import { Router } from "express";
import {
  getMyAssignments,
  getAssignmentById,
  submitAssignmentProof,
  verifyAssignmentStep,
  replaceAssignmentTester,
} from "../controllers/assignment.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /assignments/me:
 *   get:
 *     tags: [Assignments]
 *     summary: List the authenticated tester's project assignments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tester's assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Assignment' } }
 */
router.get("/me", requireAuth(), requireRole("tester"), getMyAssignments);

/**
 * @openapi
 * /assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get an assignment (owning tester or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Assignment
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Assignment' } } }
 */
router.get("/:id", requireAuth(), requireRole("tester", "admin"), getAssignmentById);

/**
 * @openapi
 * /assignments/{id}/proofs:
 *   post:
 *     tags: [Assignments]
 *     summary: Tester submits proof for their current workflow step
 *     description: "Only steps 1 (verification), 3 (play_store_invite), and 4 (testing_period) ever carry a tester proof — see the Step workflow engine section of the flow-coverage doc."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [step, fileUrl]
 *             properties:
 *               step: { type: integer, minimum: 1, maximum: 6 }
 *               fileUrl: { type: string, description: "R2 object key/URL from /uploads/presign" }
 *               fileHash: { type: string }
 *     responses:
 *       200:
 *         description: Proof recorded, step set to submitted
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Assignment' } } }
 */
router.post("/:id/proofs", requireAuth(), requireRole("tester"), submitAssignmentProof);

/**
 * @openapi
 * /assignments/{id}/verify:
 *   post:
 *     tags: [Assignments]
 *     summary: Admin verifies or rejects a tester's step submission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [step, approve]
 *             properties:
 *               step: { type: integer, minimum: 1, maximum: 6 }
 *               approve: { type: boolean }
 *               reason: { type: string, description: "Required when approve=false" }
 *     responses:
 *       200:
 *         description: Assignment updated; wallet credited if the step has a payout
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Assignment' } } }
 */
router.post("/:id/verify", requireAuth(), requireRole("admin"), verifyAssignmentStep);

/**
 * @openapi
 * /assignments/{id}/replace:
 *   post:
 *     tags: [Assignments]
 *     summary: Admin manually replaces an inactive tester past Step 1 (auto-replacement only applies to Step 1)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tester removed and next queued tester promoted, if any
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     removed: { $ref: '#/components/schemas/Assignment' }
 *                     promoted:
 *                       oneOf: [{ $ref: '#/components/schemas/Assignment' }, { type: 'null' }]
 */
router.post("/:id/replace", requireAuth(), requireRole("admin"), replaceAssignmentTester);

export default router;
