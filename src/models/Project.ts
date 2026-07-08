import { Schema, model, Document, Types } from "mongoose";
import {
  PACKAGES,
  PackageTier,
  PROJECT_TYPES,
  ProjectType,
  PROJECT_STATUSES,
  ProjectStatus,
  JOIN_STATES,
  JoinState,
  STEP_TYPES,
  StepType,
  STEP_STATES,
  StepState,
  PLAY_INTEGRATION_MODES,
  PlayIntegrationMode,
} from "./enums";

export interface IStep {
  order: number;
  type: StepType;
  state: StepState;
  deadline?: Date;
  reminderSentAt?: Date;
  config: Record<string, unknown>;
}

export interface IPlayIntegration {
  mode: PlayIntegrationMode;
  track: "internal" | "closed";
  aabFileUrl?: string;
  packageName?: string;
  optInUrl?: string;
  serviceAccountLinked: boolean;
  /** Google Group whose membership is synced as the track's tester list (API mode only —
   *  the Play API can only assign a Google Group to a track, not raw tester emails). */
  testerGoogleGroupEmail?: string;
  /** Version code returned by the last successful edits.bundles.upload call. */
  versionCode?: number;
  /** Last API-mode failure, surfaced to the admin console for one-click fallback to manual. */
  lastApiError?: string;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  package: PackageTier;
  appDetails: {
    appName: string;
    packageName?: string;
    description?: string;
    playStoreUrl?: string;
  };
  projectType: ProjectType;
  requiredTesters: number;
  activeTesterCount: number;
  status: ProjectStatus;
  joinState: JoinState;
  steps: IStep[];
  stepTemplateVersion: number;
  playIntegration: IPlayIntegration;
  createdAt: Date;
  updatedAt: Date;
}

const stepSchema = new Schema<IStep>(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: STEP_TYPES, required: true },
    state: { type: String, enum: STEP_STATES, default: "pending" },
    deadline: { type: Date },
    reminderSentAt: { type: Date },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const playIntegrationSchema = new Schema<IPlayIntegration>(
  {
    mode: { type: String, enum: PLAY_INTEGRATION_MODES, default: "manual" },
    track: { type: String, enum: ["internal", "closed"], default: "internal" },
    aabFileUrl: { type: String },
    packageName: { type: String },
    optInUrl: { type: String },
    serviceAccountLinked: { type: Boolean, default: false },
    testerGoogleGroupEmail: { type: String },
    versionCode: { type: Number },
    lastApiError: { type: String },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    package: { type: String, enum: PACKAGES, required: true },
    appDetails: {
      appName: { type: String, required: true, trim: true },
      packageName: { type: String, trim: true },
      description: { type: String, trim: true },
      playStoreUrl: { type: String, trim: true },
    },
    projectType: { type: String, enum: PROJECT_TYPES, default: "play_store_internal_testing" },
    requiredTesters: { type: Number, required: true, min: 1 },
    // Atomic slot counter — incremented only via guarded findOneAndUpdate
    // (activeTesterCount < requiredTesters) so concurrent joins can never overfill a project.
    activeTesterCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft", index: true },
    joinState: { type: String, enum: JOIN_STATES, default: "open" },
    steps: { type: [stepSchema], default: [] },
    stepTemplateVersion: { type: Number, default: 1 },
    playIntegration: { type: playIntegrationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

projectSchema.index({ clientId: 1, status: 1 });

export const Project = model<IProject>("Project", projectSchema);
