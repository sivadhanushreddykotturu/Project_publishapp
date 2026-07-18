import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Project } from "../models/Project";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";
import { Assignment } from "../models/Assignment";
import { BugReport } from "../models/BugReport";
import { Invoice } from "../models/Invoice";
import { PACKAGES, PLAY_INTEGRATION_MODES } from "../models/enums";
import { PACKAGE_CONFIG, computeInvoiceAmount, requiresClientVerification } from "../constants/packages";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { joinProject } from "../services/matching.service";
import {
  getVerifiedTesterEmails,
  markTestersInvited,
  syncApiModeRelease,
  submitEmailsForReview,
  confirmEmailReviewApproved,
  applyForProduction,
  confirmProductionApproved,
} from "../services/playIntegration.service";
import { submitClientVerificationProof, reviewClientVerification } from "../services/clientVerification.service";
import { env } from "../config/env";

const createProjectSchema = z.object({
  package: z.enum(PACKAGES),
  requiredTesters: z.number().int().min(1).optional(),
  appDetails: z.object({
    appName: z.string().min(1),
    packageName: z.string().optional(),
    description: z.string().optional(),
    playStoreUrl: z.string().optional(),
  }),
});

/**
 * Client onboarding: sign up -> choose package -> upload app details -> pay (PRD §9.2).
 * "testers_only" stays fully self-serve. Any package where LaunchOps manages Play Console
 * (managed_testing, launch_ready, custom) instead requires client verification — proof they
 * control the Play Console listing, plus a direct discussion with the team — before payment
 * unlocks, so no invoice is created yet and the project starts in "pending_verification".
 */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const body = createProjectSchema.parse(req.body);
  const client = await Client.findOne({ userId: req.dbUser!._id });
  if (!client) throw ApiError.notFound("Client profile not found");

  const requiredTesters = Math.max(
    body.requiredTesters ?? PACKAGE_CONFIG[body.package]?.minTesters ?? env.workflow.defaultMinTesters,
    env.workflow.defaultMinTesters
  );
  const needsVerification = requiresClientVerification(body.package);

  const project = await Project.create({
    clientId: client._id,
    package: body.package,
    appDetails: body.appDetails,
    requiredTesters,
    status: needsVerification ? "pending_verification" : "awaiting_payment",
    verification: needsVerification ? { required: true, status: "pending" } : { required: false, status: "not_required" },
  });

  client.projects.push(project._id);
  client.activePackage = body.package;
  await client.save();

  if (needsVerification) {
    res.status(201).json({
      data: { project, invoice: null },
      message:
        "This package requires verification before payment. Submit proof you control the Play Console listing via POST /projects/:id/verification/submit, then the team will follow up directly.",
    });
    return;
  }

  const { amount, gst } = computeInvoiceAmount(body.package, requiredTesters);
  const invoice = await Invoice.create({
    clientId: client._id,
    projectId: project._id,
    package: body.package,
    amount,
    gst,
    dueDate: new Date(Date.now() + 7 * 24 * 3_600_000),
  });

  res.status(201).json({ data: { project, invoice } });
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id });
    filter.clientId = client?._id ?? new Types.ObjectId();
  }

  const [items, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

async function assertProjectVisible(req: Request, project: InstanceType<typeof Project>) {
  if (req.dbUser!.role === "admin") return;
  if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id });
    if (!client || !project.clientId.equals(client._id)) throw ApiError.forbidden();
    return;
  }
  throw ApiError.forbidden();
}

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");
  await assertProjectVisible(req, project);
  res.status(200).json({ data: project });
});

/** Tester clicks Join on the shared opportunity link (PRD §4.2). */
export const joinProjectAsTester = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.badRequest("Complete your tester profile before joining a project");

  const assignment = await joinProject(new Types.ObjectId(req.params.id), tester._id);
  res.status(201).json({ data: assignment });
});

export const getProjectQueue = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await Assignment.find({ projectId: req.params.id, status: "queued" })
    .sort({ queuePosition: 1 })
    .populate({ path: "testerId", populate: { path: "userId" } });
  res.status(200).json({ data: assignments });
});

const submitVerificationSchema = z.object({
  proofUrl: z.string().min(1),
  note: z.string().optional(),
});

/** Client submits proof they control the Play Console listing (R2 key from /uploads/presign). */
export const submitProjectVerification = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");
  await assertProjectVisible(req, project);

  const { proofUrl, note } = submitVerificationSchema.parse(req.body);
  const updated = await submitClientVerificationProof(new Types.ObjectId(req.params.id), proofUrl, note);
  res.status(200).json({ data: updated });
});

const reviewVerificationSchema = z.object({
  approve: z.boolean(),
  note: z.string().optional(),
  customAmount: z.number().int().positive().optional(),
  customGst: z.number().int().nonnegative().optional(),
});

/**
 * Admin reviews after the direct discussion + checking the submitted proof. Approving
 * creates the invoice (unblocking payment); rejecting leaves the project in
 * pending_verification so the client can resubmit.
 */
export const reviewProjectVerification = asyncHandler(async (req: Request, res: Response) => {
  const body = reviewVerificationSchema.parse(req.body);
  const result = await reviewClientVerification({
    projectId: new Types.ObjectId(req.params.id),
    adminId: req.dbUser!._id,
    ...body,
  });
  res.status(200).json({ data: result });
});

export const getVerifiedEmails = asyncHandler(async (req: Request, res: Response) => {
  const emails = await getVerifiedTesterEmails(new Types.ObjectId(req.params.id));
  res.status(200).json({ data: { emails, count: emails.length } });
});

/** Admin confirms verified tester emails were copied into Play Console and submitted for review. */
export const submitProjectEmailsForReview = asyncHandler(async (req: Request, res: Response) => {
  const project = await submitEmailsForReview(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: project });
});

/** Admin manually confirms Google approved the tester list before the ~3h estimate elapses. */
export const confirmProjectEmailReview = asyncHandler(async (req: Request, res: Response) => {
  const project = await confirmEmailReviewApproved(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: project });
});

const markInvitedSchema = z.object({ optInUrl: z.string().url() });

export const markProjectTestersInvited = asyncHandler(async (req: Request, res: Response) => {
  const { optInUrl } = markInvitedSchema.parse(req.body);
  const project = await markTestersInvited({
    projectId: new Types.ObjectId(req.params.id),
    optInUrl,
    adminId: req.dbUser!._id,
  });
  res.status(200).json({ data: project });
});

/** Hard-blocked until the mandatory 14-day testing period has actually elapsed. */
export const applyProjectForProduction = asyncHandler(async (req: Request, res: Response) => {
  const project = await applyForProduction(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: project });
});

/** Admin manually confirms Google approved production — no API signal exists for this. */
export const confirmProjectProductionApproved = asyncHandler(async (req: Request, res: Response) => {
  const project = await confirmProductionApproved(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: project });
});

const playIntegrationConfigSchema = z.object({
  mode: z.enum(PLAY_INTEGRATION_MODES).optional(),
  track: z.enum(["internal", "closed"]).optional(),
  packageName: z.string().optional(),
  aabFileUrl: z.string().optional(),
  serviceAccountLinked: z.boolean().optional(),
  testerGoogleGroupEmail: z.string().email().optional(),
});

/**
 * Admin configures API-mode prerequisites once the client has completed the guided
 * checklist (grant service account access, share the AAB) — Tech Spec §7 step 1.
 */
export const updatePlayIntegrationConfig = asyncHandler(async (req: Request, res: Response) => {
  const body = playIntegrationConfigSchema.parse(req.body);
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");

  Object.assign(project.playIntegration, body);
  await project.save();

  res.status(200).json({ data: project });
});

/**
 * Admin triggers the Google Play API-mode sync: upload the AAB, roll out the track
 * release, sync the tester Google Group if configured, and commit — all via the Play
 * Developer API. On any failure the project falls back to manual mode with an explicit
 * pointer to /testers-invited (Tech Spec §7 — a project is never blocked on this call).
 */
export const syncProjectPlayRelease = asyncHandler(async (req: Request, res: Response) => {
  const result = await syncApiModeRelease(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: result });
});

/** Auto-generated completion report bundle (PRD §4.5 Step 5, Tech Spec Week 4). */
export const getCompletionReport = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");
  await assertProjectVisible(req, project);

  const [assignments, bugReports] = await Promise.all([
    Assignment.find({ projectId: project._id }).populate({ path: "testerId", populate: { path: "userId" } }),
    BugReport.find({ projectId: project._id, status: "published" }),
  ]);

  const testerSummary = assignments.map((a) => ({
    testerId: a.testerId,
    status: a.status,
    currentStep: a.currentStep,
  }));

  res.status(200).json({
    data: {
      project: { id: project._id, appName: project.appDetails.appName, status: project.status },
      testerCompletionSummary: testerSummary,
      bugReports,
      generatedAt: new Date(),
    },
  });
});
