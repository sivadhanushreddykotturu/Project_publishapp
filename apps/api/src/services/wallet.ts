import mongoose, { type Types } from "mongoose";
import { MIN_WITHDRAWAL_PAISE, WITHDRAWAL_SLA_HOURS } from "@defineux/types";
import { Tester, WalletTransaction } from "../models/index.js";
import { badRequest, conflict } from "../utils/errors.js";
import { writeAudit } from "./audit.js";

/**
 * The wallet is an immutable ledger in paise. Balance = approved earnings −
 * paid withdrawals, cached on the tester doc inside the same transaction.
 * Idempotency keys make every credit exactly-once.
 */
export async function creditEarning(input: {
  testerId: Types.ObjectId;
  amountPaise: number;
  idempotencyKey: string;
  projectId?: Types.ObjectId;
  assignmentId?: Types.ObjectId;
  note?: string;
}): Promise<{ credited: boolean }> {
  const session = await mongoose.startSession();
  try {
    let credited = false;
    await session.withTransaction(async () => {
      const existing = await WalletTransaction.findOne({
        idempotencyKey: input.idempotencyKey,
      }).session(session);
      if (existing) return;

      await WalletTransaction.create(
        [
          {
            testerId: input.testerId,
            projectId: input.projectId,
            assignmentId: input.assignmentId,
            type: "earning",
            amountPaise: input.amountPaise,
            status: "approved",
            note: input.note,
            idempotencyKey: input.idempotencyKey,
          },
        ],
        { session },
      );
      await Tester.updateOne(
        { _id: input.testerId },
        { $inc: { walletBalance: input.amountPaise } },
        { session },
      );
      credited = true;
    });
    return { credited };
  } finally {
    await session.endSession();
  }
}

/** Tester requests a withdrawal; balance is held immediately, refunded on reject. */
export async function requestWithdrawal(
  testerId: Types.ObjectId,
  amountPaise: number,
): Promise<import("../models/index.js").WalletTransactionDoc> {
  if (amountPaise < MIN_WITHDRAWAL_PAISE) {
    throw badRequest(`Minimum withdrawal is ₹${MIN_WITHDRAWAL_PAISE / 100}`, "MIN_WITHDRAWAL");
  }
  const session = await mongoose.startSession();
  try {
    let created: import("../models/index.js").WalletTransactionDoc | null = null;
    await session.withTransaction(async () => {
      const held = await Tester.findOneAndUpdate(
        { _id: testerId, walletBalance: { $gte: amountPaise } },
        { $inc: { walletBalance: -amountPaise } },
        { new: true, session },
      );
      if (!held) throw conflict("Insufficient balance", "INSUFFICIENT_BALANCE");

      const [tx] = await WalletTransaction.create(
        [
          {
            testerId,
            type: "withdrawal",
            amountPaise,
            status: "pending",
            idempotencyKey: `withdrawal:${testerId}:${Date.now()}`,
            expectedCompletionAt: new Date(
              Date.now() + WITHDRAWAL_SLA_HOURS * 3600 * 1000,
            ),
          },
        ],
        { session },
      );
      created = tx;
    });
    return created!;
  } finally {
    await session.endSession();
  }
}

/** Admin completes a payout (UPI transfer done, ref logged). Balance already held. */
export async function completeWithdrawal(
  txId: Types.ObjectId,
  adminId: Types.ObjectId,
  upiRef: string,
): Promise<void> {
  const tx = await WalletTransaction.findOneAndUpdate(
    { _id: txId, type: "withdrawal", status: "pending" },
    { $set: { status: "paid", upiRef, completedAt: new Date() } },
    { new: true },
  );
  if (!tx) throw conflict("Withdrawal not pending", "NOT_PENDING");
  await writeAudit({
    actorId: adminId,
    action: "wallet.withdrawal_completed",
    entityType: "WalletTransaction",
    entityId: tx._id,
    before: { status: "pending" },
    after: { status: "paid", upiRef },
  });
}

/** Admin rejects — held balance returns to the tester. */
export async function rejectWithdrawal(
  txId: Types.ObjectId,
  adminId: Types.ObjectId,
  reason: string,
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const tx = await WalletTransaction.findOneAndUpdate(
        { _id: txId, type: "withdrawal", status: "pending" },
        { $set: { status: "rejected", note: reason, completedAt: new Date() } },
        { new: true, session },
      );
      if (!tx) throw conflict("Withdrawal not pending", "NOT_PENDING");
      await Tester.updateOne(
        { _id: tx.testerId },
        { $inc: { walletBalance: tx.amountPaise } },
        { session },
      );
      await writeAudit({
        actorId: adminId,
        action: "wallet.withdrawal_rejected",
        entityType: "WalletTransaction",
        entityId: tx._id,
        before: { status: "pending" },
        after: { status: "rejected", reason },
      });
    });
  } finally {
    await session.endSession();
  }
}
