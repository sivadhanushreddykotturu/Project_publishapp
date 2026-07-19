"use client";

import { useCallback, useEffect, useState } from 'react';
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

import { MapPin, Users, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, ApiRequestError } from './lib/api';
import {
  getCurrentLaunchOpsUser,
  getMyTesterProfile,
  getMyWallet,
  joinTesterProject,
  listMyAssignments,
  listMyBugReports,
  listTesterOpportunities,
  requestWalletWithdrawal,
  submitAssignmentProof,
  submitProjectBugReport,
  updateMyTesterProfile,
  type UpsertTesterProfileInput,
} from './lib/launchops-api';
import {
  mapAssignment,
  mapBugReport,
  mapProject,
  mapTesterProfile,
  mapWallet,
  paiseToRupees,
  rupeesToPaise,
} from './lib/launchops-mappers';

const emptyTester: Tester = {
  id: '',
  name: 'Tester',
  avatar: '',
  country: 'India',
  devices: [],
  bugsFoundCount: 0,
  rating: 0,
  specialty: 'General Testing',
  status: 'Idle',
  upiId: '',
  walletBalance: 0
};

const staleDashboardKeys = [
  'launchtest_data_version',
  'launchtest_apps',
  'launchtest_bugs',
  'launchtest_assignments',
  'launchtest_withdrawals',
  'launchtest_transactions',
  'launchtest_active_tester'
];

function formatError(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while contacting the backend.';
}

function fingerprintForDevice(testerId: string, model: string, index: number) {
  return `${testerId || 'tester'}-${model.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'device'}-${index}`;
}

function profilePayloadFromTester(tester: Tester, updated: Partial<Tester>): UpsertTesterProfileInput {
  const nextDevices = updated.devices ?? tester.devices;
  const devices = (nextDevices.length > 0 ? nextDevices : ['Android Device']).map((model, index) => ({
    model,
    androidVersion: 'Android 14',
    fingerprint: fingerprintForDevice(tester.id, model, index),
  }));
  const rawExperience = `${updated.experience ?? updated.specialty ?? tester.experience ?? tester.specialty}`.toLowerCase();
  const experienceLevel: UpsertTesterProfileInput['experienceLevel'] = rawExperience.includes('expert')
    ? 'expert'
    : rawExperience.includes('intermediate')
      ? 'intermediate'
      : 'beginner';

  return {
    devices,
    experienceLevel,
    upi: { vpa: updated.upiId ?? tester.upiId ?? '' },
  };
}

type AuthScreenRenderProps = {
  isDarkMode: boolean;
  onLoginSuccess: (testerName?: string) => void;
  onBackToHome: () => void;
};

type AppProps = {
  getAuthToken?: () => Promise<string | null>;
  renderAuthScreen: (props: AuthScreenRenderProps) => ReactNode;
};

export default function App({ getAuthToken, renderAuthScreen }: AppProps) {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Theme State (Dark vs Light)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('launchtest_darkmode');
      return savedTheme ? savedTheme === 'true' : false;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('launchtest_darkmode', String(next));
      }
      return next;
    });
  };

  // Backend-backed dashboard state
  const [apps, setApps] = useState<TestApp[]>([]);

  const [bugs, setBugs] = useState<BugReport[]>([]);

  // Tester Flow Data States
  const [activeTester, setActiveTester] = useState<Tester>(emptyTester);

  const [assignments, setAssignments] = useState<TesterAssignment[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardError, setDashboardError] = useState<string>('');
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

  // Modals Controller State
  const [isWatchWorksOpen, setIsWatchWorksOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    staleDashboardKeys.forEach((key) => localStorage.removeItem(key));
  }, []);

  const getTokenOrThrow = useCallback(async () => {
    const token = await getAuthToken?.();
    if (!token) {
      throw new Error('Sign in with Clerk before loading tester data.');
    }
    return token;
  }, [getAuthToken]);

  const refreshTesterDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    setDashboardError('');

    try {
      const token = await getTokenOrThrow();
      const [
        currentUserResponse,
        testerProfileResponse,
        opportunitiesResponse,
        assignmentsResponse,
        walletResponse,
        bugReportsResponse,
      ] = await Promise.all([
        getCurrentLaunchOpsUser(token),
        getMyTesterProfile(token),
        listTesterOpportunities(token),
        listMyAssignments(token),
        getMyWallet(token),
        listMyBugReports(token),
      ]);

      const user = currentUserResponse.data.user;
      const tester = mapTesterProfile(testerProfileResponse.data, user);
      tester.walletBalance = paiseToRupees(walletResponse.data.balance);
      tester.bugsFoundCount = bugReportsResponse.data.length;

      const projectsById = new Map<string, TestApp>();
      opportunitiesResponse.data.map(mapProject).forEach((project) => projectsById.set(project.id, project));
      assignmentsResponse.data.forEach((assignment) => {
        if (typeof assignment.projectId === 'object') {
          const project = mapProject(assignment.projectId);
          projectsById.set(project.id, project);
        }
      });

      const wallet = mapWallet(walletResponse.data, tester.id);

      setActiveTester(tester);
      setApps([...projectsById.values()]);
      setAssignments(assignmentsResponse.data.map((assignment) => mapAssignment(assignment, user)));
      setWithdrawals(wallet.withdrawals);
      setTransactions(wallet.transactions);
      setBugs(bugReportsResponse.data.map((report) => mapBugReport(report, tester)));
    } catch (error) {
      setDashboardError(formatError(error));
    } finally {
      setIsDashboardLoading(false);
    }
  }, [getTokenOrThrow]);

  useEffect(() => {
    if (currentTab === 'tester') {
      void refreshTesterDashboard();
    }
  }, [currentTab, refreshTesterDashboard]);

  const handleUpdateTesterProfile = async (updated: Partial<Tester>) => {
    try {
      const payload = profilePayloadFromTester(activeTester, updated);
      if (!payload.upi.vpa.trim()) {
        throw new Error('UPI ID is required before saving your tester profile.');
      }

      const token = await getTokenOrThrow();
      await updateMyTesterProfile(payload, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleJoinProject = async (projectId: string) => {
    try {
      const token = await getTokenOrThrow();
      await joinTesterProject(projectId, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleSubmitStep1Email = async (assignmentId: string, email: string, screenshotUrl?: string) => {
    try {
      const token = await getTokenOrThrow();
      await submitAssignmentProof(assignmentId, {
        step: 1,
        fileUrl: screenshotUrl ?? email,
      }, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleClickStep3Link = async (assignmentId: string, screenshotUrl?: string) => {
    try {
      const token = await getTokenOrThrow();

      if (!screenshotUrl) {
        window.open(`${API_BASE_URL}/t/${assignmentId}`, '_blank', 'noopener,noreferrer');
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === assignmentId ? { ...assignment, step3Clicked: true } : assignment
          )
        );
        return;
      }

      await submitAssignmentProof(assignmentId, {
        step: 3,
        fileUrl: screenshotUrl,
      }, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleLogStep4CheckIn = async (assignmentId: string, proofUrl: string) => {
    try {
      const token = await getTokenOrThrow();
      await submitAssignmentProof(assignmentId, {
        step: 4,
        fileUrl: proofUrl,
      }, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleSubmitBugReport = async (
    bugReport: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }
  ) => {
    try {
      const token = await getTokenOrThrow();
      await submitProjectBugReport(bugReport.appId, {
        title: bugReport.title,
        description: bugReport.title,
        category: 'functional',
        severity: bugReport.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
        device: bugReport.device,
        appVersion: bugReport.osVersion,
        expectedResult: 'Expected the app to work without this issue.',
        actualResult: bugReport.title,
        stepsToReproduce: bugReport.reproductionSteps,
        attachments: bugReport.screenshot ? [bugReport.screenshot] : [],
      }, token);
      await refreshTesterDashboard();
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      alert(message);
    }
  };

  const handleRequestWithdrawal = async (amount: number, upiId: string) => {
    if (amount > activeTester.walletBalance) {
      return { success: false, error: 'Amount exceeds balance' };
    }

    try {
      const token = await getTokenOrThrow();
      if (upiId && upiId !== activeTester.upiId) {
        await updateMyTesterProfile(profilePayloadFromTester(activeTester, { upiId }), token);
      }
      await requestWalletWithdrawal(rupeesToPaise(amount), token);
      await refreshTesterDashboard();
      return { success: true };
    } catch (error) {
      const message = formatError(error);
      setDashboardError(message);
      return { success: false, error: message };
    }
  };

  const handleLoginSuccess = useCallback((testerName?: string) => {
    if (testerName) {
      setActiveTester(prev => ({ ...prev, name: testerName }));
    }
    setCurrentTab('tester');
    void refreshTesterDashboard();
  }, [refreshTesterDashboard]);

  const isTesterExperience = currentTab === 'tester' || Boolean(activeTester.id);

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden selection:bg-indigo-600/10 selection:text-indigo-900 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Universal Header Nav */}
      <Navbar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        onStartTesting={() => setCurrentTab('auth')} 
        showStartTestingAction={!isTesterExperience}
        isTesterExperience={isTesterExperience}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Screen Router */}
      <main className="relative min-h-screen">
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
                onStartTesting={() => setCurrentTab('auth')} 
                onWatchVideo={() => setIsWatchWorksOpen(true)} 
                onTabChange={setCurrentTab}
                isDarkMode={isDarkMode}
                showStartTestingAction={!isTesterExperience}
              />
              <HowItWorks isDarkMode={isDarkMode} />
              <BuiltForEveryone isDarkMode={isDarkMode} />
              <Testimonials isDarkMode={isDarkMode} />
              {!isTesterExperience && <CallToAction onStartTesting={() => setCurrentTab('auth')} isDarkMode={isDarkMode} />}
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
              {renderAuthScreen({
                isDarkMode,
                onLoginSuccess: handleLoginSuccess,
                onBackToHome: () => setCurrentTab('home'),
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
              {isDashboardLoading && !activeTester.id ? (
                <div className="min-h-screen pt-28 flex items-center justify-center">
                  <div className={`border rounded-2xl px-6 py-5 text-sm font-bold ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    Loading tester dashboard...
                  </div>
                </div>
              ) : (
                <>
                  {dashboardError && (
                    <div className="pt-24 px-6">
                      <div className="max-w-5xl mx-auto rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
                        {dashboardError}
                      </div>
                    </div>
                  )}
                  <TesterDashboard
                    isDarkMode={isDarkMode}
                    activeTester={activeTester}
                    projects={apps}
                    assignments={assignments}
                    bugs={bugs}
                    transactions={transactions}
                    withdrawals={withdrawals}
                    onUpdateTesterProfile={handleUpdateTesterProfile}
                    onJoinProject={handleJoinProject}
                    onSubmitStep1Email={handleSubmitStep1Email}
                    onClickStep3Link={handleClickStep3Link}
                    onLogStep4CheckIn={handleLogStep4CheckIn}
                    onSubmitBugReport={handleSubmitBugReport}
                    onRequestWithdrawal={handleRequestWithdrawal}
                  />
                </>
              )}
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
                  Meet LaunchTest
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
                    In an era dominated by simulated emulators and AI-generated logs, LaunchTest remains fiercely committed to human authenticity. We believe that critical connection anomalies, BLE packet losses, tactile layout errors, and battery drain anomalies can only be authentically audited on real physical hardware.
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
                  }`}>Global Lab Locations</h3>
                  <div className="space-y-4 relative z-10 text-xs">
                    <div className={`flex items-center justify-between border-b pb-2 ${
                      isDarkMode ? 'border-white/5' : 'border-slate-200/60'
                    }`}>
                      <span className={`font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <MapPin className="w-4 h-4 text-indigo-600" /> San Francisco, CA
                      </span>
                      <span className="text-slate-400 font-bold font-mono">Headquarters & BLE Lab</span>
                    </div>
                    <div className={`flex items-center justify-between border-b pb-2 ${
                      isDarkMode ? 'border-white/5' : 'border-slate-200/60'
                    }`}>
                      <span className={`font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <MapPin className="w-4 h-4 text-indigo-600" /> Tokyo, Japan
                      </span>
                      <span className="text-slate-400 font-bold font-mono">Foldable device specialists</span>
                    </div>
                    <div className={`flex items-center justify-between border-b pb-2 ${
                      isDarkMode ? 'border-white/5' : 'border-slate-200/60'
                    }`}>
                      <span className={`font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <MapPin className="w-4 h-4 text-indigo-600" /> London, UK
                      </span>
                      <span className="text-slate-400 font-bold font-mono">Localization & Accents QA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        <MapPin className="w-4 h-4 text-indigo-600" /> Seoul, South Korea
                      </span>
                      <span className="text-slate-400 font-bold font-mono">High-throughput network QA</span>
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
      <Footer onTabChange={setCurrentTab} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
    </div>
  );
}
