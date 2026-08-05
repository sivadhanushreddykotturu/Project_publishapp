import { Router } from "express";
import { requireAuth, auth } from "../middleware/auth.js";
import { Client, Tester, User } from "../models/index.js";
import { notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const usersRouter = Router();

/** Own profile — user + role profile in one round-trip. */
usersRouter.get(
  "/me",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId }).lean();
    if (!user) throw notFound("User");
    const profile =
      user.role === "client"
        ? await Client.findOne({ userId: user._id }).lean()
        : user.role === "tester"
          ? await Tester.findOne({ userId: user._id }).lean()
          : null;
    ok(res, { user, profile });
  }),
);
