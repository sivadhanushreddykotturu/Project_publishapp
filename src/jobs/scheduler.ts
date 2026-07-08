import cron, { ScheduledTask } from "node-cron";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { runInactivityCheck } from "./inactivityCron";
import { runReminderSweep } from "./reminderCron";
import { retryPendingNotifications } from "../services/notification.service";

let tasks: ScheduledTask[] = [];

export function startScheduler() {
  if (env.isTest) return; // tests invoke the job functions directly, not on a timer

  const inactivityTask = cron.schedule(env.workflow.inactivityCronSchedule, async () => {
    try {
      const result = await runInactivityCheck();
      logger.info(result, "Inactivity check complete");
    } catch (err) {
      logger.error({ err }, "Inactivity check failed");
    }
  });

  const reminderTask = cron.schedule(env.workflow.reminderCronSchedule, async () => {
    try {
      await runReminderSweep();
      const retried = await retryPendingNotifications();
      logger.info({ retried }, "Notification retry sweep complete");
    } catch (err) {
      logger.error({ err }, "Reminder sweep failed");
    }
  });

  tasks = [inactivityTask, reminderTask];
  logger.info(
    { inactivity: env.workflow.inactivityCronSchedule, reminder: env.workflow.reminderCronSchedule },
    "Cron scheduler started"
  );
}

export function stopScheduler() {
  for (const task of tasks) task.stop();
  tasks = [];
}
