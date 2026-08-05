import { Router } from "express";
import { z } from "zod";
import type { Types } from "mongoose";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Assignment, BugReport, Client, Project, Tester, User } from "../models/index.js";
import { mergeBugs, publishBugs } from "../services/bugs.js";
import { recordMetric } from "../services/metrics.js";
import { forbidden, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const bugsRouter = Router();

const reportSchema = z.object({
  title: z.string().min(4).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(["crash", "ui", "performance", "network", "functional", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  device: z.object({
    platform: z.enum(["android", "ios"]).default("android"),
    model: z.string().min(1).max(80),
    osVersion: z.string().min(1).max(20),
  }),
  appVersion: z.string().max(40).optional(),
  expectedResult: z.string().min(3).max(2000),
  actualResult: z.string().min(3).max(2000),
  stepsToReproduce: z.array(z.string().max(500)).max(20).default([]),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string(),
        resourceType: z.enum(["image", "video", "raw"]),
        bytes: z.number().default(0),
        hash: z.string().optional(),
      }),
    )
    .max(5)
    .default([]),
});

/** Tester files a structured report — must be on the project. */
bugsRouter.post(
  "/projects/:projectId/bug-reports",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const body = reportSchema.parse(req.body);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");

    const assignment = await Assignment.findOne({
      projectId: req.params.projectId,
      testerId: tester._id,
      status: { $in: ["active", "completed"] },
    });
    if (!assignment) throw forbidden("You aren't on this project");

    const bug = await BugReport.create({
      projectId: req.params.projectId,
      testerId: tester._id,
      ...body,
    });
    assignment.lastActivityAt = new Date();
    await assignment.save();
    await recordMetric("bug_submitted", {
      projectId: bug.projectId,
      actorId: user!._id,
      meta: { severity: bug.severity, category: bug.category },
    });
    ok(res, { bug }, 201);
  }),
);

/**
 * Read bug reports per project:
 *  tester → own reports · client → published only (own project) · admin → all
 */
bugsRouter.get(
  "/projects/:projectId/bug-reports",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const projectId = req.params.projectId;

    if (role === "admin") {
      const bugs = await BugReport.find({ projectId })
        .populate({
          path: "testerId",
          select: "userId",
          populate: { path: "userId", select: "name email" },
        })
        .sort({ createdAt: -1 })
        .lean();
      ok(res, { bugs });
      return;
    }
    if (role === "tester") {
      const tester = await Tester.findOne({ userId: user?._id });
      const bugs = await BugReport.find({ projectId, testerId: tester?._id })
        .sort({ createdAt: -1 })
        .lean();
      ok(res, { bugs });
      return;
    }
    // client — ownership + published only
    const client = await Client.findOne({ userId: user?._id });
    const project = await Project.findById(projectId).lean();
    if (!client || !project || String(project.clientId) !== String(client._id)) {
      throw forbidden("Not your project");
    }
    const bugs = await BugReport.find({ projectId, status: "published" })
      .sort({ publishedAt: -1 })
      .lean();
    ok(res, { bugs });
  }),
);

bugsRouter.get(
  "/bug-reports/me",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    const bugs = await BugReport.find({ testerId: tester?._id })
      .populate("projectId", "appDetails.appName")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { bugs });
  }),
);

bugsRouter.post(
  "/bug-reports/merge",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const { sourceId, targetId } = z
      .object({ sourceId: z.string(), targetId: z.string() })
      .parse(req.body);
    await mergeBugs({
      sourceId: sourceId as unknown as Types.ObjectId,
      targetId: targetId as unknown as Types.ObjectId,
      adminId: admin!._id,
    });
    ok(res, { merged: true });
  }),
);

bugsRouter.post(
  "/bug-reports/publish",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const { ids } = z
      .object({ ids: z.array(z.string()).min(1).max(100) })
      .parse(req.body);
    const published = await publishBugs({
      ids: ids as unknown as Types.ObjectId[],
      adminId: admin!._id,
    });
    ok(res, { published });
  }),
);
