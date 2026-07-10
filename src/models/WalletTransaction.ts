import { Schema, model, Document, Types } from "mongoose";
import { WALLET_TXN_TYPES, WalletTxnType, WALLET_TXN_STATUSES, WalletTxnStatus } from "./enums";

export interface IWalletTransaction extends Document {
  _id: Types.ObjectId;
  testerId: Types.ObjectId;
  projectId?: Types.ObjectId;
  type: WalletTxnType;
  amount: number; // minor units (paise) — always positive; type/status determine effect
  status: WalletTxnStatus;
  /** Withdrawals are paid out manually via UPI (no payment-gateway payout — avoids
   *  gateway commission on payouts); this is the UPI transaction ID the admin attaches
   *  as proof once they've sent the transfer and marked it complete. */
  transactionId?: string;
  /** Set when a withdrawal is requested — requestedAt + 48h, shown to the tester as the SLA. */
  expectedCompletionAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    type: { type: String, enum: WALLET_TXN_TYPES, required: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: WALLET_TXN_STATUSES, default: "pending", index: true },
    transactionId: { type: String },
    expectedCompletionAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);

// Immutable ledger: application code must never mutate amount/type after creation.
walletTransactionSchema.index({ testerId: 1, status: 1 });

export const WalletTransaction = model<IWalletTransaction>("WalletTransaction", walletTransactionSchema);
