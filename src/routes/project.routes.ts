import { Router } from "express";
import {
  createProject,
  listProjects,
  getProjectById,
  joinProjectAsTester,
  getProjectQueue,
  getVerifiedEmails,
  markProjectTestersInvited,
  updatePlayIntegrationConfig,
  syncProjectPlayRelease,
  getCompletionReport,
} from "../controllers/project.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: "Create a project (client onboarding: choose package, upload app details)"
 *     description: Creates the project (status "awaiting_payment") and its Invoice. The project activates automatically once the invoice is paid (webhook or manual mark-paid).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package, appDetails]
 *             properties:
 *               package: { type: string, enum: [testers_only, managed_testing, launch_ready] }
 *               requiredTesters: { type: integer, minimum: 14 }
 *               appDetails:
 *                 type: object
 *                 required: [appName]
 *                 properties:
 *                   appName: { type: string }
 *                   packageName: { type: string }
 *                   description: { type: string }
 *                   playStoreUrl: { type: string }
 *     responses:
 *       201: { description: Project and invoice created }
 *   get:
 *     tags: [Projects]
 *     summary: List projects (client sees only their own; admin sees all)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated list of projects }
 */
router.post("/", requireAuth(), requireRole("client"), createProject);
router.get("/", requireAuth(), requireRole("client", "admin"), listProjects);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project }
 *       403: { description: Not your project }
 *       404: { description: Not found }
 */
router.get("/:id", requireAuth(), requireRole("client", "admin"), getProjectById);

/**
 * @openapi
 * /projects/{id}/join:
 *   post:
 *     tags: [Projects]
 *     summary: Tester joins an open testing opportunity (atomic first-N-slots cutoff; overflow queues)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Assignment created (active or queued) }
 *       409: { description: Tester already joined this project }
 */
router.post("/:id/join", requireAuth(), requireRole("tester"), joinProjectAsTester);

/**
 * @openapi
 * /projects/{id}/queue:
 *   get:
 *     tags: [Projects]
 *     summary: View the waiting queue for a project, ordered by queue position (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Queued assignments }
 */
router.get("/:id/queue", requireAuth(), requireRole("admin"), getProjectQueue);

/**
 * @openapi
 * /projects/{id}/verified-tester-emails:
 *   get:
 *     tags: [Projects]
 *     summary: Consolidated list of Step-1-verified tester emails, for adding to Play Console (admin console)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Verified tester emails }
 */
router.get("/:id/verified-tester-emails", requireAuth(), requireRole("admin"), getVerifiedEmails);

/**
 * @openapi
 * /projects/{id}/testers-invited:
 *   post:
 *     tags: [Projects]
 *     summary: Confirm tester emails were added to Play Console and invitations sent — opens Step 2
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [optInUrl]
 *             properties:
 *               optInUrl: { type: string, format: uri }
 *     responses:
 *       200: { description: Project advanced to Step 2 }
 *       400: { description: Step 1 is not yet fully verified }
 */
router.post("/:id/testers-invited", requireAuth(), requireRole("admin"), markProjectTestersInvited);

/**
 * @openapi
 * /projects/{id}/play-integration:
 *   patch:
 *     tags: [Projects]
 *     summary: Configure Google Play API-mode prerequisites (service account link, AAB, tester group)
 *     description: Set once the client has completed the guided checklist — grant the LaunchOps service account Play Console access and share the AAB (uploaded via /uploads/presign, scope "aab-uploads"). Google's API can only sync a track's testers via a linked Google Group, so testerGoogleGroupEmail is optional but required for automated tester-list sync.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode: { type: string, enum: [manual, api] }
 *               track: { type: string, enum: [internal, closed] }
 *               packageName: { type: string }
 *               aabFileUrl: { type: string, description: "R2 object key returned by /uploads/presign" }
 *               serviceAccountLinked: { type: boolean }
 *               testerGoogleGroupEmail: { type: string, format: email }
 *     responses:
 *       200: { description: Updated Play integration config }
 */
router.patch("/:id/play-integration", requireAuth(), requireRole("admin"), updatePlayIntegrationConfig);

/**
 * @openapi
 * /projects/{id}/sync-play-release:
 *   post:
 *     tags: [Projects]
 *     summary: Upload the AAB, roll out the track release, sync the tester Google Group, and commit — via the Play Developer API
 *     description: Requires playIntegration.mode="api", serviceAccountLinked=true, a packageName, and an aabFileUrl (set via PATCH /play-integration first). On failure, the project is never left blocked — the error is recorded on playIntegration.lastApiError and the response points to the manual /testers-invited fallback.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Bundle uploaded and rolled out; Step 2 opened for verified testers }
 *       400: { description: API mode prerequisites not met (service account, package name, or AAB missing) }
 *       502: { description: Google Play API call failed — fall back to POST /testers-invited }
 */
router.post("/:id/sync-play-release", requireAuth(), requireRole("admin"), syncProjectPlayRelease);

/**
 * @openapi
 * /projects/{id}/completion-report:
 *   get:
 *     tags: [Projects]
 *     summary: Auto-generated completion report bundle (tester summary + published bugs)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Completion report }
 */
router.get("/:id/completion-report", requireAuth(), requireRole("client", "admin"), getCompletionReport);

export default router;
