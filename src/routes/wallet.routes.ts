import { Router } from "express";
import {
  getMyWallet,
  requestMyWithdrawal,
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawalRequest,
  markWithdrawalPaidManually,
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
 *       200: { description: Wallet summary }
 */
router.get("/me", requireAuth(), requireRole("tester"), getMyWallet);

/**
 * @openapi
 * /wallet/withdrawals:
 *   post:
 *     tags: [Wallet]
 *     summary: Tester requests a UPI withdrawal
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
 *       201: { description: Withdrawal request created (status pending) }
 *       400: { description: Amount exceeds available balance }
 *   get:
 *     tags: [Wallet]
 *     summary: List withdrawal requests (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, approved, rejected, paid] } }
 *     responses:
 *       200: { description: Paginated withdrawal requests }
 */
router.post("/withdrawals", requireAuth(), requireRole("tester"), requestMyWithdrawal);
router.get("/withdrawals", requireAuth(), requireRole("admin"), listWithdrawals);

/**
 * @openapi
 * /wallet/withdrawals/{id}/approve:
 *   post:
 *     tags: [Wallet]
 *     summary: Admin approves a withdrawal; attempts an immediate UPI payout, falling back to manual if the partner is unavailable
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Payout completed, transaction marked paid }
 *       202: { description: Payout partner unavailable — left pending for manual payout }
 */
router.post("/withdrawals/:id/approve", requireAuth(), requireRole("admin"), approveWithdrawal);

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
 *       200: { description: Withdrawal rejected }
 */
router.post("/withdrawals/:id/reject", requireAuth(), requireRole("admin"), rejectWithdrawalRequest);

/**
 * @openapi
 * /wallet/withdrawals/{id}/mark-paid:
 *   post:
 *     tags: [Wallet]
 *     summary: Admin marks a withdrawal as paid after sending the UPI transfer manually
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [upiRef]
 *             properties:
 *               upiRef: { type: string }
 *     responses:
 *       200: { description: Withdrawal marked paid }
 */
router.post("/withdrawals/:id/mark-paid", requireAuth(), requireRole("admin"), markWithdrawalPaidManually);

export default router;
