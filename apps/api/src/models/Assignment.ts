import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  ASSIGNMENT_STATUSES,
  PROOF_STATUSES,
  VERIFICATION_SOURCES,
  type AssignmentStatus,
  type ProofStatus,
  type VerificationSource,
} from "@launchops/types";

export interface IProof {
  _id?: Types.ObjectId;
  step: number;
  fileUrl: string;
  publicId?: string;
  /** sha256 of the file — fraud: recycled screenshot detection */
  fileHash?: string;
  status: ProofStatus;
  verifiedBy?: Types.ObjectId;
  verificationSource?: VerificationSource;
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

export interface IAssignment {
  testerId: Types.ObjectId;
  projectId: Types.ObjectId;
  status: AssignmentStatus;
  currentStep: number; // 1-5
  queuePosition?: number;
  replacedBy?: Types.ObjectId;
  proofs: Types.DocumentArray<IProof>;
  inactivityFlag: boolean;
  lastActivityAt: Date;
  joinedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type AssignmentDoc = HydratedDocument<IAssignment>;

const proofSchema = new Schema<IProof>(
  {
    step: { type: Number, required: true, min: 1, max: 5 },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    fileHash: { type: String, index: true },
    status: { type: String, enum: PROOF_STATUSES, default: "submitted" },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationSource: { type: String, enum: VERIFICATION_SOURCES },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
  },
  { _id: true },
);

const assignmentSchema = new Schema<IAssignment>(
  {
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "queued", index: true },
    currentStep: { type: Number, default: 1, min: 1, max: 5 },
    queuePosition: { type: Number },
    replacedBy: { type: Schema.Types.ObjectId, ref: "Assignment" },
    proofs: [proofSchema],
    inactivityFlag: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

assignmentSchema.index({ testerId: 1, projectId: 1 }, { unique: true });
assignmentSchema.index({ projectId: 1, status: 1 });
assignmentSchema.index({ testerId: 1, status: 1 });
assignmentSchema.index({ projectId: 1, status: 1, queuePosition: 1 });

export const Assignment: Model<IAssignment> =
  (mongoose.models.Assignment as Model<IAssignment>) ??
  mongoose.model<IAssignment>("Assignment", assignmentSchema);
