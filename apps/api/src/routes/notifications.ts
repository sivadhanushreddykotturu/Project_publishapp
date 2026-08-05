import { Router } from "express";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Notification, User } from "../models/index.js";
import { notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import { attemptEmail } from "../services/notify.js";
import type { Types } from "mongoose";

export const notificationsRouter = Router();

/** The bell: own in-app notifications, unread first. */
notificationsRouter.get(
  "/me",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const notifications = await Notification.find({
      recipientId: user?._id,
      channel: "in_app",
    })
      .sort({ readAt: 1, createdAt: -1 })
      .limit(50)
      .lean();
    const unread = notifications.filter((n) => !n.readAt).length;
    ok(res, { notifications, unread });
  }),
);

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: user?._id },
      { $set: { readAt: new Date() } },
      { new: true },
    );
    if (!n) throw notFound("Notification");
    ok(res, { notification: n });
  }),
);

/** Admin: resend a failed/stuck email notification. */
notificationsRouter.post(
  "/:id/resend",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const n = await Notification.findById(req.params.id);
    if (!n) throw notFound("Notification");
    if (n.channel !== "email") throw notFound("Email notification");
    n.status = "queued";
    await n.save();
    await attemptEmail(n._id as Types.ObjectId);
    ok(res, { notification: await Notification.findById(n._id).lean() });
  }),
);

/** Admin: delivery visibility — the notification console list. */
notificationsRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  ah(async (_req, res) => {
    const notifications = await Notification.find({ channel: "email" })
      .populate("recipientId", "name email")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    ok(res, { notifications });
  }),
);
