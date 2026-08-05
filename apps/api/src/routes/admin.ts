import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  Assignment,
  BugReport,
  Client,
  Invoice,
  MetricEvent,
  Project,
  User,
  WalletTransaction,
} from "../models/index.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

/** Dashboard summary — counts the console needs at a glance. */
adminRouter.get(
  "/summary",
  ah(async (_req, res) => {
    const [
      usersByRole,
      projectsByStatus,
      pendingProofs,
      openBugs,
      pendingWithdrawals,
      pendingInvoices,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Assignment.countDocuments({ "proofs.status": "submitted" }),
      BugReport.countDocuments({ status: "open" }),
      WalletTransaction.countDocuments({ type: "withdrawal", status: "pending" }),
      Invoice.countDocuments({ status: "pending" }),
    ]);

    const toMap = (rows: Array<{ _id: string; count: number }>) =>
      Object.fromEntries(rows.map((r) => [r._id, r.count]));

    ok(res, {
      users: toMap(usersByRole),
      projects: toMap(projectsByStatus),
      pendingProofs,
      openBugs,
      pendingWithdrawals,
      pendingInvoices,
    });
  }),
);

/** PRD-target metrics — provable from metricEvent + project timestamps. */
adminRouter.get(
  "/metrics",
  ah(async (_req, res) => {
    const [projects, eventsByType, payoutAgg, recent] = await Promise.all([
      Project.find({
        paymentConfirmedAt: { $exists: true },
        opportunityPublishedAt: { $exists: true },
      })
        .select("paymentConfirmedAt opportunityPublishedAt slotsFilledAt completedAt status")
        .lean(),
      MetricEvent.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      WalletTransaction.aggregate([
        { $match: { type: "withdrawal", status: "paid" } },
        { $group: { _id: null, totalPaise: { $sum: "$amountPaise" }, count: { $sum: 1 } } },
      ]),
      MetricEvent.find().sort({ at: -1 }).limit(25).lean(),
    ]);

    // payment_confirmed → opportunity_published — the PRD's 5-minute target
    const publishMinutes = projects.map((p) =>
      (new Date(p.opportunityPublishedAt!).getTime() -
        new Date(p.paymentConfirmedAt!).getTime()) / 60_000,
    );
    const avgPublishMinutes =
      publishMinutes.length > 0
        ? publishMinutes.reduce((a, b) => a + b, 0) / publishMinutes.length
        : null;
    const withinTarget = publishMinutes.filter((m) => m <= 5).length;

    ok(res, {
      paymentToPublish: {
        samples: publishMinutes.length,
        avgMinutes: avgPublishMinutes,
        withinFiveMinutes: withinTarget,
      },
      events: Object.fromEntries(
        eventsByType.map((r: { _id: string; count: number }) => [r._id, r.count]),
      ),
      payouts: {
        totalPaise: payoutAgg[0]?.totalPaise ?? 0,
        count: payoutAgg[0]?.count ?? 0,
      },
      recentEvents: recent,
    });
  }),
);

/** Client accounts with project counts + communication history. */
adminRouter.get(
  "/clients",
  ah(async (_req, res) => {
    const clients = await Client.find()
      .populate("userId", "name email status createdAt")
      .populate("projects", "appDetails.appName status")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { clients });
  }),
);
