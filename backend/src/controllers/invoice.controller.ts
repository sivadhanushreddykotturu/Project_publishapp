import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Invoice } from "../models/Invoice";
import { Client } from "../models/Client";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { createCheckoutOrder, verifyWebhookSignature, handlePaymentCapturedWebhook, markInvoicePaidManually } from "../services/payment.service";
import { logger } from "../config/logger";

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = {};

  if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id });
    filter.clientId = client?._id ?? new Types.ObjectId();
  }
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

async function assertInvoiceOwned(req: Request, invoice: InstanceType<typeof Invoice>) {
  if (req.dbUser!.role === "admin") return;
  const client = await Client.findOne({ userId: req.dbUser!._id });
  if (!client || !invoice.clientId.equals(client._id)) throw ApiError.forbidden();
}

/** Hosted checkout including UPI QR — webhook-verified confirmation only (Tech Spec §10). */
export const checkoutInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound("Invoice not found");
  await assertInvoiceOwned(req, invoice);

  const result = await createCheckoutOrder(invoice._id);
  res.status(200).json({ data: result });
});

const manualPaySchema = z.object({ note: z.string().optional() });

/** Manual mark-paid path so onboarding never blocks on gateway approval (PRD §12, Tech Spec §14). */
export const markInvoicePaid = asyncHandler(async (req: Request, res: Response) => {
  const { note } = manualPaySchema.parse(req.body);
  const invoice = await markInvoicePaidManually(new Types.ObjectId(req.params.id), note);
  res.status(200).json({ data: invoice });
});

/**
 * Razorpay webhook. Mounted with express.raw() so the exact byte stream is available
 * for HMAC verification — parsing JSON first is the #1 cause of signature mismatches.
 */
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("Rejected Razorpay webhook with invalid signature");
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  await handlePaymentCapturedWebhook(payload);
  res.status(200).json({ received: true });
});
