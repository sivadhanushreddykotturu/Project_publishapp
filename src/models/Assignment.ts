import { Schema, model, Document, Types } from "mongoose";
import { ASSIGNMENT_STATUSES, AssignmentStatus, VERIFICATION_SOURCES, VerificationSource } from "./enums";

export interface IProof {
  step: number;
  fileUrl: string;
  fileHash?: string;
  verifiedBy?: Types.ObjectId;
  verificationSource?: VerificationSource;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  submittedAt: Date;
  verifiedAt?: Date;
}

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  testerId: Types.ObjectId;
  projectId: Types.ObjectId;
  status: AssignmentStatus;
  currentStep: number;
  queuePosition?: number;
  replacedBy?: Types.ObjectId;
  proofs: IProof[];
  inactivityFlag: boolean;
  lastActivityAt: Date;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const proofSchema = new Schema<IProof>(
  {
    step: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    fileHash: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationSource: { type: String, enum: VERIFICATION_SOURCES },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const assignmentSchema = new Schema<IAssignment>(
  {
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "queued", index: true },
    currentStep: { type: Number, default: 1 },
    queuePosition: { type: Number },
    replacedBy: { type: Schema.Types.ObjectId, ref: "Tester" },
    proofs: { type: [proofSchema], default: [] },
    inactivityFlag: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
  },
  { timestamps: true }
);

// One tester per project; fast lookups for queue promotion and admin views.
assignmentSchema.index({ projectId: 1, testerId: 1 }, { unique: true });
assignmentSchema.index({ projectId: 1, status: 1, queuePosition: 1 });
assignmentSchema.index({ testerId: 1, status: 1 });

export const Assignment = model<IAssignment>("Assignment", assignmentSchema);
