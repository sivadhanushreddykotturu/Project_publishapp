import type { BugReport, TestApp, Tester, TesterAssignment, Transaction, WithdrawalRequest } from "../types";
import type {
  BackendAssignment,
  BackendBugReport,
  BackendProject,
  BackendTesterProfile,
  BackendWalletSummary,
  BackendWalletTransaction,
  LaunchOpsUser,
} from "./launchops-api";

const STEP_MIN = 1;
const STEP_MAX = 6;

function objectId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value && typeof value._id === "string") return value._id;
  return "";
}

function formatDate(value?: string, fallback = "") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function paiseToRupees(value: number) {
  return value / 100;
}

export function rupeesToPaise(value: number) {
  return Math.round(value * 100);
}

function projectStatusToDashboardStatus(status: BackendProject["status"]): TestApp["status"] {
  if (status === "completed") return "Completed";
  if (status === "active" || status === "full") return "Testing";
  return "Draft";
}

function projectProgress(project: BackendProject) {
  const steps = project.steps ?? [];
  if (steps.length === 0) return project.status === "completed" ? 100 : 0;
  const verified = steps.filter((step) => step.state === "verified").length;
  return Math.round((verified / steps.length) * 100);
}

export function mapProject(project: BackendProject): TestApp {
  return {
    id: project._id,
    name: project.appDetails.appName,
    version: project.appDetails.packageName ?? "1.0",
    status: projectStatusToDashboardStatus(project.status),
    testersCount: project.activeTesterCount,
    bugsFound: 0,
    launchDate: formatDate(project.createdAt, "Not scheduled"),
    category: project.package.replace(/_/g, " "),
    progress: projectProgress(project),
    devices: project.requiredDeviceModels ?? [],
    packageTier: project.package,
    verificationRequired: project.verification?.required ?? false,
    verificationStatus:
      project.verification?.status === "verified"
        ? "approved"
        : project.verification?.status === "rejected"
          ? "rejected"
          : project.verification?.required
            ? "pending"
            : "none",
    invoiceStatus: project.status === "awaiting_payment" ? "awaiting_payment" : project.status === "active" ? "paid" : "none",
    testersRequired: project.requiredTesters,
    waitlistCount: project.waitlistCount,
    joinState: project.joinState,
    optInUrl: project.playIntegration?.optInUrl,
    playIntegration: {
      serviceAccountSet: Boolean(project.playIntegration?.serviceAccountLinked),
      packageName: project.playIntegration?.packageName ?? project.appDetails.packageName ?? "",
      lastApiError: project.playIntegration?.lastApiError,
    },
  };
}

export function mapTesterProfile(profile: BackendTesterProfile, user: LaunchOpsUser): Tester {
  const devices = profile.devices.map((device) => device.model);

  return {
    id: profile._id,
    name: user.name,
    avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}`,
    country: "India",
    devices,
    bugsFoundCount: 0,
    rating: profile.ratingAvg || 0,
    specialty: `${profile.experienceLevel[0].toUpperCase()}${profile.experienceLevel.slice(1)} tester`,
    status: profile.status === "active" ? "Online" : "Idle",
    upiId: profile.upi?.vpa ?? "",
    qrCodeUrl: profile.upi?.qrImageUrl,
    walletBalance: paiseToRupees(profile.walletBalance),
    experience: profile.experienceLevel,
  };
}

export function mapAssignment(assignment: BackendAssignment, user?: LaunchOpsUser): TesterAssignment {
  const project = typeof assignment.projectId === "object" ? assignment.projectId : null;
  const proofs = assignment.proofs ?? [];
  const step1Proof = [...proofs].reverse().find((proof) => proof.step === 1);
  const step3Proof = [...proofs].reverse().find((proof) => proof.step === 3);
  const step4Proof = [...proofs].reverse().find((proof) => proof.step === 4);
  const backendStep = Math.min(STEP_MAX, Math.max(STEP_MIN, assignment.currentStep));
  const displayStep = backendStep === 1 && step1Proof?.status === "pending" ? 2 : backendStep;
  const currentStep = displayStep as TesterAssignment["currentStep"];

  return {
    id: assignment._id,
    testerId: objectId(assignment.testerId),
    projectId: project?._id ?? objectId(assignment.projectId),
    appName: project?.appDetails.appName ?? "Project",
    status: assignment.status === "removed" ? "completed" : assignment.status,
    queuePosition: assignment.queuePosition,
    currentStep,
    testerEmail: user?.email,
    step1Screenshot: step1Proof?.fileUrl,
    step3Clicked: Boolean(step3Proof),
    step3Screenshot: step3Proof?.fileUrl,
    step4CheckInsCompleted: proofs.filter((proof) => proof.step === 4).length,
    step4Proof: step4Proof?.fileUrl,
    inactivityFlag: assignment.inactivityFlag,
    joinedAt: formatDate(assignment.assignedAt ?? assignment.createdAt, "Joined"),
  };
}

export function mapWallet(summary: BackendWalletSummary, testerId: string) {
  const withdrawals: WithdrawalRequest[] = [];
  const transactions: Transaction[] = [];

  summary.history.forEach((item) => {
    if (item.type === "withdrawal") {
      withdrawals.push(mapWithdrawal(item, testerId));
    }
    transactions.push(mapTransaction(item, testerId));
  });

  return { withdrawals, transactions };
}

export function mapWithdrawal(item: BackendWalletTransaction, testerId: string): WithdrawalRequest {
  const status: WithdrawalRequest["status"] =
    item.status === "paid" ? "completed" : item.status === "rejected" ? "rejected" : "pending";

  return {
    id: item._id,
    testerId,
    amount: paiseToRupees(item.amount),
    upiId: "",
    status,
    transactionId: item.transactionId,
    rejectionReason: item.status === "rejected" ? item.note : undefined,
    createdAt: formatDate(item.createdAt, "Requested"),
    expectedCompletionAt: formatDate(item.expectedCompletionAt, "Pending"),
  };
}

export function mapTransaction(item: BackendWalletTransaction, testerId: string): Transaction {
  return {
    id: item._id,
    testerId,
    amount: paiseToRupees(item.amount),
    type: item.type === "earning" ? "credit" : "debit",
    description: item.note ?? (item.type === "earning" ? "Testing payout credited" : "UPI cashout requested"),
    createdAt: formatDate(item.createdAt, "Recent"),
  };
}

export function mapBugReport(report: BackendBugReport, tester: Tester): BugReport {
  const project = typeof report.projectId === "object" ? report.projectId : null;
  const severity = `${report.severity[0].toUpperCase()}${report.severity.slice(1)}` as BugReport["severity"];

  return {
    id: report._id,
    appId: project?._id ?? objectId(report.projectId),
    appName: project?.appDetails.appName ?? "Project",
    title: report.title,
    severity,
    status: report.status === "open" ? "Open" : report.status === "published" ? "Resolved" : "Investigating",
    testerName: tester.name,
    testerAvatar: tester.avatar,
    device: report.device,
    osVersion: report.appVersion ?? "Android",
    reproductionSteps: report.stepsToReproduce,
    createdAt: formatDate(report.createdAt, "Recent"),
    isPublished: report.status === "published",
    screenshot: report.attachments[0],
  };
}
