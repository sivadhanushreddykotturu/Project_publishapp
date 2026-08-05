import { Router } from "express";
import { z } from "zod";
import { requireAuth, auth } from "../middleware/auth.js";
import { resolveIdentity, setClerkRole } from "../services/clerk.js";
import { Client, Tester, User } from "../models/index.js";
import { conflict } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

export const onboardingRouter = Router();

const bodySchema = z.object({
  role: z.enum(["client", "tester"]), // admin is invite-only, never self-selected
  name: z.string().min(1).max(80).optional(),
  phone: z.string().max(20).optional(),
  // email/name only usable when Clerk isn't configured (local dev/tests)
  email: z.string().email().optional(),
});

onboardingRouter.post(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const body = bodySchema.parse(req.body);

    const existing = await User.findOne({ clerkUserId });
    if (existing) {
      if (existing.role !== body.role) {
        throw conflict(
          "Role is already set for this account. Contact support to change it.",
          "ROLE_LOCKED",
        );
      }
      ok(res, { user: existing });
      return;
    }

    const identity = await resolveIdentity(clerkUserId);
    const email = identity?.email ?? (env.clerkConfigured ? "" : (body.email ?? ""));
    const name = body.name ?? identity?.name ?? "";
    if (!email) throw conflict("No email on the Clerk account", "NO_EMAIL");

    // 1. role → Clerk publicMetadata (JWT source of truth)
    await setClerkRole(clerkUserId, body.role);
    // 2. mirror user + create the role profile
    const user = await User.create({
      clerkUserId,
      role: body.role,
      name,
      email,
      phone: body.phone,
    });
    if (body.role === "client") {
      await Client.create({ userId: user._id, contactName: name });
    } else {
      await Tester.create({ userId: user._id });
    }

    ok(res, { user }, 201);
  }),
);
