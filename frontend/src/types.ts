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
  devices: string[];
  
  // Simulation & Workflow Extensions
  packageTier?: 'testers_only' | 'managed_testing' | 'launch_ready' | 'custom';
  verificationRequired?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  invoiceStatus?: 'none' | 'awaiting_payment' | 'paid';
  testersRequired?: number;
  whatsappGroupLink?: string;
  optInUrl?: string;
  playIntegration?: {
    serviceAccountSet: boolean;
    packageName: string;
    lastApiError?: string;
  };
}

export interface BugReport {
  id: string;
  appId: string;
  appName: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Investigating' | 'Resolved';
  testerName: string;
  testerAvatar: string;
  device: string;
  osVersion: string;
  reproductionSteps: string[];
  createdAt: string;
  isPublished?: boolean; // Admin publishing filter
  screenshot?: string; // Bug proof screenshot
}

export interface Tester {
  id: string;
  name: string;
  avatar: string;
  country: string;
  devices: string[];
  bugsFoundCount: number;
  rating: number;
  specialty: string;
  status: 'Online' | 'Testing' | 'Idle';
  
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
  step4CheckInsCompleted: number; // Step 4: 0 to 14 days
  step4LastCheckIn?: string; // Date string
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
