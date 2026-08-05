import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  BUG_CATEGORIES,
  BUG_SEVERITIES,
  BUG_STATUSES,
  type BugCategory,
  type BugSeverity,
  type BugStatus,
  type UploadedFile,
} from "@launchops/types";

export interface IBugReport {
  projectId: Types.ObjectId;
  testerId: Types.ObjectId;
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  device: { model: string; androidVersion: string };
  appVersion?: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  attachments: UploadedFile[];
  /** merge graph — duplicateOf points at the surviving report */
  duplicateOf?: Types.ObjectId;
  mergedFrom: Types.ObjectId[];
  status: BugStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type BugReportDoc = HydratedDocument<IBugReport>;

const attachmentSchema = new Schema<UploadedFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "video", "raw"], required: true },
    bytes: { type: Number, default: 0 },
    hash: { type: String },
  },
  { _id: false },
);

const bugReportSchema = new Schema<IBugReport>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: BUG_CATEGORIES, required: true },
    severity: { type: String, enum: BUG_SEVERITIES, required: true },
    device: {
      model: { type: String, required: true },
      androidVersion: { type: String, required: true },
    },
    appVersion: { type: String },
    expectedResult: { type: String, required: true, maxlength: 2000 },
    actualResult: { type: String, required: true, maxlength: 2000 },
    stepsToReproduce: [{ type: String, maxlength: 500 }],
    attachments: [attachmentSchema],
    duplicateOf: { type: Schema.Types.ObjectId, ref: "BugReport" },
    mergedFrom: [{ type: Schema.Types.ObjectId, ref: "BugReport" }],
    status: { type: String, enum: BUG_STATUSES, default: "open" },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

bugReportSchema.index({ projectId: 1, status: 1 });
bugReportSchema.index({ testerId: 1, status: 1 });

export const BugReport: Model<IBugReport> =
  (mongoose.models.BugReport as Model<IBugReport>) ??
  mongoose.model<IBugReport>("BugReport", bugReportSchema);
