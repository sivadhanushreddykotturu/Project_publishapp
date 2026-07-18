import { Router } from "express";
import { getMetricsSummary } from "../controllers/metrics.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /metrics/summary:
 *   get:
 *     tags: [Metrics]
 *     summary: PRD success-metric dashboard (payment-to-assignment latency, active projects, dedup rate)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Metrics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     avgPaymentToOpportunityPublishedMs:
 *                       oneOf: [{ type: number }, { type: 'null' }]
 *                     activeProjectsCount: { type: integer }
 *                     duplicateBugReportsMerged: { type: integer }
 *                     projectsCompleted: { type: integer }
 *                     inactiveTesterReplacements: { type: integer }
 *                     target:
 *                       type: object
 *                       properties:
 *                         paymentToAssignedUnderMs: { type: integer }
 *                         adminHoursPerProjectPerWeekUnder: { type: number }
 *                         concurrentProjectsPerAdminTarget: { type: integer }
 */
router.get("/summary", requireAuth(), requireRole("admin"), getMetricsSummary);

export default router;
