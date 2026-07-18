import { Router } from "express";
import {
  getMyWallet,
  requestMyWithdrawal,
  listWithdrawals,
  rejectWithdrawalRequest,
  completeWithdrawalRequest,
} from "../controllers/wallet.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /wallet/me:
 *   get:
 *     tags: [Wallet]
 *     summary: Get the authenticated tester's wallet balance and transaction history
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Wallet summary
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/WalletSummary' } } }
 */
router.get("/me", requireAuth(), requireRole("tester"), getMyWallet);

/**
 * @openapi
 * /wallet/withdrawals:
 *   post:
 *     tags: [Wallet]
 *     summary: Tester requests a withdrawal, paid out manually via UPI
 *     description: "Payouts are manual UPI transfers, not a gateway payout API (avoids gateway commission on payouts). The response includes expectedCompletionAt — requestedAt + WITHDRAWAL_SLA_HOURS (default 48h)."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: integer, description: "Amount in paise" }
 *     responses:
 *       201:
 *         description: "Withdrawal request created (status pending, expectedCompletionAt set)"
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/WalletTransaction' } } }
 *       400: { description: Amount exceeds available balance }
 *   get:
 *     tags: [Wallet]
 *     summary: List withdrawal requests (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, approved, rejected, paid] } }
 *     responses:
 *       200:
 *         description: Paginated withdrawal requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/WalletTransaction' } }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.post("/withdrawals", requireAuth(), requireRole("tester"), requestMyWithdrawal);
router.get("/withdrawals", requireAuth(), requireRole("admin"), listWithdrawals);

/**
 * @openapi
 * /wallet/withdrawals/{id}/complete:
 *   post:
 *     tags: [Wallet]
 *     summary: Admin marks a withdrawal complete after sending the UPI transfer manually
 *     description: Single action — the admin pays the tester directly via their own UPI app, then calls this with the UPI transaction ID as proof. Decrements the tester's wallet balance and closes the request. There is no separate "approve" step before this.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId: { type: string, description: "UPI transaction ID, attached as proof of payment" }
 *     responses:
 *       200:
 *         description: Withdrawal marked paid, wallet balance decremented
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/WalletTransaction' } } }
 *       400: { description: Only pending withdrawal requests can be completed }
 */
router.post("/withdrawals/:id/complete", requireAuth(), requireRole("admin"), completeWithdrawalRequest);

/**
 * @openapi
 * /wallet/withdrawals/{id}/reject:
 *   post:
 *     tags: [Wallet]
 *     summary: Admin rejects a withdrawal request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Withdrawal rejected
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/WalletTransaction' } } }
 */
router.post("/withdrawals/:id/reject", requireAuth(), requireRole("admin"), rejectWithdrawalRequest);

export default router;
