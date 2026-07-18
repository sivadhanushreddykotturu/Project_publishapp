import { Request, Response } from "express";
import { Notification } from "../models/Notification";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { attemptSend } from "../services/notification.service";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

/** Admin console: monitor and, where needed, trigger reminders manually (PRD §8). */
export const resendNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound("Notification not found");

  await attemptSend(notification._id);
  const updated = await Notification.findById(req.params.id);
  res.status(200).json({ data: updated });
});
