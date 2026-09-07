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
  email: z.string().email().optional(),
  // For testers: upfront single Android device registration
  device: z
    .object({
      model: z.string().min(1).max(100),
      osVersion: z.string().min(1).max(50),
      fingerprint: z.string().optional(),
    })
    .optional(),
  upi: z.string().max(100).optional(),
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

    const identity = env.isTest ? null : await resolveIdentity(clerkUserId).catch(() => null);
    const email = identity?.email || body.email || (env.isTest ? `${clerkUserId}@test.local` : "");
    const name = body.name ?? identity?.name ?? "";
    if (!email) throw conflict("No email on the Clerk account", "NO_EMAIL");

    // 1. role → Clerk publicMetadata (JWT source of truth)
    if (!env.isTest && env.clerkConfigured) {
      await setClerkRole(clerkUserId, body.role).catch(() => {});
    }
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
      const devices = body.device
        ? [
            {
              platform: "android" as const,
              model: body.device.model.trim(),
              osVersion: body.device.osVersion.trim(),
              fingerprint:
                body.device.fingerprint ||
                `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            },
          ]
        : [];
      await Tester.create({
        userId: user._id,
        devices,
        ...(body.upi ? { upi: { vpa: body.upi.trim().toLowerCase() } } : {}),
      });
    }

    ok(res, { user }, 201);
  }),
);
