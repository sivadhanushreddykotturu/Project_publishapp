import { Request, Response } from "express";
import { MetricEvent } from "../models/MetricEvent";
import { Project } from "../models/Project";
import { BugReport } from "../models/BugReport";
import { Tester } from "../models/Tester";
import { Assignment } from "../models/Assignment";
import { WalletTransaction } from "../models/WalletTransaction";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Instruments the PRD §2.2 success metrics directly from metricEvents timestamps,
 * so targets ("under 5 minutes", "50+ concurrent projects") are provable, not anecdotal.
 */
export const getMetricsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const [paymentToAssignment, activeProjects, duplicatesMerged, projectsCompleted] = await Promise.all([
    computeAvgPaymentToOpportunityMs(),
    Project.countDocuments({ status: { $in: ["active", "full"] } }),
    BugReport.countDocuments({ status: "duplicate" }),
    Project.countDocuments({ status: "completed" }),
  ]);

  const inactiveReplacements = await MetricEvent.countDocuments({ type: "tester_replaced" });

  res.status(200).json({
    data: {
      avgPaymentToOpportunityPublishedMs: paymentToAssignment,
      activeProjectsCount: activeProjects,
      duplicateBugReportsMerged: duplicatesMerged,
      projectsCompleted,
      inactiveTesterReplacements: inactiveReplacements,
      target: {
        paymentToAssignedUnderMs: 5 * 60 * 1000,
        adminHoursPerProjectPerWeekUnder: 0.5,
        concurrentProjectsPerAdminTarget: 50,
      },
    },
  });
});

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const inactiveCutoff = new Date(Date.now() - env.workflow.step1InactivityHours * 3_600_000);

  const [
    totalProjects, activeProjects, totalTesters, activeTesters, inactiveTesters,
    activeAssignments, queuedAssignments, completedAssignments, totalAssignments,
    totalBugs, publishedBugs, replacementsToday, bugsResolvedToday, pendingPayouts,
    payoutTotals, playSyncErrors, playConfigured,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ["active", "full"] } }),
    Tester.countDocuments(),
    Tester.countDocuments({ status: "active", lastActiveAt: { $gte: inactiveCutoff } }),
    Tester.countDocuments({ $or: [{ status: { $ne: "active" } }, { lastActiveAt: { $lt: inactiveCutoff } }] }),
    Assignment.countDocuments({ status: "active" }),
    Assignment.countDocuments({ status: "queued" }),
    Assignment.countDocuments({ status: "completed" }),
    Assignment.countDocuments({ status: { $in: ["active", "queued", "completed"] } }),
    BugReport.countDocuments(),
    BugReport.countDocuments({ status: "published" }),
    MetricEvent.countDocuments({ type: "tester_replaced", at: { $gte: startOfDay } }),
    BugReport.countDocuments({ status: "published", publishedAt: { $gte: startOfDay } }),
    WalletTransaction.countDocuments({ type: "withdrawal", status: "pending" }),
    WalletTransaction.aggregate([{ $match: { type: "withdrawal", status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Project.countDocuments({ "playIntegration.lastApiError": { $exists: true, $nin: [null, ""] } }),
    Project.countDocuments({ "playIntegration.serviceAccountLinked": true }),
  ]);

  res.status(200).json({
    data: {
      projects: { total: totalProjects, active: activeProjects },
      testers: { total: totalTesters, active: activeTesters, inactive: inactiveTesters },
      assignments: { total: totalAssignments, active: activeAssignments, queued: queuedAssignments, completed: completedAssignments },
      bugs: { total: totalBugs, published: publishedBugs, resolvedToday: bugsResolvedToday },
      payouts: { paidTotal: payoutTotals[0]?.total ?? 0, pending: pendingPayouts },
      replacementsToday,
      successRate: totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
      playStoreSync: { status: playSyncErrors > 0 ? "degraded" : playConfigured > 0 ? "operational" : "not_configured", errors: playSyncErrors, configuredProjects: playConfigured },
      system: { status: "operational", serverTime: new Date(), uptimeSeconds: Math.floor(process.uptime()) },
      inactivityThresholdHours: env.workflow.step1InactivityHours,
    },
  });
});

async function computeAvgPaymentToOpportunityMs(): Promise<number | null> {
  const paired = await MetricEvent.aggregate([
    { $match: { type: { $in: ["payment_confirmed", "opportunity_published"] } } },
    { $sort: { at: 1 } },
    {
      $group: {
        _id: "$projectId",
        events: { $push: { type: "$type", at: "$at" } },
      },
    },
  ]);

  const deltas: number[] = [];
  for (const doc of paired) {
    const payment = doc.events.find((e: { type: string }) => e.type === "payment_confirmed");
    const published = doc.events.find((e: { type: string }) => e.type === "opportunity_published");
    if (payment && published) {
      deltas.push(new Date(published.at).getTime() - new Date(payment.at).getTime());
    }
  }
  if (deltas.length === 0) return null;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}
