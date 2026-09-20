import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { submitProof, verifyProof } from "../services/workflowEngine.service";
import { manuallyReplaceTester } from "../services/playIntegration.service";
import { promoteSpecificQueuedAssignment } from "../services/matching.service";

async function loadOwnedAssignment(req: Request) {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound("Assignment not found");

  if (req.dbUser!.role === "tester") {
    const tester = await Tester.findOne({ userId: req.dbUser!._id });
    if (!tester || !assignment.testerId.equals(tester._id)) throw ApiError.forbidden();
  }
  return assignment;
}

export const getMyAssignments = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.notFound("Tester profile not found");
  const assignments = await Assignment.find({ testerId: tester._id }).populate("projectId").sort({ createdAt: -1 });
  res.status(200).json({ data: assignments });
});

export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await loadOwnedAssignment(req);
  res.status(200).json({ data: assignment });
});

const submitProofSchema = z.object({
  step: z.number().int().min(1).max(5),
  fileUrl: z.string().min(1),
  fileHash: z.string().optional(),
  googlePlayEmail: z.string().email().optional(),
});

export const submitAssignmentProof = asyncHandler(async (req: Request, res: Response) => {
  await loadOwnedAssignment(req);
  const body = submitProofSchema.parse(req.body);
  const assignment = await submitProof({ assignmentId: new Types.ObjectId(req.params.id), ...body });
  res.status(200).json({ data: assignment });
});

const verifySchema = z.object({
  step: z.number().int().min(1).max(5),
  approve: z.boolean(),
  reason: z.string().optional(),
});

export const verifyAssignmentStep = asyncHandler(async (req: Request, res: Response) => {
  const body = verifySchema.parse(req.body);
  if (!body.approve && !body.reason) throw ApiError.badRequest("A reason is required when rejecting a submission");

  const assignment = await verifyProof({
    assignmentId: new Types.ObjectId(req.params.id),
    step: body.step,
    approve: body.approve,
    reason: body.reason,
    adminId: req.dbUser!._id,
    source: "admin",
  });
  res.status(200).json({ data: assignment });
});

export const replaceAssignmentTester = asyncHandler(async (req: Request, res: Response) => {
  const result = await manuallyReplaceTester(new Types.ObjectId(req.params.id), req.dbUser!._id);
  res.status(200).json({ data: result });
});

export const promoteQueuedTester = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await promoteSpecificQueuedAssignment(new Types.ObjectId(req.params.id));
  res.status(200).json({ data: assignment });
});
