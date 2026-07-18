import { Router } from "express";
import { getMyClientProfile, updateMyClientProfile, listClients, getClientById } from "../controllers/client.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /clients/me:
 *   get:
 *     tags: [Clients]
 *     summary: Get the authenticated client's own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Client profile
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Client' } } }
 *   patch:
 *     tags: [Clients]
 *     summary: Update the authenticated client's own profile (company, contact, billing)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName: { type: string }
 *               contactName: { type: string }
 *               billingInfo:
 *                 type: object
 *                 properties:
 *                   gstin: { type: string }
 *                   billingAddress: { type: string }
 *     responses:
 *       200:
 *         description: Updated client profile
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Client' } } }
 */
router.get("/me", requireAuth(), requireRole("client"), getMyClientProfile);
router.patch("/me", requireAuth(), requireRole("client"), updateMyClientProfile);

/**
 * @openapi
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: List all clients (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Paginated list of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Client' } }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.get("/", requireAuth(), requireRole("admin"), listClients);

/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Get a client by id (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Client
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Client' } } }
 *       404: { description: Not found }
 */
router.get("/:id", requireAuth(), requireRole("admin"), getClientById);

export default router;
