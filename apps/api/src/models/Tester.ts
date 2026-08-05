import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import { PLATFORMS, type Platform } from "@launchops/types";

export interface ITesterDevice {
  platform: Platform;
  model: string;
  osVersion: string;
  /** fraud signal — one account per device */
  fingerprint: string;
}

export interface ITester {
  userId: Types.ObjectId;
  devices: ITesterDevice[];
  experienceLevel: "beginner" | "intermediate" | "expert";
  upi: { vpa?: string; qrImageUrl?: string };
  ratingAvg: number;
  ratingCount: number;
  /** cached balance in paise — ledger in WalletTransaction is the truth */
  walletBalance: number;
  status: "active" | "suspended";
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type TesterDoc = HydratedDocument<ITester>;

const testerSchema = new Schema<ITester>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    devices: [
      {
        platform: { type: String, enum: PLATFORMS, default: "android" },
        model: { type: String, required: true },
        osVersion: { type: String, required: true },
        fingerprint: { type: String, required: true },
      },
    ],
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "beginner",
    },
    upi: {
      vpa: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
      qrImageUrl: { type: String },
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    lastActiveAt: { type: Date },
  },
  { timestamps: true },
);

testerSchema.index({ status: 1, lastActiveAt: -1 });

export const Tester: Model<ITester> =
  (mongoose.models.Tester as Model<ITester>) ??
  mongoose.model<ITester>("Tester", testerSchema);
