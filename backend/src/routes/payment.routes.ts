import { Router, raw } from "express";
import { razorpayWebhook } from "../controllers/invoice.controller";

const router = Router();

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     tags: [Invoices]
 *     summary: Razorpay webhook (payment.captured) — HMAC-signature verified
 *     description: Mounted with a raw body parser so the exact byte stream can be verified against x-razorpay-signature before JSON parsing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Webhook processed }
 *       401: { description: Invalid signature }
 */
router.post("/webhook", raw({ type: "application/json" }), razorpayWebhook);

export default router;
