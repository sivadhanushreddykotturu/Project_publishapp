import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Tester, User } from "../models/index.js";
import { conflict, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import { writeAudit } from "../services/audit.js";

export const testersRouter = Router();

const profileSchema = z.object({
  devices: z
    .array(
      z.object({
        model: z.string().min(2).max(80),
        androidVersion: z.string().min(1).max(20),
        fingerprint: z.string().min(8).max(200),
      }),
    )
    .max(3)
    .optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  upi: z
    .object({
      vpa: z
        .string()
        .regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, "Not a valid UPI handle")
        .max(60),
      qrImageUrl: z.string().url().optional(),
    })
    .optional(),
});

testersRouter.get(
  "/me",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id }).lean();
    if (!tester) throw notFound("Tester profile");
    ok(res, { tester });
  }),
);

/** Profile update — one UPI per account is a unique index (fraud defense). */
testersRouter.put(
  "/me",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const body = profileSchema.parse(req.body);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");

    if (body.devices) tester.devices = body.devices;
    if (body.experienceLevel) tester.experienceLevel = body.experienceLevel;
    if (body.upi) tester.upi = body.upi;
    tester.lastActiveAt = new Date();

    try {
      await tester.save();
    } catch (err) {
      if ((err as { code?: number })?.code === 11000) {
        throw conflict("That UPI handle is linked to another account", "UPI_TAKEN");
      }
      throw err;
    }
    ok(res, { tester });
  }),
);

// --------------------------------------------------------------------------
// admin
// --------------------------------------------------------------------------
testersRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  ah(async (_req, res) => {
    const testers = await Tester.find()
      .populate("userId", "name email status")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { testers });
  }),
);

testersRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const { status } = z
      .object({ status: z.enum(["active", "suspended"]) })
      .parse(req.body);
    const admin = await User.findOne({ clerkUserId });
    const tester = await Tester.findById(req.params.id);
    if (!tester) throw notFound("Tester");
    const before = tester.status;
    tester.status = status;
    await tester.save();
    await writeAudit({
      actorId: admin!._id,
      action: "tester.status_changed",
      entityType: "Tester",
      entityId: tester._id,
      before: { status: before },
      after: { status },
    });
    ok(res, { tester });
  }),
);
