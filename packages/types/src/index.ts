/**
 * @launchops/types — shared domain contract for web + api.
 * Single source of truth for enums, step templates, and API shapes.
 */

// ---------------------------------------------------------------------------
// Roles (Clerk publicMetadata.role)
// ---------------------------------------------------------------------------
export const ROLES = ["client", "tester", "admin"] as const;
export type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Platforms & project types
// ---------------------------------------------------------------------------
export const PLATFORMS = ["android", "ios"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PROJECT_TYPES = ["play_store_internal", "ios_testflight"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

// ---------------------------------------------------------------------------
// Workflow engine
// ---------------------------------------------------------------------------
export const STEP_TYPES = [
  "verification",
  "play_store_invite",
  "testflight_invite",
  "app_usage",
  "app_testing",
  "completion",
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const STEP_STATES = [
  "locked",
  "active",
  "submitted",
  "verified",
  "rejected",
  "completed",
] as const;
export type StepState = (typeof STEP_STATES)[number];

export interface StepConfig {
  /** hours the tester has to complete the step once active */
  deadlineHours: number;
  /** payout credited to tester wallet when this step is verified (paise) */
  payoutPaise: number;
  /** whether proof upload is required to submit the step */
  requiresProof: boolean;
  /** steps 1-2 gate at project level ("all testers complete"), 3-5 per tester */
  projectLevelGate: boolean;
  instructions: string;
}

export interface StepTemplate {
  key: string; // e.g. "play_store_internal_v1"
  projectType: string; // e.g. "play_store_internal"
  packageKey: string; // e.g. "starter" | "growth" | "scale"
  requiredTesters: number; // min 14 per Google policy — config, not code
  waitlistCap: number;
  inactivityHoursBeforeReplacement: number; // 48h per spec
  steps: Array<{
    order: number;
    type: StepType;
    config: StepConfig;
  }>;
}

export interface EmbeddedStep {
  order: number;
  type: StepType;
  state: StepState;
  deadline?: string; // ISO date
  config: StepConfig;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const PROJECT_STATUSES = [
  "draft",
  "awaiting_payment",
  "active",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const JOIN_STATES = ["open", "full", "closed"] as const;
export type JoinState = (typeof JOIN_STATES)[number];

export const PLAY_INTEGRATION_MODES = ["manual", "api"] as const;
export type PlayIntegrationMode = (typeof PLAY_INTEGRATION_MODES)[number];

// ---------------------------------------------------------------------------
// Assignments (tester <-> project lifecycle)
// ---------------------------------------------------------------------------
export const ASSIGNMENT_STATUSES = [
  "queued",
  "active",
  "removed",
  "completed",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const PROOF_STATUSES = [
  "pending",
  "submitted",
  "verified",
  "rejected",
] as const;
export type ProofStatus = (typeof PROOF_STATUSES)[number];

export const VERIFICATION_SOURCES = ["admin", "auto"] as const;
export type VerificationSource = (typeof VERIFICATION_SOURCES)[number];

// ---------------------------------------------------------------------------
// Bug reports
// ---------------------------------------------------------------------------
export const BUG_STATUSES = [
  "open",
  "duplicate",
  "merged",
  "published",
  "closed",
] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export const BUG_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type BugSeverity = (typeof BUG_SEVERITIES)[number];

export const BUG_CATEGORIES = [
  "crash",
  "ui",
  "performance",
  "network",
  "functional",
  "other",
] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Wallet (amounts always in paise)
// ---------------------------------------------------------------------------
export const WALLET_TX_TYPES = ["earning", "withdrawal"] as const;
export type WalletTxType = (typeof WALLET_TX_TYPES)[number];

export const WALLET_TX_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "paid",
] as const;
export type WalletTxStatus = (typeof WALLET_TX_STATUSES)[number];

export const MIN_WITHDRAWAL_PAISE = 100_00; // ₹100 minimum
export const WITHDRAWAL_SLA_HOURS = 48;

// ---------------------------------------------------------------------------
// Invoices / payments (manual-first; gateway webhook-ready)
// ---------------------------------------------------------------------------
export const INVOICE_STATUSES = [
  "pending",
  "paid",
  "manual_paid",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const GST_RATE = 0.18;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const NOTIFICATION_TYPES = [
  "opportunity_published",
  "slot_assigned",
  "queue_promoted",
  "assignment_removed",
  "step_verified",
  "step_rejected",
  "testing_link",
  "bug_status",
  "wallet_credited",
  "withdrawal_update",
  "support_reply",
  "project_update",
  "inactivity_alert",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["email", "in_app"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["queued", "sent", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------
export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------
export const METRIC_TYPES = [
  "payment_confirmed",
  "opportunity_published",
  "slots_filled",
  "tester_joined",
  "tester_replaced",
  "step_verified",
  "testing_link_clicked",
  "bug_submitted",
  "bug_published",
  "payout_completed",
  "project_completed",
] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

// ---------------------------------------------------------------------------
// Package tiers (Play Store internal testing)
// ---------------------------------------------------------------------------
export interface PackageTier {
  key: string;
  name: string;
  description: string;
  requiredTesters: number;
  durationDays: number;
  pricePaise: number;
  features: string[];
  featured?: boolean;
}

export const PACKAGES: PackageTier[] = [
  {
    key: "starter",
    name: "Starter Track",
    description: "Meet Google's closed-testing requirement, or run an iOS TestFlight beta.",
    requiredTesters: 14,
    durationDays: 14,
    pricePaise: 4_999_00,
    features: [
      "14 real testers, real devices",
      "Google Play closed-track or TestFlight",
      "Android & iOS device coverage",
      "Daily engagement for 14 days",
      "Completion report for Play Console / App Store Connect",
    ],
  },
  {
    key: "growth",
    name: "Growth Track",
    description: "Closed testing plus structured bug reports from every tester.",
    requiredTesters: 20,
    durationDays: 14,
    pricePaise: 8_999_00,
    featured: true,
    features: [
      "20 real testers, real devices",
      "Google Play closed-track or TestFlight",
      "Structured bug reports, deduplicated",
      "Daily engagement for 14 days",
      "Priority replacement queue",
      "Completion report for Play Console / App Store Connect",
    ],
  },
  {
    key: "scale",
    name: "Scale Track",
    description: "Larger tester pool with managed QA review and severity triage.",
    requiredTesters: 30,
    durationDays: 21,
    pricePaise: 14_999_00,
    features: [
      "30 real testers across Android & iOS",
      "Google Play closed-track or TestFlight",
      "Managed QA review + severity triage",
      "Daily engagement for 21 days",
      "Dedicated support thread",
      "Completion report for Play Console / App Store Connect",
    ],
  },
];

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string };
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface UploadedFile {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  bytes: number;
  hash?: string;
}
