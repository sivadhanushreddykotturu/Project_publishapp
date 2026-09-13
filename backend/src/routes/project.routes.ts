import { Router } from "express";
import {
  createProject,
  listProjects,
  listTesterOpportunities,
  getProjectById,
  joinProjectAsTester,
  assignTesterToProject,
  getProjectQueue,
  getVerifiedEmails,
  submitProjectVerification,
  reviewProjectVerification,
  submitProjectEmailsForReview,
  confirmProjectEmailReview,
  markProjectTestersInvited,
  applyProjectForProduction,
  confirmProjectProductionApproved,
  updatePlayIntegrationConfig,
  syncProjectPlayRelease,
  getCompletionReport,
  listClientProjectAssignments,
  listProjectFiles,
  addProjectFile,
  clearProjectFiles,
} from "../controllers/project.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: "Create a project (client onboarding: choose package, upload app details)"
 *     description: "\"testers_only\" is self-serve: creates the project (status \"awaiting_payment\") and its Invoice immediately; the project activates once the invoice is paid. \"managed_testing\", \"launch_ready\", and \"custom\" instead require client verification first (Play Console access proof + a direct discussion) — no invoice is created yet, and the project starts in \"pending_verification\". See /verification/submit and /verification/review."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package, appDetails]
 *             properties:
 *               package: { type: string, enum: [testers_only, managed_testing, launch_ready, custom] }
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
 *       201:
 *         description: "Project created — with an Invoice if self-serve, or with invoice: null and status pending_verification otherwise"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     project: { $ref: '#/components/schemas/Project' }
 *                     invoice: { oneOf: [{ $ref: '#/components/schemas/Invoice' }, { type: 'null' }] }
 *                 message: { type: string }
 *   get:
 *     tags: [Projects]
 *     summary: List projects (client sees only their own; admin sees all)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Paginated list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Project' } }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 */
router.post("/", requireAuth(), requireRole("client"), createProject);
router.get("/", requireAuth(), requireRole("client", "admin"), listProjects);
router.get("/opportunities", requireAuth(), requireRole("tester"), listTesterOpportunities);

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
 *       200:
 *         description: Project
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       403: { description: Not your project }
 *       404: { description: Not found }
 */
router.get("/:id", requireAuth(), requireRole("client", "admin"), getProjectById);
router.get("/:id/client-assignments", requireAuth(), requireRole("client"), listClientProjectAssignments);
router.get("/:id/files", requireAuth(), requireRole("client", "admin"), listProjectFiles);
router.post("/:id/files", requireAuth(), requireRole("client"), addProjectFile);
router.delete("/:id/files", requireAuth(), requireRole("admin"), clearProjectFiles);

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
 *       201:
 *         description: Assignment created (active or queued)
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Assignment' } } }
 *       409: { description: Tester already joined this project }
 */
router.post("/:id/join", requireAuth(), requireRole("tester"), joinProjectAsTester);
router.post("/:id/assignments", requireAuth(), requireRole("admin"), assignTesterToProject);

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
 *       200:
 *         description: Queued assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Assignment' } }
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
 *       200:
 *         description: Verified tester emails
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     emails: { type: array, items: { type: string, format: email } }
 *                     count: { type: integer }
 */
router.get("/:id/verified-tester-emails", requireAuth(), requireRole("admin"), getVerifiedEmails);

/**
 * @openapi
 * /projects/{id}/verification/submit:
 *   post:
 *     tags: [Projects]
 *     summary: Client submits proof they control the Play Console listing
 *     description: Only applies to projects that require verification (managed_testing, launch_ready, custom). Upload the proof via /uploads/presign first and pass the resulting R2 key here.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proofUrl]
 *             properties:
 *               proofUrl: { type: string, description: "R2 object key from /uploads/presign" }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Verification marked submitted, awaiting admin review
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: This project doesn't require verification }
 */
router.post("/:id/verification/submit", requireAuth(), requireRole("client"), submitProjectVerification);

/**
 * @openapi
 * /projects/{id}/verification/review:
 *   post:
 *     tags: [Projects]
 *     summary: Admin approves or rejects client verification after the direct discussion
 *     description: Approving creates the invoice (unblocking payment) and moves the project to awaiting_payment. For package="custom" (no fixed pricing), customAmount is required. Rejecting leaves the project in pending_verification so the client can resubmit proof.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approve]
 *             properties:
 *               approve: { type: boolean }
 *               note: { type: string }
 *               customAmount: { type: integer, description: "Required to approve a custom-package project. Amount in paise." }
 *               customGst: { type: integer, description: "Optional — defaults to 18% of customAmount." }
 *     responses:
 *       200:
 *         description: "Verification recorded — invoice included if approved"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     project: { $ref: '#/components/schemas/Project' }
 *                     invoice: { oneOf: [{ $ref: '#/components/schemas/Invoice' }, { type: 'null' }] }
 *       400: { description: "customAmount missing for a custom package, or verification not required" }
 */
router.post("/:id/verification/review", requireAuth(), requireRole("admin"), reviewProjectVerification);

/**
 * @openapi
 * /projects/{id}/submit-email-review:
 *   post:
 *     tags: [Projects]
 *     summary: "Confirm verified tester emails were added to Play Console and submitted for Google's review"
 *     description: "Starts the ~2-3h review clock (GOOGLE_EMAIL_REVIEW_HOURS). A cron auto-advances the gate once it elapses; call /confirm-email-review to advance it earlier if Google approves sooner."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Email review marked submitted, expected-approval timestamp recorded
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: Verification step is not yet fully verified }
 */
router.post("/:id/submit-email-review", requireAuth(), requireRole("admin"), submitProjectEmailsForReview);

/**
 * @openapi
 * /projects/{id}/confirm-email-review:
 *   post:
 *     tags: [Projects]
 *     summary: Manually confirm Google approved the tester list before the ~3h estimate elapses
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Email review confirmed — play_store_invite is now open
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: Email review has not been submitted yet }
 */
router.post("/:id/confirm-email-review", requireAuth(), requireRole("admin"), confirmProjectEmailReview);

/**
 * @openapi
 * /projects/{id}/testers-invited:
 *   post:
 *     tags: [Projects]
 *     summary: Record the real opt-in URL once Google's tester-list review has cleared — opens play_store_invite
 *     description: Requires the google_email_review step to already be verified (via /confirm-email-review or the auto-advance cron).
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
 *       200:
 *         description: play_store_invite opened for verified testers
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: Email review has not been confirmed yet }
 */
router.post("/:id/testers-invited", requireAuth(), requireRole("admin"), markProjectTestersInvited);

/**
 * @openapi
 * /projects/{id}/apply-production:
 *   post:
 *     tags: [Projects]
 *     summary: Apply for Play Store production access — hard-blocked until the mandatory 14-day testing period has elapsed
 *     description: "Google's own rule, not a LaunchOps estimate (TESTING_PERIOD_DAYS, default 14). The 14-day clock starts automatically once every tester has opted in (play_store_invite gate closes)."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Production application recorded
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: Testing period hasn't elapsed yet — response includes days remaining }
 *       409: { description: Already applied for production }
 */
router.post("/:id/apply-production", requireAuth(), requireRole("client", "admin"), applyProjectForProduction);

/**
 * @openapi
 * /projects/{id}/confirm-production-approved:
 *   post:
 *     tags: [Projects]
 *     summary: Admin manually confirms Google approved production (no API signal exists for this)
 *     description: Closes production_review and completion, then checks whether every tester who was ever active has finished their part — if so, marks the project completed.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Production approved and recorded
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
 *       400: { description: Production hasn't been applied for yet }
 */
router.post(
  "/:id/confirm-production-approved",
  requireAuth(),
  requireRole("admin"),
  confirmProjectProductionApproved
);

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
 *       200:
 *         description: Updated Play integration config
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { data: { $ref: '#/components/schemas/Project' } } }
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
 *       200:
 *         description: Bundle uploaded and rolled out; play_store_invite opened for verified testers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     project: { $ref: '#/components/schemas/Project' }
 *                     versionCode: { type: integer }
 *                     testerListAutomated: { type: boolean }
 *                     note: { type: string }
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
 *       200:
 *         description: Completion report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     project:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         appName: { type: string }
 *                         status: { type: string }
 *                     testerCompletionSummary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           testerId: { type: string }
 *                           status: { type: string }
 *                           currentStep: { type: integer }
 *                     bugReports: { type: array, items: { $ref: '#/components/schemas/BugReport' } }
 *                     generatedAt: { type: string, format: date-time }
 */
router.get("/:id/completion-report", requireAuth(), requireRole("client", "admin"), getCompletionReport);

export default router;
