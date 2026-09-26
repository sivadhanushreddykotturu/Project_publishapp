import { apiRequest } from "./api";

export type LaunchOpsRole = "client" | "tester";

export type LaunchOpsUser = {
  _id: string;
  clerkUserId: string;
  role: LaunchOpsRole | "admin";
  name: string;
  email: string;
  phone?: string;
  profileCompletedAt?: string;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

export type SyncUserInput = {
  role: LaunchOpsRole;
  name: string;
  email: string;
  phone?: string;
};

export type CurrentUserResponse = {
  user: LaunchOpsUser;
  profile: BackendTesterProfile | unknown;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: unknown;
  message?: string;
};

export type BackendTesterDevice = {
  model: string;
  androidVersion: string;
  fingerprint: string;
};

export type BackendTesterProfile = {
  _id: string;
  userId: string | LaunchOpsUser;
  devices: BackendTesterDevice[];
  experienceLevel: "beginner" | "intermediate" | "expert";
  country?: string;
  specialty?: string;
  upi?: {
    vpa?: string;
    qrImageUrl?: string;
  };
  ratingAvg: number;
  ratingCount: number;
  walletBalance: number;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
};

export type BackendInvoice = {
  _id: string;
  projectId?: string;
  amount: number;
  gst: number;
  status: "pending" | "paid" | "manual_paid" | "failed" | "refunded";
};

export type BackendProjectFile = {
  name: string;
  key: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export type BackendClient = {
  _id: string;
  userId: LaunchOpsUser;
  companyName?: string;
  contactName: string;
  logoUrl?: string;
  billingInfo?: { gstin?: string; billingAddress?: string };
  activePackage?: BackendProject["package"];
  projects: string[];
};

export type BackendProjectArtifacts = {
  clientFiles: BackendProjectFile[];
  testerProofs: Array<{ assignmentId: string; testerId: unknown; step: number; key: string; status: string; submittedAt: string }>;
  bugAttachments: Array<{ bugReportId: string; testerId: unknown; title: string; key: string; uploadedAt: string }>;
};

export type PublicTesterProfile = {
  _id: string;
  userId: { _id: string; name: string };
  devices: BackendTesterDevice[];
  experienceLevel: "beginner" | "intermediate" | "expert";
  ratingAvg: number;
  ratingCount: number;
  status: "active";
};

export type BackendProject = {
  _id: string;
  package: "testers_only" | "managed_testing" | "launch_ready" | "custom";
  serviceType: "ios_app_publishing" | "play_store_closed_testing" | "user_experience_testing";
  serviceOption: string;
  appDetails: {
    appName: string;
    packageName?: string;
    description?: string;
    playStoreUrl?: string;
  };
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  requiredDeviceModels: string[];
  status: "draft" | "pending_verification" | "awaiting_payment" | "active" | "full" | "closed" | "completed" | "cancelled";
  joinState: "open" | "full" | "closed";
  steps?: Array<{
    order: number;
    type: string;
    state: string;
    deadline?: string;
    config?: Record<string, unknown>;
  }>;
  playIntegration?: {
    optInUrl?: string;
    packageName?: string;
    mode?: "manual" | "api";
    track?: "internal" | "closed";
    aabFileUrl?: string;
    serviceAccountLinked?: boolean;
    testerGoogleGroupEmail?: string;
    lastApiError?: string;
  };
  verification?: {
    required: boolean;
    status: "not_required" | "pending" | "submitted" | "verified" | "rejected";
  };
  clientFiles?: BackendProjectFile[];
  createdAt: string;
  updatedAt: string;
};

export type BackendAssignment = {
  _id: string;
  testerId: string | { _id: string; userId?: LaunchOpsUser };
  projectId: string | BackendProject;
  status: "queued" | "active" | "removed" | "completed";
  currentStep: number;
  queuePosition?: number;
  proofs?: Array<{
    step: number;
    fileUrl: string;
    googlePlayEmail?: string;
    status: "pending" | "verified" | "rejected";
    submittedAt: string;
  }>;
  inactivityFlag: boolean;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendWalletTransaction = {
  _id: string;
  testerId: string | { _id: string; userId?: LaunchOpsUser; upi?: { vpa?: string; qrImageUrl?: string } };
  projectId?: string;
  type: "earning" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  transactionId?: string;
  expectedCompletionAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendWalletSummary = {
  balance: number;
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  history: BackendWalletTransaction[];
};

export type BackendBugReport = {
  _id: string;
  projectId: string | BackendProject;
  testerId: string;
  title: string;
  description: string;
  category: "crash" | "functional" | "ui_ux" | "performance" | "security" | "other";
  severity: "low" | "medium" | "high" | "critical";
  device: string;
  appVersion?: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  attachments: string[];
  status: "open" | "duplicate" | "merged" | "published";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendNotification = {
  _id: string;
  type: "project_request" | "project_opportunity" | string;
  channel: "email" | "push" | "sms" | "whatsapp";
  relatedId?: string;
  payload: { projectId?: string; appName?: string; joinPath?: string; requiredDeviceModels?: string[]; [key: string]: unknown };
  status: "queued" | "sent" | "failed";
  sentAt?: string;
  lastError?: string;
  readAt?: string;
  createdAt: string;
};

export type BackendSupportTicket = {
  _id: string;
  raisedBy?: string | Pick<LaunchOpsUser, "_id" | "name" | "email" | "role">;
  projectId?: string | { _id: string; appDetails?: { appName?: string } };
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  messages: Array<{ authorId: string | Pick<LaunchOpsUser, "_id" | "name" | "email" | "role">; body: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminDashboardSummary = {
  projects: { total: number; active: number };
  testers: { total: number; active: number; inactive: number };
  assignments: { total: number; active: number; queued: number; completed: number };
  bugs: { total: number; published: number; resolvedToday: number };
  payouts: { paidTotal: number; pending: number };
  replacementsToday: number;
  successRate: number;
  playStoreSync: { status: "operational" | "degraded" | "not_configured"; errors: number; configuredProjects: number };
  system: { status: "operational"; serverTime: string; uptimeSeconds: number };
  inactivityThresholdHours: number;
};

export type UpsertTesterProfileInput = {
  devices: BackendTesterDevice[];
  experienceLevel?: BackendTesterProfile["experienceLevel"];
  country?: string;
  specialty?: string;
  upi: {
    vpa: string;
    qrImageUrl?: string;
  };
};

export type SubmitAssignmentProofInput = {
  step: number;
  fileUrl: string;
  fileHash?: string;
  googlePlayEmail?: string;
};

export type SubmitBugReportInput = {
  title: string;
  description: string;
  category: BackendBugReport["category"];
  severity: BackendBugReport["severity"];
  device: string;
  appVersion?: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  attachments: string[];
};

export function syncLaunchOpsUser(input: SyncUserInput, token: string) {
  return apiRequest<ApiEnvelope<LaunchOpsUser>>("/api/v1/users/sync", {
    method: "POST",
    token,
    body: input,
  });
}

export function getCurrentLaunchOpsUser(token: string) {
  return apiRequest<ApiEnvelope<CurrentUserResponse>>("/api/v1/users/me", {
    token,
  });
}

export function getMyTesterProfile(token: string) {
  return apiRequest<ApiEnvelope<BackendTesterProfile>>("/api/v1/testers/me", {
    token,
  });
}

export function updateMyTesterProfile(input: UpsertTesterProfileInput, token: string) {
  return apiRequest<ApiEnvelope<BackendTesterProfile>>("/api/v1/testers/me", {
    method: "PUT",
    token,
    body: input,
  });
}

export function listTesterOpportunities(token: string) {
  return apiRequest<ApiEnvelope<BackendProject[]>>("/api/v1/projects/opportunities", {
    token,
  });
}

export function listMyAssignments(token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment[]>>("/api/v1/assignments/me", {
    token,
  });
}

export function joinTesterProject(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment>>(`/api/v1/projects/${projectId}/join`, {
    method: "POST",
    token,
  });
}

export function submitAssignmentProof(assignmentId: string, input: SubmitAssignmentProofInput, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment>>(`/api/v1/assignments/${assignmentId}/proofs`, {
    method: "POST",
    token,
    body: input,
  });
}

export function getMyWallet(token: string) {
  return apiRequest<ApiEnvelope<BackendWalletSummary>>("/api/v1/wallet/me", {
    token,
  });
}

export function requestWalletWithdrawal(amountPaise: number, token: string) {
  return apiRequest<ApiEnvelope<BackendWalletTransaction>>("/api/v1/wallet/withdrawals", {
    method: "POST",
    token,
    body: { amount: amountPaise },
  });
}

export function listMyBugReports(token: string) {
  return apiRequest<ApiEnvelope<BackendBugReport[]>>("/api/v1/bug-reports/me", {
    token,
  });
}

export function submitProjectBugReport(projectId: string, input: SubmitBugReportInput, token: string) {
  return apiRequest<ApiEnvelope<BackendBugReport>>(`/api/v1/projects/${projectId}/bug-reports`, {
    method: "POST",
    token,
    body: input,
  });
}

export function getBackendHealth() {
  return apiRequest<{ status: "ok"; uptime: number }>("/health");
}

export function listProjects(token: string) {
  return apiRequest<ApiEnvelope<BackendProject[]>>("/api/v1/projects?limit=100", { token });
}

export function createClientProject(input: {
  package: BackendProject["package"];
  serviceType: BackendProject["serviceType"];
  serviceOption: string;
  requiredTesters?: number;
  requiredDeviceModels?: string[];
  appDetails: BackendProject["appDetails"];
}, token: string) {
  return apiRequest<ApiEnvelope<{ project: BackendProject; invoice: BackendInvoice | null }>>("/api/v1/projects", {
    method: "POST", token, body: input,
  });
}

export function listMyNotifications(token: string) {
  return apiRequest<ApiEnvelope<BackendNotification[]>>("/api/v1/notifications/me?limit=50", { token });
}

export function listAdminNotifications(token: string) {
  return apiRequest<ApiEnvelope<BackendNotification[]>>("/api/v1/notifications?limit=50", { token });
}

export function markNotificationRead(notificationId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendNotification>>(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
}

export function submitClientVerification(projectId: string, proofUrl: string, token: string) {
  return apiRequest<ApiEnvelope<BackendProject>>(`/api/v1/projects/${projectId}/verification/submit`, {
    method: "POST", token, body: { proofUrl },
  });
}

export function listInvoices(token: string) {
  return apiRequest<ApiEnvelope<BackendInvoice[]>>("/api/v1/invoices?limit=100", { token });
}

export function checkoutInvoice(invoiceId: string, token: string) {
  return apiRequest<ApiEnvelope<{ order: { id: string; amount: number; currency: string }; keyId: string }>>(`/api/v1/invoices/${invoiceId}/checkout`, {
    method: "POST", token,
  });
}

export function listAdminClients(token: string) {
  return apiRequest<ApiEnvelope<BackendClient[]>>("/api/v1/clients?limit=100", { token });
}

export function getMyClientProfile(token: string) {
  return apiRequest<ApiEnvelope<BackendClient>>("/api/v1/clients/me", { token });
}

export function updateMyClientProfile(input: { companyName?: string; contactName?: string; billingInfo?: { gstin?: string; billingAddress?: string } }, token: string) {
  return apiRequest<ApiEnvelope<BackendClient>>("/api/v1/clients/me", { method: "PATCH", token, body: input });
}

export function createAdminProject(input: {
  clientId: string;
  package: BackendProject["package"];
  serviceType: BackendProject["serviceType"];
  serviceOption: string;
  requiredTesters: number;
  requiredDeviceModels: string[];
  appDetails: BackendProject["appDetails"];
  paymentDisposition: "bypassed" | "pending" | "manual_paid";
  customAmount?: number;
}, token: string) {
  return apiRequest<ApiEnvelope<{ project: BackendProject; invoice: BackendInvoice | null }>>("/api/v1/projects/admin", { method: "POST", token, body: input });
}

export function updateCurrentLaunchOpsUser(input: { name?: string; phone?: string; profileCompleted?: true }, token: string) {
  return apiRequest<ApiEnvelope<CurrentUserResponse>>("/api/v1/users/me", { method: "PATCH", token, body: input });
}

export function getAdminDashboard(token: string) {
  return apiRequest<ApiEnvelope<AdminDashboardSummary>>("/api/v1/metrics/admin-dashboard", { token });
}

export function checkoutOnboardingTier(tierIndex: number, token: string) {
  return apiRequest<ApiEnvelope<{ order: { id: string; amount: number; currency: string }; keyId: string }>>("/api/v1/invoices/onboarding-checkout", {
    method: "POST", token, body: { tierIndex },
  });
}

export function verifyOnboardingPayment(input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, token: string) {
  return apiRequest<ApiEnvelope<{ verified: boolean; paymentId: string }>>("/api/v1/invoices/onboarding-checkout/verify", {
    method: "POST", token, body: input,
  });
}

export function listProjectBugReports(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendBugReport[]>>(`/api/v1/projects/${projectId}/bug-reports?limit=100`, { token });
}

export function listAdminTesters(token: string) {
  return apiRequest<ApiEnvelope<Array<Omit<BackendTesterProfile, "userId"> & { userId: LaunchOpsUser }>>>("/api/v1/testers?limit=100", { token });
}

export function listPublicTesterDirectory() {
  return apiRequest<ApiEnvelope<PublicTesterProfile[]>>("/api/v1/testers/directory");
}

export function listProjectAssignments(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment[]>>(`/api/v1/projects/${projectId}/queue?all=true`, { token });
}

export function getVerifiedProjectTesterEmails(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<{ emails: string[]; count: number }>>(`/api/v1/projects/${projectId}/verified-tester-emails`, { token });
}

export function listClientProjectAssignments(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment[]>>(`/api/v1/projects/${projectId}/client-assignments`, { token });
}

export function listProjectFiles(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendProjectFile[]>>(`/api/v1/projects/${projectId}/files`, { token });
}

export function listProjectArtifacts(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendProjectArtifacts>>(`/api/v1/projects/${projectId}/artifacts`, { token });
}

export function clearAdminProjectFiles(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<{ deleted: number }>>(`/api/v1/projects/${projectId}/files`, { method: "DELETE", token });
}

export function requestTestingFileUpload(filename: string, contentType: string, token: string) {
  return apiRequest<ApiEnvelope<{ uploadUrl: string; key: string; expiresIn: number }>>("/api/v1/uploads/presign", {
    method: "POST", token, body: { filename, contentType, scope: "testing-files" },
  });
}

export function uploadTesterProofFile(file: File, token: string) {
  const contentType = file.type || "application/octet-stream";
  return requestTestingFileUpload(file.name, contentType, token).then(async (presigned) => {
    const upload = await fetch(presigned.data.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!upload.ok) throw new Error("Proof upload failed.");
    return presigned.data.key;
  });
}

export function registerProjectFile(projectId: string, file: Omit<BackendProjectFile, "uploadedAt">, token: string) {
  return apiRequest<ApiEnvelope<BackendProjectFile>>(`/api/v1/projects/${projectId}/files`, { method: "POST", token, body: file });
}

export function getProjectFileDownload(key: string, token: string) {
  return apiRequest<ApiEnvelope<{ downloadUrl: string; expiresIn: number }>>(`/api/v1/uploads/presign-download?key=${encodeURIComponent(key)}`, { token });
}

export function createSupportTicket(input: { subject: string; message: string; projectId?: string; cc?: string[] }, token: string) {
  return apiRequest<ApiEnvelope<BackendSupportTicket>>("/api/v1/support-tickets", { method: "POST", token, body: input });
}

export function listMySupportTickets(token: string) {
  return apiRequest<ApiEnvelope<BackendSupportTicket[]>>("/api/v1/support-tickets?limit=100", { token });
}

export function replyToSupportTicket(ticketId: string, body: string, token: string) {
  return apiRequest<ApiEnvelope<BackendSupportTicket>>(`/api/v1/support-tickets/${ticketId}/messages`, {
    method: "POST", token, body: { body },
  });
}

export function updateSupportTicketStatus(ticketId: string, status: BackendSupportTicket["status"], token: string) {
  return apiRequest<ApiEnvelope<BackendSupportTicket>>(`/api/v1/support-tickets/${ticketId}/status`, {
    method: "PATCH", token, body: { status },
  });
}

export function assignTesterToProject(projectId: string, testerId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment>>(`/api/v1/projects/${projectId}/assignments`, { method: "POST", token, body: { testerId } });
}

export function listAdminWithdrawals(token: string) {
  return apiRequest<ApiEnvelope<BackendWalletTransaction[]>>("/api/v1/wallet/withdrawals?limit=100", { token });
}

export function reviewProjectVerification(projectId: string, approve: boolean, token: string, customAmount?: number) {
  return apiRequest<ApiEnvelope<unknown>>(`/api/v1/projects/${projectId}/verification/review`, {
    method: "POST", token, body: { approve, customAmount: customAmount ? rupeesToMinor(customAmount) : undefined },
  });
}

function rupeesToMinor(value: number) { return Math.round(value * 100); }

export function verifyAssignment(assignmentId: string, step: number, approve: boolean, token: string, reason?: string) {
  return apiRequest<ApiEnvelope<BackendAssignment>>(`/api/v1/assignments/${assignmentId}/verify`, {
    method: "POST", token, body: { step, approve, reason },
  });
}

export function replaceAssignment(assignmentId: string, token: string) {
  return apiRequest<ApiEnvelope<unknown>>(`/api/v1/assignments/${assignmentId}/replace`, { method: "POST", token });
}

export function mergeBugReports(canonicalId: string, duplicateId: string, token: string) {
  return apiRequest<ApiEnvelope<unknown>>("/api/v1/bug-reports/merge", {
    method: "POST", token, body: { canonicalId, duplicateIds: [duplicateId] },
  });
}

export function publishBugReport(id: string, token: string, adminNotes?: string) {
  return apiRequest<ApiEnvelope<unknown>>("/api/v1/bug-reports/publish", { method: "POST", token, body: { ids: [id], adminNotes } });
}

export function completeAdminWithdrawal(id: string, transactionId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendWalletTransaction>>(`/api/v1/wallet/withdrawals/${id}/complete`, {
    method: "POST", token, body: { transactionId },
  });
}

export function rejectAdminWithdrawal(id: string, reason: string, token: string) {
  return apiRequest<ApiEnvelope<BackendWalletTransaction>>(`/api/v1/wallet/withdrawals/${id}/reject`, {
    method: "POST", token, body: { reason },
  });
}

export function advanceProjectMilestone(projectId: string, step: number, token: string, optInUrl?: string) {
  const actions: Record<number, { path: string; body?: unknown }> = {
    2: { path: "submit-email-review" },
    3: { path: "confirm-email-review" },
    4: { path: "testers-invited", body: { optInUrl } },
    5: { path: "apply-production" },
    6: { path: "confirm-production-approved" },
  };
  const action = actions[step];
  if (!action) throw new Error(`No backend milestone action exists for step ${step}`);
  return apiRequest<ApiEnvelope<BackendProject>>(`/api/v1/projects/${projectId}/${action.path}`, {
    method: "POST", token, body: action.body,
  });
}

export function updateAdminTesterStatus(testerId: string, status: BackendTesterProfile["status"], token: string) {
  return apiRequest<ApiEnvelope<BackendTesterProfile>>(`/api/v1/testers/${testerId}/status`, {
    method: "PATCH", token, body: { status },
  });
}

export function promoteQueuedAssignment(assignmentId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendAssignment>>(`/api/v1/assignments/${assignmentId}/promote`, { method: "POST", token });
}

export function resendAdminNotification(notificationId: string, token: string) {
  return apiRequest<ApiEnvelope<BackendNotification>>(`/api/v1/notifications/${notificationId}/resend`, { method: "POST", token });
}

export type CompletionReport = {
  project: { id: string; appName: string; status: string };
  testerCompletionSummary: Array<{ testerId: unknown; status: string; currentStep: number }>;
  bugReports: BackendBugReport[];
  generatedAt: string;
};

export function getProjectCompletionReport(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<CompletionReport>>(`/api/v1/projects/${projectId}/completion-report`, { token });
}

export function updateProjectPlayIntegration(projectId: string, input: {
  mode?: "manual" | "api"; track?: "internal" | "closed"; packageName?: string;
  aabFileUrl?: string; serviceAccountLinked?: boolean; testerGoogleGroupEmail?: string;
}, token: string) {
  return apiRequest<ApiEnvelope<BackendProject>>(`/api/v1/projects/${projectId}/play-integration`, { method: "PATCH", token, body: input });
}

export function syncProjectPlayIntegration(projectId: string, token: string) {
  return apiRequest<ApiEnvelope<{ project: BackendProject; mode?: string }>>(`/api/v1/projects/${projectId}/sync-play-release`, { method: "POST", token });
}
