import { Request, Response } from "express";
import { z } from "zod";
import { Tester } from "../models/Tester";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { User } from "../models/User";

const deviceSchema = z.object({
  model: z.string().min(1),
  androidVersion: z.string().min(1),
  fingerprint: z.string().min(1),
});

const upsertProfileSchema = z.object({
  devices: z.array(deviceSchema).min(1),
  experienceLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  specialty: z.string().trim().min(1).max(120).optional(),
  upi: z.object({ vpa: z.string().min(1), qrImageUrl: z.string().url().optional() }),
});

export const getMyTesterProfile = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.notFound("Tester profile not found");
  res.status(200).json({ data: tester });
});

/** Fraud defense: one-UPI-per-account is enforced by the unique index on testers.upi.vpa. */
export const upsertMyTesterProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = upsertProfileSchema.parse(req.body);

  const conflict = await Tester.findOne({ "upi.vpa": body.upi.vpa, userId: { $ne: req.dbUser!._id } });
  if (conflict) throw ApiError.conflict("This UPI ID is already registered to another tester");

  const tester = await Tester.findOneAndUpdate(
    { userId: req.dbUser!._id },
    { $set: { ...body, lastActiveAt: new Date() } },
    { new: true, upsert: true }
  );
  res.status(200).json({ data: tester });
});

export const listTesters = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Tester.find(filter).populate("userId").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Tester.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

export const listPublicTesterDirectory = asyncHandler(async (_req: Request, res: Response) => {
  const testers = await Tester.find({ status: "active" })
    .select("devices experienceLevel ratingAvg ratingCount status")
    .populate("userId", "name")
    .sort({ ratingAvg: -1, ratingCount: -1 })
    .limit(100)
    .lean();
  res.status(200).json({ data: testers.map((tester) => ({
    _id: tester._id,
    userId: tester.userId,
    devices: tester.devices.map((device) => ({ model: device.model, androidVersion: device.androidVersion })),
    experienceLevel: tester.experienceLevel,
    ratingAvg: tester.ratingAvg,
    ratingCount: tester.ratingCount,
    status: tester.status,
  })) });
});

export const getTesterById = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findById(req.params.id).populate("userId");
  if (!tester) throw ApiError.notFound("Tester not found");
  res.status(200).json({ data: tester });
});

const statusSchema = z.object({ status: z.enum(["active", "inactive", "suspended"]) });

export const updateTesterStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const tester = await Tester.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!tester) throw ApiError.notFound("Tester not found");
  await User.updateOne(
    { _id: tester.userId, role: "tester" },
    { $set: { status: status === "active" ? "active" : "suspended" } }
  );
  res.status(200).json({ data: tester });
});
