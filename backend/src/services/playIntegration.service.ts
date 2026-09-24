import { Types } from "mongoose";
import type { androidpublisher_v3 } from "googleapis";
import { Project, IProject } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { User } from "../models/User";
import { Client } from "../models/Client";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { dispatchNotification } from "./notification.service";
import { maybeAdvanceProjectGate, maybeCompleteProject } from "./workflowEngine.service";
import { promoteFromQueue } from "./matching.service";
import * as googlePlayApi from "./googlePlayApi.service";
import { getObjectStream } from "./storage.service";

/**
 * Google Play integration (Tech Spec §7, plus the real closed-testing timeline this
 * template now models — see workflowEngine.service.ts). Two upload modes recorded on
 * playIntegration.mode:
 *  - manual: admin copies the verified tester email list out of LaunchOps and pastes
 *    them into Play Console by hand, then pastes the resulting opt-in URL back in.
 *  - api: LaunchOps pushes the AAB and tester list via the Play Developer API and
 *    derives the opt-in URL itself. A project is never blocked on the integration —
 *    API-mode errors fall back to manual with one click.
 * Independent of upload mode, every project still passes through Google's own tester-list
 * review (~2-3h), the mandatory 14-day testing window, and the production review — those
 * are modeled as project milestones below, not tied to manual vs. API upload.
 * Google does not issue per-user testing links, so per-tester tracking comes from our
 * own unique redirect (launchops.app/t/:assignmentId), logged as a metric event on click.
 */

function findStep(project: IProject, type: string) {
  return project.steps.find((s) => s.type === type);
}

export async function getVerifiedTesterEmails(projectId: Types.ObjectId): Promise<string[]> {
  const assignments = await Assignment.find({ projectId, status: { $in: ["active", "completed"] } });
  const verified = assignments.filter((a) => a.proofs.some((p) => p.step === 1 && p.status === "verified"));

  const testers = await Tester.find({ _id: { $in: verified.map((a) => a.testerId) } }).populate<{
    userId: { email: string };
  }>("userId");

  const accountEmailByTester = new Map(testers.map((tester) => [
    tester._id.toString(),
    (tester.userId as unknown as { email: string }).email,
  ]));
  return [...new Set(verified.map((assignment) => {
    const proof = [...assignment.proofs].reverse().find((item) => item.step === 1 && item.status === "verified");
    return proof?.googlePlayEmail || accountEmailByTester.get(assignment.testerId.toString());
  }).filter((email): email is string => Boolean(email)))];
}

/**
 * Admin action: verified tester emails have been copied into Play Console and submitted
 * for Google's review. Starts the ~2-3h review clock (GOOGLE_EMAIL_REVIEW_HOURS) that the
 * cron auto-advances once elapsed (jobs/emailReviewCron.ts).
 */
export async function submitEmailsForReview(projectId: Types.ObjectId, adminId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const verification = findStep(project, "verification");
  if (!verification || verification.state !== "verified") {
    throw ApiError.badRequest("All active testers must complete verification first");
  }
  const emailReview = findStep(project, "google_email_review");
  if (!emailReview) throw ApiError.badRequest("This project's template has no google_email_review step");
  if (emailReview.state === "verified") throw ApiError.conflict("Email review has already been confirmed");

  const now = new Date();
  emailReview.state = "submitted";
  project.playIntegration.emailReviewSubmittedAt = now;
  project.playIntegration.emailReviewExpectedApprovalAt = new Date(now.getTime() + env.workflow.emailReviewHours * 3_600_000);
  await project.save();

  await MetricEvent.create({ type: "email_review_submitted", projectId, meta: {} });
  await recordAudit({
    actorId: adminId,
    action: "project.emailReviewSubmitted",
    entityType: "Project",
    entityId: project._id,
    after: { expectedApprovalAt: project.playIntegration.emailReviewExpectedApprovalAt },
  });

  const admins = await User.find({ role: "admin", status: "active" });
  await Promise.all(admins.map((admin) => dispatchNotification({
    recipientUserId: admin._id,
    type: "email_review_reminder",
    channel: "email",
    relatedId: `${project._id.toString()}:submitted`,
    payload: { projectId: project._id.toString(), appName: project.appDetails.appName, status: "submitted" },
  })));

  return project;
}

async function verifyEmailReviewStep(project: IProject, source: "admin" | "auto" | "client_confirmation") {
  const emailReview = findStep(project, "google_email_review");
  if (!emailReview || emailReview.state === "verified") return;

  emailReview.state = "verified";
  await project.save();

  await MetricEvent.create({ type: "email_review_verified", projectId: project._id, meta: { source } });

  const client = await Client.findById(project.clientId);
  if (client) {
    await dispatchNotification({
      recipientUserId: client.userId,
      type: "email_review_reminder",
      channel: "email",
      relatedId: `${project._id.toString()}:approved`,
      payload: { projectId: project._id.toString(), appName: project.appDetails.appName, status: "approved" },
    });
  }

  if (source === "auto") {
    const admins = await User.find({ role: "admin", status: "active" });
    for (const admin of admins) {
      await dispatchNotification({
        recipientUserId: admin._id,
        type: "email_review_reminder",
        channel: "email",
        relatedId: project._id.toString(),
        payload: { projectId: project._id.toString(), appName: project.appDetails.appName },
      });
    }
  }
}

/** Admin manually confirms Google approved the tester list early (before the ~3h estimate elapses). */
export async function confirmEmailReviewApproved(projectId: Types.ObjectId, adminId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const emailReview = findStep(project, "google_email_review");
  if (!emailReview || emailReview.state !== "submitted") {
    throw ApiError.badRequest("Email review has not been submitted yet — call submit-email-review first");
  }

  await verifyEmailReviewStep(project, "admin");
  await recordAudit({
    actorId: adminId,
    action: "project.emailReviewConfirmed",
    entityType: "Project",
    entityId: project._id,
  });

  return project;
}

/**
 * Cron hook (jobs/emailReviewCron.ts): auto-advances every project whose review window has
 * elapsed without an admin confirming it manually — matches Google's own predictable ~2-3h
 * turnaround. This only flips the internal gate; the admin still has to go get the real
 * opt-in URL from Play Console and call markTestersInvited to actually open testing.
 */
export async function autoAdvanceDueEmailReviews(): Promise<number> {
  const now = new Date();
  const candidates = await Project.find({
    "playIntegration.emailReviewExpectedApprovalAt": { $lte: now },
    "steps.type": "google_email_review",
    "steps.state": "submitted",
  });

  let advanced = 0;
  for (const project of candidates) {
    const step = findStep(project, "google_email_review");
    if (step?.state !== "submitted") continue;
    await verifyEmailReviewStep(project, "auto");
    advanced += 1;
  }
  return advanced;
}

/**
 * Admin action once Google's tester-list review has cleared and the admin has the real
 * opt-in URL in hand (PRD §4.3–4.4): records it, opens play_store_invite for every
 * verified tester, and advances that step's project gate.
 */
export async function markTestersInvited(params: {
  projectId: Types.ObjectId;
  optInUrl: string;
  adminId: Types.ObjectId;
}) {
  const project = await Project.findById(params.projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const emailReview = findStep(project, "google_email_review");
  if (!emailReview || !["submitted", "verified"].includes(emailReview.state)) {
    throw ApiError.badRequest("Email review is not ready: confirm that tester emails were added to Google Play before sharing the testing link");
  }
  // In the manual client flow, submitting the real Google Play opt-in URL is the
  // client's confirmation that the tester list was accepted and the link exists.
  // Promote the review gate here so the client does not have to wait for a duplicate
  // admin action before enrolled testers can receive their links.
  if (emailReview.state === "submitted") {
    await verifyEmailReviewStep(project, "client_confirmation");
  }

  const playStoreInvite = findStep(project, "play_store_invite");
  if (!playStoreInvite) throw ApiError.badRequest("This project's template has no play_store_invite step");

  project.playIntegration.optInUrl = params.optInUrl;
  await project.save();

  await distributeTestingLinks(params.projectId);
  await maybeAdvanceProjectGate(params.projectId, playStoreInvite.order);

  await recordAudit({
    actorId: params.adminId,
    action: "project.testersInvited",
    entityType: "Project",
    entityId: project._id,
    after: { optInUrl: params.optInUrl },
  });

  return project;
}

/** Sends every play_store_invite-stage tester their unique redirect link. */
export async function distributeTestingLinks(projectId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  const playStoreInvite = project && findStep(project, "play_store_invite");
  if (!playStoreInvite) return;

  const assignments = await Assignment.find({ projectId, status: "active", currentStep: { $gte: playStoreInvite.order } });
  const notificationBatch = new Date().toISOString();

  for (const assignment of assignments) {
    const tester = await Tester.findById(assignment.testerId);
    if (!tester) continue;

    const redirectUrl = `${env.appBaseUrl}/t/${assignment._id.toString()}`;
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "testing_link",
      channel: "email",
      relatedId: `${assignment._id.toString()}:${notificationBatch}`,
      payload: { redirectUrl, projectId: projectId.toString(), appName: project.appDetails.appName, optInUrl: project.playIntegration.optInUrl },
    });
  }
}

/** GET /t/:assignmentId handler logic — logs the click then hands back the real opt-in URL. */
export async function resolveTestingLinkClick(assignmentId: Types.ObjectId): Promise<string> {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw ApiError.notFound("Testing link not found");

  const project = await Project.findById(assignment.projectId);
  if (!project?.playIntegration.optInUrl) {
    throw ApiError.badRequest("Testing link is not yet active for this project");
  }

  await MetricEvent.create({
    type: "testing_link_clicked",
    projectId: assignment.projectId,
    meta: { assignmentId: assignment._id },
  });

  return project.playIntegration.optInUrl;
}

/**
 * Admin fallback for testing_period+ inactivity (PRD §4.4): no automatic replacement occurs
 * once a tester is on Google's testing track, but the admin can trigger a manual
 * replacement here, which also frees the slot for queue promotion.
 */
export async function manuallyReplaceTester(assignmentId: Types.ObjectId, adminId: Types.ObjectId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.status !== "active") throw ApiError.badRequest("Only active assignments can be replaced");

  // Free the slot before promoting — see matching.service#replaceInactiveStep1Tester
  // for why promotion must happen after the outgoing tester's slot is released.
  const before = { status: assignment.status };
  assignment.status = "removed";
  await assignment.save();
  await Project.findByIdAndUpdate(assignment.projectId, { $inc: { activeTesterCount: -1 } });

  const promoted = await promoteFromQueue(assignment.projectId);
  if (promoted) {
    assignment.replacedBy = promoted.testerId;
    await assignment.save();
  }

  await recordAudit({
    actorId: adminId,
    action: "assignment.manualReplace",
    entityType: "Assignment",
    entityId: assignment._id,
    before,
    after: { status: assignment.status, replacedBy: promoted?.testerId },
  });

  return { removed: assignment, promoted };
}

/**
 * The mandatory 14-day floor (TESTING_PERIOD_DAYS), enforced as a hard gate — Google's own
 * rule, not a LaunchOps estimate. Thrown as a 400 with the remaining time so the admin
 * console can show a countdown instead of a bare rejection.
 */
function assertTestingPeriodElapsed(project: IProject) {
  const startedAt = project.playIntegration.testingPeriodStartAt;
  if (!startedAt) {
    throw ApiError.badRequest("The 14-day testing period hasn't started yet — testers haven't finished opting in");
  }
  const elapsedMs = Date.now() - startedAt.getTime();
  const requiredMs = env.workflow.testingPeriodDays * 24 * 3_600_000;
  if (elapsedMs < requiredMs) {
    const remainingDays = Math.ceil((requiredMs - elapsedMs) / (24 * 3_600_000));
    throw ApiError.badRequest(
      `The mandatory ${env.workflow.testingPeriodDays}-day testing period isn't over yet — ${remainingDays} day(s) remaining`
    );
  }
}

/** Admin/client applies for production access. Hard-blocked until the 14-day floor has elapsed. */
export async function applyForProduction(projectId: Types.ObjectId, actorId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  assertTestingPeriodElapsed(project);

  const productionReview = findStep(project, "production_review");
  if (!productionReview) throw ApiError.badRequest("This project's template has no production_review step");
  if (productionReview.state === "submitted" || productionReview.state === "verified") {
    throw ApiError.conflict("Production has already been applied for");
  }

  productionReview.state = "submitted";
  project.playIntegration.productionAppliedAt = new Date();
  await project.save();

  await MetricEvent.create({ type: "production_applied", projectId, meta: {} });
  await recordAudit({
    actorId,
    action: "project.applyForProduction",
    entityType: "Project",
    entityId: project._id,
    after: { productionAppliedAt: project.playIntegration.productionAppliedAt },
  });

  return project;
}

/**
 * Admin manually confirms Google approved production — there's no API signal for this,
 * so it's an explicit, honest admin action rather than a fabricated automatic check.
 * Closes out production_review + completion and checks whether the project as a whole
 * is done (every tester who was ever active has finished their part).
 */
export async function confirmProductionApproved(projectId: Types.ObjectId, adminId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const productionReview = findStep(project, "production_review");
  if (!productionReview || productionReview.state !== "submitted") {
    throw ApiError.badRequest("Production hasn't been applied for yet — call apply-production first");
  }

  productionReview.state = "verified";
  const completion = findStep(project, "completion");
  if (completion) completion.state = "verified";
  project.playIntegration.productionApprovedAt = new Date();
  await project.save();

  await MetricEvent.create({ type: "production_approved", projectId, meta: {} });
  await recordAudit({
    actorId: adminId,
    action: "project.productionApproved",
    entityType: "Project",
    entityId: project._id,
    after: { productionApprovedAt: project.playIntegration.productionApprovedAt },
  });

  await maybeCompleteProject(projectId);
  logger.info({ projectId }, "Production approved");

  return project;
}

/** Injectable seams so tests can exercise the real orchestration without calling Google. */
export interface ApiModeSyncDeps {
  client?: androidpublisher_v3.Androidpublisher;
  createEdit?: typeof googlePlayApi.createEdit;
  uploadBundle?: typeof googlePlayApi.uploadBundle;
  updateTrackRelease?: typeof googlePlayApi.updateTrackRelease;
  syncTesterGoogleGroup?: typeof googlePlayApi.syncTesterGoogleGroup;
  commitEdit?: typeof googlePlayApi.commitEdit;
  getObjectStream?: typeof getObjectStream;
}

/**
 * API mode (Tech Spec §7): uploads the client's AAB straight to Google, rolls it out on
 * the configured track, and commits the edit — all via the Play Developer API, no
 * Play Console clicking required. Still requires the email-review milestone to be
 * confirmed first (Google's tester-list review applies regardless of upload mode).
 * Tester-list sync is best-effort: Google's API can only assign a Google Group to a track
 * (Schema$Testers has no raw-email field), so if the project has a testerGoogleGroupEmail
 * configured that group's membership becomes the track's tester list; otherwise individual
 * emails still need Play Console or the manual `markTestersInvited` flow. Any failure here
 * — permission revoked, upload rejected, version-code conflict — is caught, recorded on the
 * project, and surfaced with an explicit fallback-to-manual instruction; it never leaves
 * the project half-updated or the caller with just a stack trace.
 */
export async function syncApiModeRelease(
  projectId: Types.ObjectId,
  adminId: Types.ObjectId,
  deps: ApiModeSyncDeps = {}
) {
  const {
    createEdit = googlePlayApi.createEdit,
    uploadBundle = googlePlayApi.uploadBundle,
    updateTrackRelease = googlePlayApi.updateTrackRelease,
    syncTesterGoogleGroup = googlePlayApi.syncTesterGoogleGroup,
    commitEdit = googlePlayApi.commitEdit,
    getObjectStream: getStream = getObjectStream,
  } = deps;

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (project.playIntegration.mode !== "api") {
    throw ApiError.badRequest("Project is not configured for Google Play API mode");
  }
  if (!project.playIntegration.serviceAccountLinked) {
    throw ApiError.badRequest("Client has not granted the LaunchOps service account Play Console access yet");
  }
  const emailReview = findStep(project, "google_email_review");
  if (!emailReview || emailReview.state !== "verified") {
    throw ApiError.badRequest("Email review has not been confirmed yet");
  }
  const playStoreInvite = findStep(project, "play_store_invite");
  if (!playStoreInvite) throw ApiError.badRequest("This project's template has no play_store_invite step");

  const packageName = project.playIntegration.packageName ?? project.appDetails.packageName;
  if (!packageName) throw ApiError.badRequest("Project has no Play Store package name configured");
  if (!project.playIntegration.aabFileUrl) throw ApiError.badRequest("No AAB has been uploaded for this project");

  const client = deps.client ?? googlePlayApi.getClient();
  const track = project.playIntegration.track;

  try {
    const editId = await createEdit(client, packageName);
    const bundleStream = await getStream(project.playIntegration.aabFileUrl);
    const versionCode = await uploadBundle(client, packageName, editId, bundleStream);
    await updateTrackRelease(client, packageName, editId, track, versionCode);

    const groupEmail = project.playIntegration.testerGoogleGroupEmail;
    if (groupEmail) {
      await syncTesterGoogleGroup(client, packageName, editId, track, groupEmail);
    }

    await commitEdit(client, packageName, editId);

    project.playIntegration.versionCode = versionCode;
    project.playIntegration.optInUrl = `https://play.google.com/apps/testing/${packageName}`;
    project.playIntegration.lastApiError = undefined;
    await project.save();

    await distributeTestingLinks(project._id);
    await maybeAdvanceProjectGate(project._id, playStoreInvite.order);

    await recordAudit({
      actorId: adminId,
      action: "project.apiModeSync",
      entityType: "Project",
      entityId: project._id,
      after: { versionCode, testerGroupSynced: Boolean(groupEmail) },
    });

    return {
      project,
      versionCode,
      testerListAutomated: Boolean(groupEmail),
      note: groupEmail
        ? "Bundle uploaded and rolled out; tester Google Group synced automatically."
        : "Bundle uploaded and rolled out automatically. No Google Group configured — Google's API can't add raw tester emails to a track, so add testers via Play Console (or set playIntegration.testerGoogleGroupEmail and re-run) before testers can opt in.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    project.playIntegration.lastApiError = message;
    await project.save();
    throw new ApiError(
      502,
      `Google Play API sync failed: ${message}. Fall back to manual mode via POST /projects/${project._id.toString()}/testers-invited.`,
      { fallbackToManual: true }
    );
  }
}
