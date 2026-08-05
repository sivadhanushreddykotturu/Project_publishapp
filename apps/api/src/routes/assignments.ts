import { Router } from "express";
import { z } from "zod";
import type { Types } from "mongoose";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Assignment, Tester, User } from "../models/index.js";
import { submitProof } from "../services/verification.js";
import { removeAndReplace } from "../services/matching.js";
import { forbidden, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const assignmentsRouter = Router();

/** Tester's own assignments, with project context. */
assignmentsRouter.get(
  "/me",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");
    const assignments = await Assignment.find({
      testerId: tester._id,
      status: { $ne: "removed" },
    })
      .populate("projectId", "appDetails steps status joinState playIntegration.optInUrl")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { assignments });
  }),
);

const proofSchema = z.object({
  fileUrl: z.string().min(1).max(1000),
  publicId: z.string().max(300).optional(),
  fileHash: z.string().max(128).optional(),
  note: z.string().max(1000).optional(),
});

assignmentsRouter.post(
  "/:id/proofs",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const body = proofSchema.parse(req.body);
    const assignment = await submitProof({
      assignmentId: req.params.id as unknown as Types.ObjectId,
      userId: user!._id,
      ...body,
    });
    ok(res, { assignment }, 201);
  }),
);

/** Shared read — the owning tester or an admin. */
assignmentsRouter.get(
  "/:id",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const assignment = await Assignment.findById(req.params.id)
      .populate("projectId", "appDetails steps status playIntegration.optInUrl")
      .lean();
    if (!assignment) throw notFound("Assignment");
    if (role === "tester") {
      const user = await User.findOne({ clerkUserId });
      const tester = await Tester.findOne({ userId: user?._id });
      if (!tester || String(tester._id) !== String(assignment.testerId)) {
        throw forbidden("Not your assignment");
      }
    } else if (role !== "admin") {
      throw forbidden();
    }
    ok(res, { assignment });
  }),
);

/** Admin manual replacement (any step — keeps Play track intact). */
assignmentsRouter.post(
  "/:id/replace",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const { reason } = z
      .object({ reason: z.string().max(500).optional() })
      .parse(req.body ?? {});
    const result = await removeAndReplace(
      req.params.id as unknown as Types.ObjectId,
      admin!._id,
      reason ?? "Replaced by an admin.",
    );
    ok(res, result);
  }),
);
