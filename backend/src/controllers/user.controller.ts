import { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { z } from "zod";
import { logger } from "../config/logger";
import { User } from "../models/User";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";
import { Assignment } from "../models/Assignment";
import { BugReport } from "../models/BugReport";
import { WalletTransaction } from "../models/WalletTransaction";
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

  let user = await User.findOne({ clerkUserId: userId });
  if (!user) {
    user = await User.create({ clerkUserId: userId, ...body });
    if (body.role === "client") {
      await Client.create({ userId: user._id, contactName: body.name });
    } else {
      await Tester.create({ userId: user._id });
    }
  } else if (user.role !== body.role && user.role !== "admin") {
    if (user.role === "tester" && body.role === "client") {
      const tester = await Tester.findOne({ userId: user._id });
      const [assignments, bugs, walletTransactions] = tester
        ? await Promise.all([
            Assignment.countDocuments({ testerId: tester._id }),
            BugReport.countDocuments({ testerId: tester._id }),
            WalletTransaction.countDocuments({ testerId: tester._id }),
          ])
        : [0, 0, 0];
      const pristine = !tester || (tester.devices.length === 0 && tester.walletBalance === 0 && assignments === 0 && bugs === 0 && walletTransactions === 0);
      if (pristine) {
        if (tester) await tester.deleteOne();
        await Client.create({ userId: user._id, contactName: body.name });
        user.role = "client";
        await user.save();
      }
    } else if (user.role === "client" && body.role === "tester") {
      const client = await Client.findOne({ userId: user._id });
      if (!client || client.projects.length === 0) {
        if (client) await client.deleteOne();
        await Tester.create({ userId: user._id });
        user.role = "tester";
        await user.save();
      }
    }
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
