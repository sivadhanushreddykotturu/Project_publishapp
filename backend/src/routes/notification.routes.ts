import { Router } from "express";
import { listNotifications, listMyNotifications, markNotificationRead, resendNotification } from "../controllers/notification.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [queued, sent, failed] } }
 *     responses:
 *       200:
 *         description: Paginated notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Notification' } }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get("/", requireAuth(), requireRole("admin"), listNotifications);
router.get("/me", requireAuth(), listMyNotifications);
router.patch("/:id/read", requireAuth(), markNotificationRead);

/**
 * @openapi
 * /notifications/{id}/resend:
 *   post:
 *     tags: [Notifications]
 *     summary: Manually trigger a resend of a queued/failed notification (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Notification resend attempted
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Notification' } } }
 */
router.post("/:id/resend", requireAuth(), requireRole("admin"), resendNotification);

export default router;
