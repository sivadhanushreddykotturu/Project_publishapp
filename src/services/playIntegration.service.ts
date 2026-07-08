import { Types } from "mongoose";
import type { androidpublisher_v3 } from "googleapis";
import { Project } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { dispatchNotification } from "./notification.service";
import { maybeAdvanceProjectGate } from "./workflowEngine.service";
import { promoteFromQueue } from "./matching.service";
import * as googlePlayApi from "./googlePlayApi.service";
import { getObjectStream } from "./storage.service";

/**
 * Google Play integration (Tech Spec §7). Two modes recorded on playIntegration.mode:
 *  - manual: admin copies the verified tester email list out of LaunchOps and pastes
 *    them into Play Console by hand, then pastes the resulting opt-in URL back in.
 *  - api: LaunchOps pushes the AAB and tester list via the Play Developer API and
 *    derives the opt-in URL itself. A project is never blocked on the integration —
 *    API-mode errors fall back to manual with one click.
 * Google does not issue per-user testing links, so per-tester tracking comes from our
 * own unique redirect (launchops.app/t/:assignmentId), logged as a metric event on click.
 */

export async function getVerifiedTesterEmails(projectId: Types.ObjectId): Promise<string[]> {
  const assignments = await Assignment.find({ projectId, status: { $in: ["active", "completed"] } });
  const verified = assignments.filter((a) => a.proofs.some((p) => p.step === 1 && p.status === "verified"));

  const testers = await Tester.find({ _id: { $in: verified.map((a) => a.testerId) } }).populate<{
    userId: { email: string };
  }>("userId");

  return testers.map((t) => (t.userId as unknown as { email: string }).email).filter(Boolean);
}

/**
 * Admin action once tester emails are added to Play Console and Google invitations
 * are sent (PRD §4.3–4.4): records the opt-in URL, opens Step 2 for every Step-1-verified
 * tester, and advances the Step 1 project gate.
 */
export async function markTestersInvited(params: {
  projectId: Types.ObjectId;
  optInUrl: string;
  adminId: Types.ObjectId;
}) {
  const project = await Project.findById(params.projectId);
  if (!project) throw ApiError.notFound("Project not found");

  const step1 = project.steps.find((s) => s.order === 1);
  if (!step1 || step1.state !== "verified") {
    throw ApiError.badRequest("All active testers must complete Step 1 verification first");
  }

  project.playIntegration.optInUrl = params.optInUrl;
  await project.save();

  await distributeTestingLinks(params.projectId);
  await maybeAdvanceProjectGate(params.projectId, 2);

  await recordAudit({
    actorId: params.adminId,
    action: "project.testersInvited",
    entityType: "Project",
    entityId: project._id,
    after: { optInUrl: params.optInUrl },
  });

  return project;
}

/** Sends every Step-1-verified tester their unique redirect link for the Play Store invite. */
export async function distributeTestingLinks(projectId: Types.ObjectId) {
  const assignments = await Assignment.find({ projectId, status: "active", currentStep: 2 });

  for (const assignment of assignments) {
    const tester = await Tester.findById(assignment.testerId);
    if (!tester) continue;

    const redirectUrl = `${env.appBaseUrl}/t/${assignment._id.toString()}`;
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "testing_link",
      channel: "email",
      relatedId: assignment._id.toString(),
      payload: { redirectUrl, projectId: projectId.toString() },
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
 * Admin fallback for Step 2+ inactivity (PRD §4.4): no automatic replacement occurs
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
 * Play Console clicking required. Tester-list sync is best-effort: Google's API can only
 * assign a Google Group to a track (Schema$Testers has no raw-email field), so if the
 * project has a testerGoogleGroupEmail configured that group's membership becomes the
 * track's tester list; otherwise individual emails still need Play Console or the
 * existing manual `markTestersInvited` flow. Any failure here — permission revoked,
 * upload rejected, version-code conflict — is caught, recorded on the project, and
 * surfaced with an explicit fallback-to-manual instruction; it never leaves the project
 * half-updated or the caller with just a stack trace.
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
    await maybeAdvanceProjectGate(project._id, 2);

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
        : "Bundle uploaded and rolled out automatically. No Google Group configured — Google's API can't add raw tester emails to a track, so add testers via Play Console (or set playIntegration.testerGoogleGroupEmail and re-run) before Step 2 opens.",
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
