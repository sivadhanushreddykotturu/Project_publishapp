import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { BugReport } from "../models/BugReport";
import { Tester } from "../models/Tester";
import { Assignment } from "../models/Assignment";
import { Project } from "../models/Project";
import { Client } from "../models/Client";
import { BUG_CATEGORIES, BUG_SEVERITIES } from "../models/enums";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";

const submitSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(BUG_CATEGORIES),
  severity: z.enum(BUG_SEVERITIES),
  device: z.string().min(1),
  appVersion: z.string().optional(),
  expectedResult: z.string().min(1),
  actualResult: z.string().min(1),
  stepsToReproduce: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
});

/** Tester submits a structured bug report (PRD §5.1) — not free text. */
export const submitBugReport = asyncHandler(async (req: Request, res: Response) => {
  const projectId = new Types.ObjectId(req.params.projectId);
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.notFound("Tester profile not found");

  const assignment = await Assignment.findOne({ projectId, testerId: tester._id, status: { $in: ["active", "completed"] } });
  if (!assignment) throw ApiError.forbidden("You are not an active tester on this project");

  const body = submitSchema.parse(req.body);
  const bugReport = await BugReport.create({ projectId, testerId: tester._id, ...body });

  await MetricEvent.create({ type: "bug_report_submitted", projectId, meta: { bugReportId: bugReport._id } });
  res.status(201).json({ data: bugReport });
});

async function assertProjectAccessible(req: Request, projectId: Types.ObjectId) {
  if (req.dbUser!.role === "admin") return;
  if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id });
    const project = await Project.findById(projectId);
    if (!client || !project || !project.clientId.equals(client._id)) throw ApiError.forbidden();
    return;
  }
  throw ApiError.forbidden();
}

/**
 * Admin sees the full queue (open + merged, for review); clients only ever see the
 * published, de-duplicated set — the mess never reaches them (PRD §5.2 design principle).
 */
export const listBugReports = asyncHandler(async (req: Request, res: Response) => {
  const projectId = new Types.ObjectId(req.params.projectId);
  await assertProjectAccessible(req, projectId);

  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = { projectId };
  if (req.dbUser!.role === "client") filter.status = "published";
  else if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    BugReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BugReport.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

const mergeSchema = z.object({
  canonicalId: z.string().min(1),
  duplicateIds: z.array(z.string().min(1)).min(1),
});

/** Admin merges duplicates into one canonical report, keeping the strongest evidence (PRD §5.2). */
export const mergeBugReports = asyncHandler(async (req: Request, res: Response) => {
  const { canonicalId, duplicateIds } = mergeSchema.parse(req.body);

  const canonical = await BugReport.findById(canonicalId);
  if (!canonical) throw ApiError.notFound("Canonical bug report not found");

  await BugReport.updateMany(
    { _id: { $in: duplicateIds } },
    { $set: { status: "duplicate", duplicateOf: canonical._id } }
  );

  await MetricEvent.create({
    type: "bug_reports_merged",
    projectId: canonical.projectId,
    meta: { canonicalId, duplicateIds },
  });
  await recordAudit({
    actorId: req.dbUser!._id,
    action: "bugReport.merge",
    entityType: "BugReport",
    entityId: canonical._id,
    after: { duplicateIds },
  });

  res.status(200).json({ data: { canonicalId, mergedCount: duplicateIds.length } });
});

const publishSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

/** Admin publishes the clean, de-duplicated set to the client dashboard (PRD §5.2). */
export const publishBugReports = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = publishSchema.parse(req.body);

  const result = await BugReport.updateMany(
    { _id: { $in: ids }, status: { $ne: "duplicate" } },
    { $set: { status: "published", publishedAt: new Date() } }
  );

  await recordAudit({
    actorId: req.dbUser!._id,
    action: "bugReport.publish",
    entityType: "BugReport",
    entityId: new Types.ObjectId(ids[0]),
    after: { ids },
  });

  res.status(200).json({ data: { publishedCount: result.modifiedCount } });
});
