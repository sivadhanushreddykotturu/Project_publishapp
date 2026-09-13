import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { createUploadUrl, createDownloadUrl } from "../services/storage.service";

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  scope: z.enum(["proofs", "bug-reports", "aab-uploads", "upi-qr", "testing-files"]),
});

/** Presigned PUT URL for direct browser -> R2 upload — the API never proxies binaries. */
export const presignUpload = asyncHandler(async (req: Request, res: Response) => {
  const body = presignSchema.parse(req.body);
  const result = await createUploadUrl(body);
  res.status(200).json({ data: result });
});

export const presignDownload = asyncHandler(async (req: Request, res: Response) => {
  const key = String(req.query.key ?? "");
  if (!key) return res.status(400).json({ error: { message: "key query param is required" } });
  const result = await createDownloadUrl(key);
  res.status(200).json({ data: result });
});
