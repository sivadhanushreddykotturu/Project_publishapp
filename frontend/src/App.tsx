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
import AuthScreen from './components/AuthScreen';
import ClientDashboard from './components/ClientDashboard';
import AdminConsole from './components/AdminConsole';

import { MapPin, Users, Heart, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ENHANCED_INITIAL_APPS: TestApp[] = INITIAL_APPS.map(app => ({
  ...app,
  packageTier: 'managed_testing' as const,
  testersRequired: 35,
  verificationRequired: true,
  verificationStatus: 'approved' as const,
  invoiceStatus: 'paid' as const
}));

export default function App() {
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
      if (parts.length > 0) {
        const mainTab = parts[0];
        if (['home', 'auth', 'tester', 'client', 'admin', 'solutions', 'resources', 'pricing', 'company'].includes(mainTab)) {
          setCurrentTab(mainTab);
          if (parts[1]) {
            setInitialSubTab(parts[1]);
          }
        }
      } else {
        const saved = localStorage.getItem('launchops_current_tab');
        if (saved) {
          setCurrentTab(saved);
        }
      }

      const handlePopState = () => {
        const subparts = window.location.pathname.split('/').filter(Boolean);
        const p = subparts[0] || 'home';
        setCurrentTab(p);
        if (subparts[1]) {
          setInitialSubTab(subparts[1]);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const handleSetTab = (tab: string, subtab?: string) => {
    setCurrentTab(tab);
    if (subtab) {
      setInitialSubTab(subtab);
    }
    if (typeof window !== 'undefined') {
      if (tab === 'home' || tab === 'solutions' || tab === 'pricing' || tab === 'resources') {
        localStorage.removeItem('launchops_current_tab');
      } else {
        localStorage.setItem('launchops_current_tab', tab);
      }
      
      const targetPath = '/' + (tab === 'home' ? '' : tab) + (subtab ? '/' + subtab : '');
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
  const [apps, setApps] = useState<TestApp[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_apps');
      if (saved) {
        try {
          const parsed: TestApp[] = JSON.parse(saved);
          const seen = new Set<string>();
          const uniqueApps: TestApp[] = [];
          parsed.forEach((app) => {
            let uniqueId = app.id;
            if (!uniqueId || seen.has(uniqueId)) {
              uniqueId = `${uniqueId || 'app'}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            }
            seen.add(uniqueId);
            uniqueApps.push({ ...app, id: uniqueId });
          });
          return uniqueApps;
        } catch (e) {
          return ENHANCED_INITIAL_APPS;
        }
      }
    }
    return ENHANCED_INITIAL_APPS;
  });

  const [bugs, setBugs] = useState<BugReport[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_bugs');
      if (saved) {
        try {
          const parsed: BugReport[] = JSON.parse(saved);
          const seen = new Set<string>();
          const uniqueBugs: BugReport[] = [];
          parsed.forEach((bug) => {
            let uniqueId = bug.id;
            if (!uniqueId || seen.has(uniqueId)) {
              uniqueId = `${uniqueId || 'bug'}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            }
            seen.add(uniqueId);
            uniqueBugs.push({ ...bug, id: uniqueId });
          });
          return uniqueBugs;
        } catch (e) {
          return INITIAL_BUGS;
        }
      }
    }
    return INITIAL_BUGS;
  });

  const [devices] = useState<AndroidDevice[]>(MOCK_DEVICES);

  // Tester Flow Data States
  const [activeTester, setActiveTester] = useState<Tester>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_active_tester');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      id: 'tester-123',
      name: 'Deven Patel',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd4DobtQhtBLqI2y6OKlewxLeYjt-2dWb4zwElRSw3AkyelrVX03GtqcPvaHfiHqBmJ0Vx1zl7HAPThzZFmtQMgzZtTneML_NYjSYU4vG6RBX4fSntKJVcLe6LynQ6fA_uX-2DwS17Tmhy_HeV9OTXke2fR_wxp0Hd8o2jQ8o_JyxlSk8JWlPZB0xIZZFOIlL_M7TFexHbiDgLji027458If5kijP8M31CdMtcgRKCfBSIWIi36ck6kA',
      country: 'India',
      devices: ['Google Pixel 8 Pro'],
      bugsFoundCount: 0,
      rating: 5.0,
      specialty: 'General Testing',
      status: 'Idle',
      upiId: '',
      walletBalance: 0
    };
  });

  const [assignments, setAssignments] = useState<TesterAssignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_assignments');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_withdrawals');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('launchops_transactions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // Modals Controller State
  const [isWatchWorksOpen, setIsWatchWorksOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('launchops_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('launchops_bugs', JSON.stringify(bugs));
  }, [bugs]);

  useEffect(() => {
    localStorage.setItem('launchops_active_tester', JSON.stringify(activeTester));
  }, [activeTester]);

  useEffect(() => {
    localStorage.setItem('launchops_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('launchops_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('launchops_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Keep refs to avoid stale closures in the simulation interval
  const appsRef = useRef(apps);
  const bugsRef = useRef(bugs);

  useEffect(() => {
    appsRef.current = apps;
  }, [apps]);

  useEffect(() => {
    bugsRef.current = bugs;
  }, [bugs]);

  // Live Simulation Progress Loop for apps under test
  useEffect(() => {
    const interval = setInterval(() => {
      const currentApps = appsRef.current;
      let appsUpdated = false;
      const generatedBugs: BugReport[] = [];

      const newApps = currentApps.map((app) => {
        if (app.status === 'Testing' && app.progress < 100) {
          appsUpdated = true;
          const nextProgress = Math.min(app.progress + 4, 100);
          const isCompleted = nextProgress === 100;

          // Chance to spawn a simulated bug as testing advances
          const shouldAddBug = Math.random() < 0.22 && nextProgress < 95;
          let updatedBugsFound = app.bugsFound;

          if (shouldAddBug) {
            const deviceModels = [
              'Google Pixel 8 Pro',
              'Samsung Galaxy S24 Ultra',
              'OnePlus 12',
              'Galaxy Z Fold 5'
            ];
            const targetDevice = deviceModels[Math.floor(Math.random() * deviceModels.length)];
            const bugTitles = [
              'NullPointerException in state restoration on background pause',
              'Thread sync issue during multi-page animation transit',
              'Asset scaling cut off on Foldable Inner flex ratio',
              'BLE sensor pairing timeout error'
            ];
            const randomTitle = bugTitles[Math.floor(Math.random() * bugTitles.length)];
            
            const testNames = ['Sarah Jenkins', 'Marcus Vance', 'David Kim', 'Elena Rostova'];
            const randomTesterName = testNames[Math.floor(Math.random() * testNames.length)];
            const matchingTester = MOCK_TESTERS.find(t => t.name === randomTesterName) || MOCK_TESTERS[0];

            const newBug: BugReport = {
              id: `bug-gen-${Date.now()}-${app.id}-${Math.floor(Math.random() * 1000000)}`,
              appId: app.id,
              appName: app.name,
              title: `${randomTitle} on ${targetDevice}`,
              severity: Math.random() < 0.4 ? 'Critical' : 'High',
              status: 'Open',
              testerName: matchingTester.name,
              testerAvatar: matchingTester.avatar,
              device: targetDevice,
              osVersion: 'Android 14 (API 34)',
              reproductionSteps: [
                `Launch ${app.name} v${app.version}`,
                'Perform intensive testing scenarios in settings block',
                'Trigger connection handshake or screen layout rotate',
                'Verify system crash logs and logcat output'
              ],
              createdAt: 'Just now'
            };

            generatedBugs.push(newBug);
            updatedBugsFound += 1;
          }

          return {
            ...app,
            progress: nextProgress,
            bugsFound: updatedBugsFound,
            status: (isCompleted ? 'Completed' : 'Testing') as 'Completed' | 'Testing'
          };
        }
        return app;
      });

      if (appsUpdated) {
        setApps(newApps);
        if (generatedBugs.length > 0) {
          setBugs((prevBugs) => {
            const existingIds = new Set(prevBugs.map((b) => b.id));
            const uniqueNewBugs = generatedBugs.filter((b) => !existingIds.has(b.id));
            return [...uniqueNewBugs, ...prevBugs];
          });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);



  const handleUpdateBugStatus = (bugId: string, status: BugReport['status']) => {
    setBugs((prev) =>
      prev.map((bug) => (bug.id === bugId ? { ...bug, status } : bug))
    );
  };

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

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden selection:bg-indigo-600/10 selection:text-indigo-900 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Universal Header Nav */}
      {!isDashboard && (
        <Navbar 
          currentTab={currentTab} 
          onTabChange={handleSetTab} 
          onStartTesting={() => handleSetTab('auth')} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}

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
                onStartTesting={() => handleSetTab('auth')} 
                onWatchVideo={() => setIsWatchWorksOpen(true)} 
                onTabChange={handleSetTab}
                isDarkMode={isDarkMode}
                showStartTestingAction={!isTesterExperience}
              />
              <HowItWorks isDarkMode={isDarkMode} />
              <BuiltForEveryone isDarkMode={isDarkMode} />
              <Testimonials isDarkMode={isDarkMode} />
              <CallToAction onStartTesting={() => handleSetTab('auth')} isDarkMode={isDarkMode} />
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
              <AuthScreen 
                isDarkMode={isDarkMode}
                onLoginSuccess={(name, role) => {
                  if (role === 'admin') {
                    handleSetTab('admin');
                  } else if (role === 'client') {
                    handleSetTab('client');
                  } else {
                    const existingTester = MOCK_TESTERS.find(t => t.name.toLowerCase() === name.toLowerCase());
                    if (existingTester) {
                      setActiveTester(existingTester);
                    } else {
                      setActiveTester(MOCK_TESTERS[0]); 
                    }
                    handleSetTab('tester');
                  }
                }}
                onBackToHome={() => handleSetTab('home')}
              />
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
                onSimulateAdminAdvanceStep={handleSimulateAdminAdvanceStep}
                onSimulateFastForwardDay={handleSimulateFastForwardDay}
                onLogout={() => handleSetTab('home')}
                initialTab={initialSubTab}
                onTabChange={(tab) => handleSetTab('tester', tab)}
              />
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
              <ClientDashboard
                isDarkMode={isDarkMode}
                projects={apps}
                bugs={bugs}
                onCreateProject={handleCreateProject}
                onSubmitVerification={handleSubmitVerification}
                onPayInvoice={handlePayInvoice}
                onLogout={() => handleSetTab('home')}
                initialTab={initialSubTab}
                onTabChange={(tab) => handleSetTab('client', tab)}
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
              <AdminConsole
                isDarkMode={isDarkMode}
                projects={apps}
                bugs={bugs}
                assignments={assignments}
                testers={MOCK_TESTERS}
                withdrawals={withdrawals}
                onApproveVerification={handleApproveVerification}
                onRejectVerification={handleRejectVerification}
                onAdvanceMilestone={handleAdvanceMilestone}
                onReplaceTester={handleReplaceTester}
                onMergeBugs={handleMergeBugs}
                onPublishBug={handlePublishBug}
                onCompleteWithdrawal={handleCompleteWithdrawal}
                onRejectWithdrawal={handleRejectWithdrawal}
                onLogout={() => handleSetTab('home')}
                onAddTesterToProject={handleAddTesterToProject}
                onRemoveTesterFromProject={handleRemoveTesterFromProject}
                onApproveTesterStep1={handleApproveTesterStep1}
                initialTab={initialSubTab}
                onTabChange={(tab) => handleSetTab('admin', tab)}
              />
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
                  Meet LaunchOps
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
                    In an era dominated by simulated emulators and AI-generated logs, LaunchOps remains fiercely committed to human authenticity. We believe that critical connection anomalies, BLE packet losses, tactile layout errors, and battery drain anomalies can only be authentically audited on real physical hardware.
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
