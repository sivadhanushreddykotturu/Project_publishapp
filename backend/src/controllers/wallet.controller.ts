import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Tester } from "../models/Tester";
import { WalletTransaction } from "../models/WalletTransaction";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { getWalletSummary, requestWithdrawal, rejectWithdrawal, completeWithdrawal } from "../services/wallet.service";
import { dispatchNotification } from "../services/notification.service";

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.notFound("Tester profile not found");
  const summary = await getWalletSummary(tester._id);
  res.status(200).json({ data: summary });
});

const withdrawSchema = z.object({ amount: z.number().int().positive() });

export const requestMyWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const tester = await Tester.findOne({ userId: req.dbUser!._id });
  if (!tester) throw ApiError.notFound("Tester profile not found");
  const { amount } = withdrawSchema.parse(req.body);
  const txn = await requestWithdrawal(tester._id, amount);
  res.status(201).json({ data: txn });
});

export const listWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const filter: Record<string, unknown> = { type: "withdrawal" };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate({ path: "testerId", populate: { path: "userId" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(filter),
  ]);
  res.status(200).json({ data: items, meta: buildPageMeta(page, limit, total) });
});

const rejectSchema = z.object({ reason: z.string().min(1) });

export const rejectWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = rejectSchema.parse(req.body);
  const txn = await rejectWithdrawal(new Types.ObjectId(req.params.id), req.dbUser!._id, reason);

  const tester = await Tester.findById(txn.testerId);
  if (tester) {
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "withdrawal_rejected",
      channel: "email",
      relatedId: txn._id.toString(),
      payload: { reason },
    });
  }
  res.status(200).json({ data: txn });
});

const completeSchema = z.object({ transactionId: z.string().min(1) });

/**
 * Admin has already sent the UPI transfer manually (outside LaunchOps — no gateway payout
 * call, see wallet.service#completeWithdrawal) and now marks the request complete,
 * attaching the UPI transaction ID as proof. Single action: there's no separate "approve"
 * step — paying and completing are the same real-world action.
 */
export const completeWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = completeSchema.parse(req.body);
  const txn = await completeWithdrawal(new Types.ObjectId(req.params.id), req.dbUser!._id, transactionId);

  const tester = await Tester.findById(txn.testerId);
  if (tester) {
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "withdrawal_completed",
      channel: "email",
      relatedId: txn._id.toString(),
      payload: { amount: txn.amount, transactionId },
    });
  }

  res.status(200).json({ data: txn });
});
