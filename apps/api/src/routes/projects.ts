import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { PACKAGES, PROJECT_TYPES, PROJECT_TYPE_PLATFORM } from "@defineux/types";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import type { Types } from "mongoose";
import {
  Assignment,
  BugReport,
  Client,
  Invoice,
  MetricEvent,
  Project,
  Tester,
  User,
} from "../models/index.js";
import {
  createProjectWithInvoice,
  markInvoicePaid,
} from "../services/billing.js";
import { publishOpportunity } from "../services/workflow.js";
import { joinProject } from "../services/matching.js";
import { env } from "../config/env.js";
import { distributeTestingLinks } from "../services/verification.js";
import { writeAudit } from "../services/audit.js";
import { dispatch } from "../services/notify.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const projectsRouter = Router();

/** Public package catalog (drives the marketing pricing + client checkout). */
projectsRouter.get("/packages", (_req, res) => {
  ok(res, { packages: PACKAGES });
});

// --------------------------------------------------------------------------
// client
// --------------------------------------------------------------------------
const createSchema = z.object({
  packageKey: z.string().min(1),
  projectType: z.enum(["play_store_internal", "ios_testflight"]).optional(),
  testerCount: z.number().int().min(14).max(100).optional(),
  appDetails: z.object({
    appName: z.string().min(1).max(120),
    packageName: z.string().max(200).optional().default(""),
    description: z.string().max(2000).optional(),
    iconUrl: z.string().max(1000).optional(),
    webOptInUrl: z.string().url().optional().or(z.literal("")),
    playStoreUrl: z.string().url().optional().or(z.literal("")),
  }),
});

projectsRouter.post(
  "/",
  requireAuth,
  requireRole("client"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const body = createSchema.parse(req.body);
    if (!PACKAGES.some((p) => p.key === body.packageKey)) {
      throw badRequest(`Unknown package: ${body.packageKey}`, "UNKNOWN_PACKAGE");
    }
    const user = await User.findOne({ clerkUserId });
    const client = await Client.findOne({ userId: user?._id });
    if (!client) throw notFound("Client profile");

    let pkgName = (body.appDetails.packageName || "").trim().toLowerCase();
    if (pkgName) {
      if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(pkgName)) {
        throw badRequest("Invalid package name format", "INVALID_PACKAGE_NAME");
      }
    } else {
      const cleanSlug = body.appDetails.appName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app";
      pkgName = `com.publishapp.${cleanSlug}`;
    }

    const { project, invoice } = await createProjectWithInvoice({
      clientId: client._id,
      packageKey: body.packageKey,
      projectType: body.projectType,
      testerCount: body.testerCount,
      appDetails: {
        appName: body.appDetails.appName,
        packageName: pkgName,
        description: body.appDetails.description,
        iconUrl: body.appDetails.iconUrl || undefined,
        webOptInUrl: body.appDetails.webOptInUrl || undefined,
        playStoreUrl: body.appDetails.playStoreUrl || undefined,
      },
    });
    ok(res, { project, invoice }, 201);
  }),
);

projectsRouter.get(
  "/me",
  requireAuth,
  requireRole("client"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const client = await Client.findOne({ userId: user?._id });
    if (!client) throw notFound("Client profile");
    const projects = await Project.find({ clientId: client._id })
      .sort({ createdAt: -1 })
      .lean();
    const invoices = await Invoice.find({ clientId: client._id }).lean();
    ok(res, { projects, invoices });
  }),
);

// --------------------------------------------------------------------------
// tester — opportunities & join (BEFORE /:id so it doesn't shadow)
// --------------------------------------------------------------------------
projectsRouter.get(
  "/opportunities",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");

    // only show projects the tester's registered devices can actually test
    const platforms = new Set(tester.devices.map((d) => d.platform));
    const eligibleTypes = PROJECT_TYPES.filter((t) =>
      platforms.has(PROJECT_TYPE_PLATFORM[t]),
    );

    const projects = await Project.find({
      status: "active",
      joinState: { $in: ["open", "full"] },
      projectType: { $in: eligibleTypes },
    })
      .select("appDetails packageKey projectType requiredTesters activeTesterCount waitlistCount joinState createdAt")
      .sort({ opportunityPublishedAt: -1 })
      .lean();

    const mine = await Assignment.find({
      testerId: tester._id,
      projectId: { $in: projects.map((p) => p._id) },
    })
      .select("projectId status queuePosition")
      .lean();
    const byProject = new Map(mine.map((a) => [String(a.projectId), a]));

    ok(res, {
      opportunities: projects.map((p) => ({
        ...p,
        myAssignment: byProject.get(String(p._id)) ?? null,
      })),
    });
  }),
);

projectsRouter.post(
  "/:id/join",
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => env.isTest && !req.header("x-force-rate-limit"),
  }),
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const result = await joinProject(
      req.params.id as unknown as Types.ObjectId,
      user!._id,
    );
    ok(res, result, 201);
  }),
);

projectsRouter.get(
  "/:id/assignments",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound("Project");

    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(client._id) !== String(project.clientId)) {
        throw forbidden("Not your project");
      }
    }

    const assignments = await Assignment.find({ projectId: req.params.id })
      .populate({
        path: "testerId",
        select: "userId devices" + (role === "admin" ? " upi" : ""),
        populate: { path: "userId", select: "name email phone" },
      })
      .sort({ status: 1, queuePosition: 1, createdAt: 1 })
      .lean();
    ok(res, { assignments });
  }),
);

projectsRouter.get(
  "/:id/queue",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const queued = await Assignment.find({
      projectId: req.params.id,
      status: "queued",
    })
      .populate({
        path: "testerId",
        select: "userId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ queuePosition: 1 })
      .lean();
    ok(res, { queue: queued });
  }),
);

projectsRouter.post(
  "/:id/play-integration",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const body = z
      .object({
        optInUrl: z.string().url(),
        track: z.string().max(40).optional(),
      })
      .parse(req.body);
    const project = await distributeTestingLinks({
      projectId: req.params.id as unknown as Types.ObjectId,
      adminId: admin!._id,
      ...body,
    });
    ok(res, { project });
  }),
);

/** All active tester emails for Play Console closed testing track. */
projectsRouter.get(
  "/:id/tester-emails",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound("Project");

    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(client._id) !== String(project.clientId)) {
        throw forbidden("Not your project");
      }
    }

    const assignments = await Assignment.find({
      projectId: req.params.id,
      status: "active",
    }).lean();

    const testers = await Tester.find({
      _id: { $in: assignments.map((a) => a.testerId) },
    }).lean();

    const users = await User.find({
      _id: { $in: testers.map((t) => t.userId) },
    }).lean();

    const emails = users.map((u) => u.email).filter(Boolean).sort();
    const commaSeparated = emails.join(", ");
    const newlineSeparated = emails.join("\n");
    const requiredTesters = project.requiredTesters || 14;
    const isReady = emails.length >= requiredTesters;

    ok(res, {
      emails,
      commaSeparated,
      newlineSeparated,
      total: emails.length,
      requiredTesters,
      isReady,
      step1Verified: project.steps.find((s) => s.order === 1)?.state === "verified",
      step2Active: project.steps.find((s) => s.order === 2)?.state === "active",
    });
  }),
);

/** Backwards-compatible alias for admin / legacy callers. */
projectsRouter.get(
  "/:id/verified-tester-emails",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const assignments = await Assignment.find({
      projectId: req.params.id,
      status: "active",
    }).lean();
    const testers = await Tester.find({
      _id: { $in: assignments.map((a) => a.testerId) },
    }).lean();
    const users = await User.find({
      _id: { $in: testers.map((t) => t.userId) },
    }).lean();
    ok(res, { emails: users.map((u) => u.email).filter(Boolean).sort() });
  }),
);

/**
 * Client has added all tester emails to Google Play Console:
 * Advances Step 1 -> verified, Step 2 -> active, and unlocks opt-in links for testers.
 */
projectsRouter.post(
  "/:id/advance-to-step-2",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound("Project");

    const actor = await User.findOne({ clerkUserId });
    const actorId = actor?._id;

    if (role === "client") {
      const client = await Client.findOne({ userId: actorId });
      if (!client || String(client._id) !== String(project.clientId)) {
        throw forbidden("Not your project");
      }
    }

    if (project.status !== "active") {
      throw conflict("Project is not active yet", "PROJECT_NOT_ACTIVE");
    }

    const step1 = project.steps.find((s) => s.order === 1);
    const step2 = project.steps.find((s) => s.order === 2);

    // Idempotency: if step 2 is already active or verified, return success immediately
    if (step2?.state === "active" || step2?.state === "verified") {
      return ok(res, { project, alreadyAdvanced: true });
    }

    // Check active tester count (allow admin override if needed)
    const activeAssignments = await Assignment.find({
      projectId: project._id,
      status: "active",
    });

    const required = project.requiredTesters || 14;
    if (role !== "admin" && activeAssignments.length < required) {
      throw conflict(
        `All ${required} testers must join before proceeding. Currently ${activeAssignments.length} joined.`,
        "TESTERS_NOT_FULL",
      );
    }

    // Advance project steps
    if (step1) step1.state = "verified";
    if (step2) step2.state = "active";

    // Ensure optInUrl is populated from appDetails if available
    if (!project.playIntegration?.optInUrl && project.appDetails?.webOptInUrl) {
      project.playIntegration = {
        ...project.playIntegration,
        mode: "manual",
        optInUrl: project.appDetails.webOptInUrl,
      };
    }
    await project.save();

    // Advance all active assignments to Step 2
    for (const assignment of activeAssignments) {
      if (assignment.currentStep === 1) {
        assignment.currentStep = 2;
        assignment.lastActivityAt = new Date();
        await assignment.save();
      }

      // Notify tester
      const tester = await Tester.findById(assignment.testerId).lean();
      if (tester) {
        await dispatch({
          recipientId: tester.userId,
          type: "project_update",
          title: `Step 2 Ready — ${project.appDetails.appName}`,
          body: "The developer has added you to Google Play Console. Open your test dashboard to opt in and install the app!",
          link: `/tester/tests/${assignment._id}`,
          idempotencyKey: `step2_ready:${assignment._id}`,
        }).catch(() => {});
      }
    }

    if (actorId) {
      await writeAudit({
        actorId,
        action: "project.advance_to_step_2",
        entityType: "Project",
        entityId: project._id,
        after: { step1: "verified", step2: "active" },
      });
    }

    ok(res, { project, advanced: true });
  }),
);

/** Completion report bundle — built for Play Console evidence. */
projectsRouter.get(
  "/:id/completion-report",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const project = await Project.findById(req.params.id).lean();
    if (!project) throw notFound("Project");

    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(project.clientId) !== String(client._id)) {
        throw forbidden("Not your project");
      }
    }

    const [assignments, bugs, events] = await Promise.all([
      Assignment.find({ projectId: project._id })
        .populate({
          path: "testerId",
          select: "userId devices",
          populate: { path: "userId", select: "name email" },
        })
        .lean(),
      BugReport.find({ projectId: project._id, status: "published" })
        .select("-duplicateOf -mergedFrom")
        .lean(),
      MetricEvent.find({ projectId: project._id }).sort({ at: 1 }).lean(),
    ]);

    ok(res, {
      report: {
        generatedAt: new Date().toISOString(),
        app: project.appDetails,
        package: project.packageKey,
        window: {
          paymentConfirmedAt: project.paymentConfirmedAt,
          opportunityPublishedAt: project.opportunityPublishedAt,
          slotsFilledAt: project.slotsFilledAt,
          completedAt: project.completedAt,
        },
        testers: assignments.map((a) => ({
          testerId: (a.testerId as { _id?: unknown })?._id,
          tester: (a.testerId as { userId?: { name?: string; email?: string } })?.userId,
          devices: (a.testerId as { devices?: unknown[] })?.devices ?? [],
          status: a.status,
          stepsCompleted:
            a.status === "completed" ? 5 : a.currentStep - 1,
          proofsVerified: a.proofs.filter((p) => p.status === "verified").length,
          joinedAt: a.joinedAt,
        })),
        bugs,
        timeline: events.map((e) => ({ type: e.type, at: e.at, meta: e.meta })),
      },
    });
  }),
);

/** Post-project tester ratings (one per project per tester). */
projectsRouter.post(
  "/:id/ratings",
  requireAuth,
  requireRole("client"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const { ratings } = z
      .object({
        ratings: z
          .array(
            z.object({
              testerId: z.string(),
              rating: z.number().int().min(1).max(5),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(req.body);

    const user = await User.findOne({ clerkUserId });
    const client = await Client.findOne({ userId: user?._id });
    const project = await Project.findById(req.params.id);
    if (!project) throw notFound("Project");
    if (!client || String(project.clientId) !== String(client._id)) {
      throw forbidden("Not your project");
    }
    if (project.status !== "completed") {
      throw conflict("Ratings open when the project completes", "NOT_COMPLETED");
    }

    let rated = 0;
    for (const r of ratings) {
      if (project.ratedTesterIds.some((id) => String(id) === r.testerId)) continue;
      const tester = await Tester.findById(r.testerId);
      if (!tester) continue;
      tester.ratingAvg =
        (tester.ratingAvg * tester.ratingCount + r.rating) / (tester.ratingCount + 1);
      tester.ratingCount += 1;
      await tester.save();
      project.ratedTesterIds.push(tester._id);
      rated += 1;
      await writeAudit({
        actorId: user!._id,
        action: "tester.rated",
        entityType: "Tester",
        entityId: tester._id,
        after: { rating: r.rating, projectId: project._id },
      });
    }
    await project.save();
    ok(res, { rated });
  }),
);

// --------------------------------------------------------------------------
// admin
// --------------------------------------------------------------------------
projectsRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const status = z.string().optional().parse(req.query.status);
    const filter = status ? { status } : {};
    const projects = await Project.find(filter)
      .populate("clientId", "companyName contactName")
      .sort({ createdAt: -1 })
      .lean();

    const invoices = await Invoice.find({
      projectId: { $in: projects.map((p) => p._id) },
    })
      .select("projectId status totalPaise")
      .lean();
    const invoiceByProj = new Map(invoices.map((i) => [String(i.projectId), i]));

    ok(res, {
      projects: projects.map((p) => ({
        ...p,
        invoice: invoiceByProj.get(String(p._id)) ?? null,
      })),
    });
  }),
);

projectsRouter.post(
  "/:id/publish",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const project = await publishOpportunity(
      req.params.id as unknown as Types.ObjectId,
      admin!._id,
    );
    ok(res, { project });
  }),
);

// --------------------------------------------------------------------------
// shared read — owner client or admin (ownership enforced in the query)
// --------------------------------------------------------------------------
projectsRouter.get(
  "/:id",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const project = await Project.findById(req.params.id)
      .populate("clientId", "companyName contactName")
      .lean();
    if (!project) throw notFound("Project");

    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      const ownerId = (project.clientId as { _id: unknown })._id ?? project.clientId;
      if (!client || String(client._id) !== String(ownerId)) {
        throw forbidden("Not your project");
      }
    }
    ok(res, { project });
  }),
);

// mark-paid lives on invoices but is project-adjacent; expose under admin too
projectsRouter.post(
  "/:id/mark-paid",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const invoice = await Invoice.findOne({
      projectId: req.params.id,
      status: "pending",
    }).sort({ createdAt: -1 });
    if (!invoice) throw notFound("Pending invoice");
    const paid = await markInvoicePaid(invoice._id, admin!._id, { manual: true });
    ok(res, { invoice: paid });
  }),
);
