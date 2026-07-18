import { Router } from "express";
import { syncUser, getMe } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /users/sync:
 *   post:
 *     tags: [Users]
 *     summary: Provision or fetch the LaunchOps user linked to the current Clerk identity
 *     description: Called by the frontend immediately after Clerk sign-in/sign-up. Only client/tester roles can be self-provisioned — admin is invite-only.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, name, email]
 *             properties:
 *               role: { type: string, enum: [client, tester] }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: User provisioned or fetched
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/User' } } }
 *       401: { description: Not authenticated with Clerk }
 */
router.post("/sync", syncUser);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user plus their role-specific profile (client or tester)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user and profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     profile:
 *                       oneOf:
 *                         - { $ref: '#/components/schemas/Client' }
 *                         - { $ref: '#/components/schemas/Tester' }
 *                         - { type: 'null' }
 *       401: { description: Not authenticated }
 */
router.get("/me", requireAuth(), getMe);

export default router;
