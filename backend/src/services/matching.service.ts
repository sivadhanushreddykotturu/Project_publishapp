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
export async function joinProject(
  projectId: Types.ObjectId,
  testerId: Types.ObjectId,
  options: { reactivateRemoved?: boolean } = {}
) {
  const existing = await Assignment.findOne({ projectId, testerId });
  // Joining is idempotent: repeated clicks, retries, or a refreshed notification
  // return the tester's existing enrollment instead of surfacing a misleading 409.
  const shouldReactivate = existing?.status === "removed" && options.reactivateRemoved;
  if (existing && !shouldReactivate) return existing;

  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (project.status !== "active" && project.status !== "full") {
    throw ApiError.badRequest("Project is not currently accepting testers");
  }
  if (project.joinState === "closed") throw ApiError.conflict("Enrollment is closed: all 14 tester slots and 3 waitlist spots are filled");
  const tester = await Tester.findById(testerId);
  if (!tester) throw ApiError.notFound("Tester not found");
  const activeProjectCount = await Assignment.countDocuments({ testerId, status: "active" });
  if (activeProjectCount >= 3 && !shouldReactivate) {
    throw ApiError.conflict("A tester can participate in a maximum of 3 active projects");
  }
  const requiredDevices = project.requiredDeviceModels ?? [];
  if (requiredDevices.length > 0 && !tester.devices.some((device) => requiredDevices.includes(device.model))) {
    throw ApiError.forbidden("This project requires a registered matching device");
  }

  const claimed = await Project.findOneAndUpdate(
    { _id: projectId, $expr: { $lt: ["$activeTesterCount", "$requiredTesters"] } },
    { $inc: { activeTesterCount: 1 } },
    { new: true }
  );

  if (claimed) {
    const assignedAt = new Date();
    const assignment = shouldReactivate
      ? await Assignment.findOneAndUpdate(
          { _id: existing!._id, status: "removed" },
          {
            $set: {
              status: "active",
              currentStep: 1,
              proofs: [],
              inactivityFlag: false,
              assignedAt,
              lastActivityAt: assignedAt,
            },
            $unset: { queuePosition: 1, replacedBy: 1, scheduledInstallDate: 1, installPacingNotifiedAt: 1 },
          },
          { new: true }
        )
      : await Assignment.create({
          projectId,
          testerId,
          status: "active",
          currentStep: 1,
          assignedAt,
          lastActivityAt: assignedAt,
        });

    // Another concurrent admin request may have reactivated the same historical
    // assignment after we claimed a project slot. Release our duplicate claim.
    if (!assignment) {
      await Project.findByIdAndUpdate(projectId, { $inc: { activeTesterCount: -1 } });
      const concurrentlyReactivated = await Assignment.findById(existing!._id);
      if (!concurrentlyReactivated) throw ApiError.notFound("Assignment not found after concurrent allocation");
      return concurrentlyReactivated;
    }

    if (claimed.activeTesterCount >= claimed.requiredTesters && claimed.joinState !== "full") {
      claimed.joinState = "full";
      await claimed.save();
      await MetricEvent.create({ type: "slots_filled", projectId, meta: {} });
    }

    await MetricEvent.create({ type: "tester_joined", projectId, meta: { testerId, status: "active" } });
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "testing_link",
      channel: "email",
      relatedId: shouldReactivate ? `${assignment._id.toString()}:${assignedAt.toISOString()}` : assignment._id.toString(),
      payload: { projectId: projectId.toString(), status: "active", reallocated: Boolean(shouldReactivate) },
    });
    return assignment;
  }

  const waitlistClaim = await Project.findOneAndUpdate(
    {
      _id: projectId,
      joinState: { $ne: "closed" },
      $or: [{ waitlistCount: { $lt: 3 } }, { waitlistCount: { $exists: false } }],
    },
    { $inc: { waitlistCount: 1 } },
    { new: true }
  );
  if (!waitlistClaim) throw ApiError.conflict("Enrollment is closed: the 3-person waitlist is full");
  const queuePosition = waitlistClaim.waitlistCount;

  const assignment = await Assignment.create({
    projectId,
    testerId,
    status: "queued",
    queuePosition,
    lastActivityAt: new Date(),
  });
  if (waitlistClaim.waitlistCount >= 3) {
    waitlistClaim.joinState = "closed";
    await waitlistClaim.save();
  }

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

  const saturatedTesterIds = await Assignment.aggregate<{ _id: Types.ObjectId }>([
    { $match: { status: "active" } },
    { $group: { _id: "$testerId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 3 } } },
  ]).then((rows) => rows.map((row) => row._id));
  const promoted = await Assignment.findOneAndUpdate(
    { projectId, status: "queued", testerId: { $nin: saturatedTesterIds } },
    { $set: { status: "active", assignedAt: new Date(), lastActivityAt: new Date() }, $unset: { queuePosition: 1 } },
    { sort: { queuePosition: 1 }, new: true }
  );

  if (!promoted) {
    // No one was waiting — release the slot we just claimed.
    await Project.findByIdAndUpdate(projectId, { $inc: { activeTesterCount: -1 } });
    return null;
  }
  claimedProject.waitlistCount = Math.max(0, (claimedProject.waitlistCount ?? 0) - 1);
  claimedProject.joinState = claimedProject.activeTesterCount >= claimedProject.requiredTesters ? "full" : "open";
  await claimedProject.save();

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

/** Admin promotion of a specific queued tester when a project has an open slot. */
export async function promoteSpecificQueuedAssignment(assignmentId: Types.ObjectId) {
  const queued = await Assignment.findOne({ _id: assignmentId, status: "queued" });
  if (!queued) throw ApiError.badRequest("This tester is not currently queued");
  if (await Assignment.countDocuments({ testerId: queued.testerId, status: "active" }) >= 3) {
    throw ApiError.conflict("This tester already has the maximum of 3 active projects");
  }

  const project = await Project.findOneAndUpdate(
    { _id: queued.projectId, $expr: { $lt: ["$activeTesterCount", "$requiredTesters"] } },
    { $inc: { activeTesterCount: 1 } },
    { new: true }
  );
  if (!project) throw ApiError.conflict("No open tester slot is available");

  const promoted = await Assignment.findOneAndUpdate(
    { _id: assignmentId, status: "queued" },
    { $set: { status: "active", currentStep: 1, assignedAt: new Date(), lastActivityAt: new Date() }, $unset: { queuePosition: 1 } },
    { new: true }
  );
  if (!promoted) {
    await Project.findByIdAndUpdate(queued.projectId, { $inc: { activeTesterCount: -1 } });
    throw ApiError.conflict("The queue changed before this tester could be promoted");
  }

  project.waitlistCount = Math.max(0, (project.waitlistCount ?? 0) - 1);
  project.joinState = project.activeTesterCount >= project.requiredTesters ? "full" : "open";
  await project.save();

  const tester = await Tester.findById(promoted.testerId);
  if (tester) {
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "queue_promoted",
      channel: "email",
      relatedId: promoted._id.toString(),
      payload: { projectId: queued.projectId.toString() },
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
