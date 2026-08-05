import cron from "node-cron";
import { Types } from "mongoose";
import { Assignment, Project, Tester, User } from "../models/index.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { removeAndReplace } from "../services/matching.js";
import { dispatch, dispatchToAdmins, retryQueuedEmails } from "../services/notify.js";
import { getTemplate } from "../services/workflow.js";

/** Synthetic actor for automated actions in the audit trail. */
export const SYSTEM_ACTOR = new Types.ObjectId("000000000000000000000000");

/**
 * Inactivity sweep (every 15 min per spec):
 *  - Step 1 + idle > threshold → auto-remove, promote from queue.
 *  - Step 2+ + idle → admin alert with everything needed to act manually
 *    (auto-removal would disrupt the client's Play track continuity).
 */
export async function runInactivitySweep(
  now = new Date(),
): Promise<{ removed: number; flagged: number }> {
  let removed = 0;
  let flagged = 0;

  const stale = await Assignment.find({ status: "active" });
  for (const a of stale) {
    const project = await Project.findById(a.projectId).lean();
    if (!project || project.status !== "active") continue;
    const thresholdHrs =
      getTemplate(project.packageKey).inactivityHoursBeforeReplacement;
    const idleMs = now.getTime() - new Date(a.lastActivityAt).getTime();
    if (idleMs < thresholdHrs * 3600 * 1000) continue;

    const daysIdle = Math.floor(idleMs / (24 * 3600 * 1000));

    if (a.currentStep === 1) {
      await removeAndReplace(
        a._id,
        SYSTEM_ACTOR,
        `Inactive for ${daysIdle}+ day(s) during verification. Your slot went to the next tester on the waiting list.`,
      );
      removed += 1;
      logger.info({ assignmentId: a._id }, "inactive tester auto-replaced");
    } else if (!a.inactivityFlag) {
      a.inactivityFlag = true;
      await a.save();
      const tester = await Tester.findById(a.testerId).lean();
      const user = tester ? await User.findById(tester.userId).lean() : null;
      await dispatchToAdmins({
        type: "inactivity_alert",
        title: `Tester inactive at step ${a.currentStep} — ${project.appDetails.appName}`,
        body: [
          `Tester: ${user?.name ?? "unknown"} (${user?.email ?? "?"}, ${user?.phone ?? "no phone"})`,
          `Project: ${project.appDetails.appName} · Step ${a.currentStep}`,
          `Last activity: ${new Date(a.lastActivityAt).toISOString()} (${daysIdle} day(s) idle)`,
          `Pending action: manual replacement keeps the Play track intact.`,
        ].join("\n"),
        link: "/admin/projects",
        idempotencyKey: `inactive:${a._id}`,
      });
      flagged += 1;
    }
  }
  return { removed, flagged };
}

/**
 * Deadline reminders — hourly. Reminder is a derived flag, not a state;
 * idempotency is type + recipient + related id + date-bucket.
 */
export async function runReminderSweep(now = new Date()): Promise<number> {
  let sent = 0;
  const active = await Assignment.find({ status: "active" });
  for (const a of active) {
    if (a.proofs.some((p) => p.step === a.currentStep && p.status === "submitted")) {
      continue; // already awaiting review
    }
    const project = await Project.findById(a.projectId).lean();
    if (!project || project.status !== "active") continue;
    const embedded = project.steps.find((s) => s.order === a.currentStep);
    if (!embedded) continue;
    if (embedded.config.projectLevelGate && embedded.state !== "active") continue;

    const idleMs = now.getTime() - new Date(a.lastActivityAt).getTime();
    if (idleMs < (embedded.config.deadlineHours / 2) * 3600 * 1000) continue;

    const tester = await Tester.findById(a.testerId).lean();
    if (!tester) continue;
    const bucket = now.toISOString().slice(0, 10); // date-bucket
    await dispatch({
      recipientId: tester.userId,
      type: "project_update",
      title: `Step ${a.currentStep} is waiting on you`,
      body: `You're on step ${a.currentStep} for ${project.appDetails.appName}. Submit before your deadline to keep your slot.`,
      link: "/tester/tests",
      idempotencyKey: `reminder:${a._id}:${a.currentStep}:${bucket}`,
    });
    sent += 1;
  }
  return sent;
}

export function startJobs(): void {
  if (env.isTest) return;
  cron.schedule(env.INACTIVITY_CRON, () => {
    runInactivitySweep().catch((err) => logger.error({ err }, "inactivity sweep failed"));
  });
  cron.schedule(env.REMINDER_CRON, () => {
    runReminderSweep().catch((err) => logger.error({ err }, "reminder sweep failed"));
    retryQueuedEmails().catch((err) => logger.error({ err }, "email retry failed"));
  });
  logger.info("cron jobs registered");
}
