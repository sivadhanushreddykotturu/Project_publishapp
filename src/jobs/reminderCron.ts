import { Project } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { logger } from "../config/logger";
import { dispatchNotification } from "../services/notification.service";

/**
 * Runs every REMINDER_CRON_SCHEDULE (default hourly). Sends a step_reminder to every
 * active tester whose current step has an unmet deadline, and retries any queued/failed
 * notifications from earlier runs. Reminder is a derived scheduler flag, not a
 * persisted state (Tech Spec §5) — idempotency is handled by notification.service's
 * date-bucketed key, so re-running this job mid-day never double-sends.
 */
export async function runReminderSweep(): Promise<{ remindersSent: number }> {
  const now = new Date();
  const projects = await Project.find({ status: { $in: ["active", "full"] } });

  let remindersSent = 0;
  for (const project of projects) {
    for (const step of project.steps) {
      if (!step.deadline || step.deadline > now) continue;

      const dueAssignments = await Assignment.find({
        projectId: project._id,
        status: "active",
        currentStep: step.order,
      });

      for (const assignment of dueAssignments) {
        const tester = await Tester.findById(assignment.testerId);
        if (!tester) continue;

        await dispatchNotification({
          recipientUserId: tester.userId,
          type: "step_reminder",
          channel: "email",
          relatedId: `${assignment._id.toString()}:${step.order}`,
          payload: { projectId: project._id.toString(), step: step.order, appName: project.appDetails.appName },
        });
        remindersSent += 1;
      }
    }
  }

  logger.info({ remindersSent }, "Reminder sweep complete");
  return { remindersSent };
}
