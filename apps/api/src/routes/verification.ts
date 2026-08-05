import { Router } from "express";
import { z } from "zod";
import type { Types } from "mongoose";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Assignment, User } from "../models/index.js";
import { reviewSubmission } from "../services/verification.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const verificationRouter = Router();

verificationRouter.use(requireAuth, requireRole("admin"));

/** The review queue: every live submission, with tester + project context. */
verificationRouter.get(
  "/",
  ah(async (_req, res) => {
    const assignments = await Assignment.find({
      status: "active",
      "proofs.status": "submitted",
    })
      .populate({
        path: "testerId",
        select: "userId devices",
        populate: { path: "userId", select: "name email" },
      })
      .populate("projectId", "appDetails.appName")
      .sort({ "proofs.submittedAt": 1 })
      .lean();

    const items = assignments.flatMap((a) =>
      a.proofs
        .filter((p) => p.status === "submitted")
        .map((p) => ({
          proofId: p._id,
          assignmentId: a._id,
          step: p.step,
          fileUrl: p.fileUrl,
          fileHash: p.fileHash,
          submittedAt: p.submittedAt,
          tester: a.testerId,
          project: a.projectId,
        })),
    );
    ok(res, { items });
  }),
);

verificationRouter.post(
  "/:assignmentId/proofs/:proofId/review",
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const { approve, reason } = z
      .object({
        approve: z.boolean(),
        reason: z.string().max(500).optional(),
      })
      .parse(req.body);
    if (!approve && !reason) {
      throw Object.assign(new Error("A reason is required when rejecting"), {
        statusCode: 400,
        code: "REASON_REQUIRED",
      });
    }
    const assignment = await reviewSubmission({
      assignmentId: req.params.assignmentId as unknown as Types.ObjectId,
      proofId: req.params.proofId as unknown as Types.ObjectId,
      adminId: admin!._id,
      approve,
      reason,
    });
    ok(res, { assignment });
  }),
);
