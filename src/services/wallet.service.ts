import mongoose, { Types } from "mongoose";
import { Tester } from "../models/Tester";
import { WalletTransaction } from "../models/WalletTransaction";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { logger } from "../config/logger";

/**
 * Runs `fn` inside a Mongo session/transaction when the deployment is a replica set
 * (Atlas always is), and falls back to a plain call on a standalone mongod (e.g. a
 * developer's local single-node instance) where multi-document transactions aren't
 * available. Never silently loses the write — only the atomicity guarantee narrows.
 */
async function withOptionalTransaction<T>(fn: (session: mongoose.ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Transaction numbers") || message.includes("IllegalOperation")) {
      logger.warn("Mongo transactions unavailable (standalone instance) — running without one");
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/** Earnings post automatically the moment a project step is verified complete (PRD §7). */
export async function creditEarning(params: {
  testerId: Types.ObjectId;
  projectId?: Types.ObjectId;
  amount: number;
  note?: string;
}) {
  return withOptionalTransaction(async (session) => {
    const [txn] = await WalletTransaction.create(
      [
        {
          testerId: params.testerId,
          projectId: params.projectId,
          type: "earning",
          amount: params.amount,
          status: "approved",
          note: params.note,
        },
      ],
      { session: session ?? undefined }
    );

    await Tester.findByIdAndUpdate(
      params.testerId,
      { $inc: { walletBalance: params.amount } },
      { session: session ?? undefined }
    );

    await MetricEvent.create({
      type: "wallet_credited",
      projectId: params.projectId,
      meta: { testerId: params.testerId, amount: params.amount },
    });

    return txn;
  });
}

export async function getWalletSummary(testerId: Types.ObjectId) {
  const tester = await Tester.findById(testerId);
  if (!tester) throw ApiError.notFound("Tester not found");

  const [pendingAgg] = await WalletTransaction.aggregate([
    { $match: { testerId, type: "withdrawal", status: "pending" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const history = await WalletTransaction.find({ testerId }).sort({ createdAt: -1 }).limit(50);

  return {
    balance: tester.walletBalance,
    pendingWithdrawals: pendingAgg?.total ?? 0,
    availableForWithdrawal: tester.walletBalance - (pendingAgg?.total ?? 0),
    history,
  };
}

export async function requestWithdrawal(testerId: Types.ObjectId, amount: number) {
  if (amount <= 0) throw ApiError.badRequest("Withdrawal amount must be positive");

  const summary = await getWalletSummary(testerId);
  if (amount > summary.availableForWithdrawal) {
    throw ApiError.badRequest("Withdrawal amount exceeds available balance");
  }

  const txn = await WalletTransaction.create({
    testerId,
    type: "withdrawal",
    amount,
    status: "pending",
  });

  await MetricEvent.create({ type: "withdrawal_requested", meta: { testerId, amount } });
  return txn;
}

export async function rejectWithdrawal(txnId: Types.ObjectId, adminId: Types.ObjectId, reason: string) {
  const txn = await WalletTransaction.findById(txnId);
  if (!txn) throw ApiError.notFound("Withdrawal request not found");
  if (txn.type !== "withdrawal" || txn.status !== "pending") {
    throw ApiError.badRequest("Only pending withdrawal requests can be rejected");
  }

  const before = { status: txn.status };
  txn.status = "rejected";
  txn.note = reason;
  await txn.save();

  await recordAudit({
    actorId: adminId,
    action: "wallet.withdrawal.reject",
    entityType: "WalletTransaction",
    entityId: txn._id,
    before,
    after: { status: txn.status, reason },
  });

  return txn;
}

/**
 * Admin approves a withdrawal. Payout dispatch (UPI) is invoked by the caller
 * (controller) via payment.service so this module stays free of gateway concerns;
 * this function only owns the ledger + balance transition once a payout succeeds.
 */
export async function markWithdrawalPaid(txnId: Types.ObjectId, adminId: Types.ObjectId, upiRef: string) {
  return withOptionalTransaction(async (session) => {
    const txn = await WalletTransaction.findById(txnId).session(session);
    if (!txn) throw ApiError.notFound("Withdrawal request not found");
    if (txn.type !== "withdrawal" || txn.status !== "pending") {
      throw ApiError.badRequest("Only pending withdrawal requests can be paid out");
    }

    const before = { status: txn.status };
    txn.status = "paid";
    txn.upiRef = upiRef;
    await txn.save({ session: session ?? undefined });

    await Tester.findByIdAndUpdate(
      txn.testerId,
      { $inc: { walletBalance: -txn.amount } },
      { session: session ?? undefined }
    );

    await recordAudit({
      actorId: adminId,
      action: "wallet.withdrawal.paid",
      entityType: "WalletTransaction",
      entityId: txn._id,
      before,
      after: { status: txn.status, upiRef },
    });

    await MetricEvent.create({ type: "withdrawal_paid", meta: { testerId: txn.testerId, amount: txn.amount } });
    return txn;
  });
}
