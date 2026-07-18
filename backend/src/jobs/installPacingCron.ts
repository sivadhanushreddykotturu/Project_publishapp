import { Project } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { logger } from "../config/logger";
import { dispatchNotification } from "../services/notification.service";

/**
 * Runs once daily (INSTALL_PACING_CRON_SCHEDULE, default 9am). Notifies only the testers
 * whose scheduledInstallDate has arrived — ~INSTALLS_PER_DAY per day, assigned when
 * testing_period opens (workflowEngine.service#startTestingPeriodAndScheduleInstalls) — so
 * installs land naturally across the mandatory 14-day window instead of all 14 testers
 * hitting Play Store the same hour.
 */
export async function runInstallPacingSweep(): Promise<{ notified: number }> {
  const now = new Date();
  const projects = await Project.find({
    status: { $in: ["active", "full"] },
    "playIntegration.testingPeriodStartAt": { $exists: true },
  });

  let notified = 0;
  for (const project of projects) {
    const testingPeriodStep = project.steps.find((s) => s.type === "testing_period");
    if (!testingPeriodStep) continue;

    const dueAssignments = await Assignment.find({
      projectId: project._id,
      status: "active",
      currentStep: testingPeriodStep.order,
      scheduledInstallDate: { $lte: now },
      installPacingNotifiedAt: { $exists: false },
    });

    for (const assignment of dueAssignments) {
      const tester = await Tester.findById(assignment.testerId);
      if (!tester) continue;

      await dispatchNotification({
        recipientUserId: tester.userId,
        type: "install_scheduled",
        channel: "email",
        relatedId: assignment._id.toString(),
        payload: { projectId: project._id.toString(), appName: project.appDetails.appName },
      });

      assignment.installPacingNotifiedAt = now;
      await assignment.save();
      notified += 1;
    }
  }

  logger.info({ notified }, "Install pacing sweep complete");
  return { notified };
}
