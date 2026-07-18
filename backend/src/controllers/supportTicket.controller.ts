import { Request, Response } from "express";
import { z } from "zod";
import { SupportTicket } from "../models/SupportTicket";
import { Client } from "../models/Client";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { dispatchNotification } from "../services/notification.service";

const createSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  projectId: z.string().optional(),
});

export const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);
  const ticket = await SupportTicket.create({
    raisedBy: req.dbUser!._id,
    projectId: body.projectId,
    subject: body.subject,
    messages: [{ authorId: req.dbUser!._id, body: body.message, createdAt: new Date() }],
  });

  if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id });
    if (client) {
      client.communications.push({ channel: "support_ticket", subject: body.subject, body: body.message, createdAt: new Date(), createdBy: req.dbUser!._id });
      await client.save();
    }
  }

  res.status(201).json({ data: ticket });
});

export const listSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.dbUser!.role !== "admin") filter.raisedBy = req.dbUser!._id;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SupportTicket.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

async function loadVisibleTicket(req: Request) {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound("Support ticket not found");
  if (req.dbUser!.role !== "admin" && !ticket.raisedBy.equals(req.dbUser!._id)) throw ApiError.forbidden();
  return ticket;
}

export const getSupportTicketById = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await loadVisibleTicket(req);
  res.status(200).json({ data: ticket });
});

const messageSchema = z.object({ body: z.string().min(1) });

export const addSupportTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await loadVisibleTicket(req);
  const { body } = messageSchema.parse(req.body);

  ticket.messages.push({ authorId: req.dbUser!._id, body, createdAt: new Date() });
  if (req.dbUser!.role === "admin") {
    ticket.status = "in_progress";
    ticket.assignedAdminId = req.dbUser!._id;
    await dispatchNotification({
      recipientUserId: ticket.raisedBy,
      type: "support_reply",
      channel: "email",
      relatedId: ticket._id.toString(),
      payload: { subject: ticket.subject },
    });
  }
  await ticket.save();
  res.status(200).json({ data: ticket });
});

const statusSchema = z.object({ status: z.enum(["open", "in_progress", "resolved", "closed"]) });

export const updateSupportTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) throw ApiError.notFound("Support ticket not found");
  res.status(200).json({ data: ticket });
});
