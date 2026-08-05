import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { signUpload } from "../services/cloudinary.js";
import { ah, ok } from "../utils/asyncHandler.js";

export const uploadsRouter = Router();

const bodySchema = z.object({
  folder: z.enum(["proofs", "bug-attachments", "upi-qr", "misc"]),
  entityId: z.string().min(1).max(120),
  resourceType: z.enum(["image", "video"]),
});

/** Presigned Cloudinary params — files go browser → Cloudinary directly. */
uploadsRouter.post(
  "/signature",
  requireAuth,
  ah(async (req, res) => {
    const { folder, entityId, resourceType } = bodySchema.parse(req.body);
    ok(res, signUpload(folder, entityId, resourceType));
  }),
);
