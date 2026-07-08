import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Tester } from "../models/Tester";
import { WalletTransaction } from "../models/WalletTransaction";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, buildPageMeta } from "../utils/pagination";
import { getWalletSummary, requestWithdrawal, rejectWithdrawal, markWithdrawalPaid } from "../services/wallet.service";
import { payoutViaUpi } from "../services/payment.service";
import { dispatchNotification } from "../services/notification.service";
import { logger } from "../config/logger";

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

/**
 * Approves a withdrawal and attempts an immediate UPI payout. If the payout partner
 * isn't wired up yet, the transaction stays "pending" and is surfaced for manual
 * payout — this endpoint never silently drops the request (Tech Spec §14).
 */
export const approveWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const txn = await WalletTransaction.findById(req.params.id);
  if (!txn || txn.type !== "withdrawal" || txn.status !== "pending") {
    throw ApiError.badRequest("Only pending withdrawal requests can be approved");
  }
  const tester = await Tester.findById(txn.testerId);
  if (!tester?.upi.vpa) throw ApiError.badRequest("Tester has no UPI ID on file");

  try {
    const payout = await payoutViaUpi({ vpa: tester.upi.vpa, amountPaise: txn.amount, reference: txn._id.toString() });
    const paidTxn = await markWithdrawalPaid(txn._id, req.dbUser!._id, (payout as { id: string }).id);
    await dispatchNotification({
      recipientUserId: tester.userId,
      type: "withdrawal_approved",
      channel: "email",
      relatedId: txn._id.toString(),
      payload: { amount: txn.amount },
    });
    res.status(200).json({ data: paidTxn });
  } catch (err) {
    logger.warn({ err, txnId: txn._id }, "Automated UPI payout unavailable — leave for manual payout");
    res.status(202).json({
      data: txn,
      message: "Payout partner unavailable — mark this paid manually once you've sent the UPI transfer.",
    });
  }
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

const manualPaySchema = z.object({ upiRef: z.string().min(1) });

/** Fallback when the automated payout partner call fails but the admin sent the transfer directly. */
export const markWithdrawalPaidManually = asyncHandler(async (req: Request, res: Response) => {
  const { upiRef } = manualPaySchema.parse(req.body);
  const txn = await markWithdrawalPaid(new Types.ObjectId(req.params.id), req.dbUser!._id, upiRef);
  res.status(200).json({ data: txn });
});
