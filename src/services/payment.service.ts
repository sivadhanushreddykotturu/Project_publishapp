import crypto from "crypto";
import { Types } from "mongoose";
import { razorpayClient } from "../config/razorpay";
import { env } from "../config/env";
import { Invoice } from "../models/Invoice";
import { MetricEvent } from "../models/MetricEvent";
import { ApiError } from "../utils/apiError";
import { logger } from "../config/logger";
import { activateProject } from "./workflowEngine.service";

/**
 * Payment gateway integration (Tech Spec §10, §14). Razorpay is the kickoff choice
 * (strong UPI/India support, hosted checkout incl. UPI QR). A manual mark-paid path
 * always exists so client onboarding never blocks on gateway approval — the risk
 * register explicitly calls this out.
 */
export async function createCheckoutOrder(invoiceId: Types.ObjectId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "paid" || invoice.status === "manual_paid") {
    throw ApiError.conflict("Invoice is already paid");
  }

  const order = await razorpayClient.orders.create({
    amount: invoice.amount + invoice.gst,
    currency: "INR",
    receipt: invoice._id.toString(),
    notes: { invoiceId: invoice._id.toString(), clientId: invoice.clientId.toString() },
  });

  invoice.gatewayRef = order.id;
  await invoice.save();

  return { order, keyId: env.razorpay.keyId };
}

/** Verifies req.body was signed by Razorpay before trusting a webhook payload. */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", env.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export async function handlePaymentCapturedWebhook(payload: {
  event: string;
  payload: { payment: { entity: { order_id: string; id: string } } };
}) {
  if (payload.event !== "payment.captured") return null;

  const orderId = payload.payload.payment.entity.order_id;
  const invoice = await Invoice.findOne({ gatewayRef: orderId });
  if (!invoice) {
    logger.warn({ orderId }, "Webhook for unknown invoice/order");
    return null;
  }
  if (invoice.status === "paid") return invoice;

  invoice.status = "paid";
  invoice.paidAt = new Date();
  await invoice.save();

  await MetricEvent.create({
    type: "payment_confirmed",
    projectId: invoice.projectId,
    meta: { invoiceId: invoice._id, amount: invoice.amount },
  });

  if (invoice.projectId) await activateProject(invoice.projectId);

  return invoice;
}

/** Onboarding-never-blocks fallback (Tech Spec §10, §14). */
export async function markInvoicePaidManually(invoiceId: Types.ObjectId, adminNote?: string) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw ApiError.notFound("Invoice not found");
  if (invoice.status === "paid" || invoice.status === "manual_paid") {
    throw ApiError.conflict("Invoice is already paid");
  }

  invoice.status = "manual_paid";
  invoice.paidAt = new Date();
  await invoice.save();

  await MetricEvent.create({
    type: "payment_confirmed",
    projectId: invoice.projectId,
    meta: { invoiceId: invoice._id, amount: invoice.amount, manual: true, note: adminNote },
  });

  if (invoice.projectId) await activateProject(invoice.projectId);

  return invoice;
}

/**
 * UPI payout via Razorpay X for approved tester withdrawals. Stubbed gracefully if the
 * payout partner isn't wired yet (Tech Spec §14 risk register) — callers should catch
 * and leave the withdrawal in "approved" state for manual payout instead of failing hard.
 */
export async function payoutViaUpi(_params: { vpa: string; amountPaise: number; reference: string }): Promise<never> {
  if (!env.razorpay.xAccountNumber) {
    throw new Error("UPI payout partner not configured — process this withdrawal manually");
  }
  // RazorpayX payouts API call (fund account + payout creation) goes here once the
  // payout partner is onboarded — left as an explicit integration point rather than
  // a fabricated response, per the risk register's "ledger ships regardless" plan.
  throw new Error("RazorpayX payout integration pending partner onboarding");
}
