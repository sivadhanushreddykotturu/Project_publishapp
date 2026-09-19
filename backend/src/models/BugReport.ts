import { Schema, model, Document, Types } from "mongoose";
import { BUG_CATEGORIES, BugCategory, BUG_SEVERITIES, BugSeverity, BUG_STATUSES, BugStatus } from "./enums";

export interface IBugReport extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  testerId: Types.ObjectId;
  title: string;
  description: string;
  category: BugCategory;
  severity: BugSeverity;
  device: string;
  appVersion?: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  attachments: string[];
  duplicateOf?: Types.ObjectId;
  status: BugStatus;
  publishedAt?: Date;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bugReportSchema = new Schema<IBugReport>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    testerId: { type: Schema.Types.ObjectId, ref: "Tester", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: BUG_CATEGORIES, required: true },
    severity: { type: String, enum: BUG_SEVERITIES, required: true },
    device: { type: String, required: true },
    appVersion: { type: String },
    expectedResult: { type: String, required: true },
    actualResult: { type: String, required: true },
    stepsToReproduce: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "BugReport" },
    status: { type: String, enum: BUG_STATUSES, default: "open", index: true },
    publishedAt: { type: Date },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

bugReportSchema.index({ projectId: 1, status: 1 });

export const BugReport = model<IBugReport>("BugReport", bugReportSchema);
