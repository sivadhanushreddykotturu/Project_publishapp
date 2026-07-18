import { Types } from "mongoose";
import { Project } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { MetricEvent } from "../models/MetricEvent";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { dispatchNotification } from "./notification.service";

/**
 * Tester clicks "Join Project" (PRD §4.2, §6). Slot allocation is a race-safe,
 * atomic server-side check: the project's activeTesterCount is incremented via a
 * guarded findOneAndUpdate, so concurrent joins can never exceed requiredTesters.
 * Testers who miss the cutoff are queued in arrival order (queuePosition).
 */
export async function joinProject(projectId: Types.ObjectId, testerId: Types.ObjectId) {
  const existing = await Assignment.findOne({ projectId, testerId });
  if (existing) throw ApiError.conflict("Tester has already joined this project");

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (project.status !== "active" && project.status !== "full") {
    throw ApiError.badRequest("Project is not currently accepting testers");
  }

  const claimed = await Project.findOneAndUpdate(
    { _id: projectId, $expr: { $lt: ["$activeTesterCount", "$requiredTesters"] } },
    { $inc: { activeTesterCount: 1 } },
    { new: true }
  );

  if (claimed) {
    const assignment = await Assignment.create({
      projectId,
      testerId,
      status: "active",
      currentStep: 1,
      assignedAt: new Date(),
      lastActivityAt: new Date(),
    });

    if (claimed.activeTesterCount >= claimed.requiredTesters && claimed.joinState !== "full") {
      claimed.joinState = "full";
      await claimed.save();
      await MetricEvent.create({ type: "slots_filled", projectId, meta: {} });
    }

    await MetricEvent.create({ type: "tester_joined", projectId, meta: { testerId, status: "active" } });
    await dispatchNotification({
      recipientUserId: (await Tester.findById(testerId))!.userId,
      type: "testing_link",
      channel: "email",
      relatedId: assignment._id.toString(),
      payload: { projectId: projectId.toString(), status: "active" },
    });
    return assignment;
  }

  const lastQueued = await Assignment.findOne({ projectId, status: "queued" }).sort({ queuePosition: -1 });
  const queuePosition = (lastQueued?.queuePosition ?? 0) + 1;

  const assignment = await Assignment.create({
    projectId,
    testerId,
    status: "queued",
    queuePosition,
    lastActivityAt: new Date(),
  });

  await MetricEvent.create({ type: "tester_joined", projectId, meta: { testerId, status: "queued", queuePosition } });
  return assignment;
}

/**
 * Promotes the lowest-queuePosition waiting tester into the freed slot. Race-safe:
 * the project counter increment is guarded exactly as in joinProject, and the queued
 * assignment is claimed with a single findOneAndUpdate so two concurrent promotions
 * can't pick the same tester.
 */
export async function promoteFromQueue(projectId: Types.ObjectId) {
  const claimedProject = await Project.findOneAndUpdate(
    { _id: projectId, $expr: { $lt: ["$activeTesterCount", "$requiredTesters"] } },
    { $inc: { activeTesterCount: 1 } },
    { new: true }
  );
  if (!claimedProject) return null;

  const promoted = await Assignment.findOneAndUpdate(
    { projectId, status: "queued" },
    { $set: { status: "active", assignedAt: new Date(), lastActivityAt: new Date() }, $unset: { queuePosition: 1 } },
    { sort: { queuePosition: 1 }, new: true }
  );

  if (!promoted) {
    // No one was waiting — release the slot we just claimed.
    await Project.findByIdAndUpdate(projectId, { $inc: { activeTesterCount: -1 } });
    return null;
  }

  await MetricEvent.create({ type: "tester_replaced", projectId, meta: { promotedAssignmentId: promoted._id } });
  const tester = await Tester.findById(promoted.testerId);
  if (tester) {
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "queue_promoted",
      channel: "email",
      relatedId: promoted._id.toString(),
      payload: { projectId: projectId.toString() },
    });
  }
  return promoted;
}

/**
 * Removes a Step-1 tester who has gone inactive past the configured threshold and
 * promotes the next queued tester into their slot. Automatic replacement is only
 * valid during Step 1 (PRD §4.4) — callers must not invoke this once a tester has
 * moved past verification onto the official Play Store track.
 */
export async function replaceInactiveStep1Tester(assignmentId: Types.ObjectId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.status !== "active" || assignment.currentStep !== 1) {
    throw ApiError.badRequest("Automatic replacement only applies to active Step 1 assignments");
  }

  // Free the slot first — promoteFromQueue only claims a slot when
  // activeTesterCount < requiredTesters, so the removal must land before promotion
  // or the outgoing tester's own slot blocks their replacement from being assigned.
  assignment.status = "removed";
  await assignment.save();
  await Project.findByIdAndUpdate(assignment.projectId, { $inc: { activeTesterCount: -1 } });

  const promoted = await promoteFromQueue(assignment.projectId);
  if (promoted) {
    assignment.replacedBy = promoted.testerId;
    await assignment.save();
  }

  return { removed: assignment, promoted };
}

/** Used by the cron job (jobs/inactivityCron.ts) to find Step-1 stragglers. */
export function step1InactivityCutoff(): Date {
  return new Date(Date.now() - env.workflow.step1InactivityHours * 3_600_000);
}
