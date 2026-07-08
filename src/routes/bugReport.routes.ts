import { Router } from "express";
import { submitBugReport, listBugReports, mergeBugReports, publishBugReports } from "../controllers/bugReport.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /projects/{projectId}/bug-reports:
 *   post:
 *     tags: [Bug Reports]
 *     summary: Tester submits a structured bug report for a project
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category, severity, device, expectedResult, actualResult]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string, enum: [crash, functional, ui_ux, performance, security, other] }
 *               severity: { type: string, enum: [low, medium, high, critical] }
 *               device: { type: string }
 *               appVersion: { type: string }
 *               expectedResult: { type: string }
 *               actualResult: { type: string }
 *               stepsToReproduce: { type: array, items: { type: string } }
 *               attachments: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Bug report created (status "open") }
 *   get:
 *     tags: [Bug Reports]
 *     summary: List bug reports for a project (clients only ever see published, de-duplicated reports)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: projectId, required: true, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [open, duplicate, merged, published] } }
 *     responses:
 *       200: { description: Paginated bug reports }
 */
router.post("/projects/:projectId/bug-reports", requireAuth(), requireRole("tester"), submitBugReport);
router.get("/projects/:projectId/bug-reports", requireAuth(), requireRole("client", "admin"), listBugReports);

/**
 * @openapi
 * /bug-reports/merge:
 *   post:
 *     tags: [Bug Reports]
 *     summary: Admin merges duplicate bug reports into a canonical report
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [canonicalId, duplicateIds]
 *             properties:
 *               canonicalId: { type: string }
 *               duplicateIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Duplicates linked to the canonical report }
 */
router.post("/bug-reports/merge", requireAuth(), requireRole("admin"), mergeBugReports);

/**
 * @openapi
 * /bug-reports/publish:
 *   post:
 *     tags: [Bug Reports]
 *     summary: Admin publishes de-duplicated bug reports to the client dashboard
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Reports published }
 */
router.post("/bug-reports/publish", requireAuth(), requireRole("admin"), publishBugReports);

export default router;
