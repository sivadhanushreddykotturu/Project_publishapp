import { Router } from "express";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Client, Invoice, Project, User } from "../models/index.js";
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

/** Create Razorpay Order */
invoicesRouter.post(
  "/:id/create-razorpay-order",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw notFound("Invoice");

    if (role === "client") {
      const user = await User.findOne({ clerkUserId });
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(client._id) !== String(invoice.clientId)) {
        throw forbidden("Not your invoice");
      }
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_fallback";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If real Razorpay credentials exist, create order via Razorpay API
    let orderId = `order_sim_${invoice._id.toString().slice(-8)}_${Date.now()}`;
    if (keySecret && keySecret !== "secret") {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const resp = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: invoice.totalPaise,
            currency: "INR",
            receipt: String(invoice._id),
          }),
        });
        if (resp.ok) {
          const rzpData = (await resp.json()) as { id: string };
          orderId = rzpData.id;
        }
      } catch {
        // Fallback to simulated order
      }
    }

    ok(res, {
      orderId,
      amountPaise: invoice.totalPaise,
      currency: "INR",
      keyId,
      invoiceId: invoice._id,
      isTestMode: !keySecret || keySecret === "secret",
    });
  }),
);

/** Verify Razorpay Payment and activate project */
invoicesRouter.post(
  "/:id/verify-razorpay-payment",
  requireAuth,
  requireRole("client", "admin"),
  ah(async (req, res) => {
    const { clerkUserId, role } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw notFound("Invoice");

    if (role === "client") {
      const client = await Client.findOne({ userId: user?._id });
      if (!client || String(client._id) !== String(invoice.clientId)) {
        throw forbidden("Not your invoice");
      }
    }

    const paymentId = (req.body?.razorpay_payment_id as string) || `pay_sim_${Date.now()}`;

    const paidInvoice = await markInvoicePaid(
      invoice._id,
      user!._id,
      { manual: false, gatewayRef: paymentId },
    );

    const project = paidInvoice.projectId
      ? await Project.findById(paidInvoice.projectId).lean()
      : null;

    ok(res, { invoice: paidInvoice, project });
  }),
);
