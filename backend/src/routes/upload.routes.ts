import { Router } from "express";
import { presignUpload, presignDownload } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /uploads/presign:
 *   post:
 *     tags: [Uploads]
 *     summary: Get a presigned R2 PUT URL for direct browser upload (screenshots, recordings, AAB/APK)
 *     description: The API never proxies binaries — the client uploads straight to Cloudflare R2 using this URL, then submits the returned key as fileUrl elsewhere.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filename, contentType, scope]
 *             properties:
 *               filename: { type: string }
 *               contentType: { type: string }
 *               scope: { type: string, enum: [proofs, bug-reports, aab-uploads, upi-qr] }
 *     responses:
 *       200:
 *         description: Presigned upload URL and object key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadUrl: { type: string }
 *                     key: { type: string }
 *                     expiresIn: { type: integer, description: "Seconds" }
 *       400: { description: File type not allowed }
 */
router.post("/presign", requireAuth(), presignUpload);

/**
 * @openapi
 * /uploads/presign-download:
 *   get:
 *     tags: [Uploads]
 *     summary: Get a presigned R2 GET URL for a stored object
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: key, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Presigned download URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl: { type: string }
 *                     expiresIn: { type: integer, description: "Seconds" }
 */
router.get("/presign-download", requireAuth(), presignDownload);

export default router;
