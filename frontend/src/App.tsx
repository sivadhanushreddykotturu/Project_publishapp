"use client";

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TestApp, BugReport, Tester, TesterAssignment, WithdrawalRequest, Transaction } from './types';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SolutionsScreen from './components/SolutionsScreen';
import PricingScreen from './components/PricingScreen';
import ResourcesScreen from './components/ResourcesScreen';
import TesterDashboard from './components/TesterDashboard';
import WatchWorksModal from './components/WatchWorksModal';
import HowItWorks from './components/HowItWorks';
import BuiltForEveryone from './components/BuiltForEveryone';
import Testimonials from './components/Testimonials';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import AuthScreen from './components/AuthScreen';
import ClientDashboard from './components/ClientDashboard';
import ClientFlowManager from './components/client-flow/ClientFlowManager';
import AdminConsole from './components/AdminConsole';

import { MapPin, Users, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  advanceProjectMilestone, assignTesterToProject, checkoutInvoice, checkoutOnboardingTier, verifyOnboardingPayment, completeAdminWithdrawal, createClientProject,
  getCurrentLaunchOpsUser, getMyTesterProfile, getMyWallet, joinTesterProject, getAdminDashboard, updateCurrentLaunchOpsUser,
  listAdminTesters, listAdminWithdrawals, listInvoices, listMyAssignments, listMyBugReports,
  listMyNotifications, markNotificationRead, listMySupportTickets, replyToSupportTicket, updateSupportTicketStatus,
  listProjectAssignments, listProjectBugReports, listProjects, listTesterOpportunities,
  listClientProjectAssignments, listProjectFiles, clearAdminProjectFiles, requestTestingFileUpload, uploadTesterProofFile, registerProjectFile, getProjectFileDownload, createSupportTicket, getVerifiedProjectTesterEmails,
  mergeBugReports, publishBugReport, rejectAdminWithdrawal, replaceAssignment,
  requestWalletWithdrawal, reviewProjectVerification, submitAssignmentProof,
  submitClientVerification, submitProjectBugReport, updateMyTesterProfile, verifyAssignment,
  updateAdminTesterStatus, promoteQueuedAssignment, resendAdminNotification, getProjectCompletionReport,
  updateProjectPlayIntegration, syncProjectPlayIntegration,
  listAdminClients, createAdminProject, getMyClientProfile, updateMyClientProfile, listProjectArtifacts,
  type BackendInvoice, type BackendNotification, type BackendTesterProfile, type BackendProjectFile, type BackendClient, type LaunchOpsUser, type AdminDashboardSummary, type BackendSupportTicket,
} from './lib/launchops-api';
import {
  mapAssignment, mapBugReport, mapProject, mapTesterProfile, mapWallet, mapWithdrawal,
  paiseToRupees, rupeesToPaise,
} from './lib/launchops-mappers';
import { API_BASE_URL } from './lib/api';

const emptyTester: Tester = { id: '', name: 'Tester', avatar: '', country: 'India', devices: [], bugsFoundCount: 0, rating: 0, specialty: 'General Testing', status: 'Idle', upiId: '', walletBalance: 0 };

type AuthScreenRenderProps = {
  isDarkMode: boolean;
  initialRole?: 'tester' | 'client';
  onLoginSuccess: (name: string, role: 'tester' | 'client' | 'admin') => void;
  onBackToHome: () => void;
};

type AppProps = {
  getAuthToken?: () => Promise<string | null>;
  onSignOut?: () => Promise<void>;
  renderAuthScreen?: (props: AuthScreenRenderProps) => ReactNode;
};

function DashboardLoadingScreen({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${isDarkMode ? 'bg-[#09090B]' : 'bg-slate-50'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Loading your workspace
        </p>
      </div>
    </div>
  );
}

export default function App({ getAuthToken, onSignOut, renderAuthScreen }: AppProps = {}) {
  // Data version guard — bump this whenever mock data schema changes to clear stale localStorage
  const DATA_VERSION = 'v2';
  if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem('launchops_data_version');
    if (storedVersion !== DATA_VERSION) {
      ['launchops_apps', 'launchops_bugs', 'launchops_assignments',
       'launchops_withdrawals', 'launchops_transactions', 'launchops_active_tester'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('launchops_data_version', DATA_VERSION);
    }
  }

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [initialSubTab, setInitialSubTab] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const storedRole = localStorage.getItem('launchops_user_role')?.toLowerCase();
      if (parts.length > 0) {
        let mainTab = parts[0];
        if (storedRole === 'tester' && (mainTab === 'client' || mainTab === 'wizard')) {
          mainTab = 'tester';
          window.history.replaceState(null, '', '/tester');
        } else if (storedRole === 'client' && mainTab === 'tester') {
          mainTab = 'client';
          window.history.replaceState(null, '', '/client');
        }

        if (mainTab === 'wizard') {
          setCurrentTab('client');
          setInitialSubTab('new-app');
        } else if (mainTab === 'client') {
          setCurrentTab('client');
          if (parts[1] === 'wizard' || parts[1] === 'new-app') {
            setInitialSubTab('new-app');
          } else if (parts[1]) {
            setInitialSubTab(parts[1]);
          }
        } else if (['home', 'auth', 'tester', 'client', 'admin', 'solutions', 'resources', 'pricing', 'company'].includes(mainTab)) {
          setCurrentTab(mainTab);
          if (parts[1]) {
            setInitialSubTab(mainTab === 'tester' ? parts.slice(1).join('/') : parts[1]);
          }
        }
      } else {
        // Root path "/" ALWAYS defaults to home marketing page — never force redirect to tester dashboard
        setCurrentTab('home');
        setInitialSubTab('');
        localStorage.removeItem('launchops_current_tab');
      }

      const handlePopState = () => {
        const subparts = window.location.pathname.split('/').filter(Boolean);
        const p = subparts[0] || 'home';
        if (p === 'wizard') {
          setCurrentTab('client');
          setInitialSubTab('new-app');
        } else if (p === 'client' && (subparts[1] === 'wizard' || subparts[1] === 'new-app')) {
          setCurrentTab('client');
          setInitialSubTab('new-app');
        } else if (['home', 'auth', 'tester', 'client', 'admin', 'solutions', 'resources', 'pricing', 'company'].includes(p)) {
          setCurrentTab(p);
          if (subparts[1]) {
            setInitialSubTab(p === 'tester' ? subparts.slice(1).join('/') : subparts[1]);
          } else {
            setInitialSubTab('');
          }
        } else {
          setCurrentTab('home');
          setInitialSubTab('');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const handleSetTab = (tab: string, subtab?: string) => {
    if (tab === 'home') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('launchops_current_tab');
        window.location.href = '/';
      }
      return;
    }
    setCurrentTab(tab);
    setInitialSubTab(subtab || '');
    if (typeof window !== 'undefined') {
      if (tab === 'solutions' || tab === 'pricing' || tab === 'resources' || tab === 'company') {
        localStorage.removeItem('launchops_current_tab');
      } else {
        localStorage.setItem('launchops_current_tab', tab);
      }
      
      const targetPath = '/' + tab + (subtab ? '/' + subtab : '');
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  // Theme State (Dark vs Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('launchops_darkmode');
      return savedTheme ? savedTheme === 'true' : false;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('launchops_darkmode', String(next));
      }
      return next;
    });
  };

  // Core Data States with robust key deduplication
  const [apps, setApps] = useState<TestApp[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [invoices, setInvoices] = useState<BackendInvoice[]>([]);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<LaunchOpsUser | null>(null);
  const [currentClient, setCurrentClient] = useState<BackendClient | null>(null);

  // Tester Flow Data States
  const [activeTester, setActiveTester] = useState<Tester>(emptyTester);
  const [adminTesters, setAdminTesters] = useState<Tester[]>([]);
  const [adminClients, setAdminClients] = useState<BackendClient[]>([]);

  const [assignments, setAssignments] = useState<TesterAssignment[]>([]);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardSummary | null>(null);
  const [supportTickets, setSupportTickets] = useState<BackendSupportTicket[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals Controller State
  const [isWatchWorksOpen, setIsWatchWorksOpen] = useState(false);

  const getTokenOrThrow = async () => {
    const token = await getAuthToken?.();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    return token;
  };

  const refreshTesterData = async () => {
    const token = await getTokenOrThrow();
    const me = await getCurrentLaunchOpsUser(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('launchops_user_role', me.data.user.role);
    }
    if (me.data.user.role === 'client') {
      handleSetTab('client');
      return;
    }
    if (me.data.user.role === 'admin') {
      handleSetTab('admin');
      return;
    }
    const [profileResponse, opportunities, assignmentResponse, walletResponse, bugResponse, notificationResponse, supportResponse] = await Promise.all([
      getMyTesterProfile(token), listTesterOpportunities(token),
      listMyAssignments(token), getMyWallet(token), listMyBugReports(token), listMyNotifications(token), listMySupportTickets(token),
    ]);
    const tester = mapTesterProfile(profileResponse.data, me.data.user);
    const wallet = mapWallet(walletResponse.data, tester.id);
    tester.walletBalance = paiseToRupees(walletResponse.data.balance);
    tester.bugsFoundCount = bugResponse.data.length;
    const projectMap = new Map(opportunities.data.map((project) => [project._id, mapProject(project)]));
    assignmentResponse.data.forEach((assignment) => {
      if (typeof assignment.projectId === 'object') projectMap.set(assignment.projectId._id, mapProject(assignment.projectId));
    });
    setActiveTester(tester);
    setApps([...projectMap.values()]);
    setAssignments(assignmentResponse.data.map((assignment) => mapAssignment(assignment, me.data.user)));
    setWithdrawals(wallet.withdrawals);
    setTransactions(wallet.transactions);
    setBugs(bugResponse.data.map((report) => mapBugReport(report, tester)));
    setNotifications(notificationResponse.data);
    setSupportTickets(supportResponse.data);
  };

  const refreshClientData = async () => {
    const token = await getTokenOrThrow();
    const me = await getCurrentLaunchOpsUser(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('launchops_user_role', me.data.user.role);
    }
    if (me.data.user.role === 'tester') {
      handleSetTab('tester');
      return;
    }
    if (me.data.user.role === 'admin') {
      handleSetTab('admin');
      return;
    }
    const [clientResponse, projectResponse, invoiceResponse, notificationResponse, supportResponse] = await Promise.all([
      getMyClientProfile(token), listProjects(token), listInvoices(token), listMyNotifications(token), listMySupportTickets(token),
    ]);
    setCurrentUser(me.data.user);
    setCurrentClient(clientResponse.data);
    const projectBugs = await Promise.all(projectResponse.data.map((project) => listProjectBugReports(project._id, token)));
    const clientTester = { ...emptyTester, name: 'Verified tester' };
    const allBugs = projectBugs.flatMap((response) => response.data.map((report) => mapBugReport(report, clientTester)));
    const invoiceByProject = new Map(invoiceResponse.data.filter((invoice) => invoice.projectId).map((invoice) => [invoice.projectId!, invoice]));
    setApps(projectResponse.data.map((project) => {
      const mapped = mapProject(project);
      const invoice = invoiceByProject.get(project._id);
      mapped.invoiceStatus = invoice?.status === 'paid' || invoice?.status === 'manual_paid' ? 'paid' : invoice ? 'awaiting_payment' : mapped.invoiceStatus;
      mapped.bugsFound = allBugs.filter((bug) => bug.appId === project._id).length;
      return mapped;
    }));
    setInvoices(invoiceResponse.data);
    setBugs(allBugs);
    setNotifications(notificationResponse.data);
    setSupportTickets(supportResponse.data);
  };

  const refreshAdminData = async () => {
    const token = await getTokenOrThrow();
    const me = await getCurrentLaunchOpsUser(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('launchops_user_role', me.data.user.role);
    }
    if (me.data.user.role === 'tester') {
      handleSetTab('tester');
      return;
    }
    if (me.data.user.role === 'client') {
      handleSetTab('client');
      return;
    }
    const [projectResponse, testerResponse, clientResponse, withdrawalResponse, notificationResponse, dashboardResponse, supportResponse] = await Promise.all([
      listProjects(token), listAdminTesters(token), listAdminClients(token), listAdminWithdrawals(token), listMyNotifications(token), getAdminDashboard(token), listMySupportTickets(token),
    ]);
    setCurrentUser(me.data.user);
    const testers = testerResponse.data.map((profile) => mapTesterProfile(profile as BackendTesterProfile, profile.userId));
    const [queueResponses, bugResponses] = await Promise.all([
      Promise.all(projectResponse.data.map((project) => listProjectAssignments(project._id, token))),
      Promise.all(projectResponse.data.map((project) => listProjectBugReports(project._id, token))),
    ]);
    const mappedAssignments = queueResponses.flatMap((response) => response.data.map((assignment) => mapAssignment(assignment)));
    const mappedBugs = bugResponses.flatMap((response, projectIndex) => response.data.map((report) => {
      const testerId = typeof report.testerId === 'string' ? report.testerId : '';
      return {
        ...mapBugReport(report, testers.find((tester) => tester.id === testerId) ?? { ...emptyTester, name: 'Tester' }),
        appId: projectResponse.data[projectIndex]._id,
        appName: projectResponse.data[projectIndex].appDetails.appName,
      };
    }));
    setApps(projectResponse.data.map((project) => ({ ...mapProject(project), bugsFound: mappedBugs.filter((bug) => bug.appId === project._id).length })));
    setAdminTesters(testers);
    setAdminClients(clientResponse.data);
    setAssignments(mappedAssignments);
    setBugs(mappedBugs);
    setWithdrawals(withdrawalResponse.data.map((item) => mapWithdrawal(item, typeof item.testerId === 'string' ? item.testerId : item.testerId._id)));
    setNotifications(notificationResponse.data);
    setAdminDashboard(dashboardResponse.data);
    setSupportTickets(supportResponse.data);
  };

  const refreshCurrentDashboard = async () => {
    setDashboardError('');
    setDashboardLoading(true);
    try {
      if (currentTab === 'tester') await refreshTesterData();
      if (currentTab === 'client') await refreshClientData();
      if (currentTab === 'admin') await refreshAdminData();
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not load dashboard data.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (['tester', 'client', 'admin'].includes(currentTab)) void refreshCurrentDashboard();
  }, [currentTab]);

  const handleUpdateTesterProfile = (updated: Partial<Tester>) => {
    setActiveTester(prev => ({
      ...prev,
      ...updated
    }));
  };

  const handleJoinProject = (projectId: string) => {
    const exists = assignments.some(a => a.projectId === projectId && a.testerId === activeTester.id);
    if (exists) return;

    const project = apps.find(p => p.id === projectId);
    if (!project) return;

    const joinedCount = assignments.filter(a => a.projectId === projectId && a.status === 'active').length;
    const required = project.testersRequired || 14;
    const isFull = joinedCount >= required;

    const newAssignment: TesterAssignment = {
      id: `assign-${Date.now()}`,
      testerId: activeTester.id,
      projectId: projectId,
      appName: project.name,
      status: isFull ? 'queued' : 'active',
      queuePosition: isFull ? assignments.filter(a => a.projectId === projectId && a.status === 'queued').length + 1 : undefined,
      currentStep: 1,
      step3Clicked: false,
      step4CheckInsCompleted: 0,
      inactivityFlag: false,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setAssignments(prev => [...prev, newAssignment]);

    if (!isFull) {
      setApps(prev => prev.map(p => p.id === projectId ? { ...p, testersCount: p.testersCount + 1 } : p));
    }
  };

  const handleSubmitStep1Email = (assignmentId: string, email: string, screenshotUrl?: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          testerEmail: email,
          step1Screenshot: screenshotUrl || 'google-profile.png'
        };
      }
      return a;
    }));

    // Credit ₹50
    setActiveTester(prev => ({
      ...prev,
      walletBalance: prev.walletBalance + 50
    }));

    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        testerId: activeTester.id,
        amount: 50,
        type: 'credit',
        description: `Registered Google Play email address for ${assignments.find(a => a.id === assignmentId)?.appName}`,
        createdAt: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  const handleApproveTesterStep1 = (projectId: string, testerId: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.projectId === projectId && a.testerId === testerId) {
        return {
          ...a,
          currentStep: 2 // Advance to Google Email Review!
        };
      }
      return a;
    }));
  };

  const handleClickStep3Link = (assignmentId: string, screenshotUrl?: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        // If screenshot provided, advance to step 4
        if (screenshotUrl) {
          return {
            ...a,
            currentStep: 4,
            step3Clicked: true,
            step3Screenshot: screenshotUrl
          };
        }
        // First click: just mark link as clicked, stay on step 3 so user can upload screenshot
        return {
          ...a,
          step3Clicked: true
        };
      }
      return a;
    }));
  };

  const handleLogStep4CheckIn = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const nextCheckIns = assignment.step4CheckInsCompleted + 1;
    const isCompleted = nextCheckIns >= 14;

    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          step4CheckInsCompleted: nextCheckIns,
          currentStep: isCompleted ? 5 : 4,
          status: isCompleted ? 'active' : a.status
        };
      }
      return a;
    }));

    if (isCompleted) {
      // Completed payout: ₹500
      setActiveTester(prev => ({
        ...prev,
        walletBalance: prev.walletBalance + 500
      }));

      setTransactions(prev => [
        {
          id: `tx-${Date.now()}`,
          testerId: activeTester.id,
          amount: 500,
          type: 'credit',
          description: `14-Day closed testing track completed for ${assignment.appName}`,
          createdAt: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    } else {
      // Daily check-in: ₹50
      setActiveTester(prev => ({
        ...prev,
        walletBalance: prev.walletBalance + 50
      }));

      setTransactions(prev => [
        {
          id: `tx-${Date.now()}`,
          testerId: activeTester.id,
          amount: 50,
          type: 'credit',
          description: `Logged Day ${nextCheckIns} test check-in for ${assignment.appName}`,
          createdAt: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    }
  };

  const handleSubmitBugReport = async (
    bugReport: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }
  ) => {
    const nextBug: BugReport = {
      ...bugReport,
      id: `bug-${Date.now()}`,
      createdAt: 'Just now',
      testerName: activeTester.name,
      testerAvatar: activeTester.avatar,
      screenshot: bugReport.screenshot,
    };
    setBugs((previous) => [nextBug, ...previous]);
  };

  const handleRequestWithdrawal = async (amount: number, upiId: string) => {
    if (amount > activeTester.walletBalance) {
      return { success: false, error: 'Amount exceeds balance' };
    }

    if (amount <= 0) return { success: false, error: 'Enter a valid amount' };
    setActiveTester((tester) => ({ ...tester, upiId }));
    setWithdrawals((previous) => [{
      id: `withdrawal-${Date.now()}`,
      testerId: activeTester.id,
      amount,
      upiId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expectedCompletionAt: 'Within 3 business days',
    }, ...previous]);
    return { success: true };
  };

  const handleSimulateAdminAdvanceStep = (assignmentId: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const nextStep = a.currentStep + 1;
        const isFinished = nextStep > 6;
        return {
          ...a,
          currentStep: isFinished ? 6 : (nextStep as any),
          status: isFinished ? 'completed' : a.status
        };
      }
      return a;
    }));
  };

  const handleSimulateFastForwardDay = (assignmentId: string) => {
    handleLogStep4CheckIn(assignmentId);
  };

  // Client Onboarding / Create project handler
  const handleCreateProject = (projectData: Omit<TestApp, 'id' | 'testersCount' | 'bugsFound' | 'progress' | 'status'>) => {
    const isTestersOnly = projectData.packageTier === 'testers_only';
    const newProj: TestApp = {
      ...projectData,
      id: `app-${Date.now()}`,
      testersCount: 0,
      bugsFound: 0,
      progress: 0,
      status: 'Draft',
      verificationRequired: !isTestersOnly,
      verificationStatus: isTestersOnly ? 'none' : 'pending',
      invoiceStatus: isTestersOnly ? 'awaiting_payment' : 'none'
    };
    setApps(prev => [...prev, newProj]);
  };

  // Client Submit Verification proof screenshot handler
  const handleSubmitVerification = (projectId: string, proofUrl: string) => {
    setApps(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          verificationStatus: 'pending',
          whatsappGroupLink: proofUrl // store screenshot url in this field dynamically for MVP preview
        };
      }
      return p;
    }));
  };

  // Client simulated invoice Razorpay checkout payment handler
  const handlePayInvoice = (projectId: string) => {
    setApps(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          invoiceStatus: 'paid',
          status: 'Testing',
          progress: 16.6 // Immediately start step 1: Verification
        };
      }
      return p;
    }));
  };

  // Admin Approve Verification proof screenshot handler
  const handleApproveVerification = (projectId: string, customAmount?: number) => {
    setApps(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          verificationStatus: 'approved',
          invoiceStatus: 'awaiting_payment',
          whatsappGroupLink: customAmount ? `Custom price set: ₹${customAmount}` : p.whatsappGroupLink
        };
      }
      return p;
    }));
  };

  // Admin Reject Verification proof screenshot handler
  const handleRejectVerification = (projectId: string) => {
    setApps(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          verificationStatus: 'rejected'
        };
      }
      return p;
    }));
  };

  // Admin advance project-level step workflow milestones handler
  const handleAdvanceMilestone = (projectId: string, step: number, payload?: any) => {
    setApps(prev => prev.map(p => {
      if (p.id === projectId) {
        const nextProgress = Math.min(step * 16.6, 100);
        return {
          ...p,
          progress: nextProgress,
          optInUrl: payload?.optInUrl || p.optInUrl,
          status: step === 6 ? 'Completed' : p.status
        };
      }
      return p;
    }));

    // Advance all testers assigned to this project to the designated step
    setAssignments(prev => prev.map(a => {
      if (a.projectId === projectId) {
        return {
          ...a,
          currentStep: step as any,
          status: step === 6 ? 'completed' : a.status
        };
      }
      return a;
    }));
  };

  // Admin replace inactive tester with queued tester
  const handleReplaceTester = (assignmentId: string) => {
    const targetAssignment = assignments.find(a => a.id === assignmentId);
    if (!targetAssignment) return;

    // Set target assignment status to completed/removed
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));

    // Promote first queued tester for this project
    setAssignments(prev => {
      const projectQueue = prev.filter(a => a.projectId === targetAssignment.projectId && a.status === 'queued');
      if (projectQueue.length > 0) {
        const firstInQueue = projectQueue[0];
        return prev.map(a => {
          if (a.id === firstInQueue.id) {
            return { ...a, status: 'active', queuePosition: undefined };
          }
          return a;
        });
      }
      return prev;
    });
  };

  const handleAddTesterToProject = (projectId: string, testerId: string) => {
    const proj = apps.find(p => p.id === projectId);
    if (!proj) return;

    const newAssignment: TesterAssignment = {
      id: `ass-${Date.now()}`,
      projectId,
      testerId,
      appName: proj.name,
      currentStep: 1,
      status: 'active',
      step3Clicked: false,
      step4CheckInsCompleted: 0,
      inactivityFlag: false,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setAssignments(prev => [...prev, newAssignment]);
    setApps(prev => prev.map(p => p.id === projectId ? { ...p, testersCount: p.testersCount + 1 } : p));
  };

  const handleRemoveTesterFromProject = (projectId: string, testerId: string) => {
    setAssignments(prev => prev.filter(a => !(a.projectId === projectId && a.testerId === testerId)));
    setApps(prev => prev.map(p => p.id === projectId ? { ...p, testersCount: Math.max(0, p.testersCount - 1) } : p));
  };

  // Admin merge duplicate bug reports
  const handleMergeBugs = (canonicalId: string, duplicateId: string) => {
    setBugs(prev => prev.map(b => {
      if (b.id === duplicateId) {
        return { ...b, status: 'Resolved', title: `[Duplicate of ${canonicalId.slice(-6)}] ${b.title}` };
      }
      return b;
    }));
  };

  // Admin publish bug report to client dashboard
  const handlePublishBug = (bugId: string, adminNotes?: string) => {
    setBugs(prev => prev.map(b => {
      if (b.id === bugId) {
        return { ...b, isPublished: true, adminNotes };
      }
      return b;
    }));
  };

  // Admin Complete UPI Payout Cashout Request
  const handleCompleteWithdrawal = (withdrawalId: string, txnId: string) => {
    setWithdrawals(prev => prev.map(w => {
      if (w.id === withdrawalId) {
        return { ...w, status: 'completed', transactionId: txnId };
      }
      return w;
    }));
  };

  // Admin Reject UPI Payout Cashout Request
  const handleRejectWithdrawal = (withdrawalId: string, reason: string) => {
    setWithdrawals(prev => prev.map(w => {
      if (w.id === withdrawalId) {
        return { ...w, status: 'rejected', rejectionReason: reason };
      }
      return w;
    }));
  };

  const isDashboard = ['tester', 'client', 'admin'].includes(currentTab);
  const isTesterExperience = currentTab === 'tester';

  const handleLogout = async () => {
    localStorage.removeItem('launchops_current_tab');
    localStorage.removeItem('launchops_user_role');
    sessionStorage.removeItem('launchops_intended_role');
    setApps([]);
    setAssignments([]);
    setBugs([]);
    setInvoices([]);
    setWithdrawals([]);
    setTransactions([]);
    setNotifications([]);
    setActiveTester(emptyTester);
    setDashboardLoading(true);
    setCurrentTab('home');
    setInitialSubTab('');

    try {
      await onSignOut?.();
      // Navigate only after sign-out finishes; leaving earlier can cancel the request and keep the session alive.
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Could not sign out. Please try again.');
    }
  };

  const apiUpdateTesterProfile = async (updated: Partial<Tester>) => {
    const token = await getTokenOrThrow();
    const models = updated.devices ?? activeTester.devices;
    await updateMyTesterProfile({
      devices: models.map((model, index) => {
        const existing = activeTester.deviceDetails?.find((device) => device.model === model);
        return existing ?? { model, androidVersion: 'Unknown', fingerprint: `${activeTester.id || 'tester'}-${index}-${model.replace(/\W+/g, '-').toLowerCase()}` };
      }),
      experienceLevel: (updated.experience ?? activeTester.experience ?? 'beginner') as 'beginner' | 'intermediate' | 'expert',
      country: updated.country ?? activeTester.country,
      specialty: updated.specialty ?? activeTester.specialty,
      upi: { vpa: updated.upiId ?? activeTester.upiId },
    }, token);
    await refreshTesterData();
  };

  const apiJoinProject = async (projectId: string) => {
    setDashboardError('');
    try {
      await joinTesterProject(projectId, await getTokenOrThrow());
      await refreshTesterData();
    } catch (error) {
      await refreshTesterData().catch(() => undefined);
      setDashboardError(error instanceof Error ? error.message : 'Unable to join this project.');
    }
  };
  const apiMarkNotificationRead = async (notificationId: string) => {
    setNotifications((items) => items.map((item) => item._id === notificationId ? { ...item, readAt: new Date().toISOString() } : item));
    try {
      await markNotificationRead(notificationId, await getTokenOrThrow());
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Unable to mark notification as read.');
    }
  };
  const apiSubmitStep1 = async (assignmentId: string, email: string, screenshotUrl?: string) => { await submitAssignmentProof(assignmentId, { step: 1, fileUrl: screenshotUrl || email, googlePlayEmail: email }, await getTokenOrThrow()); await refreshTesterData(); };
  const apiSubmitStep3 = async (assignmentId: string, screenshotUrl?: string) => {
    if (!screenshotUrl) { window.open(`${API_BASE_URL}/t/${assignmentId}`, '_blank', 'noopener,noreferrer'); return; }
    await submitAssignmentProof(assignmentId, { step: 3, fileUrl: screenshotUrl }, await getTokenOrThrow()); await refreshTesterData();
  };
  const apiSubmitStep4 = async (assignmentId: string, screenshotUrl: string) => { await submitAssignmentProof(assignmentId, { step: 4, fileUrl: screenshotUrl }, await getTokenOrThrow()); await refreshTesterData(); };
  const apiUploadTesterProof = async (file: File) => uploadTesterProofFile(file, await getTokenOrThrow());
  const apiSubmitBug = async (bug: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }) => {
    await submitProjectBugReport(bug.appId, { title: bug.title, description: bug.title, category: 'functional', severity: bug.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical', device: bug.device, appVersion: bug.osVersion, expectedResult: 'Expected behavior without this issue', actualResult: bug.title, stepsToReproduce: bug.reproductionSteps, attachments: bug.screenshot ? [bug.screenshot] : [] }, await getTokenOrThrow());
    await refreshTesterData();
  };
  const apiRequestWithdrawal = async (amount: number, upiId: string) => {
    try {
      if (amount > activeTester.walletBalance) return { success: false, error: 'Amount exceeds balance' };
      if (upiId !== activeTester.upiId) await apiUpdateTesterProfile({ upiId });
      await requestWalletWithdrawal(rupeesToPaise(amount), await getTokenOrThrow()); await refreshTesterData(); return { success: true };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Withdrawal failed' }; }
  };

  const apiCreateProject = async (project: Omit<TestApp, 'id' | 'testersCount' | 'bugsFound' | 'progress' | 'status'>) => {
    const response = await createClientProject({
      package: project.packageTier ?? 'managed_testing',
      serviceType: project.serviceType ?? 'play_store_closed_testing',
      serviceOption: project.serviceOption ?? project.packageTier ?? 'testers_only',
      requiredTesters: project.testersRequired ?? 14,
      requiredDeviceModels: project.devices,
      appDetails: { appName: project.name, packageName: project.packageName || project.playIntegration?.packageName || project.version, description: project.instructions, playStoreUrl: project.apkUrl },
    }, await getTokenOrThrow());
    await refreshClientData();
    return mapProject(response.data.project);
  };
  const apiGetVerifiedTesterEmails = async (projectId: string) => {
    const response = await getVerifiedProjectTesterEmails(projectId, await getTokenOrThrow());
    return response.data;
  };
  const apiSubmitVerification = async (projectId: string, proofUrl: string) => { await submitClientVerification(projectId, proofUrl, await getTokenOrThrow()); await refreshClientData(); };
  const apiPayInvoice = async (projectId: string) => {
    const invoice = invoices.find((item) => item.projectId === projectId);
    if (!invoice) throw new Error('Invoice is not available yet.');
    const checkout = await checkoutInvoice(invoice._id, await getTokenOrThrow());
    await new Promise<void>((resolve, reject) => {
      const startCheckout = () => {
        const Razorpay = (window as typeof window & { Razorpay?: new (options: unknown) => { open: () => void } }).Razorpay;
        if (!Razorpay) { reject(new Error('Razorpay checkout failed to load.')); return; }
        new Razorpay({ key: checkout.data.keyId, order_id: checkout.data.order.id, amount: checkout.data.order.amount, currency: checkout.data.order.currency, name: 'UXOS', handler: () => { void refreshClientData().then(resolve); }, modal: { ondismiss: resolve } }).open();
      };
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
      if (existing) { startCheckout(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.dataset.razorpayCheckout = 'true';
      script.onload = startCheckout;
      script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
      document.head.appendChild(script);
    });
  };
  const apiSendTesterSupport = async (input: { subject: string; message: string; projectId?: string }) => {
    await createSupportTicket(input, await getTokenOrThrow());
    await refreshTesterData();
  };
  const apiReplyToSupport = async (ticketId: string, body: string) => {
    await replyToSupportTicket(ticketId, body, await getTokenOrThrow());
    if (currentTab === 'admin') await refreshAdminData();
    else if (currentTab === 'client') await refreshClientData();
    else await refreshTesterData();
  };
  const apiUpdateSupportStatus = async (ticketId: string, status: BackendSupportTicket['status']) => {
    await updateSupportTicketStatus(ticketId, status, await getTokenOrThrow());
    await refreshAdminData();
  };

  const apiCheckoutOnboardingTier = async (tierIndex: number): Promise<boolean> => {
    const token = await getTokenOrThrow();
    const checkout = await checkoutOnboardingTier(tierIndex, token);
    return new Promise<boolean>((resolve, reject) => {
      const startCheckout = () => {
        const Razorpay = (window as typeof window & { Razorpay?: new (options: unknown) => { open: () => void } }).Razorpay;
        if (!Razorpay) { reject(new Error('Razorpay checkout failed to load.')); return; }
        new Razorpay({
          key: checkout.data.keyId,
          order_id: checkout.data.order.id,
          amount: checkout.data.order.amount,
          currency: checkout.data.order.currency,
          name: 'UXOS',
          handler: async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try { const result = await verifyOnboardingPayment(payment, token); resolve(result.data.verified); }
            catch (error) { reject(error); }
          },
          modal: { ondismiss: () => resolve(false) },
        }).open();
      };
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
      if (existing) { startCheckout(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.dataset.razorpayCheckout = 'true';
      script.onload = startCheckout;
      script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
      document.head.appendChild(script);
    });
  };

  const apiLoadClientProjectDetails = async (projectId: string) => {
    const token = await getTokenOrThrow();
    const [assignmentResponse, fileResponse] = await Promise.all([
      listClientProjectAssignments(projectId, token),
      listProjectFiles(projectId, token),
    ]);
    return { assignments: assignmentResponse.data, files: fileResponse.data };
  };

  const apiUploadClientProjectFile = async (projectId: string, file: File): Promise<BackendProjectFile> => {
    const token = await getTokenOrThrow();
    const contentType = file.type || 'application/octet-stream';
    const presigned = await requestTestingFileUpload(file.name, contentType, token);
    const upload = await fetch(presigned.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
    if (!upload.ok) throw new Error('File upload failed.');
    const saved = await registerProjectFile(projectId, { name: file.name, key: presigned.data.key, contentType, size: file.size }, token);
    return saved.data;
  };

  const apiDownloadClientProjectFile = async (key: string) => {
    if (/^https?:\/\//i.test(key)) { window.open(key, '_blank', 'noopener,noreferrer'); return; }
    const response = await getProjectFileDownload(key, await getTokenOrThrow());
    window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const apiSubmitClientTestingLink = async (projectId: string, optInUrl: string) => {
    await advanceProjectMilestone(projectId, 4, await getTokenOrThrow(), optInUrl);
    await refreshClientData();
  };
  const apiConfirmClientEmailsAdded = async (projectId: string) => {
    await advanceProjectMilestone(projectId, 2, await getTokenOrThrow());
    await refreshClientData();
  };

  const apiSendClientSupport = async (input: { subject: string; message: string; cc: string[] }, projectId?: string) => {
    await createSupportTicket({ ...input, projectId }, await getTokenOrThrow());
    await refreshClientData();
  };
  const apiListAdminProjectFiles = async (projectId: string) => {
    const artifacts = (await listProjectArtifacts(projectId, await getTokenOrThrow())).data;
    const proofFiles: BackendProjectFile[] = artifacts.testerProofs
      .filter((proof) => proof.key && !proof.key.startsWith('check-in:') && !proof.key.includes('@'))
      .map((proof) => ({ name: `Tester proof - step ${proof.step}`, key: proof.key, contentType: 'application/octet-stream', size: 0, uploadedAt: proof.submittedAt }));
    const bugFiles: BackendProjectFile[] = artifacts.bugAttachments.map((file) => ({ name: `Bug attachment - ${file.title}`, key: file.key, contentType: 'application/octet-stream', size: 0, uploadedAt: file.uploadedAt }));
    return [...artifacts.clientFiles, ...proofFiles, ...bugFiles];
  };
  const apiClearAdminProjectFiles = async (projectId: string) => (await clearAdminProjectFiles(projectId, await getTokenOrThrow())).data.deleted;

  const apiReviewVerification = async (projectId: string, approve: boolean, customAmount?: number) => { await reviewProjectVerification(projectId, approve, await getTokenOrThrow(), customAmount); await refreshAdminData(); };
  const apiAdvanceMilestone = async (projectId: string, step: number, payload?: { optInUrl?: string }) => { await advanceProjectMilestone(projectId, step, await getTokenOrThrow(), payload?.optInUrl); await refreshAdminData(); };
  const apiReplaceTester = async (assignmentId: string) => { await replaceAssignment(assignmentId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiApproveStep1 = async (projectId: string, testerId: string) => { const assignment = assignments.find((item) => item.projectId === projectId && item.testerId === testerId); if (!assignment) throw new Error('Assignment not found'); await verifyAssignment(assignment.id, 1, true, await getTokenOrThrow()); await refreshAdminData(); };
  const apiVerifyTesterProof = async (assignmentId: string, step: number, approve: boolean, reason?: string) => { await verifyAssignment(assignmentId, step, approve, await getTokenOrThrow(), reason); await refreshAdminData(); };
  const apiAddTester = async (projectId: string, testerId: string) => { await assignTesterToProject(projectId, testerId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiRemoveTester = async (projectId: string, testerId: string) => { const assignment = assignments.find((item) => item.projectId === projectId && item.testerId === testerId); if (!assignment) throw new Error('Assignment not found'); await replaceAssignment(assignment.id, await getTokenOrThrow()); await refreshAdminData(); };
  const apiMergeBugs = async (canonicalId: string, duplicateId: string) => { await mergeBugReports(canonicalId, duplicateId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiPublishBug = async (bugId: string, adminNotes?: string) => { await publishBugReport(bugId, await getTokenOrThrow(), adminNotes); await refreshAdminData(); };
  const apiUpdateAdminProfile = async (input: { name?: string; phone?: string }) => {
    const response = await updateCurrentLaunchOpsUser(input, await getTokenOrThrow());
    setCurrentUser(response.data.user);
  };
  const apiUpdateClientProfile = async (input: { name?: string; phone?: string; companyName?: string; contactName?: string }) => {
    const token = await getTokenOrThrow();
    const response = await updateCurrentLaunchOpsUser(input, token);
    const clientResponse = await updateMyClientProfile({ companyName: input.companyName, contactName: input.contactName ?? input.name }, token);
    setCurrentUser(response.data.user);
    setCurrentClient(clientResponse.data);
  };
  const apiUpdateTesterStatus = async (testerId: string, status: BackendTesterProfile['status']) => { await updateAdminTesterStatus(testerId, status, await getTokenOrThrow()); await refreshAdminData(); };
  const apiPromoteQueuedTester = async (assignmentId: string) => { await promoteQueuedAssignment(assignmentId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiResendNotification = async (notificationId: string) => { await resendAdminNotification(notificationId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiDownloadCompletionReport = async (projectId: string) => {
    const response = await getProjectCompletionReport(projectId, await getTokenOrThrow());
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${response.data.project.appName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-completion-report.json`; anchor.click();
    URL.revokeObjectURL(url);
  };
  const apiUpdatePlayIntegration = async (projectId: string, input: Parameters<typeof updateProjectPlayIntegration>[1]) => { await updateProjectPlayIntegration(projectId, input, await getTokenOrThrow()); await refreshAdminData(); };
  const apiSyncPlayIntegration = async (projectId: string) => { await syncProjectPlayIntegration(projectId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiCreateProjectForClient = async (input: Parameters<typeof createAdminProject>[0]) => { await createAdminProject(input, await getTokenOrThrow()); await refreshAdminData(); };
  const apiCompleteWithdrawal = async (id: string, transactionId: string) => { await completeAdminWithdrawal(id, transactionId, await getTokenOrThrow()); await refreshAdminData(); };
  const apiRejectWithdrawal = async (id: string, reason: string) => { await rejectAdminWithdrawal(id, reason, await getTokenOrThrow()); await refreshAdminData(); };

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden selection:bg-indigo-600/10 selection:text-indigo-900 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Universal Header Nav */}
      {!isDashboard && (
        <Navbar 
          currentTab={currentTab} 
          onTabChange={handleSetTab} 
          onStartTesting={() => handleSetTab('client', 'new-app')} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}

      {/* Main Screen Router */}
      <main className="relative min-h-screen">
        {dashboardError && isDashboard && (
          <div className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto max-w-md mx-auto z-[100] rounded-xl border px-4 py-3 text-xs sm:text-sm font-semibold shadow-2xl transition-colors text-center break-words ${
            isDarkMode ? 'border-red-500/30 bg-red-950/95 text-red-100 backdrop-blur-md' : 'border-red-200 bg-red-50/95 text-red-700 backdrop-blur-md'
          }`}>
            {dashboardError}
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <HeroSection 
                onStartTesting={() => handleSetTab('client', 'new-app')} 
                onWatchVideo={() => setIsWatchWorksOpen(true)} 
                onTabChange={handleSetTab}
                isDarkMode={isDarkMode}
                showStartTestingAction={!isTesterExperience}
              />
              <HowItWorks isDarkMode={isDarkMode} />
              <BuiltForEveryone isDarkMode={isDarkMode} />
              <Testimonials isDarkMode={isDarkMode} />
              <CallToAction 
                onStartTesting={() => handleSetTab('client', 'new-app')} 
                onTalkToSales={() => handleSetTab('pricing')}
                isDarkMode={isDarkMode} 
              />
            </motion.div>
          )}

          {currentTab === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {(renderAuthScreen ?? ((props) => <AuthScreen {...props} />))({
                isDarkMode,
                initialRole: initialSubTab === 'client' ? 'client' : 'tester',
                onLoginSuccess: (name, role) => {
                  localStorage.setItem('launchops_user_role', role);
                  if (role === 'admin') {
                    handleSetTab('admin');
                  } else if (role === 'client') {
                    // Every authenticated client lands on the dashboard. Existing
                    // projects load there; new clients can start their first project.
                    handleSetTab('client', 'dashboard');
                  } else {
                    setActiveTester({ ...emptyTester, name });
                    handleSetTab('tester');
                  }
                },
                onBackToHome: () => handleSetTab('home'),
              })}
            </motion.div>
          )}

          {currentTab === 'tester' && (
            <motion.div
              key="tester"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {dashboardLoading ? (
                <DashboardLoadingScreen isDarkMode={isDarkMode} />
              ) : <TesterDashboard
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                activeTester={activeTester}
                projects={apps}
                assignments={assignments}
                bugs={bugs}
                transactions={transactions}
                withdrawals={withdrawals}
                notifications={notifications}
                supportTickets={supportTickets}
                onReadNotification={apiMarkNotificationRead}
                onUpdateTesterProfile={apiUpdateTesterProfile}
                onJoinProject={apiJoinProject}
                onSubmitStep1Email={apiSubmitStep1}
                onClickStep3Link={apiSubmitStep3}
                onLogStep4CheckIn={apiSubmitStep4}
                onUploadProof={apiUploadTesterProof}
                onSubmitBugReport={apiSubmitBug}
                onRequestWithdrawal={apiRequestWithdrawal}
                onSendSupport={apiSendTesterSupport}
                onReplyToSupport={apiReplyToSupport}
                onLogout={() => { void handleLogout(); }}
                initialTab={initialSubTab}
                onTabChange={(tab) => handleSetTab('tester', tab)}
              />}
            </motion.div>
          )}

          {currentTab === 'client' && (
            <motion.div
              key="client"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ClientFlowManager
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onBackToHome={() => handleSetTab('home')}
                initialView={initialSubTab === 'dashboard' ? 'dashboard' : ['wizard', 'new-app'].includes(initialSubTab) ? 'wizard' : undefined}
                onCheckoutTier={apiCheckoutOnboardingTier}
                projects={apps}
                isLoading={dashboardLoading}
                error={dashboardError}
                onCreateProject={apiCreateProject}
                onGetVerifiedTesterEmails={apiGetVerifiedTesterEmails}
                currentUser={currentUser}
                currentClient={currentClient}
                notifications={notifications}
                onLoadProjectDetails={apiLoadClientProjectDetails}
                onDownloadProjectFile={apiDownloadClientProjectFile}
                onUploadProjectFile={apiUploadClientProjectFile}
                onSubmitTestingLink={apiSubmitClientTestingLink}
                onConfirmEmailsAdded={apiConfirmClientEmailsAdded}
                onSendSupport={apiSendClientSupport}
                supportTickets={supportTickets}
                onReplyToSupport={apiReplyToSupport}
                onLogout={() => { void handleLogout(); }}
                onReadNotification={apiMarkNotificationRead}
                onUpdateProfile={apiUpdateClientProfile}
                onDownloadCompletionReport={apiDownloadCompletionReport}
              />
            </motion.div>
          )}

          {currentTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {dashboardLoading ? (
                <DashboardLoadingScreen isDarkMode={isDarkMode} />
              ) : currentUser?.role !== 'admin' ? (
                <div className="min-h-screen bg-slate-50 px-6 py-24 text-center dark:bg-slate-950 dark:text-white">
                  <h1 className="text-2xl font-black">Admin access required</h1>
                  <p className="mt-3 text-sm text-slate-500">This account is not authorized to access the admin portal.</p>
                  <button onClick={() => handleSetTab(currentUser?.role === 'tester' ? 'tester' : currentUser?.role === 'client' ? 'client' : 'home')} className="mt-6 rounded-xl bg-[#4F37FE] px-5 py-3 text-sm font-bold text-white">Return to your dashboard</button>
                </div>
              ) : <AdminConsole
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                projects={apps}
                bugs={bugs}
                assignments={assignments}
                testers={adminTesters}
                clients={adminClients}
                withdrawals={withdrawals}
                notifications={notifications}
                supportTickets={supportTickets}
                currentUser={currentUser}
                dashboardSummary={adminDashboard}
                onUpdateProfile={apiUpdateAdminProfile}
                onReadNotification={apiMarkNotificationRead}
                onApproveVerification={(id, amount) => { void apiReviewVerification(id, true, amount); }}
                onRejectVerification={(id) => { void apiReviewVerification(id, false); }}
                onAdvanceMilestone={(id, step, payload) => { void apiAdvanceMilestone(id, step, payload); }}
                onReplaceTester={(id) => { void apiReplaceTester(id); }}
                onMergeBugs={(canonical, duplicate) => { void apiMergeBugs(canonical, duplicate); }}
                onPublishBug={apiPublishBug}
                onCompleteWithdrawal={apiCompleteWithdrawal}
                onRejectWithdrawal={apiRejectWithdrawal}
                onLogout={() => { void handleLogout(); }}
                onAddTesterToProject={apiAddTester}
                onRemoveTesterFromProject={(projectId, testerId) => { void apiRemoveTester(projectId, testerId); }}
                onApproveTesterStep1={(projectId, testerId) => { void apiApproveStep1(projectId, testerId); }}
                onVerifyTesterProof={apiVerifyTesterProof}
                onListProjectFiles={apiListAdminProjectFiles}
                onDownloadProjectFile={apiDownloadClientProjectFile}
                onClearProjectFiles={apiClearAdminProjectFiles}
                onReplyToSupport={apiReplyToSupport}
                onUpdateSupportStatus={apiUpdateSupportStatus}
                onUpdateTesterStatus={apiUpdateTesterStatus}
                onPromoteQueuedTester={apiPromoteQueuedTester}
                onResendNotification={apiResendNotification}
                onDownloadCompletionReport={apiDownloadCompletionReport}
                onUpdatePlayIntegration={apiUpdatePlayIntegration}
                onSyncPlayIntegration={apiSyncPlayIntegration}
                onCreateProjectForClient={apiCreateProjectForClient}
                initialTab={initialSubTab}
                onTabChange={(tab) => handleSetTab('admin', tab)}
              />}
            </motion.div>
          )}

          {currentTab === 'solutions' && (
            <motion.div
              key="solutions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <SolutionsScreen isDarkMode={isDarkMode} />
            </motion.div>
          )}

          {currentTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResourcesScreen isDarkMode={isDarkMode} />
            </motion.div>
          )}

          {currentTab === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <PricingScreen isDarkMode={isDarkMode} />
            </motion.div>
          )}

          {currentTab === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-6 py-28 relative z-10"
            >
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] tracking-widest font-extrabold mb-6 uppercase ${
                  isDarkMode 
                    ? 'border-indigo-500/20 bg-indigo-950/40 text-indigo-400' 
                    : 'border-indigo-150 bg-indigo-50 text-indigo-600'
                }`}>
                  Meet UXOS
                </span>
                <h1 className={`text-4xl font-black mb-6 tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>OUR MISSION & VISION</h1>
                <p className={`text-sm leading-relaxed font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Empowering mobile engineers worldwide to launch high-performance Android applications with confidence by putting real devices in the hands of real experts.
                </p>
              </div>

              {/* Content info grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                <div>
                  <h2 className={`text-2xl font-black mb-4 tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>Real Devices. Absolute Integrity.</h2>
                  <p className={`text-sm leading-relaxed mb-6 font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    In an era dominated by simulated emulators and AI-generated logs, UXOS remains fiercely committed to human authenticity. We believe that critical connection anomalies, BLE packet losses, tactile layout errors, and battery drain anomalies can only be authentically audited on real physical hardware.
                  </p>
                  <div className={`space-y-3 text-sm font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>SEC and SOC2 Type II Certified Testing Facility</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>Global workforce of 15,000+ QA specialists</span>
                    </div>
                  </div>
                </div>

                {/* Stats card */}
                <div className={`border rounded-3xl p-8 relative overflow-hidden transition-colors ${
                  isDarkMode ? 'bg-[#0f0f13] border-white/5 shadow-2xl shadow-indigo-500/5' : 'bg-slate-50 border-slate-200/80 shadow-sm'
                }`}>
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-3xl rounded-full ${
                    isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-50'
                  }`} />
                  <h3 className={`font-bold text-lg mb-6 relative z-10 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>Headquarters</h3>
                  <div className="space-y-4 relative z-10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <MapPin className="w-4 h-4 text-indigo-600" /> Hyderabad, Telangana
                      </span>
                      <span className="text-slate-400 font-bold font-mono">Main Office</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </main>

      {/* Watch How It Works Simulation Walkthrough */}
      <WatchWorksModal 
        isOpen={isWatchWorksOpen} 
        onClose={() => setIsWatchWorksOpen(false)} 
        isDarkMode={isDarkMode}
      />

      {/* Complete Site Footer */}
      {!isDashboard && (
        <Footer onTabChange={handleSetTab} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      )}
    </div>
  );
}
