import { Router } from "express";
import {
  getMyTesterProfile,
  upsertMyTesterProfile,
  listTesters,
  getTesterById,
  updateTesterStatus,
} from "../controllers/tester.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /testers/me:
 *   get:
 *     tags: [Testers]
 *     summary: Get the authenticated tester's own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tester profile
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Tester' } } }
 *   put:
 *     tags: [Testers]
 *     summary: Create or update the authenticated tester's profile (devices, experience, UPI)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [devices, upi]
 *             properties:
 *               devices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     model: { type: string }
 *                     androidVersion: { type: string }
 *                     fingerprint: { type: string }
 *               experienceLevel: { type: string, enum: [beginner, intermediate, expert] }
 *               upi:
 *                 type: object
 *                 properties:
 *                   vpa: { type: string }
 *                   qrImageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Tester profile upserted
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Tester' } } }
 *       409: { description: UPI ID already registered to another tester }
 */
router.get("/me", requireAuth(), requireRole("tester"), getMyTesterProfile);
router.put("/me", requireAuth(), requireRole("tester"), upsertMyTesterProfile);

/**
 * @openapi
 * /testers:
 *   get:
 *     tags: [Testers]
 *     summary: List testers (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive, suspended] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Paginated list of testers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Tester' } }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get("/", requireAuth(), requireRole("admin"), listTesters);

/**
 * @openapi
 * /testers/{id}:
 *   get:
 *     tags: [Testers]
 *     summary: Get a tester by id (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tester
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Tester' } } }
 *       404: { description: Not found }
 */
router.get("/:id", requireAuth(), requireRole("admin"), getTesterById);

/**
 * @openapi
 * /testers/{id}/status:
 *   patch:
 *     tags: [Testers]
 *     summary: Suspend, activate, or deactivate a tester (admin console)
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
 *               status: { type: string, enum: [active, inactive, suspended] }
 *     responses:
 *       200:
 *         description: Updated tester
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Tester' } } }
 */
router.patch("/:id/status", requireAuth(), requireRole("admin"), updateTesterStatus);

export default router;
