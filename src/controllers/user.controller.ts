import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { User } from "../models/User";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

const syncSchema = z.object({
  role: z.enum(["client", "tester"]),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

/**
 * Called by the frontend right after Clerk sign-in/sign-up. Admin is invite-only
 * (Tech Spec §3) so this endpoint can only ever provision client/tester users —
 * an admin account is created directly against the database or Clerk publicMetadata.
 */
export const syncUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) throw ApiError.unauthorized();

  const body = syncSchema.parse(req.body);

  let user = await User.findOne({ clerkUserId: userId });
  if (!user) {
    user = await User.create({ clerkUserId: userId, ...body });
    if (body.role === "client") {
      await Client.create({ userId: user._id, contactName: body.name });
    } else {
      await Tester.create({ userId: user._id });
    }
  }

  res.status(200).json({ data: user });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.dbUser) throw ApiError.unauthorized();

  let profile: unknown = null;
  if (req.dbUser.role === "client") profile = await Client.findOne({ userId: req.dbUser._id });
  if (req.dbUser.role === "tester") profile = await Tester.findOne({ userId: req.dbUser._id });

  res.status(200).json({ data: { user: req.dbUser, profile } });
});
