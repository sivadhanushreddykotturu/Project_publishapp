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
 *       200: { description: Metrics summary }
 */
router.get("/summary", requireAuth(), requireRole("admin"), getMetricsSummary);

export default router;
