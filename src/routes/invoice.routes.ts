import { Router } from "express";
import { listInvoices, checkoutInvoice, markInvoicePaid } from "../controllers/invoice.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices (client sees only their own; admin sees all)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [pending, paid, manual_paid, failed] } }
 *     responses:
 *       200: { description: Paginated invoices }
 */
router.get("/", requireAuth(), requireRole("client", "admin"), listInvoices);

/**
 * @openapi
 * /invoices/{id}/checkout:
 *   post:
 *     tags: [Invoices]
 *     summary: Create a Razorpay hosted checkout order (incl. UPI QR) for an invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Razorpay order + publishable key id }
 */
router.post("/:id/checkout", requireAuth(), requireRole("client"), checkoutInvoice);

/**
 * @openapi
 * /invoices/{id}/mark-paid:
 *   post:
 *     tags: [Invoices]
 *     summary: Admin marks an invoice paid manually (fallback so onboarding never blocks on gateway approval)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string }
 *     responses:
 *       200: { description: Invoice marked paid; project activates automatically }
 */
router.post("/:id/mark-paid", requireAuth(), requireRole("admin"), markInvoicePaid);

export default router;
