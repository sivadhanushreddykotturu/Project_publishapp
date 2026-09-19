import { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { z } from "zod";
import { logger } from "../config/logger";
import { User } from "../models/User";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";
import { Role } from "../models/enums";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

const syncSchema = z.object({
  role: z.enum(["client", "tester"]),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

async function syncClerkRoleMetadata(clerkUserId: string, role: Role) {
  try {
    await clerkClient.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role,
        launchOpsRole: role,
      },
    });
  } catch (err) {
    logger.warn({ err, clerkUserId, role }, "Unable to mirror LaunchOps role into Clerk metadata");
  }
}

/**
 * Called by the frontend right after Clerk sign-in/sign-up. Admin is invite-only
 * (Tech Spec §3) so this endpoint can only ever provision client/tester users —
 * an admin account is created directly against the database or Clerk publicMetadata.
 */
export const syncUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorized();

  const body = syncSchema.parse(req.body);
  const normalizedEmail = body.email.trim().toLowerCase();

  let user = await User.findOne({ clerkUserId: userId });
  if (!user) {
    const emailOwner = await User.findOne({ email: normalizedEmail });
    if (emailOwner) {
      throw ApiError.conflict(
        `An account already exists for ${normalizedEmail} as a ${emailOwner.role}. Please sign in using the ${emailOwner.role} login.`
      );
    }

    user = await User.create({ clerkUserId: userId, ...body, email: normalizedEmail });
    if (body.role === "client") {
      await Client.create({ userId: user._id, contactName: body.name });
    } else {
      await Tester.create({ userId: user._id });
    }
  } else if (user.role !== body.role && user.role !== "admin") {
    throw ApiError.conflict(
      `This email is already registered as a ${user.role}. Please use the ${user.role} login; one email cannot be both client and tester.`
    );
  }

  await syncClerkRoleMetadata(userId, user.role);

  res.status(200).json({ data: user });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.dbUser) throw ApiError.unauthorized();

  let profile: unknown = null;
  if (req.dbUser.role === "client") profile = await Client.findOne({ userId: req.dbUser._id });
  if (req.dbUser.role === "tester") profile = await Tester.findOne({ userId: req.dbUser._id });

  res.status(200).json({ data: { user: req.dbUser, profile } });
});

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.dbUser) throw ApiError.unauthorized();
  const body = updateMeSchema.parse(req.body);
  if (body.name !== undefined) req.dbUser.name = body.name;
  if (body.phone !== undefined) req.dbUser.phone = body.phone || undefined;
  await req.dbUser.save();
  res.status(200).json({ data: { user: req.dbUser, profile: null } });
});
