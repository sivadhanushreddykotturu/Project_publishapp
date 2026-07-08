import { Types } from "mongoose";
import { Project, IProject, IStep } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { creditEarning } from "./wallet.service";
import { env } from "../config/env";

/**
 * Step templates are keyed by projectType + package (Tech Spec §5). Phase 1 ships a single
 * template — the five-step Play Store flow — so new "testing types" in Phase 3/4 are added
 * here as new template entries, never as engine changes.
 */
const PLAY_STORE_TEMPLATE: Array<{
  type: IStep["type"];
  deadlineHours: number;
  config: Record<string, unknown>;
}> = [
  { type: "verification", deadlineHours: 48, config: { gate: "project", payoutAmount: 0 } },
  { type: "play_store_invite", deadlineHours: 72, config: { gate: "project", payoutAmount: 0 } },
  { type: "app_usage", deadlineHours: 120, config: { gate: "tester", payoutAmount: 5000 } },
  { type: "app_testing", deadlineHours: 168, config: { gate: "tester", payoutAmount: 10000 } },
  { type: "completion", deadlineHours: 0, config: { gate: "tester", payoutAmount: 0 } },
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
    deadline: step.deadlineHours > 0 ? new Date(now + step.deadlineHours * 3_600_000) : undefined,
    config: step.config,
  }));
}

/** Steps 1–2 gate at the project level; every active assignment must clear the step. */
function isProjectGatedStep(project: IProject, order: number): boolean {
  const step = project.steps.find((s) => s.order === order);
  return step?.config?.gate === "project";
}

export async function submitProof(params: {
  assignmentId: Types.ObjectId;
  step: number;
  fileUrl: string;
  fileHash?: string;
}) {
  const assignment = await Assignment.findById(params.assignmentId);
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.status !== "active") throw ApiError.badRequest("Assignment is not active");
  if (params.step !== assignment.currentStep) {
    throw ApiError.badRequest(`Tester is on step ${assignment.currentStep}, not ${params.step}`);
  }

  assignment.proofs.push({
    step: params.step,
    fileUrl: params.fileUrl,
    fileHash: params.fileHash,
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

    const isLastStep = params.step === project.steps.length;
    assignment.currentStep = isLastStep ? params.step : params.step + 1;
    if (isLastStep) assignment.status = "completed";

    // Persist before the gate/completion checks below — they re-query this same
    // assignment from the database, so an unsaved in-memory currentStep would make
    // this tester look like it's still on the old step to maybeAdvanceProjectGate.
    await assignment.save();

    await MetricEvent.create({
      type: "step_verified",
      projectId: assignment.projectId,
      meta: { assignmentId: assignment._id, step: params.step },
    });

    if (isProjectGatedStep(project, params.step)) {
      await maybeAdvanceProjectGate(project._id, params.step);
    }
    if (isLastStep) {
      await maybeCompleteProject(project._id);
    }
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
 * For project-gated steps (1–2), once every active assignment has cleared the step,
 * mark it verified at the project level. Advancing past Step 1 into Step 2 additionally
 * requires the admin to confirm tester emails were added to Play Console
 * (see playIntegration.service#markTestersInvited) — that is a distinct, explicit action,
 * not something this function does automatically, per PRD §4.3.
 */
export async function maybeAdvanceProjectGate(projectId: Types.ObjectId, stepOrder: number) {
  const activeAssignments = await Assignment.find({ projectId, status: { $in: ["active", "completed"] } });
  if (activeAssignments.length === 0) return;

  const allCleared = activeAssignments.every((a) => a.currentStep > stepOrder);
  if (!allCleared) return;

  const project = await Project.findById(projectId);
  if (!project) return;
  const step = project.steps.find((s) => s.order === stepOrder);
  if (step && step.state !== "verified") {
    step.state = "verified";
    await project.save();
  }
}

export async function maybeCompleteProject(projectId: Types.ObjectId) {
  const [activeCount, incompleteCount] = await Promise.all([
    Assignment.countDocuments({ projectId, status: { $in: ["active", "completed"] } }),
    Assignment.countDocuments({ projectId, status: "active" }),
  ]);
  if (activeCount === 0 || incompleteCount > 0) return;

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
