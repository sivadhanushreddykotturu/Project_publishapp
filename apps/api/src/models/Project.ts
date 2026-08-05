import mongoose, { Schema, type HydratedDocument, type Model, type Types } from "mongoose";
import {
  JOIN_STATES,
  PLAY_INTEGRATION_MODES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STEP_STATES,
  STEP_TYPES,
  type EmbeddedStep,
  type JoinState,
  type PlayIntegrationMode,
  type ProjectStatus,
  type ProjectType,
} from "@launchops/types";

export interface IProject {
  clientId: Types.ObjectId;
  packageKey: string;
  projectType: ProjectType;
  appDetails: {
    appName: string;
    packageName: string;
    description: string;
    playStoreUrl?: string;
  };
  requiredTesters: number; // min 14 — from package config
  activeTesterCount: number;
  waitlistCount: number;
  status: ProjectStatus;
  joinState: JoinState;
  steps: EmbeddedStep[];
  stepTemplateVersion: string;
  playIntegration: {
    mode: PlayIntegrationMode;
    track?: string;
    aabFileUrl?: string;
    optInUrl?: string;
    serviceAccountLinked: boolean;
    lastApiError?: string;
  };
  /** metric timestamps — PRD targets are provable from these */
  paymentConfirmedAt?: Date;
  opportunityPublishedAt?: Date;
  slotsFilledAt?: Date;
  completedAt?: Date;
  /** testers the client already rated — one rating per project per tester */
  ratedTesterIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
export type ProjectDoc = HydratedDocument<IProject>;

const stepSchema = new Schema<EmbeddedStep>(
  {
    order: { type: Number, required: true, min: 1, max: 5 },
    type: { type: String, enum: STEP_TYPES, required: true },
    state: { type: String, enum: STEP_STATES, default: "locked" },
    deadline: { type: String },
    config: {
      deadlineHours: { type: Number, required: true },
      payoutPaise: { type: Number, required: true, min: 0 },
      requiresProof: { type: Boolean, default: true },
      projectLevelGate: { type: Boolean, default: false },
      instructions: { type: String, default: "" },
    },
  },
  { _id: false },
);

const projectSchema = new Schema<IProject>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    packageKey: { type: String, required: true },
    projectType: { type: String, enum: PROJECT_TYPES, default: "play_store_internal" },
    appDetails: {
      appName: { type: String, required: true },
      packageName: { type: String, required: true, lowercase: true, trim: true },
      description: { type: String, default: "" },
      playStoreUrl: { type: String },
    },
    requiredTesters: { type: Number, required: true, min: 14 },
    activeTesterCount: { type: Number, default: 0, min: 0 },
    waitlistCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft", index: true },
    joinState: { type: String, enum: JOIN_STATES, default: "closed" },
    steps: [stepSchema],
    stepTemplateVersion: { type: String, required: true },
    playIntegration: {
      mode: { type: String, enum: PLAY_INTEGRATION_MODES, default: "manual" },
      track: { type: String, default: "internal" },
      aabFileUrl: { type: String },
      optInUrl: { type: String },
      serviceAccountLinked: { type: Boolean, default: false },
      lastApiError: { type: String },
    },
    paymentConfirmedAt: { type: Date },
    opportunityPublishedAt: { type: Date },
    slotsFilledAt: { type: Date },
    completedAt: { type: Date },
    ratedTesterIds: [{ type: Schema.Types.ObjectId, ref: "Tester" }],
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, joinState: 1 });

export const Project: Model<IProject> =
  (mongoose.models.Project as Model<IProject>) ??
  mongoose.model<IProject>("Project", projectSchema);
