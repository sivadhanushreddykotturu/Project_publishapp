import { Types } from "mongoose";
import { Notification } from "../models/Notification";
import { NotificationChannel, NotificationType } from "../models/enums";
import { User } from "../models/User";
import { resendClient } from "../config/resend";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Single dispatch() abstraction fanning out to channel adapters (Tech Spec §10).
 * Every dispatch is written queued-first so a crash mid-send never loses the intent,
 * retried up to 3x with backoff, and always visible/resendable from the admin console.
 * Idempotency key = type + recipient + related id + date-bucket, so a cron re-run or
 * a duplicate event never double-sends the same reminder.
 */
const MAX_ATTEMPTS = 3;

function dateBucket(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildIdempotencyKey(recipientUserId: Types.ObjectId, type: NotificationType, relatedId?: string) {
  return [recipientUserId.toString(), type, relatedId ?? "none", dateBucket()].join(":");
}

async function sendViaChannel(
  channel: NotificationChannel,
  recipientEmail: string,
  type: NotificationType,
  payload: Record<string, unknown>
): Promise<void> {
  if (channel === "email") {
    await resendClient.emails.send({
      from: env.resend.fromEmail,
      to: recipientEmail,
      subject: emailSubject(type),
      html: emailBody(type, payload),
    });
    return;
  }
  // push/SMS/WhatsApp adapters are pluggable in Phase 2 (Tech Spec §10) — v1 ships email only.
  throw new Error(`Channel not yet implemented: ${channel}`);
}

function emailSubject(type: NotificationType): string {
  const subjects: Record<NotificationType, string> = {
    project_request: "New client project request awaiting approval",
    project_opportunity: "New testing project available",
    testing_link: "You're in! Your LaunchOps testing link",
    step_reminder: "Reminder: action needed on your LaunchOps project",
    step_verified: "Step verified — you've moved to the next stage",
    step_rejected: "Action needed: a submission was rejected",
    queue_promoted: "You're off the waitlist — you're now assigned",
    tester_replaced: "A tester was replaced on your project",
    withdrawal_completed: "Your withdrawal is complete — funds sent",
    withdrawal_rejected: "Your withdrawal request was rejected",
    support_reply: "New reply on your support ticket",
    project_completed: "Your project is complete",
    install_scheduled: "It's your turn — install the app today",
    email_review_reminder: "Google's tester-list review window has passed — check Play Console",
    client_verification_approved: "You're verified — your invoice is ready",
    client_verification_rejected: "We need more information before we can proceed",
  };
  return subjects[type];
}

function emailBody(type: NotificationType, payload: Record<string, unknown>): string {
  return `<p>${type.replace(/_/g, " ")}</p><pre>${JSON.stringify(payload, null, 2)}</pre>`;
}

export async function dispatchNotification(params: {
  recipientUserId: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  relatedId?: string;
  payload: Record<string, unknown>;
}) {
  const idempotencyKey = buildIdempotencyKey(params.recipientUserId, params.type, params.relatedId);

  const existing = await Notification.findOne({ idempotencyKey });
  if (existing && existing.status === "sent") return existing;

  const notification =
    existing ??
    (await Notification.create({
      recipientId: params.recipientUserId,
      type: params.type,
      channel: params.channel,
      payload: params.payload,
      idempotencyKey,
      status: "queued",
    }));

  await attemptSend(notification._id);
  return notification;
}

export async function attemptSend(notificationId: Types.ObjectId) {
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.status === "sent") return;

  const user = await User.findById(notification.recipientId);
  if (!user) {
    notification.status = "failed";
    notification.lastError = "Recipient user not found";
    await notification.save();
    return;
  }

  try {
    await sendViaChannel(notification.channel, user.email, notification.type, notification.payload);
    notification.status = "sent";
    notification.sentAt = new Date();
  } catch (err) {
    notification.attempts += 1;
    notification.lastError = err instanceof Error ? err.message : String(err);
    notification.status = notification.attempts >= MAX_ATTEMPTS ? "failed" : "queued";
    logger.warn({ err, notificationId }, "Notification dispatch failed");
  }
  await notification.save();
}

/** Retries every notification still queued/failed under the attempt cap — for the reminder cron. */
export async function retryPendingNotifications() {
  const pending = await Notification.find({ status: { $in: ["queued", "failed"] }, attempts: { $lt: MAX_ATTEMPTS } });
  for (const n of pending) {
    await attemptSend(n._id);
  }
  return pending.length;
}
