export const ROLES = ["client", "tester", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PROJECT_TYPES = ["play_store_internal_testing"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PACKAGES = ["testers_only", "managed_testing", "launch_ready"] as const;
export type PackageTier = (typeof PACKAGES)[number];

export const PROJECT_STATUSES = [
  "draft",
  "awaiting_payment",
  "active",
  "full",
  "closed",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const JOIN_STATES = ["open", "full", "closed"] as const;
export type JoinState = (typeof JOIN_STATES)[number];

export const STEP_TYPES = [
  "verification",
  "play_store_invite",
  "app_usage",
  "app_testing",
  "completion",
] as const;
export type StepType = (typeof STEP_TYPES)[number];

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
  "withdrawal_approved",
  "withdrawal_rejected",
  "support_reply",
  "project_completed",
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
] as const;
export type MetricEventType = (typeof METRIC_EVENT_TYPES)[number];
