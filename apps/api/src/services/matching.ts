import mongoose, { type Types } from "mongoose";
import { Assignment, Project, Tester, type AssignmentDoc } from "../models/index.js";
import { conflict, notFound } from "../utils/errors.js";
import { recordMetric } from "./metrics.js";
import { dispatch } from "./notify.js";
import { getTemplate } from "./workflow.js";
import { writeAudit } from "./audit.js";

/**
 * Tester matching: atomic first-N cutoff, then a waiting queue.
 * Slot claims are single-document findOneAndUpdate with $expr guards —
 * race-safe without transactions.
 */
export async function joinProject(
  projectId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<{ assignment: AssignmentDoc; queued: boolean }> {
  const tester = await Tester.findOne({ userId, status: "active" });
  if (!tester) throw notFound("Tester profile");

  const project = await Project.findById(projectId);
  if (!project) throw notFound("Project");
  if (!["open", "full"].includes(project.joinState)) {
    throw conflict("This opportunity isn't accepting testers", "JOIN_CLOSED");
  }

  // already joined? return the existing assignment (idempotent)
  const existing = await Assignment.findOne({
    projectId,
    testerId: tester._id,
  });
  if (existing) return { assignment: existing, queued: existing.status === "queued" };

  // 1. try to claim an active slot atomically
  const claimed = await Project.findOneAndUpdate(
    {
      _id: projectId,
      joinState: "open",
      $expr: { $lt: ["$activeTesterCount", "$requiredTesters"] },
    },
    { $inc: { activeTesterCount: 1 } },
    { new: true },
  );

  if (claimed) {
    try {
      const assignment = await Assignment.create({
        testerId: tester._id,
        projectId,
        status: "active",
        currentStep: 1,
      });
      await Tester.updateOne({ _id: tester._id }, { $set: { lastActiveAt: new Date() } });

      if (claimed.activeTesterCount >= claimed.requiredTesters) {
        await Project.updateOne({ _id: projectId }, { $set: { joinState: "full" } });
        await recordMetric("slots_filled", { projectId });
      }
      await recordMetric("tester_joined", {
        projectId,
        actorId: userId,
        meta: { queued: false },
      });
      await dispatch({
        recipientId: userId,
        type: "slot_assigned",
        title: `You're in — ${claimed.appDetails.appName}`,
        body: `You have an active slot. Step 1 (verification) is waiting for you.`,
        link: "/tester/tests",
        idempotencyKey: `slot:${assignment._id}`,
      });
      return { assignment, queued: false };
    } catch (err) {
      // duplicate join raced us — roll the counter back and return existing
      if ((err as { code?: number })?.code === 11000) {
        await Project.updateOne({ _id: projectId }, { $inc: { activeTesterCount: -1 } });
        const dup = await Assignment.findOne({ projectId, testerId: tester._id });
        if (dup) return { assignment: dup, queued: dup.status === "queued" };
      }
      throw err;
    }
  }

  // 2. slots full → waiting queue (capped)
  const cap = getTemplate(project.packageKey).waitlistCap;
  const queuedProject = await Project.findOneAndUpdate(
    {
      _id: projectId,
      joinState: { $in: ["open", "full"] },
      $expr: { $lt: ["$waitlistCount", cap] },
    },
    { $inc: { waitlistCount: 1 } },
    { new: true },
  );
  if (!queuedProject) {
    throw conflict(
      "Slots are full and the waiting list is at capacity",
      "SLOTS_FULL",
    );
  }

  try {
    const assignment = await Assignment.create({
      testerId: tester._id,
      projectId,
      status: "queued",
      queuePosition: queuedProject.waitlistCount,
    });
    await recordMetric("tester_joined", {
      projectId,
      actorId: userId,
      meta: { queued: true, queuePosition: assignment.queuePosition },
    });
    return { assignment, queued: true };
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) {
      await Project.updateOne({ _id: projectId }, { $inc: { waitlistCount: -1 } });
      const dup = await Assignment.findOne({ projectId, testerId: tester._id });
      if (dup) return { assignment: dup, queued: dup.status === "queued" };
    }
    throw err;
  }
}

/**
 * Promote the lowest queuePosition to active. The status-guarded
 * findOneAndUpdate makes double promotion impossible.
 */
export async function promoteNextInQueue(
  projectId: Types.ObjectId,
): Promise<AssignmentDoc | null> {
  const promoted = await Assignment.findOneAndUpdate(
    { projectId, status: "queued" },
    {
      $set: { status: "active", currentStep: 1, lastActivityAt: new Date(), joinedAt: new Date() },
      $unset: { queuePosition: 1 },
    },
    { sort: { queuePosition: 1 }, new: true },
  );
  if (!promoted) return null;

  await Project.updateOne({ _id: projectId }, { $inc: { waitlistCount: -1 } });

  const tester = await Tester.findById(promoted.testerId).lean();
  if (tester) {
    await dispatch({
      recipientId: tester.userId,
      type: "queue_promoted",
      title: "A slot opened up — you're active",
      body: "You were promoted from the waiting list. Step 1 (verification) is waiting — complete it within 48 hours to keep your slot.",
      link: "/tester/tests",
      idempotencyKey: `promoted:${promoted._id}`,
    });
  }
  return promoted;
}

/**
 * Remove an active assignment and promote from the queue. Scope rules live
 * in the caller (cron: step 1 only; admin: any step, manual).
 */
export async function removeAndReplace(
  assignmentId: Types.ObjectId,
  actorId: Types.ObjectId,
  reason: string,
): Promise<{ removed: AssignmentDoc; promoted: AssignmentDoc | null }> {
  const removed = await Assignment.findOneAndUpdate(
    { _id: assignmentId, status: "active" },
    { $set: { status: "removed" } },
    { new: true },
  );
  if (!removed) throw conflict("Assignment not active", "NOT_ACTIVE");

  const project = await Project.findOneAndUpdate(
    { _id: removed.projectId },
    { $inc: { activeTesterCount: -1 } },
    { new: true },
  );

  const promoted = await promoteNextInQueue(removed.projectId);
  if (promoted) {
    removed.replacedBy = promoted._id;
    await removed.save();
  } else if (project && project.joinState === "full" && project.status === "active") {
    // no one waiting — the slot is open again
    await Project.updateOne({ _id: removed.projectId }, { $set: { joinState: "open" } });
  }

  const tester = await Tester.findById(removed.testerId).lean();
  if (tester) {
    await dispatch({
      recipientId: tester.userId,
      type: "assignment_removed",
      title: "Your slot was reassigned",
      body: reason,
      link: "/tester/tests",
      idempotencyKey: `removed:${removed._id}`,
    });
  }

  await recordMetric("tester_replaced", {
    projectId: removed.projectId,
    actorId,
    meta: { removedAssignment: removed._id, promotedAssignment: promoted?._id ?? null },
  });
  await writeAudit({
    actorId,
    action: "assignment.removed_replaced",
    entityType: "Assignment",
    entityId: removed._id,
    before: { status: "active" },
    after: { status: "removed", promotedTo: promoted?._id ?? null },
  });

  return { removed, promoted };
}

/** Sessions for future multi-doc flows live here. */
export async function withSession<T>(fn: (s: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    return await fn(session);
  } finally {
    await session.endSession();
  }
}
