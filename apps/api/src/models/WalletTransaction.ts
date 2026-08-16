import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  WALLET_TX_STATUSES,
  WALLET_TX_TYPES,
  type WalletTxStatus,
  type WalletTxType,
} from "@defineux/types";

export interface IWalletTransaction {
  testerId: Types.ObjectId;
  projectId?: Types.ObjectId;
  assignmentId?: Types.ObjectId;
  type: WalletTxType;
  /** always paise, always positive — direction comes from `type` */
  amountPaise: number;
  status: WalletTxStatus;
  upiRef?: string;
  note?: string;
  /** exactly-once crediting: e.g. "earning:{assignmentId}:{step}" */
  idempotencyKey: string;
  expectedCompletionAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type WalletTransactionDoc = HydratedDocument<IWalletTransaction>;

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
    type: { type: String, enum: WALLET_TX_TYPES, required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    status: { type: String, enum: WALLET_TX_STATUSES, default: "pending", index: true },
    upiRef: { type: String },
    note: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
    expectedCompletionAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ testerId: 1, type: 1, status: 1 });

export const WalletTransaction: Model<IWalletTransaction> =
  (mongoose.models.WalletTransaction as Model<IWalletTransaction>) ??
  mongoose.model<IWalletTransaction>("WalletTransaction", walletTransactionSchema);
