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
  CLIENT_VERIFICATION_STATUSES,
  ClientVerificationStatus,
} from "./enums";

export interface IClientVerification {
  required: boolean;
  status: ClientVerificationStatus;
  /** Proof the client controls the Play Console listing (R2 object key) — the agreed criterion for managed_testing/launch_ready/custom. */
  proofUrl?: string;
  note?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
}

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

  // Real-world Play Console timeline milestones (STEP_TYPES: google_email_review,
  // testing_period, production_review). Kept on playIntegration rather than embedded
  // per-step config so they survive independent of any single Step document's shape.
  /** Admin confirmed the verified tester emails were added to Play Console and submitted for review. */
  emailReviewSubmittedAt?: Date;
  /** submittedAt + GOOGLE_EMAIL_REVIEW_HOURS — the cron auto-verifies at this point if the admin hasn't already. */
  emailReviewExpectedApprovalAt?: Date;
  /** When the mandatory testing_period window started — production application is blocked before start + TESTING_PERIOD_DAYS. */
  testingPeriodStartAt?: Date;
  /** Admin/client applied for production access (only allowed once the testing period has elapsed). */
  productionAppliedAt?: Date;
  /** Admin manually confirmed Google approved production — there's no API signal for this. */
  productionApprovedAt?: Date;
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
  waitlistCount: number;
  requiredDeviceModels: string[];
  status: ProjectStatus;
  joinState: JoinState;
  steps: IStep[];
  stepTemplateVersion: number;
  playIntegration: IPlayIntegration;
  verification: IClientVerification;
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
    emailReviewSubmittedAt: { type: Date },
    emailReviewExpectedApprovalAt: { type: Date },
    testingPeriodStartAt: { type: Date },
    productionAppliedAt: { type: Date },
    productionApprovedAt: { type: Date },
  },
  { _id: false }
);

const clientVerificationSchema = new Schema<IClientVerification>(
  {
    required: { type: Boolean, default: false },
    status: { type: String, enum: CLIENT_VERIFICATION_STATUSES, default: "not_required" },
    proofUrl: { type: String },
    note: { type: String },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
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
    waitlistCount: { type: Number, default: 0, min: 0, max: 3 },
    requiredDeviceModels: { type: [String], default: [] },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft", index: true },
    joinState: { type: String, enum: JOIN_STATES, default: "open" },
    steps: { type: [stepSchema], default: [] },
    stepTemplateVersion: { type: Number, default: 1 },
    playIntegration: { type: playIntegrationSchema, default: () => ({}) },
    verification: { type: clientVerificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

projectSchema.index({ clientId: 1, status: 1 });

export const Project = model<IProject>("Project", projectSchema);
