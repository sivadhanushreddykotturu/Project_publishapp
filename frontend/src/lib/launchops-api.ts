import { apiRequest } from "./api";

export type LaunchOpsRole = "client" | "tester";

export type LaunchOpsUser = {
  _id: string;
  clerkUserId: string;
  role: LaunchOpsRole | "admin";
  name: string;
  email: string;
  phone?: string;
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
    serviceAccountLinked?: boolean;
    lastApiError?: string;
  };
  verification?: {
    required: boolean;
    status: "not_required" | "pending" | "submitted" | "verified" | "rejected";
  };
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
  testerId: string | { _id: string; userId?: LaunchOpsUser };
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
  createdAt: string;
  updatedAt: string;
};

export type BackendNotification = {
  _id: string;
  type: "project_request" | "project_opportunity" | string;
  payload: { projectId?: string; appName?: string; joinPath?: string; requiredDeviceModels?: string[]; [key: string]: unknown };
  status: "queued" | "sent" | "failed";
  createdAt: string;
};

export type UpsertTesterProfileInput = {
  devices: BackendTesterDevice[];
  experienceLevel?: BackendTesterProfile["experienceLevel"];
  upi: {
    vpa: string;
    qrImageUrl?: string;
  };
};

export type SubmitAssignmentProofInput = {
  step: number;
  fileUrl: string;
  fileHash?: string;
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

export function publishBugReport(id: string, token: string) {
  return apiRequest<ApiEnvelope<unknown>>("/api/v1/bug-reports/publish", { method: "POST", token, body: { ids: [id] } });
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
