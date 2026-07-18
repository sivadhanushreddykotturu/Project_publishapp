import { Request, Response } from "express";
import { MetricEvent } from "../models/MetricEvent";
import { Project } from "../models/Project";
import { BugReport } from "../models/BugReport";
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
