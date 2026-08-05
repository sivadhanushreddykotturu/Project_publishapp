import type { Types } from "mongoose";
import {
  Assignment,
  Project,
  Tester,
  type AssignmentDoc,
  type ProjectDoc,
} from "../models/index.js";
import { conflict, forbidden, notFound } from "../utils/errors.js";
import { env } from "../config/env.js";
import { recordMetric } from "./metrics.js";
import { dispatch, dispatchToAdmins } from "./notify.js";
import { creditEarning } from "./wallet.js";
import { writeAudit } from "./audit.js";

/**
 * The step state machine: PENDING → SUBMITTED → VERIFIED/REJECTED.
 * Steps 1–2 additionally gate at project level; steps 3–5 flow per tester.
 * Wallet credits on VERIFIED. Rejection reopens the step for resubmission.
 */

export async function submitProof(input: {
  assignmentId: Types.ObjectId;
  userId: Types.ObjectId;
  fileUrl: string;
  publicId?: string;
  fileHash?: string;
  note?: string;
}): Promise<AssignmentDoc> {
  const assignment = await Assignment.findById(input.assignmentId);
  if (!assignment) throw notFound("Assignment");

  const tester = await Tester.findOne({ userId: input.userId });
  if (!tester || String(tester._id) !== String(assignment.testerId)) {
    throw forbidden("Not your assignment");
  }
  if (assignment.status !== "active") {
    throw conflict("Assignment isn't active", "NOT_ACTIVE");
  }

  const step = assignment.currentStep;
  const project = await Project.findById(assignment.projectId);
  if (!project) throw notFound("Project");

  // project-level gate: gated steps must be open project-wide
  const embedded = project.steps.find((s) => s.order === step);
  if (embedded && embedded.config.projectLevelGate && embedded.state !== "active") {
    throw conflict("This step hasn't opened yet", "STEP_LOCKED");
  }
  if (embedded?.config.requiresProof && !input.fileUrl.startsWith("http")) {
    throw conflict("This step needs a screenshot upload", "PROOF_REQUIRED");
  }

  // one live submission per step (step 3 check-ins are the exception: many allowed)
  const isCheckInStep = embedded?.type === "app_usage";
  const hasLive = assignment.proofs.some(
    (p) => p.step === step && ["submitted", "verified"].includes(p.status),
  );
  if (hasLive && !isCheckInStep) {
    throw conflict("This step already has a submission under review", "ALREADY_SUBMITTED");
  }

  // fraud defense: the same screenshot can't be used by two assignments
  if (input.fileHash) {
    const reused = await Assignment.findOne({
      projectId: assignment.projectId,
      _id: { $ne: assignment._id },
      proofs: { $elemMatch: { fileHash: input.fileHash } },
    }).lean();
    if (reused) {
      throw conflict("This screenshot was already used on another assignment", "PROOF_REUSED");
    }
  }

  assignment.proofs.push({
    step,
    fileUrl: input.fileUrl,
    publicId: input.publicId,
    fileHash: input.fileHash,
    status: "submitted",
    submittedAt: new Date(),
  } as AssignmentDoc["proofs"][number]);
  assignment.lastActivityAt = new Date();
  if (embedded && embedded.state === "active") {
    embedded.state = embedded.config.projectLevelGate ? "active" : embedded.state;
  }
  await assignment.save();
  return assignment;
}

export async function reviewSubmission(input: {
  assignmentId: Types.ObjectId;
  proofId: Types.ObjectId;
  adminId: Types.ObjectId;
  approve: boolean;
  reason?: string;
}): Promise<AssignmentDoc> {
  const assignment = await Assignment.findById(input.assignmentId);
  if (!assignment) throw notFound("Assignment");
  const proof = assignment.proofs.id(input.proofId);
  if (!proof) throw notFound("Proof");
  if (proof.status !== "submitted") {
    throw conflict("Proof already reviewed", "ALREADY_REVIEWED");
  }

  const project = await Project.findById(assignment.projectId);
  if (!project) throw notFound("Project");
  const embedded = project.steps.find((s) => s.order === proof.step);
  const tester = await Tester.findById(assignment.testerId);

  if (!input.approve) {
    proof.status = "rejected";
    proof.rejectionReason = input.reason ?? "Rejected";
    proof.verifiedBy = input.adminId;
    proof.verificationSource = "admin";
    proof.reviewedAt = new Date();
    await assignment.save();
    await writeAudit({
      actorId: input.adminId,
      action: "proof.rejected",
      entityType: "Assignment",
      entityId: assignment._id,
      before: { status: "submitted" },
      after: { status: "rejected", reason: input.reason, step: proof.step },
    });
    if (tester) {
      await dispatch({
        recipientId: tester.userId,
        type: "step_rejected",
        title: `Step ${proof.step} needs another attempt`,
        body: input.reason ?? "Your proof was rejected. Please resubmit.",
        link: "/tester/tests",
        idempotencyKey: `reject:${proof._id}`,
      });
    }
    return assignment;
  }

  // ---- approve path ----
  proof.status = "verified";
  proof.verifiedBy = input.adminId;
  proof.verificationSource = "admin";
  proof.reviewedAt = new Date();
  assignment.lastActivityAt = new Date();

  const isCurrent = proof.step === assignment.currentStep;
  let completed = false;
  if (isCurrent) {
    if (assignment.currentStep >= 5) {
      completed = true;
      assignment.status = "completed";
      assignment.completedAt = new Date();
    } else {
      assignment.currentStep += 1;
    }
  }
  await assignment.save();

  // wallet credit — exactly-once via the proof-scoped idempotency key
  if (embedded && tester) {
    await creditEarning({
      testerId: assignment.testerId,
      projectId: project._id,
      assignmentId: assignment._id,
      amountPaise: embedded.config.payoutPaise,
      idempotencyKey: `earning:${assignment._id}:${proof.step}:${proof._id}`,
      note: `Step ${proof.step} verified — ${project.appDetails.appName}`,
    });
  }

  await writeAudit({
    actorId: input.adminId,
    action: "proof.verified",
    entityType: "Assignment",
    entityId: assignment._id,
    before: { status: "submitted" },
    after: { status: "verified", step: proof.step },
  });
  await recordMetric("step_verified", {
    projectId: project._id,
    actorId: input.adminId,
    meta: { step: proof.step, testerId: assignment.testerId },
  });
  if (tester) {
    await dispatch({
      recipientId: tester.userId,
      type: "step_verified",
      title: `Step ${proof.step} verified`,
      body: completed
        ? "That's the final step — your assignment is complete. Thank you!"
        : `Your proof was approved and the payout credited. Step ${assignment.currentStep} is now open.`,
      link: "/tester/tests",
      idempotencyKey: `verified:${proof._id}`,
    });
  }

  await checkProjectGates(project, proof.step);
  if (completed) await checkProjectCompletion(project._id);
  return assignment;
}

/**
 * Project-level gates for steps 1–2: when every active tester has a verified
 * proof for the step, the project step verifies and the next one opens.
 */
async function checkProjectGates(project: ProjectDoc, step: number): Promise<void> {
  if (step > 2) return;
  const embedded = project.steps.find((s) => s.order === step);
  if (!embedded?.config.projectLevelGate || embedded.state === "verified") return;

  const activeAssignments = await Assignment.find({
    projectId: project._id,
    status: "active",
  }).lean();
  if (activeAssignments.length === 0) return;

  const allVerified = activeAssignments.every((a) =>
    a.proofs.some((p) => p.step === step && p.status === "verified"),
  );
  if (!allVerified) return;

  embedded.state = "verified";
  if (step === 2) {
    // per-tester steps open project-wide once the invite gate clears
    for (const s of project.steps) {
      if (s.order >= 3 && s.state === "locked") s.state = "active";
    }
  }
  await project.save();

  if (step === 1) {
    await dispatchToAdmins({
      type: "project_update",
      title: `All testers verified — ${project.appDetails.appName}`,
      body: "Every active tester cleared Step 1. Add the Play track opt-in URL to open Step 2 and distribute testing links.",
      link: `/admin/projects`,
      idempotencyKey: `gate1:${project._id}`,
    });
  }
}

/** All active assignments done → project completes. */
async function checkProjectCompletion(projectId: Types.ObjectId): Promise<void> {
  const remaining = await Assignment.countDocuments({
    projectId,
    status: "active",
  });
  if (remaining > 0) return;
  const project = await Project.findOneAndUpdate(
    { _id: projectId, status: { $in: ["active", "in_progress"] } },
    { $set: { status: "completed", completedAt: new Date(), joinState: "closed" } },
    { new: true },
  );
  if (project) {
    await recordMetric("project_completed", { projectId });
  }
}

/**
 * Manual Play mode: admin pastes the track opt-in URL → Step 2 opens and
 * every verified tester gets their unique tracked redirect link.
 */
export async function distributeTestingLinks(input: {
  projectId: Types.ObjectId;
  adminId: Types.ObjectId;
  optInUrl: string;
  track?: string;
}): Promise<ProjectDoc> {
  const project = await Project.findById(input.projectId);
  if (!project) throw notFound("Project");
  const step1 = project.steps.find((s) => s.order === 1);
  if (step1?.state !== "verified") {
    throw conflict("Step 1 must be verified for all testers first", "GATE_NOT_PASSED");
  }
  const step2 = project.steps.find((s) => s.order === 2);
  if (step2?.state === "active") return project; // idempotent

  project.playIntegration.optInUrl = input.optInUrl;
  if (input.track) project.playIntegration.track = input.track;
  if (step2) step2.state = "active";
  await project.save();

  const assignments = await Assignment.find({
    projectId: project._id,
    status: "active",
  }).lean();
  for (const a of assignments) {
    const tester = await Tester.findById(a.testerId).lean();
    if (!tester) continue;
    const link = `${env.WEB_BASE_URL}/t/${a._id}`;
    await dispatch({
      recipientId: tester.userId,
      type: "testing_link",
      title: `Your testing link — ${project.appDetails.appName}`,
      body: "Open your personal link, accept the invite on Google Play, install the app, and upload a screenshot of it installed.",
      link,
      idempotencyKey: `tlink:${a._id}`,
    });
  }

  await writeAudit({
    actorId: input.adminId,
    action: "play_integration.optin_set",
    entityType: "Project",
    entityId: project._id,
    after: { optInUrl: input.optInUrl, mode: project.playIntegration.mode },
  });
  return project;
}
