import { Router } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { resolveTestingLinkClick } from "../services/playIntegration.service";

const router = Router();

/**
 * @openapi
 * /t/{assignmentId}:
 *   get:
 *     tags: [Testing Links]
 *     summary: Per-tester tracked redirect to the Google Play opt-in URL
 *     description: Google does not issue per-user testing links, so LaunchOps generates a unique redirect per assignment and logs the click as a metric event before redirecting. Unauthenticated by design — testers reach this straight from an email link.
 *     parameters:
 *       - { in: path, name: assignmentId, required: true, schema: { type: string } }
 *     responses:
 *       302: { description: Redirects to the project's Play Store opt-in URL }
 *       400: { description: Testing link not yet active for this project }
 *       404: { description: Unknown assignment }
 */
router.get(
  "/:assignmentId",
  asyncHandler(async (req, res) => {
    const optInUrl = await resolveTestingLinkClick(new Types.ObjectId(req.params.assignmentId));
    res.redirect(302, optInUrl);
  })
);

export default router;
