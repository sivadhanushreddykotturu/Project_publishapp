import { Schema, model, Document, Types } from "mongoose";

export interface ITesterDevice {
  model: string;
  androidVersion: string;
  fingerprint: string;
}

export interface ITester extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  devices: ITesterDevice[];
  experienceLevel: "beginner" | "intermediate" | "expert";
  upi: {
    vpa?: string;
    qrImageUrl?: string;
  };
  ratingAvg: number;
  ratingCount: number;
  walletBalance: number; // cached, in paise — see WalletTransaction for the ledger of record
  status: "active" | "inactive" | "suspended";
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<ITesterDevice>(
  {
    model: { type: String, required: true },
    androidVersion: { type: String, required: true },
    fingerprint: { type: String, required: true },
  },
  { _id: false }
);

const testerSchema = new Schema<ITester>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    devices: { type: [deviceSchema], default: [] },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "beginner",
    },
    upi: {
      vpa: { type: String, trim: true, unique: true, sparse: true },
      qrImageUrl: { type: String },
    },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active", index: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Fraud defense: one active device fingerprint should not back multiple tester accounts.
testerSchema.index({ "devices.fingerprint": 1 });
testerSchema.index({ status: 1, lastActiveAt: 1 });

export const Tester = model<ITester>("Tester", testerSchema);
