export interface TestApp {
  id: string;
  name: string;
  version: string;
  status: 'Draft' | 'Testing' | 'Completed';
  testersCount: number;
  bugsFound: number;
  launchDate: string;
  category: string;
  progress: number;
  testerPayout?: number;
  testingWindowEnded?: boolean;
    devices: string[];
  
  // Simulation & Workflow Extensions
  packageTier?: 'testers_only' | 'managed_testing' | 'launch_ready' | 'custom';
  serviceType?: 'ios_app_publishing' | 'play_store_closed_testing' | 'user_experience_testing';
  serviceOption?: string;
  packageName?: string;
  verificationRequired?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  invoiceStatus?: 'none' | 'awaiting_payment' | 'paid';
  testersRequired?: number;
  waitlistCount?: number;
  joinState?: 'open' | 'full' | 'closed';
  whatsappGroupLink?: string;
  optInUrl?: string;
  workflowSteps?: Array<{ order: number; type: string; state: string; deadline?: string }>;
  playIntegration?: {
    serviceAccountSet: boolean;
    packageName: string;
    mode?: 'manual' | 'api';
    track?: 'internal' | 'closed';
    aabFileUrl?: string;
    testerGoogleGroupEmail?: string;
    lastApiError?: string;
  };
  projectName?: string;
  apkUrl?: string;
  releaseNotes?: string;
  demoCredentials?: string;
  instructions?: string;
}

export interface BugReport {
  id: string;
  appId: string;
  appName: string;
  title: string;
  category?: 'UI/UX' | 'Crash' | 'Functionality' | 'Performance' | 'Other';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved';
  testerName: string;
  testerAvatar: string;
  device: string;
  osVersion: string;
  expectedResult?: string;
  actualResult?: string;
  reproductionSteps: string[];
  createdAt: string;
  isPublished?: boolean; // Admin publishing filter
  adminNotes?: string; // Admin notes added before publishing
  screenshot?: string; // Bug proof screenshot
  screenRecordingUrl?: string; // Bug proof video
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  packageTier: 'testers_only' | 'managed_testing' | 'launch_ready' | 'custom';
  status: 'active' | 'inactive';
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  issuedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string; // testerId or clientId
  type: 'reminder' | 'update' | 'alert';
  channel: 'in_app' | 'whatsapp' | 'email';
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Tester {
    id: string;
    name: string;
    email?: string;
  avatar: string;
  country: string;
    devices: string[];
    deviceDetails?: Array<{ model: string; androidVersion: string; fingerprint: string }>;
  bugsFoundCount: number;
  rating: number;
  specialty: string;
  status: 'Online' | 'Testing' | 'Idle';
  accountStatus?: 'active' | 'inactive' | 'suspended';
  
  // Wallet & Profile extensions
  upiId?: string;
  qrCodeUrl?: string;
  walletBalance: number;
  experience?: string;
  interests?: string[];
}

export interface TesterAssignment {
  id: string;
  testerId: string;
  projectId: string;
  appName: string;
  status: 'active' | 'queued' | 'completed';
  queuePosition?: number;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  testerEmail?: string; // Step 1: Google Play Email Address
  step1Screenshot?: string; // Step 1: Verification Profile screenshot
  step3Clicked: boolean; // Step 3: Play Store Invite click
  step3Screenshot?: string; // Step 3: Download/Installation screenshot proof
  step4CheckInsCompleted: number; // Derived count of submitted Step 4 proofs
  step4LastCheckIn?: string; // Date string
  step4Proof?: string; // Step 4: Testing-period completion proof
  pendingProofSteps?: number[];
  rejectedProofSteps?: number[];
  inactivityFlag: boolean;
  joinedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  testerId: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'completed' | 'rejected';
  transactionId?: string;
  rejectionReason?: string;
  createdAt: string;
  expectedCompletionAt: string; // 48h SLA
}

export interface Transaction {
  id: string;
  testerId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}

export interface AndroidDevice {
  id: string;
  name: string;
  brand: string;
  osVersion: string;
  screenSize: string;
  status: 'Available' | 'Active Test' | 'Maintenance';
}
