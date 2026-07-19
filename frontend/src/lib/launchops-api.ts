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
  userId: string;
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
  testerId: string;
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
  testerId: string;
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
