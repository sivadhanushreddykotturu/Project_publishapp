import { Types } from "mongoose";
import { Project, IProject, IStep } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { creditEarning } from "./wallet.service";
import { env } from "../config/env";
import { Tester } from "../models/Tester";
import { dispatchNotification } from "./notification.service";

/**
 * Step template matching Google's actual closed-testing timeline (verified against
 * real Play Console mechanics, not an idealized guess):
 *
 *   verification --------- LaunchOps checks each tester is real (project gate)
 *   google_email_review -- Google reviews the submitted tester list, ~2-3h (admin/cron milestone)
 *   play_store_invite ---- each tester accepts the invite / opts in (project gate)
 *   testing_period -------- MANDATORY 14-day window, installs staggered ~2/day (time gate)
 *   production_review ---- admin applies, Google reviews, commonly ~7d+ (admin milestone)
 *   completion ------------ terminal
 *
 * ~2 + 14 + 7 ≈ 23 days end to end. Only verification / play_store_invite / testing_period
 * carry individual tester actions (config.perTesterAction) — the other three are project-level
 * milestones the admin advances directly (see playIntegration.service.ts), never something an
 * individual tester's Assignment.currentStep passes through.
 *
 * Phase 1 ships this single template (Tech Spec §5); new "testing types" in Phase 3/4 are
 * added here as new template entries, never as engine changes.
 */
const PLAY_STORE_TEMPLATE: Array<{
  type: IStep["type"];
  deadlineHours: number;
  config: Record<string, unknown>;
}> = [
  { type: "verification", deadlineHours: 48, config: { gate: "project", perTesterAction: true, payoutAmount: 0 } },
  {
    type: "google_email_review",
    deadlineHours: env.workflow.emailReviewHours,
    config: { gate: "manual", perTesterAction: false, payoutAmount: 0 },
  },
  { type: "play_store_invite", deadlineHours: 48, config: { gate: "project", perTesterAction: true, payoutAmount: 0 } },
  {
    type: "testing_period",
    deadlineHours: env.workflow.testingPeriodDays * 24,
    config: {
      gate: "time",
      perTesterAction: true,
      perTesterTerminal: true,
      testingPeriodDays: env.workflow.testingPeriodDays,
      payoutAmount: 15000,
    },
  },
  {
    type: "production_review",
    deadlineHours: env.workflow.productionReviewDays * 24,
    config: { gate: "manual", perTesterAction: false, payoutAmount: 0 },
  },
  { type: "completion", deadlineHours: 0, config: { gate: "manual", perTesterAction: false, payoutAmount: 0 } },
];

export function getStepTemplate(_projectType: string, _pkg: string) {
  return PLAY_STORE_TEMPLATE;
}

export function createStepsFromTemplate(project: Pick<IProject, "projectType" | "package">): IStep[] {
  const template = getStepTemplate(project.projectType, project.package);
  const now = Date.now();
  return template.map((step, idx) => ({
    order: idx + 1,
    type: step.type,
    state: "pending",
    // An initial display estimate only. testing_period and production_review get their
    // real, authoritative timestamps (testingPeriodStartAt / productionAppliedAt) stamped
    // dynamically when those milestones actually happen — see maybeAdvanceProjectGate and
    // playIntegration.service#applyForProduction.
    deadline: step.deadlineHours > 0 ? new Date(now + step.deadlineHours * 3_600_000) : undefined,
    config: step.config,
  }));
}

function isProjectGatedStep(project: IProject, order: number): boolean {
  const step = project.steps.find((s) => s.order === order);
  return step?.config?.gate === "project";
}

/** Only verification / play_store_invite / testing_period ever appear as a tester's currentStep. */
function nextTesterStep(project: IProject, fromOrder: number): number {
  const next = project.steps.find((s) => s.order > fromOrder && s.config?.perTesterAction !== false);
  return next ? next.order : fromOrder;
}

export async function submitProof(params: {
  assignmentId: Types.ObjectId;
  step: number;
  fileUrl: string;
  fileHash?: string;
  googlePlayEmail?: string;
}) {
  const assignment = await Assignment.findById(params.assignmentId);
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.status !== "active") throw ApiError.badRequest("Assignment is not active");
  if (params.step !== assignment.currentStep) {
    throw ApiError.badRequest(`Tester is on step ${assignment.currentStep}, not ${params.step}`);
  }
  if (params.step === 4) {
    if (params.fileUrl.startsWith("check-in:")) {
      throw ApiError.badRequest("Upload a testing screenshot for the 48-hour check-in");
    }
    const latestCheckIn = [...assignment.proofs]
      .filter((proof) => proof.step === 4)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
    if (latestCheckIn && Date.now() - latestCheckIn.submittedAt.getTime() < 48 * 3_600_000) {
      throw ApiError.badRequest("A testing screenshot can only be uploaded once every 48 hours");
    }
  }

  assignment.proofs.push({
    step: params.step,
    fileUrl: params.fileUrl,
    fileHash: params.fileHash,
    googlePlayEmail: params.googlePlayEmail,
    status: "pending",
    submittedAt: new Date(),
  });
  assignment.lastActivityAt = new Date();
  assignment.inactivityFlag = false;
  await assignment.save();
  return assignment;
}

export async function verifyProof(params: {
  assignmentId: Types.ObjectId;
  step: number;
  approve: boolean;
  reason?: string;
  adminId: Types.ObjectId;
  source?: "admin" | "auto";
}) {
  const assignment = await Assignment.findById(params.assignmentId);
  if (!assignment) throw ApiError.notFound("Assignment not found");

  const proof = [...assignment.proofs].reverse().find((p) => p.step === params.step && p.status === "pending");
  if (!proof) throw ApiError.badRequest("No pending proof found for that step");

  const before = { status: proof.status, currentStep: assignment.currentStep };

  proof.status = params.approve ? "verified" : "rejected";
  proof.verifiedBy = params.adminId;
  proof.verificationSource = params.source ?? "admin";
  proof.verifiedAt = new Date();
  if (!params.approve) proof.rejectionReason = params.reason;

  if (params.approve) {
    const project = await Project.findById(assignment.projectId);
    if (!project) throw ApiError.notFound("Project not found");

    const stepConfig = project.steps.find((s) => s.order === params.step);
    const payoutAmount = Number(stepConfig?.config?.payoutAmount ?? 0);
    if (payoutAmount > 0) {
      await creditEarning({
        testerId: assignment.testerId,
        projectId: assignment.projectId,
        amount: payoutAmount,
        note: `Step ${params.step} (${stepConfig?.type}) verified`,
      });
    }

    // testing_period is the last step an individual tester ever acts on — production
    // review and completion are project-level milestones the admin advances directly.
    const isTerminalTesterStep = Boolean(stepConfig?.config?.perTesterTerminal);
    assignment.currentStep = isTerminalTesterStep ? params.step : nextTesterStep(project, params.step);
    if (isTerminalTesterStep) assignment.status = "completed";

    // Persist before the gate check below — it re-queries this same assignment from the
    // database, so an unsaved in-memory currentStep would make this tester look like it's
    // still on the old step to maybeAdvanceProjectGate.
    await assignment.save();

    await MetricEvent.create({
      type: "step_verified",
      projectId: assignment.projectId,
      meta: { assignmentId: assignment._id, step: params.step },
    });

    if (isProjectGatedStep(project, params.step)) {
      await maybeAdvanceProjectGate(project._id, params.step);
    }
    // Project completion is decided by playIntegration.service#confirmProductionApproved,
    // not here — a tester finishing testing_period doesn't mean the project is done.
  } else {
    await MetricEvent.create({
      type: "step_rejected",
      projectId: assignment.projectId,
      meta: { assignmentId: assignment._id, step: params.step, reason: params.reason },
    });
    await assignment.save();
  }

  await recordAudit({
    actorId: params.adminId,
    action: params.approve ? "step.verify" : "step.reject",
    entityType: "Assignment",
    entityId: assignment._id,
    before,
    after: { status: proof.status, currentStep: assignment.currentStep },
  });

  return assignment;
}

/**
 * For project-gated steps (verification, play_store_invite), once every active assignment
 * has cleared the step, mark it verified at the project level. Advancing past
 * google_email_review into play_store_invite additionally requires the admin to confirm
 * tester emails were reviewed (see playIntegration.service#markTestersInvited /
 * #confirmEmailReviewApproved) — that is a distinct, explicit action, per PRD §4.3.
 * When play_store_invite itself closes, this also starts the mandatory 14-day testing
 * clock and schedules staggered install reminders (~2 testers/day).
 */
export async function maybeAdvanceProjectGate(projectId: Types.ObjectId, stepOrder: number) {
  const activeAssignments = await Assignment.find({ projectId, status: { $in: ["active", "completed"] } });
  if (activeAssignments.length === 0) return;

  const allCleared = activeAssignments.every((a) => a.currentStep > stepOrder);
  if (!allCleared) return;

  const project = await Project.findById(projectId);
  if (!project) return;
  const step = project.steps.find((s) => s.order === stepOrder);
  if (!step || step.state === "verified") return;

  step.state = "verified";
  await project.save();

  if (step.type === "play_store_invite") {
    await startTestingPeriodAndScheduleInstalls(projectId);
  }
}

/**
 * Stamps testingPeriodStartAt (the authoritative clock the 14-day hard gate reads) and
 * assigns every active tester a scheduledInstallDate — ~INSTALLS_PER_DAY per day — so
 * installs land naturally over the window instead of all 14 testers hitting Play at once.
 */
export async function startTestingPeriodAndScheduleInstalls(projectId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) return;
  if (project.playIntegration.testingPeriodStartAt) return; // already started — idempotent

  const start = new Date();
  project.playIntegration.testingPeriodStartAt = start;
  await project.save();

  const activeAssignments = await Assignment.find({
    projectId,
    status: { $in: ["active", "completed"] },
  }).sort({ assignedAt: 1 });

  const perDay = Math.max(1, env.workflow.installsPerDay);
  for (let i = 0; i < activeAssignments.length; i++) {
    const dayOffset = Math.floor(i / perDay);
    activeAssignments[i].scheduledInstallDate = new Date(start.getTime() + dayOffset * 24 * 3_600_000);
    await activeAssignments[i].save();
  }

  await MetricEvent.create({
    type: "install_pacing_scheduled",
    projectId,
    meta: { testerCount: activeAssignments.length, perDay, testingPeriodStartAt: start },
  });
}

/**
 * Called once the admin confirms Google approved production (playIntegration.service
 * #confirmProductionApproved) — a project is "done" once every tester who was ever
 * active has reached "completed" (finished their testing_period proof) and none are
 * still mid-flight.
 */
export async function maybeCompleteProject(projectId: Types.ObjectId) {
  const [everActiveCount, stillActiveCount] = await Promise.all([
    Assignment.countDocuments({ projectId, status: { $in: ["active", "completed"] } }),
    Assignment.countDocuments({ projectId, status: "active" }),
  ]);
  if (everActiveCount === 0 || stillActiveCount > 0) return;

  await Project.findByIdAndUpdate(projectId, { status: "completed" });
  await MetricEvent.create({ type: "project_completed", projectId, meta: {} });
}

/**
 * CLIENT PAYS -> PROJECT ACTIVATED (Tech Spec §6). Clones the step template, opens the
 * project for joins, and publishes the "New Testing Opportunity" — in v1 that means
 * generating the join link + a formatted WhatsApp post for the admin to paste manually
 * (Tech Spec §14: "WhatsApp publishing has no clean API — manual copy-link/post in v1").
 * Target: payment_confirmed -> opportunity_published under 5 minutes.
 */
export async function activateProject(projectId: Types.ObjectId) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (project.status === "active" || project.status === "completed") return project;

  project.steps = createStepsFromTemplate(project);
  project.status = "active";
  project.joinState = "open";
  await project.save();

  await MetricEvent.create({ type: "opportunity_published", projectId: project._id, meta: {} });

  const testerFilter: Record<string, unknown> = { status: "active" };
  if (project.serviceType === "user_experience_testing") {
    testerFilter.specialty = { $regex: /(?:ux|user experience).*test/i };
  }
  const requiredDeviceModels = project.requiredDeviceModels ?? [];
  if (requiredDeviceModels.length > 0) testerFilter["devices.model"] = { $in: requiredDeviceModels };
  const eligibleTesters = await Tester.find(testerFilter);
  await Promise.all(eligibleTesters.map((tester) => dispatchNotification({
    recipientUserId: tester.userId,
    type: "project_opportunity",
    channel: "email",
    relatedId: project._id.toString(),
    payload: { projectId: project._id.toString(), appName: project.appDetails.appName, requiredDeviceModels, joinPath: `/tester/explore?project=${project._id}` },
  })));

  const joinLink = `${env.webBaseUrl}/join/${project._id.toString()}`;
  const whatsappPost = [
    "🚀 New Testing Opportunity",
    "",
    `Project Name: ${project.appDetails.appName}`,
    "Platform: Android",
    `Required Testers: ${project.requiredTesters}`,
    "",
    "Interested in participating?",
    `Click below to Join: ${joinLink}`,
  ].join("\n");

  return { project, joinLink, whatsappPost };
}
