import { Router } from "express";
import { z } from "zod";
import type { Types } from "mongoose";
import { MIN_WITHDRAWAL_PAISE } from "@defineux/types";
import { requireAuth, requireRole, auth } from "../middleware/auth.js";
import { Tester, User, WalletTransaction } from "../models/index.js";
import {
  completeWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
} from "../services/wallet.js";
import { badRequest, notFound } from "../utils/errors.js";
import { ah, ok } from "../utils/asyncHandler.js";
import { dispatch } from "../services/notify.js";

export const walletRouter = Router();

walletRouter.get(
  "/me",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");
    const transactions = await WalletTransaction.find({ testerId: tester._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    ok(res, {
      balancePaise: tester.walletBalance,
      minWithdrawalPaise: MIN_WITHDRAWAL_PAISE,
      upiSet: Boolean(tester.upi?.vpa),
      transactions,
    });
  }),
);

walletRouter.post(
  "/withdrawals",
  requireAuth,
  requireRole("tester"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const { amountPaise } = z
      .object({ amountPaise: z.number().int().positive() })
      .parse(req.body);
    const user = await User.findOne({ clerkUserId });
    const tester = await Tester.findOne({ userId: user?._id });
    if (!tester) throw notFound("Tester profile");
    if (!tester.upi?.vpa) {
      throw badRequest("Add your UPI handle in Profile first", "NO_UPI");
    }
    const tx = await requestWithdrawal(tester._id, amountPaise);
    ok(res, { withdrawal: tx }, 201);
  }),
);

// --------------------------------------------------------------------------
// admin
// --------------------------------------------------------------------------
walletRouter.get(
  "/withdrawals",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const status = z.enum(["pending", "paid", "rejected"]).optional()
      .parse(req.query.status);
    const withdrawals = await WalletTransaction.find({
      type: "withdrawal",
      ...(status ? { status } : {}),
    })
      .populate({
        path: "testerId",
        select: "userId upi",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();
    ok(res, { withdrawals });
  }),
);

walletRouter.post(
  "/withdrawals/:id/complete",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const { upiRef } = z
      .object({ upiRef: z.string().min(6).max(60) })
      .parse(req.body);
    const admin = await User.findOne({ clerkUserId });
    const txId = req.params.id as unknown as Types.ObjectId;
    await completeWithdrawal(txId, admin!._id, upiRef);

    const tx = await WalletTransaction.findById(txId).lean();
    const tester = tx ? await Tester.findById(tx.testerId).lean() : null;
    if (tester) {
      await dispatch({
        recipientId: tester.userId,
        type: "withdrawal_update",
        title: "Payout sent",
        body: `Your withdrawal of ₹${(tx!.amountPaise / 100).toFixed(0)} was sent to your UPI handle. Ref: ${upiRef}`,
        link: "/tester/wallet",
        idempotencyKey: `paid:${txId}`,
      });
    }
    ok(res, { completed: true });
  }),
);

walletRouter.post(
  "/withdrawals/:id/reject",
  requireAuth,
  requireRole("admin"),
  ah(async (req, res) => {
    const { clerkUserId } = auth(req);
    const { reason } = z
      .object({ reason: z.string().min(3).max(300) })
      .parse(req.body);
    const admin = await User.findOne({ clerkUserId });
    const txId = req.params.id as unknown as Types.ObjectId;
    await rejectWithdrawal(txId, admin!._id, reason);

    const tx = await WalletTransaction.findById(txId).lean();
    const tester = tx ? await Tester.findById(tx.testerId).lean() : null;
    if (tester) {
      await dispatch({
        recipientId: tester.userId,
        type: "withdrawal_update",
        title: "Withdrawal returned to balance",
        body: `Your withdrawal couldn't be completed: ${reason}. The amount is back in your wallet.`,
        link: "/tester/wallet",
        idempotencyKey: `rejected:${txId}`,
      });
    }
    ok(res, { rejected: true });
  }),
);
