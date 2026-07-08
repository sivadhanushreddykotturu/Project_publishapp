import { Router } from "express";
import {
  createSupportTicket,
  listSupportTickets,
  getSupportTicketById,
  addSupportTicketMessage,
  updateSupportTicketStatus,
} from "../controllers/supportTicket.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /support-tickets:
 *   post:
 *     tags: [Support]
 *     summary: Raise a support ticket (client or tester)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject: { type: string }
 *               message: { type: string }
 *               projectId: { type: string }
 *     responses:
 *       201: { description: Ticket created }
 *   get:
 *     tags: [Support]
 *     summary: List support tickets (own tickets, or all for admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [open, in_progress, resolved, closed] } }
 *     responses:
 *       200: { description: Paginated support tickets }
 */
router.post("/", requireAuth(), requireRole("client", "tester"), createSupportTicket);
router.get("/", requireAuth(), listSupportTickets);

/**
 * @openapi
 * /support-tickets/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get a support ticket (raiser or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Support ticket with message thread }
 */
router.get("/:id", requireAuth(), getSupportTicketById);

/**
 * @openapi
 * /support-tickets/{id}/messages:
 *   post:
 *     tags: [Support]
 *     summary: Add a threaded reply to a support ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *     responses:
 *       200: { description: Message appended }
 */
router.post("/:id/messages", requireAuth(), addSupportTicketMessage);

/**
 * @openapi
 * /support-tickets/{id}/status:
 *   patch:
 *     tags: [Support]
 *     summary: Update a support ticket's status (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [open, in_progress, resolved, closed] }
 *     responses:
 *       200: { description: Ticket status updated }
 */
router.patch("/:id/status", requireAuth(), requireRole("admin"), updateSupportTicketStatus);

export default router;
