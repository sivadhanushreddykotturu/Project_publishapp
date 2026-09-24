import { Request, Response } from "express";
import { z } from "zod";
import { Client } from "../models/Client";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";

const updateSchema = z.object({
  companyName: z.string().trim().min(1).optional(),
  contactName: z.string().trim().min(1).optional(),
  billingInfo: z.object({ gstin: z.string().optional(), billingAddress: z.string().optional() }).optional(),
});

export const getMyClientProfile = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findOne({ userId: req.dbUser!._id }).populate("projects");
  if (!client) throw ApiError.notFound("Client profile not found");
  res.status(200).json({ data: client });
});

export const updateMyClientProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const client = await Client.findOneAndUpdate({ userId: req.dbUser!._id }, { $set: body }, { new: true });
  if (!client) throw ApiError.notFound("Client profile not found");
  res.status(200).json({ data: client });
});

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await Promise.all([
    Client.find().populate("userId").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const client = await Client.findById(req.params.id).populate("userId").populate("projects");
  if (!client) throw ApiError.notFound("Client not found");
  res.status(200).json({ data: client });
});
