import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { createUploadUrl, createDownloadUrl } from "../services/storage.service";
import { ApiError } from "../utils/apiError";
import { Project } from "../models/Project";
import { Assignment } from "../models/Assignment";
import { BugReport } from "../models/BugReport";
import { Client } from "../models/Client";
import { Tester } from "../models/Tester";

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
  if (!/^[a-z0-9-]+\/[a-f0-9-]+\.[a-z0-9]+$/i.test(key)) throw ApiError.badRequest("Invalid storage key");

  let permitted = false;
  if (req.dbUser!.role === "admin") {
    permitted = Boolean(
      await Project.exists({ $or: [{ "clientFiles.key": key }, { "playIntegration.aabFileUrl": key }] })
      || await Assignment.exists({ "proofs.fileUrl": key })
      || await BugReport.exists({ attachments: key })
      || await Tester.exists({ "upi.qrImageUrl": key })
    );
  } else if (req.dbUser!.role === "client") {
    const client = await Client.findOne({ userId: req.dbUser!._id }).select("_id");
    const projects = client ? await Project.find({ clientId: client._id }).select("_id clientFiles playIntegration.aabFileUrl").lean() : [];
    const projectIds = projects.map((project) => project._id);
    permitted = projects.some((project) => project.clientFiles.some((file) => file.key === key) || project.playIntegration?.aabFileUrl === key)
      || Boolean(await Assignment.exists({ projectId: { $in: projectIds }, "proofs.fileUrl": key }))
      || Boolean(await BugReport.exists({ projectId: { $in: projectIds }, attachments: key }));
  } else {
    const tester = await Tester.findOne({ userId: req.dbUser!._id }).select("_id upi.qrImageUrl");
    const assignments = tester ? await Assignment.find({ testerId: tester._id, status: { $ne: "removed" } }).select("projectId proofs").lean() : [];
    const projectIds = assignments.map((assignment) => assignment.projectId);
    permitted = tester?.upi?.qrImageUrl === key
      || assignments.some((assignment) => assignment.proofs.some((proof) => proof.fileUrl === key))
      || Boolean(tester && await BugReport.exists({ testerId: tester._id, attachments: key }))
      || Boolean(await Project.exists({ _id: { $in: projectIds }, "clientFiles.key": key }));
  }
  if (!permitted) throw ApiError.forbidden("File is not accessible to this account");
  const result = await createDownloadUrl(key);
  res.status(200).json({ data: result });
});
