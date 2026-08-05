import { Router } from "express";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/index.js";
import { ApiError, unauthorized } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const webhooksRouter = Router();

/**
 * Clerk → user sync. This is the ONLY path that writes identity from Clerk;
 * role changes flow through onboarding (publicMetadata) and land here via
 * user.updated so Mongo mirrors the JWT source of truth.
 */
webhooksRouter.post(
  "/clerk",
  ah(async (req, res) => {
    if (!env.CLERK_WEBHOOK_SECRET) {
      throw new ApiError(503, "WEBHOOK_DISABLED", "Webhook not configured");
    }
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!rawBody) throw unauthorized("Missing body");

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let evt: WebhookEvent;
    try {
      evt = wh.verify(rawBody.toString("utf8"), {
        "svix-id": req.header("svix-id") ?? "",
        "svix-timestamp": req.header("svix-timestamp") ?? "",
        "svix-signature": req.header("svix-signature") ?? "",
      }) as WebhookEvent;
    } catch {
      throw unauthorized("Invalid webhook signature");
    }

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const d = evt.data;
      const email =
        d.email_addresses?.find((e) => e.id === d.primary_email_address_id)
          ?.email_address ?? d.email_addresses?.[0]?.email_address ?? "";
      const role = (d.public_metadata as { role?: string } | undefined)?.role;
      await User.findOneAndUpdate(
        { clerkUserId: d.id },
        {
          $set: {
            email,
            name: [d.first_name, d.last_name].filter(Boolean).join(" "),
            ...(role === "client" || role === "tester" || role === "admin"
              ? { role }
              : {}),
          },
          $setOnInsert: {
            clerkUserId: d.id,
            role: role === "admin" ? "admin" : role === "client" ? "client" : "tester",
          },
        },
        { upsert: true, new: true },
      );
      logger.info({ clerkUserId: d.id, type: evt.type }, "clerk user synced");
    }

    ok(res, { received: true });
  }),
);
