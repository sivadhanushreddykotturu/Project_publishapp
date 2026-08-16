import type { Types } from "mongoose";
import type { NotificationType } from "@defineux/types";
import { Notification, User } from "../models/index.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface DispatchInput {
  recipientId: Types.ObjectId; // User
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  /** type + recipient + related id + date-bucket — dedupes reminders */
  idempotencyKey?: string;
}

/**
 * Queued-first dispatch. v1 channels: in_app (the bell) + email via Resend
 * (falls back to logs when unconfigured). Push/SMS/WhatsApp plug in here
 * in Phase 2 without touching callers.
 */
export async function dispatch(input: DispatchInput): Promise<void> {
  // in-app notification — the bell reads these
  await Notification.create({
    recipientId: input.recipientId,
    type: input.type,
    channel: "in_app",
    payload: { title: input.title, body: input.body, link: input.link },
    status: "sent",
    idempotencyKey: input.idempotencyKey
      ? `inapp:${input.idempotencyKey}`
      : undefined,
    sentAt: new Date(),
  }).catch((err: { code?: number }) => {
    if (err?.code === 11000) return; // idempotent duplicate — fine
    throw err;
  });

  // email — queued, attempted inline, retried by the retry sweep (Phase 5 cron)
  const emailKey = input.idempotencyKey ? `email:${input.idempotencyKey}` : undefined;
  let email = null;
  try {
    email = await Notification.create({
      recipientId: input.recipientId,
      type: input.type,
      channel: "email",
      payload: { title: input.title, body: input.body, link: input.link },
      status: "queued",
      idempotencyKey: emailKey,
    });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) return;
    throw err;
  }

  await attemptEmail(email._id);
}

export async function attemptEmail(notificationId: Types.ObjectId): Promise<void> {
  const n = await Notification.findById(notificationId);
  if (!n || n.channel !== "email" || n.status === "sent") return;

  const recipient = await User.findById(n.recipientId).lean();
  if (!recipient?.email) {
    n.status = "failed";
    n.lastError = "no recipient email";
    await n.save();
    return;
  }

  try {
    if (env.resendConfigured) {
      const { Resend } = await import("resend");
      const resend = new Resend(env.RESEND_API_KEY!);
      const linkHtml = n.payload.link
        ? `<p><a href="${n.payload.link}" style="color:#e8590c">${n.payload.link}</a></p>`
        : "";
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: recipient.email,
        subject: n.payload.title,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px"><h2 style="margin:0 0 12px">${n.payload.title}</h2><p style="color:#4b4f55;line-height:1.6">${n.payload.body}</p>${linkHtml}<p style="color:#9a9ea6;font-size:12px;margin-top:24px">DefineUX — real testers for Google Play</p></div>`,
      });
    } else {
      logger.info(
        { to: recipient.email, title: n.payload.title },
        "email (console adapter — resend not configured)",
      );
    }
    n.status = "sent";
    n.sentAt = new Date();
    n.attempts += 1;
    await n.save();
  } catch (err) {
    n.attempts += 1;
    n.lastError = err instanceof Error ? err.message : String(err);
    if (n.attempts >= 3) n.status = "failed";
    await n.save();
    logger.warn({ err, notificationId }, "email attempt failed");
  }
}

/** Retry sweep for queued/failed-with-attempts-left emails. */
export async function retryQueuedEmails(): Promise<number> {
  const queued = await Notification.find({
    channel: "email",
    status: { $in: ["queued", "failed"] },
    attempts: { $lt: 3 },
  })
    .limit(50)
    .lean();
  for (const n of queued) await attemptEmail(n._id);
  return queued.length;
}

/** Fan-out to every admin (inactivity alerts, all-verified pings). */
export async function dispatchToAdmins(
  input: Omit<DispatchInput, "recipientId">,
): Promise<void> {
  const admins = await User.find({ role: "admin", status: "active" }).lean();
  for (const admin of admins) {
    await dispatch({
      ...input,
      recipientId: admin._id,
      idempotencyKey: input.idempotencyKey
        ? `${input.idempotencyKey}:${admin._id}`
        : undefined,
    });
  }
}
