export const ROLES = ["client", "tester", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PROJECT_TYPES = ["play_store_internal_testing"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

// "custom" is a bespoke, admin-negotiated deal — always requires client verification and
// has no fixed PACKAGE_CONFIG pricing (see constants/packages.ts); the admin sets the
// invoice amount directly when approving verification.
export const PACKAGES = ["testers_only", "managed_testing", "launch_ready", "custom"] as const;
export type PackageTier = (typeof PACKAGES)[number];

export const PROJECT_STATUSES = [
  "draft",
  // managed_testing / launch_ready / custom projects land here first — no invoice exists
  // yet, and payment is blocked until an admin verifies the client (Play Console access
  // proof + a direct discussion) and approves. testers_only skips this entirely.
  "pending_verification",
  "awaiting_payment",
  "active",
  "full",
  "closed",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const CLIENT_VERIFICATION_STATUSES = ["not_required", "pending", "submitted", "verified", "rejected"] as const;
export type ClientVerificationStatus = (typeof CLIENT_VERIFICATION_STATUSES)[number];

export const JOIN_STATES = ["open", "full", "closed"] as const;
export type JoinState = (typeof JOIN_STATES)[number];

/**
 * Matches Google's real closed-testing timeline, not an idealized one (confirmed against
 * actual Play Console mechanics): LaunchOps-side eligibility check, then Google's own
 * tester-list review (~2-3h), then testers opt in, then a *mandatory* 14-day testing
 * window with staggered installs, then Google's production review (~7d+). Roughly
 * 2 + 14 + 7 ≈ 23 days end to end. Only verification / play_store_invite / testing_period
 * carry individual tester actions — google_email_review, production_review, and completion
 * are project-level milestones the admin advances directly (see stepGateType in
 * workflowEngine.service.ts).
 */
export const STEP_TYPES = [
  "verification",
  "google_email_review",
  "play_store_invite",
  "testing_period",
  "production_review",
  "completion",
] as const;
export type StepType = (typeof STEP_TYPES)[number];

/** How a step's project-level "state" advances — see workflowEngine.service.ts. */
export const STEP_GATE_TYPES = ["project", "time", "manual"] as const;
export type StepGateType = (typeof STEP_GATE_TYPES)[number];

// PENDING -> SUBMITTED -> VERIFIED -> (next step) | REJECTED -> (resubmit -> SUBMITTED)
// "reminder" is a derived scheduler flag (Step.reminderSentAt), not a state — Tech Spec §5.
export const STEP_STATES = ["pending", "submitted", "verified", "rejected"] as const;
export type StepState = (typeof STEP_STATES)[number];

export const ASSIGNMENT_STATUSES = ["queued", "active", "removed", "completed"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const VERIFICATION_SOURCES = ["admin", "auto"] as const;
export type VerificationSource = (typeof VERIFICATION_SOURCES)[number];

export const PLAY_INTEGRATION_MODES = ["manual", "api"] as const;
export type PlayIntegrationMode = (typeof PLAY_INTEGRATION_MODES)[number];

export const BUG_CATEGORIES = ["crash", "functional", "ui_ux", "performance", "security", "other"] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number];

export const BUG_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type BugSeverity = (typeof BUG_SEVERITIES)[number];

export const BUG_STATUSES = ["open", "duplicate", "merged", "published"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export const WALLET_TXN_TYPES = ["earning", "withdrawal"] as const;
export type WalletTxnType = (typeof WALLET_TXN_TYPES)[number];

export const WALLET_TXN_STATUSES = ["pending", "approved", "rejected", "paid"] as const;
export type WalletTxnStatus = (typeof WALLET_TXN_STATUSES)[number];

export const INVOICE_STATUSES = ["pending", "paid", "manual_paid", "failed"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["email", "push", "sms", "whatsapp"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["queued", "sent", "failed"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "testing_link",
  "step_reminder",
  "step_verified",
  "step_rejected",
  "queue_promoted",
  "tester_replaced",
  "withdrawal_completed",
  "withdrawal_rejected",
  "support_reply",
  "project_completed",
  "install_scheduled",
  "email_review_reminder",
  "client_verification_approved",
  "client_verification_rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const SUPPORT_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const METRIC_EVENT_TYPES = [
  "payment_confirmed",
  "opportunity_published",
  "slots_filled",
  "tester_joined",
  "tester_replaced",
  "step_verified",
  "step_rejected",
  "bug_report_submitted",
  "bug_reports_merged",
  "project_completed",
  "wallet_credited",
  "withdrawal_requested",
  "withdrawal_paid",
  "testing_link_clicked",
  "email_review_submitted",
  "email_review_verified",
  "install_pacing_scheduled",
  "production_applied",
  "production_approved",
  "client_verification_submitted",
  "client_verification_approved",
  "client_verification_rejected",
] as const;
export type MetricEventType = (typeof METRIC_EVENT_TYPES)[number];
