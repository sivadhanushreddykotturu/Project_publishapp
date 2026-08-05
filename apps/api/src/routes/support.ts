import { Router } from "express";
import { z } from "zod";
import { requireAuth, auth } from "../middleware/auth.js";
import { Client, SupportTicket, User } from "../models/index.js";
import { forbidden, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import { dispatch } from "../services/notify.js";

export const supportRouter = Router();

const createSchema = z.object({
  subject: z.string().min(4).max(200),
  body: z.string().min(4).max(5000),
  projectId: z.string().optional(),
});

supportRouter.post(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const body = createSchema.parse(req.body);
    const user = await User.findOne({ clerkUserId });
    if (!user) throw notFound("User");
    const ticket = await SupportTicket.create({
      raisedBy: user._id,
      projectId: body.projectId,
      subject: body.subject,
      messages: [{ senderId: user._id, isAdmin: false, body: body.body, at: new Date() }],
    });
    ok(res, { ticket }, 201);
  }),
);

supportRouter.get(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const filter = role === "admin" ? {} : { raisedBy: user?._id };
    const tickets = await SupportTicket.find(filter)
      .populate("raisedBy", "name email role")
      .sort({ updatedAt: -1 })
      .lean();
    ok(res, { tickets });
  }),
);

async function loadTicketFor(req: Parameters<typeof auth>[0]) {
  const { clerkUserId, role } = auth(req);
  const user = await User.findOne({ clerkUserId });
  const ticket = await SupportTicket.findById(req.params.id)
    .populate("raisedBy", "name email role")
    .lean();
  if (!ticket) throw notFound("Ticket");
  if (role !== "admin" && String(ticket.raisedBy._id ?? ticket.raisedBy) !== String(user?._id)) {
    throw forbidden("Not your ticket");
  }
  return { ticket, user: user!, isAdmin: role === "admin" };
}

supportRouter.get(
  "/:id",
  requireAuth,
  ah(async (req, res) => {
    const { ticket } = await loadTicketFor(req);
    ok(res, { ticket });
  }),
);

supportRouter.post(
  "/:id/messages",
  requireAuth,
  ah(async (req, res) => {
    const { body } = z.object({ body: z.string().min(1).max(5000) }).parse(req.body);
    const { ticket, user, isAdmin } = await loadTicketFor(req);

    await SupportTicket.updateOne(
      { _id: ticket._id },
      {
        $push: { messages: { senderId: user._id, isAdmin, body, at: new Date() } },
        $set: { status: isAdmin ? "in_progress" : ticket.status === "resolved" ? "open" : ticket.status },
      },
    );

    // admin replies notify the raiser + land in the client communication log
    if (isAdmin) {
      const raiserId = (ticket.raisedBy as { _id: unknown })._id ?? ticket.raisedBy;
      await dispatch({
        recipientId: raiserId as Parameters<typeof dispatch>[0]["recipientId"],
        type: "support_reply",
        title: `Reply on: ${ticket.subject}`,
        body: body.slice(0, 300),
        link: `/${(ticket.raisedBy as { role?: string }).role === "client" ? "client" : "tester"}/support`,
        idempotencyKey: `support:${ticket._id}:${Date.now()}`,
      });
      const raiserUser = await User.findById(raiserId).lean();
      if (raiserUser?.role === "client") {
        await Client.updateOne(
          { userId: raiserUser._id },
          {
            $push: {
              communications: {
                type: "support",
                subject: ticket.subject,
                snippet: body.slice(0, 140),
                at: new Date(),
              },
            },
          },
        );
      }
    }
    ok(res, { sent: true });
  }),
);

supportRouter.patch(
  "/:id/status",
  requireAuth,
  ah(async (req, res) => {
    const { role } = auth(req);
    if (role !== "admin") throw forbidden();
    const { status } = z
      .object({ status: z.enum(["open", "in_progress", "resolved", "closed"]) })
      .parse(req.body);
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true },
    );
    if (!ticket) throw notFound("Ticket");
    ok(res, { ticket });
  }),
);
