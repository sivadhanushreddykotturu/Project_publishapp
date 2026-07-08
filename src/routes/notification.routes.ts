import { Router } from "express";
import { listNotifications, resendNotification } from "../controllers/notification.controller";
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
 *       200: { description: Paginated notifications }
 */
router.get("/", requireAuth(), requireRole("admin"), listNotifications);

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
 *       200: { description: Notification resend attempted }
 */
router.post("/:id/resend", requireAuth(), requireRole("admin"), resendNotification);

export default router;
