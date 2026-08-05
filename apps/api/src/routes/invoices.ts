import { Router } from "express";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Client, Invoice, User } from "../models/index.js";
import { markInvoicePaid } from "../services/billing.js";
import { forbidden, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import type { Types } from "mongoose";

export const invoicesRouter = Router();

invoicesRouter.get(
  "/me",
  requireAuth,
  requireRole("client"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const client = await Client.findOne({ userId: user?._id });
    if (!client) throw notFound("Client profile");
    const invoices = await Invoice.find({ clientId: client._id })
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { invoices });
  }),
);

invoicesRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  ah(async (_req, res) => {
    const invoices = await Invoice.find()
      .populate("clientId", "companyName contactName")
      .populate("projectId", "appDetails.appName")
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { invoices });
  }),
);

invoicesRouter.get(
  "/:id",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) throw notFound("Invoice");
    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(client._id) !== String(invoice.clientId)) {
        throw forbidden("Not your invoice");
      }
    }
    ok(res, { invoice });
  }),
);

/** Manual mark-paid — the no-gateway fallback path. Audit-logged. */
invoicesRouter.post(
  "/:id/mark-paid",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const admin = await User.findOne({ clerkUserId });
    const invoice = await markInvoicePaid(
      req.params.id as unknown as Types.ObjectId,
      admin!._id,
      { manual: true },
    );
    ok(res, { invoice });
  }),
);
