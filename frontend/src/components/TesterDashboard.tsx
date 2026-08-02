import { useState, useEffect } from 'react';
import { 
  Wallet, Shield, Smartphone, Plus, Bug, Check, AlertCircle, 
  ArrowRight, Landmark, ExternalLink, Calendar, Hourglass, 
  User, CheckCircle, Clock, ChevronDown, Upload, Sparkles, MapPin, Award,
  Compass, Bell, Settings, LogOut, MessageSquare, Star, FolderCheck, ListFilter, Home, CheckSquare, Loader2
} from 'lucide-react';
import { Tester, TestApp, TesterAssignment, BugReport, Transaction, WithdrawalRequest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackendNotification } from '../lib/launchops-api';

interface TesterDashboardProps {
  isDarkMode: boolean;
  activeTester: Tester;
  projects: TestApp[];
  assignments: TesterAssignment[];
  bugs: BugReport[];
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  notifications: BackendNotification[];
  onReadNotification: (notificationId: string) => void;
  onUpdateTesterProfile: (updatedTester: Partial<Tester>) => void;
  onJoinProject: (projectId: string) => Promise<void>;
  onSubmitStep1Email: (assignmentId: string, email: string, screenshotUrl?: string) => void;
  onClickStep3Link: (assignmentId: string, screenshotUrl?: string) => void;
  onLogStep4CheckIn: (assignmentId: string) => void;
  onSubmitBugReport: (bugReport: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }) => void | Promise<void>;
  onRequestWithdrawal: (amount: number, upiId: string) => { success: boolean; error?: string } | Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function TesterDashboard({
  isDarkMode,
  activeTester,
  projects,
  assignments,
  bugs,
  transactions,
  withdrawals,
  notifications,
  onReadNotification,
  onUpdateTesterProfile,
  onJoinProject,
  onSubmitStep1Email,
  onClickStep3Link,
  onLogStep4CheckIn,
  onSubmitBugReport,
  onRequestWithdrawal,
  onLogout,
  initialTab,
  onTabChange
}: TesterDashboardProps) {
  // Tabs: 'dashboard' (Active), 'explore' (Projects), 'wallet', 'bugs' (Support/Bugs), 'profile'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'wallet' | 'bugs' | 'profile'>(() => {
    if (initialTab && ['dashboard', 'explore', 'wallet', 'bugs', 'profile'].includes(initialTab)) {
      return initialTab as any;
    }
    return 'dashboard';
  });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [joiningProjectIds, setJoiningProjectIds] = useState<string[]>([]);

  const handleJoin = async (projectId: string) => {
    if (joiningProjectIds.includes(projectId)) return;
    setJoiningProjectIds((ids) => [...ids, projectId]);
    try {
      await onJoinProject(projectId);
    } finally {
      setJoiningProjectIds((ids) => ids.filter((id) => id !== projectId));
    }
  };

  const openCurrentProjectStep = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    handleTabSelect('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Simulation & Modal States
  const [googlePlayEmail, setGooglePlayEmail] = useState<string>('');
  const [step1ScreenshotFile, setStep1ScreenshotFile] = useState<string>('');
  const [step3ScreenshotFile, setStep3ScreenshotFile] = useState<string>('');
  const [step4ProofFile, setStep4ProofFile] = useState<string>('');
  const [step4BugScreenshotFile, setStep4BugScreenshotFile] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalUpi, setWithdrawalUpi] = useState<string>(activeTester.upiId || '');
  const [withdrawalError, setWithdrawalError] = useState<string>('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<boolean>(false);
  
  // Bug Report Form
  const [bugAppId, setBugAppId] = useState<string>('');
  const [bugTitle, setBugTitle] = useState<string>('');
  const [bugSeverity, setBugSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');
  const [bugReproductionSteps, setBugReproductionSteps] = useState<string[]>(['']);
  const [bugSuccess, setBugSuccess] = useState<boolean>(false);

  // Inline Step 4 Bug Form States
  const [inlineBugTitle, setInlineBugTitle] = useState<string>('');
  const [inlineBugSeverity, setInlineBugSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');
  const [inlineBugSteps, setInlineBugSteps] = useState<string>('');
  const [inlineBugSuccess, setInlineBugSuccess] = useState<boolean>(false);

  // Profile Edit States
  const [profileUpi, setProfileUpi] = useState(activeTester.upiId || '');
  const [profileCountry, setProfileCountry] = useState(activeTester.country || 'India');
  const [profileSpecialty, setProfileSpecialty] = useState(activeTester.specialty || 'General Testing');
  const [profileDevices, setProfileDevices] = useState<string[]>(activeTester.devices || []);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync activeTester UPI when props update
  useEffect(() => {
    if (activeTester) {
      setWithdrawalUpi(activeTester.upiId || '');
      setProfileUpi(activeTester.upiId || '');
      setProfileCountry(activeTester.country || 'India');
      setProfileSpecialty(activeTester.specialty || 'General Testing');
      setProfileDevices(activeTester.devices || []);
    }
  }, [activeTester]);

  useEffect(() => {
    if (initialTab && ['dashboard', 'explore', 'wallet', 'bugs', 'profile'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleTabSelect = (tab: 'dashboard' | 'explore' | 'wallet' | 'bugs' | 'profile') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Derive active testing tasks
  const activeAssignments = assignments.filter(a => a.testerId === activeTester.id && a.status === 'active');
  const completedAssignments = assignments.filter(a => a.testerId === activeTester.id && a.status === 'completed');
  
  // Select first assignment if none selected
  useEffect(() => {
    if (activeAssignments.length > 0 && !selectedAssignmentId) {
      setSelectedAssignmentId(activeAssignments[0].id);
    }
  }, [activeAssignments, selectedAssignmentId]);

  const selectedAssignment = activeAssignments.find(a => a.id === selectedAssignmentId);
  const selectedProject = selectedAssignment ? projects.find(p => p.id === selectedAssignment.projectId) : null;
  const pendingWithdrawals = withdrawals.filter(w => w.testerId === activeTester.id && w.status === 'pending');
  const nextPayoutDate = pendingWithdrawals[0]?.expectedCompletionAt ?? 'No pending payout';
  const pendingVerificationCount = assignments.filter(a =>
    a.testerId === activeTester.id &&
    a.status === 'active' &&
    (a.currentStep === 2 || (a.currentStep === 1 && Boolean(a.step1Screenshot)) || (a.currentStep === 3 && Boolean(a.step3Screenshot)))
  ).length;
  const totalEarnings = transactions
    .filter(t => t.testerId === activeTester.id && t.type === 'credit')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const recentActivity = [
    ...assignments.slice(0, 1).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      icon: <CheckCircle className="w-4 h-4" />,
      iconClass: 'bg-emerald-500/10 text-emerald-505',
      label: `${assignment.status === 'queued' ? 'Queued for' : 'Joined'} ${assignment.appName}`,
      time: assignment.joinedAt,
    })),
    ...projects
      .filter((project) => !assignments.some((assignment) => assignment.projectId === project.id && assignment.testerId === activeTester.id))
      .slice(0, 1)
      .map((project) => ({
        id: `project-${project.id}`,
        icon: <Compass className="w-4 h-4" />,
        iconClass: 'bg-indigo-500/10 text-indigo-500',
        label: `New opportunity available: ${project.name}`,
        time: project.launchDate,
      })),
    ...transactions.slice(0, 2).map((transaction) => ({
      id: `transaction-${transaction.id}`,
      icon: <Wallet className="w-4 h-4" />,
      iconClass: transaction.type === 'credit' ? 'bg-emerald-500/10 text-emerald-505' : 'bg-indigo-500/10 text-indigo-500',
      label: `${transaction.type === 'credit' ? 'Wallet credited' : 'Withdrawal requested'}: ₹${transaction.amount.toFixed(2)}`,
      time: transaction.createdAt,
    })),
    ...bugs.slice(0, 1).map((bug) => ({
      id: `bug-${bug.id}`,
      icon: <Bug className="w-4 h-4" />,
      iconClass: 'bg-amber-500/10 text-amber-500',
      label: `Bug report submitted for ${bug.appName}`,
      time: bug.createdAt,
    })),
  ].slice(0, 4);

  // Derive Reward based on package tier
  const getRewardAmount = (tier?: string) => {
    switch (tier) {
      case 'launch_ready': return 2500;
      case 'managed_testing': return 1200;
      case 'custom': return 1800;
      default: return 400; // testers_only
    }
  };

  const handleWithdrawalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWithdrawalError('');
    setWithdrawalSuccess(false);

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawalError('Please enter a valid amount.');
      return;
    }

    if (amount > activeTester.walletBalance) {
      setWithdrawalError('Withdrawal amount exceeds your available balance.');
      return;
    }

    if (!withdrawalUpi.trim()) {
      setWithdrawalError('UPI VPA ID is required.');
      return;
    }

    const res = await onRequestWithdrawal(amount, withdrawalUpi);
    if (res.success) {
      setWithdrawalSuccess(true);
      setWithdrawalAmount('');
    } else {
      setWithdrawalError(res.error || 'Failed to submit withdrawal.');
    }
  };

  const [bugErrors, setBugErrors] = useState<{ bugAppId?: string; bugTitle?: string; bugSteps?: string }>({});

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBugSuccess(false);
    setBugErrors({});

    const errs: typeof bugErrors = {};
    if (!bugAppId) errs.bugAppId = 'Please select an application.';
    if (!bugTitle.trim()) errs.bugTitle = 'Please provide a bug summary.';
    
    const stepsFiltered = bugReproductionSteps.filter(s => s.trim() !== '');
    if (stepsFiltered.length === 0) errs.bugSteps = 'Please provide at least one reproduction step.';

    if (Object.keys(errs).length > 0) {
      setBugErrors(errs);
      return;
    }

    const targetProject = projects.find(p => p.id === bugAppId);
    if (!targetProject) return;

    await onSubmitBugReport({
      appId: bugAppId,
      appName: targetProject.name,
      title: bugTitle,
      severity: bugSeverity,
      status: 'Open',
      device: activeTester.devices[0] || 'Google Pixel 8 Pro',
      osVersion: 'Android 14 (API 34)',
      reproductionSteps: stepsFiltered
    });

    setBugSuccess(true);
    setBugTitle('');
    setBugReproductionSteps(['']);
    setBugErrors({});
    setTimeout(() => setBugSuccess(false), 3000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);

    if (!profileUpi.trim()) {
      alert('UPI ID is required to receive payouts.');
      return;
    }

    await onUpdateTesterProfile({
      upiId: profileUpi,
      country: profileCountry,
      specialty: profileSpecialty,
      devices: profileDevices
    });

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Helper to get step title and instructions
  const getStepDetails = (step: number) => {
    switch (step) {
      case 1: 
        return {
          title: 'Verification',
          description: 'Submit your Google Play email address so the developer can add you to the closed-testing track.'
        };
      case 2: 
        return {
          title: 'Google Email Review',
          description: 'Awaiting the admin to add your email address to the Google Play Console testing list (takes ~2-3 hours).'
        };
      case 3: 
        return {
          title: 'Play Store Invite',
          description: 'Accept the Play Store invitation and download the app track onto your device.'
        };
      case 4: 
        return {
          title: 'Testing Period',
          description: 'Keep the app installed and launch it daily for 14 consecutive days.'
        };
      case 5: 
        return {
          title: 'Production Review',
          description: 'Awaiting Google Play Console production release approval (takes ~7+ days).'
        };
      case 6: 
        return {
          title: 'Completion',
          description: 'Reward credited! You can now safely uninstall the app.'
        };
      default: 
        return { title: '', description: '' };
    }
  };

  // Sidebar navigation elements
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-5 h-5" /> },
    { id: 'explore', label: 'Projects', icon: <FolderCheck className="w-5 h-5" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
    { id: 'bugs', label: 'Support', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile Settings', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className={`h-screen overflow-hidden font-sans transition-colors duration-300 flex ${
      isDarkMode ? 'bg-[#09090B] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. Left Sidebar Navigation */}
      <aside className={`w-[260px] border-r shrink-0 hidden md:flex flex-col justify-between p-6 sticky top-0 h-screen ${
        isDarkMode ? 'bg-[#09090B] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center transform rotate-12">
              <span className="text-white font-extrabold italic text-sm">LO</span>
            </div>
            <span className="font-black tracking-wider text-lg uppercase">
              Launch<span className="text-indigo-600">Ops</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => {
              const isActive = activeTab === link.id;
              
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id as any);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border border-transparent cursor-pointer bg-transparent text-left ${
                    isActive
                      ? isDarkMode 
                        ? 'bg-zinc-800/60 text-white font-bold' 
                        : 'bg-indigo-50/70 text-indigo-600 font-bold'
                      : isDarkMode
                        ? 'text-slate-450 hover:bg-zinc-900 hover:text-slate-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Box */}
        <div className={`rounded-2xl p-4 text-center border relative overflow-hidden ${
          isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-indigo-50/30 border-indigo-100/50'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">Available for Testing</span>
          <p className={`text-[10px] leading-relaxed mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            You will receive new opportunities here.
          </p>
          <button 
            onClick={() => setActiveTab('explore')}
            className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer bg-transparent ${
              isDarkMode
                ? 'border-zinc-700 hover:border-zinc-600 text-white hover:bg-zinc-800/30'
                : 'border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            Refresh Opportunities
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* 2. Top Header Bar */}
        <header className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xs ${
          isDarkMode ? 'bg-[#09090B]/90 border-zinc-800' : 'bg-white/95 border-slate-200'
        }`}>
          <div>
            <h1 className={`text-xl font-extrabold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, {activeTester.name.split(' ')[0]}! 
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Ready to test amazing apps and earn rewards</p>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Bell Notifications */}
            <button onClick={() => setNotificationDropdownOpen((open) => !open)} className={`p-2 rounded-xl relative border cursor-pointer bg-transparent ${
              isDarkMode ? 'border-zinc-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
            }`}>
              <Bell className="w-5 h-5" />
              {notifications.some((notification) => !notification.readAt) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white" />}
            </button>
            {notificationDropdownOpen && (
              <div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border p-2 shadow-xl z-50 ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'}`}>
                {notifications.length === 0 ? <p className="p-3 text-xs text-slate-500">No notifications.</p> : notifications.map((notification) => (
                  <button key={notification._id} onClick={() => { onReadNotification(notification._id); if (notification.type === 'project_opportunity') handleTabSelect('explore'); setNotificationDropdownOpen(false); }} className={`w-full text-left p-3 rounded-lg text-xs border mb-1 transition-colors ${notification.readAt ? (isDarkMode ? 'bg-zinc-900/70 border-zinc-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500') : (isDarkMode ? 'bg-indigo-500/15 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')}`}>
                    <span className="flex items-center justify-between gap-2 font-bold"><span>{notification.type === 'project_opportunity' ? 'New testing opportunity' : notification.type.replace(/_/g, ' ')}</span><span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-full ${notification.readAt ? 'bg-slate-500/10 text-slate-500' : 'bg-indigo-600 text-white'}`}>{notification.readAt ? 'Read' : 'New'}</span></span>
                    <span className="text-slate-500 block mt-1">{String(notification.payload.appName ?? '')}</span>
                    {notification.payload.requiredDeviceModels?.length ? <span className="text-indigo-500 block mt-1">Device: {notification.payload.requiredDeviceModels.join(', ')}</span> : null}
                  </button>
                ))}
              </div>
            )}

            {/* Profile Avatar Trigger */}
            <div 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center gap-3 pl-3 border-l cursor-pointer ${
                isDarkMode ? 'border-zinc-805' : 'border-slate-200'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 font-display">
                {activeTester.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeTester.name}</span>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className={`absolute right-0 top-12 w-48 rounded-xl border p-2 shadow-lg z-50 ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <button
                  onClick={() => { setActiveTab('profile'); setUserDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-500/10 cursor-pointer border-0 bg-transparent"
                >
                  My Profile Settings
                </button>
                <button
                  onClick={() => { setActiveTab('wallet'); setUserDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-500/10 cursor-pointer border-0 bg-transparent"
                >
                  Wallet Ledger
                </button>
                <div className="border-t my-1 opacity-10" />
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 cursor-pointer border-0 bg-transparent"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Outer Dashboard Scroll Container */}
        <div className="p-4 md:p-6 pb-24 md:pb-6 flex-grow overflow-y-auto space-y-8">
          
          {/* Tab Content Router */}

          {/* TAB 1: MAIN DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* A. Three Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* 1. Wallet Balance */}
                <div className={`border rounded-2xl p-5 flex items-center justify-between relative overflow-hidden transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-card-dark card-glow-indigo' 
                    : 'glass-card-light card-glow-indigo border-indigo-500/10'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-indigo-500 animate-float" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wallet Balance</span>
                      <h3 className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{activeTester.walletBalance.toFixed(2)}</h3>
                      <span className="text-[10px] text-slate-500 mt-1 block">Withdrawable Balance: ₹{activeTester.walletBalance.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleTabSelect('wallet'); }}
                    className="px-4 py-2 text-white rounded-xl text-xs font-bold transition-all border-0 shadow-md cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Withdraw
                  </button>
                </div>

                {/* 2. Next Payout */}
                <div className={`border rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-card-dark card-glow-emerald' 
                    : 'glass-card-light card-glow-emerald border-emerald-500/10'
                }`}>
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-emerald-505" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next Payout</span>
                    <h3 className={`text-lg font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </h3>
                    <span className="text-[10px] text-slate-500 mt-1 block">Expected date of next payout</span>
                  </div>
                </div>

                {/* 3. Tester Status */}
                <div className={`border rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden transition-all duration-300 ${
                  isDarkMode 
                    ? 'glass-card-dark card-glow-blue' 
                    : 'glass-card-light card-glow-blue border-blue-500/10'
                }`}>
                  <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-550 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tester Status</span>
                    <h3 className={`text-lg font-black mt-1 text-blue-500 ${isDarkMode ? 'text-white' : ''}`}>Active</h3>
                    <span className="text-[10px] text-slate-500 mt-1 block">You are available for new projects</span>
                  </div>
                </div>
              </div>

              {/* B. Overview 6-Card Grid */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block font-mono">Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  
                  {/* Card 1: Completed */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-indigo' 
                      : 'glass-card-light card-glow-indigo border-indigo-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Projects Completed</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{completedAssignments.length}</span>
                      <span className="text-[9px] font-semibold text-emerald-500 mt-2 block">Completed tracks</span>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-500"><FolderCheck className="w-4 h-4" /></div>
                  </div>

                  {/* Card 2: Active */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-indigo' 
                      : 'glass-card-light card-glow-indigo border-indigo-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Active Projects</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {activeAssignments.filter(a => a.status === 'active').length}
                      </span>
                      <span className="text-[9px] font-semibold text-indigo-500 mt-2 block">Currently in progress</span>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-555"><Calendar className="w-4 h-4" /></div>
                  </div>

                  {/* Card 3: Pending */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-amber' 
                      : 'glass-card-light card-glow-amber border-amber-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Pending Verification</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{pendingVerificationCount}</span>
                      <span className="text-[9px] font-semibold text-amber-505 mt-2 block">Awaiting admin review</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/5 text-amber-500"><Clock className="w-4 h-4" /></div>
                  </div>

                  {/* Card 4: Earnings */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-emerald' 
                      : 'glass-card-light card-glow-emerald border-emerald-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Total Earnings</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{totalEarnings.toFixed(2)}</span>
                      <span className="text-[9px] font-semibold text-emerald-555 mt-2 block">Backend ledger</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 text-emerald-500"><Landmark className="w-4 h-4" /></div>
                  </div>

                  {/* Card 5: Bugs */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-indigo' 
                      : 'glass-card-light card-glow-indigo border-indigo-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Bug Reports Submitted</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeTester.bugsFoundCount}</span>
                      <span className="text-[9px] font-semibold text-indigo-555 mt-2 block">Submitted reports</span>
                    </div>
                    <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-500"><Bug className="w-4 h-4" /></div>
                  </div>

                  {/* Card 6: Rating */}
                  <div className={`border rounded-2xl p-4 text-left flex justify-between items-start relative transition-all duration-300 ${
                    isDarkMode 
                      ? 'glass-card-dark card-glow-amber' 
                      : 'glass-card-light card-glow-amber border-amber-500/10'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block">Rating</span>
                      <span className={`text-2xl font-black block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeTester.rating}</span>
                      <span className="text-[9px] font-semibold text-slate-500 mt-2 block">
                        {activeTester.rating > 0 ? 'Backend rating' : 'No reviews yet'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/5 text-amber-500"><Star className="w-4 h-4 fill-amber-500 stroke-amber-500" /></div>
                  </div>
                </div>
              </div>

              {/* C. Main Section Grid Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT MAIN SPLIT COLUMN */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* 1. Current Project */}
                  <div className={`border rounded-2xl p-6 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-4 mb-5">
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Current Project</h3>
                      <button 
                        onClick={() => setActiveTab('explore')}
                        className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        View All
                      </button>
                    </div>

                    {!selectedAssignment || !selectedProject ? (
                      <div className="text-center py-10 text-slate-500">
                        <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                        <p className="text-sm font-semibold">No active testing tracks at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Title Header Card */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/5 rounded-xl flex items-center justify-center shrink-0">
                              <Compass className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <h4 className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedAssignment.appName}</h4>
                              <span className="text-[10px] text-slate-500">{selectedProject.category}</span>
                            </div>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            In Progress
                          </span>
                        </div>

                        {/* Four Metrics Grid */}
                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl text-center border ${
                          isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50/50 border-slate-200/60'
                        }`}>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Reward</span>
                            <span className={`text-sm font-black mt-1 block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              ₹{getRewardAmount(selectedProject.packageTier)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Progress</span>
                            <span className="text-sm font-black mt-1 text-indigo-500 block">Step {selectedAssignment.currentStep} of 6</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Deadline</span>
                            <span className={`text-sm font-black mt-1 block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedProject.launchDate}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Slots</span>
                            <span className={`text-sm font-black mt-1 block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {selectedProject.testersCount}/{selectedProject.testersRequired ?? 0}
                            </span>
                          </div>
                        </div>

                        {/* 6-Step Visual Stepper */}
                        <div className="pt-2 pb-1">
                          <div className="flex items-center justify-between relative mb-2">
                            {/* Connective Line */}
                            <div className={`absolute top-4 left-0 right-0 h-0.5 z-0 ${
                              isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'
                            }`} />
                            <div 
                              className="absolute top-4 left-0 h-0.5 bg-indigo-600 transition-all duration-500 z-0" 
                              style={{ width: `${((selectedAssignment.currentStep - 1) / 5) * 100}%` }}
                            />

                            {/* Stepper Dots */}
                            {[1, 2, 3, 4, 5, 6].map((stepNum) => {
                              const isCompleted = selectedAssignment.currentStep > stepNum;
                              const isActive = selectedAssignment.currentStep === stepNum;

                              return (
                                <div key={stepNum} className="flex flex-col items-center z-10 relative">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : isActive
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                        : isDarkMode
                                          ? 'bg-zinc-900 border-zinc-800 text-slate-500'
                                          : 'bg-white border-slate-200 text-slate-450'
                                  }`}>
                                    {isCompleted ? <Check className="w-4 h-4 font-black" /> : stepNum}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Label descriptions */}
                          <div className="flex justify-between text-[9px] font-bold text-center uppercase tracking-wider text-slate-500 font-mono">
                            <span className="w-12 text-left">1. Verify</span>
                            <span className="w-12">2. Review</span>
                            <span className="w-12">3. Invite</span>
                            <span className="w-12">4. Test 14d</span>
                            <span className="w-12">5. Review</span>
                            <span className="w-12 text-right">6. Done</span>
                          </div>
                        </div>

                        {/* Active Task Console */}
                        <div className={`border rounded-xl p-5 ${
                          isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                              Current Step: {getStepDetails(selectedAssignment.currentStep).title}
                            </h5>
                          </div>
                          <p className={`text-xs leading-relaxed mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {getStepDetails(selectedAssignment.currentStep).description}
                          </p>

                          {/* Email Address Registration (Step 1) */}
                          {selectedAssignment.currentStep === 1 && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Google Play Email Address
                                  </label>
                                  <input 
                                    type="email" 
                                    placeholder="Enter your Google Play email address..."
                                    value={googlePlayEmail}
                                    onChange={(e) => setGooglePlayEmail(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-indigo-500/50 ${
                                      isDarkMode 
                                        ? 'bg-zinc-900/50 border-zinc-805 text-white' 
                                        : 'bg-white border-slate-200 text-slate-900'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                    Verification Profile Screenshot
                                  </label>
                                  <div className={`border border-dashed rounded-xl px-4 py-2 text-center cursor-pointer hover:border-indigo-500/50 transition-colors ${
                                    isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                                  }`}>
                                    <Upload className="w-3.5 h-3.5 text-slate-500 mx-auto mb-0.5" />
                                    <span className="text-[10px] block font-bold text-slate-400 truncate">
                                      {step1ScreenshotFile ? step1ScreenshotFile : 'Click to select screenshot proof'}
                                    </span>
                                    <input 
                                      type="text" 
                                      placeholder="Paste uploaded proof URL..."
                                      value={step1ScreenshotFile}
                                      onChange={(e) => setStep1ScreenshotFile(e.target.value)}
                                      className="mt-1 w-full text-center border-0 bg-transparent text-[9px] text-indigo-500 outline-hidden font-bold"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!googlePlayEmail.includes('@')) {
                                    alert('Please enter a valid email address.');
                                    return;
                                  }
                                  if (!step1ScreenshotFile.trim()) {
                                    alert('Please paste the uploaded proof URL.');
                                    return;
                                  }
                                  await onSubmitStep1Email(selectedAssignment.id, googlePlayEmail, step1ScreenshotFile);
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer border-0 shadow-md"
                              >
                                Submit Details & Screenshot
                              </button>
                            </div>
                          )}

                          {/* Google Email Review (Step 2) */}
                          {selectedAssignment.currentStep === 2 && (
                            <div className="text-center py-4 space-y-4">
                              <Hourglass className="w-9 h-9 text-amber-500 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
                              <h5 className="font-bold text-sm">Reviewing play store email address</h5>
                              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                The developer is adding your email address <strong>{selectedAssignment.testerEmail}</strong> to the closed-testing email list.
                              </p>
                              {selectedAssignment.step1Screenshot && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Verification File: <span className="text-indigo-405 font-bold">{selectedAssignment.step1Screenshot}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Play Store Invitation (Step 3) */}
                          {selectedAssignment.currentStep === 3 && (
                            <div className="space-y-4">
                              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                                isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-100/50 border-slate-200'
                              }`}>
                                <div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-mono">Accept Link</span>
                                  <span className="text-xs font-mono text-indigo-405 font-bold">/t/{selectedAssignment.id}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    // Click action logs link opening
                                    onClickStep3Link(selectedAssignment.id, '');
                                  }}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 border-0 cursor-pointer rounded-lg shadow-sm"
                                >
                                  Accept invite link <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {selectedAssignment.step3Clicked && (
                                <div className="space-y-3 pt-2 border-t border-dashed border-slate-200 dark:border-zinc-800">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Upload App Installation Proof Screenshot
                                  </label>
                                  <div className={`border border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500/50 transition-colors ${
                                    isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-500/5 border-slate-200'
                                  }`}>
                                    <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                                    <span className="text-[11px] block font-bold text-slate-400 truncate">
                                      {step3ScreenshotFile ? step3ScreenshotFile : 'Click to select installation screenshot proof'}
                                    </span>
                                    <input 
                                      type="text" 
                                      placeholder="Paste uploaded proof URL..."
                                      value={step3ScreenshotFile}
                                      onChange={(e) => setStep3ScreenshotFile(e.target.value)}
                                      className="mt-1.5 w-full text-center border-0 bg-transparent text-[10px] text-indigo-500 outline-hidden font-bold"
                                    />
                                  </div>
                                  <button
                                    onClick={async () => {
                                      if (!step3ScreenshotFile.trim()) {
                                        alert('Please paste the uploaded proof URL.');
                                        return;
                                      }
                                      await onClickStep3Link(selectedAssignment.id, step3ScreenshotFile);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer border-0 shadow-md"
                                  >
                                    Submit Screenshot Proof
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 14-Day closed-testing (Step 4) */}
                          {selectedAssignment.currentStep === 4 && (
                            <div className="space-y-5">
                              {/* Check-in Logs timeline */}
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">Check-in Logs</span>
                                <div className="grid grid-cols-7 gap-2">
                                  {[...Array(14)].map((_, index) => {
                                    const dayNum = index + 1;
                                    const isDone = selectedAssignment.step4CheckInsCompleted >= dayNum;
                                    const isCurrent = selectedAssignment.step4CheckInsCompleted === index;
                                    return (
                                      <div
                                        key={index}
                                        className={`border rounded-lg p-2 text-center flex flex-col items-center justify-center ${
                                          isDone
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            : isCurrent
                                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-500 font-bold animate-pulse'
                                              : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-slate-700' : 'bg-white border-slate-200 text-slate-400'
                                        }`}
                                      >
                                        <span className="text-[8px] font-mono">D{dayNum}</span>
                                        <span className="mt-1.5">
                                          {isDone ? <Check className="w-3 h-3 text-emerald-500 font-bold" /> : <Calendar className="w-3 h-3 text-slate-500" />}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                  onClick={() => onLogStep4CheckIn(selectedAssignment.id)}
                                  disabled={selectedAssignment.step4CheckInsCompleted >= 14}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-0 shadow-md shadow-indigo-500/5"
                                >
                                  {selectedAssignment.step4CheckInsCompleted >= 14
                                    ? 'All 14 Days Completed'
                                    : `Log Check-In (Day ${selectedAssignment.step4CheckInsCompleted + 1})`}
                                </button>
                                <button
                                  hidden
                                  className="hidden"
                                >
                                  Simulate Fast Forward Day ⏩
                                </button>
                              </div>

                              {/* Inline Bug Reporting Module */}
                              <div className={`mt-5 pt-5 border-t border-dashed ${isDarkMode ? 'border-zinc-800' : 'border-slate-105'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Bug className="w-4 h-4 text-indigo-500" />
                                  <h6 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Found a bug? Submit it here for payout bonus!
                                  </h6>
                                </div>

                                {inlineBugSuccess ? (
                                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs text-center font-bold mb-3">
                                    Bug report submitted successfully!
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Bug Summary (e.g. Crash on launch)"
                                        value={inlineBugTitle}
                                        onChange={(e) => setInlineBugTitle(e.target.value)}
                                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500/50 ${
                                          isDarkMode ? 'bg-zinc-900/50 border-zinc-805 text-white' : 'bg-white border-slate-200 text-slate-900'
                                        }`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <select
                                          value={inlineBugSeverity}
                                          onChange={(e) => setInlineBugSeverity(e.target.value as any)}
                                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500/50 ${
                                            isDarkMode ? 'bg-zinc-900/50 border-zinc-805 text-white' : 'bg-white border-slate-200 text-slate-900'
                                          }`}
                                        >
                                          <option value="Low">Low Severity</option>
                                          <option value="Medium">Medium Severity</option>
                                          <option value="High">High Severity</option>
                                          <option value="Critical">Critical Severity</option>
                                        </select>
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Reproduction steps..."
                                          value={inlineBugSteps}
                                          onChange={(e) => setInlineBugSteps(e.target.value)}
                                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500/50 ${
                                            isDarkMode ? 'bg-zinc-900/50 border-zinc-805 text-white' : 'bg-white border-slate-200 text-slate-900'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className={`border border-dashed rounded-xl px-3 py-2 text-center cursor-pointer hover:border-indigo-500/50 transition-colors ${
                                        isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                                      }`}>
                                        <span className="text-[10px] block font-bold text-slate-400">
                                          {step4BugScreenshotFile ? step4BugScreenshotFile : 'Upload Bug Screenshot Proof'}
                                        </span>
                                        <input
                                          type="text"
                                          placeholder="Paste uploaded bug proof URL..."
                                          value={step4BugScreenshotFile}
                                          onChange={(e) => setStep4BugScreenshotFile(e.target.value)}
                                          className="mt-1 w-full text-center border-0 bg-transparent text-[9px] text-indigo-500 outline-hidden font-bold"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (!inlineBugTitle.trim()) return alert('Please enter a bug title.');
                                        if (!inlineBugSteps.trim()) return alert('Please describe reproduction steps.');

                                        await onSubmitBugReport({
                                          appId: selectedProject.id,
                                          appName: selectedProject.name,
                                          title: inlineBugTitle,
                                          severity: inlineBugSeverity,
                                          device: activeTester.devices[0] || 'Google Pixel 8',
                                          osVersion: 'Android 14',
                                          reproductionSteps: [inlineBugSteps],
                                          screenshot: step4BugScreenshotFile || undefined,
                                          status: 'Open'
                                        });

                                        setInlineBugSuccess(true);
                                        setInlineBugTitle('');
                                        setInlineBugSteps('');
                                        setStep4BugScreenshotFile('');
                                        setTimeout(() => setInlineBugSuccess(false), 3000);
                                      }}
                                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase py-2 rounded-lg cursor-pointer border-0 shadow-sm"
                                    >
                                      Submit Bug Report
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Production Application Review (Step 5) */}
                          {selectedAssignment.currentStep === 5 && (
                            <div className="text-center py-4 space-y-4">
                              <Hourglass className="w-9 h-9 text-indigo-400 mx-auto animate-pulse" />
                              <h5 className="font-bold text-sm">Google Play console Review in Progress</h5>
                              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                The developer has submitted the 14-day closed testing reports. We are awaiting Google Play's approval.
                              </p>
                              {selectedAssignment.step3Screenshot && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Installation Proof: <span className="text-indigo-405 font-bold">{selectedAssignment.step3Screenshot}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Step 6: Completion */}
                          {selectedAssignment.currentStep === 6 && (
                            <div className="text-center py-4 space-y-2">
                              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                              <h5 className="font-bold text-sm">App Testing Track Successfully Completed!</h5>
                              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                Payout has been fully credited. You are free to delete the app from your device.
                              </p>
                            </div>
                          )}

                          {/* Fallback Step Action */}
                          {selectedAssignment.currentStep > 1 && selectedAssignment.currentStep !== 2 && selectedAssignment.currentStep !== 3 && selectedAssignment.currentStep !== 4 && selectedAssignment.currentStep !== 5 && selectedAssignment.currentStep !== 6 && (
                            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer shadow-md">
                              Continue Task
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Recent Activity */}
                  <div className={`border rounded-2xl p-6 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-4 mb-5">
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Recent Activity</h3>
                      <button className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                        View All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {recentActivity.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No recent backend activity yet.</p>
                      ) : (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.iconClass}`}>
                                {activity.icon}
                              </div>
                              <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {activity.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{activity.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT MAIN SPLIT COLUMN */}
                <div className="lg:col-span-5 space-y-8">
                  
                  {/* 1. Available Opportunities */}
                  {(
                  <div className={`border rounded-2xl p-6 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-4 mb-5">
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Available Opportunities</h3>
                      <button 
                        onClick={() => setActiveTab('explore')}
                        className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        View All
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {projects.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No open projects right now.</p>
                      ) : (
                        projects.map((p) => {
                          const alreadyJoined = assignments.some(a => a.projectId === p.id && a.testerId === activeTester.id);
                          return (
                            <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                              <div>
                                <h4 className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {p.name}
                                </h4>
                                <div className="flex items-center gap-2 text-slate-500 mt-1 font-semibold">
                                  <span>₹{getRewardAmount(p.packageTier)}</span>
                                  <span>•</span>
                                  <span>{p.category}</span>
                                  <span>•</span>
                                  <span>{p.testersCount}/{p.testersRequired ?? 14} slots</span>
                                  <span>•</span>
                                  <span>{p.waitlistCount ?? 0}/3 waitlist</span>
                                </div>
                              </div>
                              {alreadyJoined ? (
                                <span className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-500 bg-slate-500/10">
                                  Joined
                                </span>
                              ) : (
                                <button
                                  onClick={() => { void handleJoin(p.id); }}
                                  disabled={p.joinState === 'closed' || joiningProjectIds.includes(p.id)}
                                  className={`px-4 py-2 border rounded-xl text-xs font-extrabold transition-all cursor-pointer bg-transparent ${
                                    isDarkMode
                                      ? 'border-zinc-700 hover:border-zinc-600 text-white hover:bg-zinc-800/30'
                                      : 'border-indigo-500 hover:bg-indigo-50/20 text-indigo-600'
                                  }`}
                                >
                                  {joiningProjectIds.includes(p.id) ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Joining...</span> : p.joinState === 'closed' ? 'Enrollment Closed' : p.joinState === 'full' ? `Join Waitlist (${p.waitlistCount ?? 0}/3)` : 'Join'}
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  )}

                  {/* Wallet Summary */}
                  <div className={`border rounded-2xl p-6 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-4 mb-5">
                      <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Wallet Summary</h3>
                      <button 
                        onClick={() => setActiveTab('wallet')}
                        className="text-xs font-bold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-4 mb-6 text-xs font-semibold">
                      <div className="flex justify-between border-b pb-3 border-slate-100 dark:border-zinc-800/50">
                        <span className="text-slate-500">Total Balance</span>
                        <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>₹{activeTester.walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-3 border-slate-100 dark:border-zinc-800/50">
                        <span className="text-slate-500">Withdrawable Balance</span>
                        <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>₹{activeTester.walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-500">Pending Earnings</span>
                        <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>₹0.00</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('wallet')}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer border-0 shadow-lg shadow-indigo-500/10 text-center block"
                    >
                      Withdraw Funds
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPLORE / PROJECTS LIST */}
          {activeTab === 'explore' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Testing Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((p) => {
                  const assignment = assignments.find(a => a.projectId === p.id && a.testerId === activeTester.id);
                  const isJoined = !!assignment;
                  
                  return (
                    <div
                      key={p.id}
                      className={`border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between ${
                        isDarkMode 
                          ? 'bg-[#18181B] border-zinc-800' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className={`font-extrabold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.name}</h4>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{p.version} · {p.category}</span>
                          </div>
                          <span className="px-3 py-1 rounded-xl text-xs font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/20">
                            ₹{getRewardAmount(p.packageTier)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Requirements:</span>
                            <span className="font-semibold">Android 7.0+</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Status:</span>
                            <span className="font-semibold capitalize text-indigo-405">
                              {isJoined ? assignment.status === 'queued' ? `Queued #${assignment.queuePosition}` : 'Joined' : 'Open'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Tester slots:</span>
                            <span className="font-semibold">{p.testersCount}/{p.testersRequired ?? 14}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Waitlist:</span>
                            <span className="font-semibold">{p.waitlistCount ?? 0}/3</span>
                          </div>
                        </div>

                        {/* 6-Step Progress Tracker Preview */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/50 mb-6">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5 font-mono">
                            Testing Workflow Steps
                          </span>
                          <div className="space-y-2">
                            {[
                              { stepNum: 1, title: 'Step 1: Verification' },
                              { stepNum: 2, title: 'Step 2: Google Email Review' },
                              { stepNum: 3, title: 'Step 3: Play Store Invite' },
                              { stepNum: 4, title: 'Step 4: Testing Period (14 Days)' },
                              { stepNum: 5, title: 'Step 5: Production Review' },
                              { stepNum: 6, title: 'Step 6: Completion' }
                            ].map((stepItem) => {
                              const isStepDone = isJoined && assignment.currentStep > stepItem.stepNum;
                              const isStepActive = isJoined && assignment.status === 'active' && assignment.currentStep === stepItem.stepNum;
                              const isStepLocked = !isJoined || assignment.currentStep < stepItem.stepNum;

                              return (
                                <button
                                  key={stepItem.stepNum} 
                                  type="button"
                                  disabled={!isStepActive}
                                  onClick={() => isStepActive && openCurrentProjectStep(assignment.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all text-left ${isStepActive ? 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/10' : 'cursor-default'} ${
                                    isStepDone
                                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500'
                                      : isStepActive
                                        ? 'bg-indigo-600/5 border-indigo-500/20 text-indigo-500'
                                        : isDarkMode
                                          ? 'bg-zinc-900/40 border-zinc-800/40 text-slate-500'
                                          : 'bg-slate-50 border-slate-150 text-slate-500'
                                  }`}
                                >
                                  <span>{stepItem.title}</span>
                                  {isStepDone ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Completed</span>
                                  ) : isStepActive ? (
                                    <span className="flex items-center gap-1 text-indigo-600 font-bold uppercase text-[9px] tracking-wider shrink-0">
                                      Open step <ArrowRight className="w-3 h-3" />
                                    </span>
                                  ) : isStepLocked ? (
                                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold shrink-0">
                                      Locked
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-slate-450 font-bold shrink-0">
                                      Unlocked
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {isJoined ? (
                        assignment.status === 'queued' ? (
                          <span className="w-full py-2.5 rounded-xl font-bold text-xs border border-amber-500/20 bg-amber-500/5 text-amber-500 text-center">
                            Waitlisted #{assignment.queuePosition}
                          </span>
                        ) : (
                          <button
                            onClick={() => openCurrentProjectStep(assignment.id)}
                            className="w-full py-2.5 rounded-xl font-bold text-xs border border-indigo-500/20 bg-indigo-500/5 text-indigo-500 cursor-pointer hover:bg-indigo-500/10 transition-colors"
                          >
                            Open Current Step {assignment.currentStep}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => { void handleJoin(p.id); }}
                          disabled={p.joinState === 'closed' || joiningProjectIds.includes(p.id)}
                          className="w-full btn-gradient text-white py-2.5 rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md"
                        >
                          {joiningProjectIds.includes(p.id) ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Joining project...</span> : p.joinState === 'closed' ? 'Enrollment Closed (14 + 3)' : p.joinState === 'full' ? `Enter Waitlist (${p.waitlistCount ?? 0}/3)` : 'Join Testing Track'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Previous Works / Completed Campaigns */}
              <div className="mt-12 pt-8 border-t border-slate-200/40">
                <h3 className={`text-lg font-black mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Previous Works (Completed Campaigns)</h3>
                
                {completedAssignments.length === 0 ? (
                  <div className={`p-8 border rounded-2xl text-center ${isDarkMode ? 'border-zinc-850 bg-zinc-950/20' : 'border-slate-200 bg-white'}`}>
                    <p className="text-xs text-slate-400">No completed campaigns yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedAssignments.map((ass) => {
                      const p = projects.find(proj => proj.id === ass.projectId);
                      return (
                        <div 
                          key={ass.id}
                          className={`p-6 border rounded-2xl ${
                            isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{ass.appName}</h4>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{p?.category || 'Utility'}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Completed
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between">
                              <span>Reward Earned:</span>
                              <span className="font-bold text-indigo-500">₹{getRewardAmount(p?.packageTier)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Closed Testing Runs:</span>
                              <span className="font-semibold">{ass.step4CheckInsCompleted}/14 Days Logged</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Testing Device:</span>
                              <span className="font-semibold">{activeTester.devices[0] || 'Mobile Device'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WALLET & CASHOUT LEDGER */}
          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Cashout Request Block */}
              <div className="lg:col-span-5 space-y-6">
                <div className={`border rounded-2xl p-6 ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <h3 className={`text-base font-bold tracking-tight mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Landmark className="w-5 h-5 text-indigo-500" /> Request Withdrawal
                  </h3>

                  {withdrawalSuccess && (
                    <div className="mb-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Withdrawal request submitted! SLA timer set.
                    </div>
                  )}

                  {withdrawalError && (
                    <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {withdrawalError}
                    </div>
                  )}

                  <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Withdrawal Amount (INR)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
                          isDarkMode 
                            ? `${withdrawalError && (withdrawalError.includes('amount') || withdrawalError.includes('balance') || withdrawalError.includes('valid')) ? 'border-red-500 bg-red-500/5' : 'bg-zinc-950/60 border-zinc-800'} text-white` 
                            : `${withdrawalError && (withdrawalError.includes('amount') || withdrawalError.includes('balance') || withdrawalError.includes('valid')) ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-900`
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Available balance: ₹{activeTester.walletBalance}</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                        UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        value={withdrawalUpi}
                        onChange={(e) => setWithdrawalUpi(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
                          isDarkMode 
                            ? `${withdrawalError && withdrawalError.includes('UPI') ? 'border-red-500 bg-red-500/5' : 'bg-zinc-950/60 border-zinc-800'} text-white` 
                            : `${withdrawalError && withdrawalError.includes('UPI') ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-900`
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full text-white py-2.5 rounded-xl font-bold text-xs border-0 cursor-pointer shadow-md hover:opacity-90 transition-all"
                      style={{ backgroundColor: '#4F46E5' }}
                    >
                      Request Payout (UPI)
                    </button>

                    <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
                      *Payouts are manual UPI transfers processed directly by admins. Withdrawal request has an SLA of **48 hours**.
                    </p>
                  </form>
                </div>
              </div>

              {/* Transactions Ledger & SLA counts */}
              <div className="lg:col-span-7 space-y-6">
                {/* Active Withdrawals Countdown */}
                {withdrawals.filter(w => w.testerId === activeTester.id).length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">Pending Payout SLA</span>
                    <div className="space-y-3">
                      {withdrawals
                        .filter(w => w.testerId === activeTester.id)
                        .map((w) => {
                          const isPending = w.status === 'pending';
                          return (
                            <div
                              key={w.id}
                              className={`border p-4 rounded-xl flex items-center justify-between gap-4 ${
                                isPending
                                  ? isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'
                                  : isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className={`w-5 h-5 shrink-0 ${isPending ? 'text-indigo-500' : 'text-slate-500'}`} />
                                <div>
                                  <span className={`text-sm font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{w.amount} Cashout</span>
                                  <span className="text-[10px] text-slate-500">UPI: {w.upiId} · Requested {w.createdAt}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase inline-block border ${
                                  w.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : w.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                  {w.status}
                                </span>
                                {isPending && (
                                  <span className="text-[9px] font-bold block mt-1.5 font-mono text-indigo-400">
                                    SLA: 48h (Est: {w.expectedCompletionAt})
                                  </span>
                                )}
                                {w.transactionId && (
                                  <span className="text-[9px] block mt-1.5 font-mono text-slate-500">
                                    Txn ID: {w.transactionId}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Ledger Entries */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">Ledger Entries</span>
                  <div className={`border rounded-2xl overflow-hidden ${
                    isDarkMode ? 'bg-slate-900/20 border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    {transactions.filter(t => t.testerId === activeTester.id).length === 0 ? (
                      <p className="text-xs text-slate-500 p-6 text-center">No ledger transactions found.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {transactions
                          .filter(t => t.testerId === activeTester.id)
                          .map((t) => (
                            <div key={t.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-500/5 transition-colors">
                              <div>
                                <span className={`font-semibold block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.description}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{t.createdAt}</span>
                              </div>
                              <span className={`font-bold font-mono text-sm ${
                                t.type === 'credit' ? 'text-emerald-500' : 'text-red-500'
                              }`}>
                                {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUGS / NOTIFICATIONS */}
          {activeTab === 'bugs' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Report Bug */}
              <div className="lg:col-span-5">
                <div className={`border rounded-2xl p-6 ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <h3 className={`text-base font-bold tracking-tight mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Bug className="w-5 h-5 text-purple-500" /> Report App Bug
                  </h3>

                  {bugSuccess && (
                    <div className="mb-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Bug report successfully submitted to queue!
                    </div>
                  )}

                  <form onSubmit={handleBugSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Select App Under Test
                      </label>
                      <select
                        value={bugAppId}
                        onChange={(e) => setBugAppId(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                          isDarkMode 
                            ? `${bugErrors.bugAppId ? 'border-red-500 bg-red-500/5' : 'bg-zinc-950/60 border-zinc-800'} text-white` 
                            : `${bugErrors.bugAppId ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-900`
                        }`}
                      >
                        <option value="">-- Choose App --</option>
                        {activeAssignments
                          .filter(a => a.status === 'active')
                          .map((a) => (
                            <option key={a.id} value={a.projectId}>
                                {a.appName}
                            </option>
                          ))}
                      </select>
                      {bugErrors.bugAppId && <p className="mt-1 text-xs font-bold text-red-500">{bugErrors.bugAppId}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Bug Summary
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. App crashes during Bluetooth Connection scanner"
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                          isDarkMode 
                            ? `${bugErrors.bugTitle ? 'border-red-500 bg-red-500/5' : 'bg-zinc-950/60 border-zinc-800'} text-white` 
                            : `${bugErrors.bugTitle ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-900`
                        }`}
                      >
                      </input>
                      {bugErrors.bugTitle && <p className="mt-1 text-xs font-bold text-red-500">{bugErrors.bugTitle}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Severity Tier
                      </label>
                      <div className="flex gap-2">
                        {(['Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setBugSeverity(sev)}
                            className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              bugSeverity === sev
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : isDarkMode
                                  ? 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                                  : 'bg-transparent text-slate-500 border-slate-200 hover:text-slate-800'
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                          Reproduction Steps
                        </label>
                        <button
                          type="button"
                          onClick={() => setBugReproductionSteps([...bugReproductionSteps, ''])}
                          className="text-[9px] font-bold text-indigo-500 hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Step
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {bugReproductionSteps.map((step, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <span className="text-[10px] font-mono text-slate-500">{index + 1}.</span>
                            <input
                              type="text"
                              value={step}
                              onChange={(e) => {
                                  const newSteps = [...bugReproductionSteps];
                                  newSteps[index] = e.target.value;
                                  setBugReproductionSteps(newSteps);
                              }}
                              placeholder="Action taken..."
                              className={`flex-grow border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                                isDarkMode 
                                  ? `${bugErrors.bugSteps ? 'border-red-500 bg-red-500/5' : 'bg-zinc-950/60 border-zinc-800'} text-white` 
                                  : `${bugErrors.bugSteps ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-900`
                              }`}
                            />
                            {bugErrors.bugSteps && <p className="mt-1 text-xs font-bold text-red-500">{bugErrors.bugSteps}</p>}
                            {bugReproductionSteps.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setBugReproductionSteps(bugReproductionSteps.filter((_, i) => i !== index))}
                                className="text-red-500 text-xs font-bold bg-transparent border-none cursor-pointer"
                              >
                                x
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs border-0 cursor-pointer shadow-md"
                    >
                      Submit Bug Report
                    </button>
                  </form>
                </div>
              </div>

              {/* Bug History */}
              <div className="lg:col-span-7">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">My Filed Bugs</span>
                <div className="space-y-4">
                  {bugs.filter(b => b.testerName === activeTester.name).length === 0 ? (
                    <p className="text-xs text-slate-500 p-6 text-center border border-dashed rounded-xl">No bugs submitted yet.</p>
                  ) : (
                    bugs
                      .filter(b => b.testerName === activeTester.name)
                      .map((b) => (
                        <div
                          key={b.id}
                          className={`border p-4 rounded-xl relative overflow-hidden ${
                            isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <span className="text-[9px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded-sm inline-block mr-2 uppercase font-bold">
                                {b.severity}
                              </span>
                              <span className="text-xs text-slate-500 font-semibold">{b.appName}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              b.status === 'Resolved'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : b.status === 'Investigating'
                                  ? 'bg-amber-500/10 text-amber-405 border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-405 border-indigo-500/20'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <h4 className={`font-bold text-sm mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{b.title}</h4>
                          <span className="text-[10px] text-slate-505">Reported {b.createdAt} on {b.device}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 max-w-2xl mx-auto">
              <h3 className={`text-base font-bold tracking-tight mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <User className="w-5 h-5 text-indigo-500" /> Tester Profile Settings
              </h3>

              {profileSuccess && (
                <div className="mb-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Profile details saved successfully!
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={activeTester.name}
                      disabled
                      className="w-full border rounded-xl px-4 py-2.5 text-xs bg-slate-500/5 border-white/5 opacity-55 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                      UPI VPA ID (for cashouts)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. name@upi"
                      value={profileUpi}
                      onChange={(e) => setProfileUpi(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                        isDarkMode 
                          ? 'bg-zinc-950/60 border-zinc-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Country Location
                    </label>
                    <input
                      type="text"
                      value={profileCountry}
                      onChange={(e) => setProfileCountry(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                        isDarkMode 
                          ? 'bg-zinc-950/60 border-zinc-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      QA Testing Specialty
                    </label>
                    <select
                      value={profileSpecialty}
                      onChange={(e) => setProfileSpecialty(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 ${
                        isDarkMode 
                          ? 'bg-zinc-955/60 border-zinc-800 text-white' 
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="General Testing">General Exploratory Testing</option>
                      <option value="BLE Integrations & Network Sync">BLE Integrations & Network Sync</option>
                      <option value="Performance Profiling & Memory Leak Diagnostics">Performance Profiling & Memory Leak Diagnostics</option>
                      <option value="Security, Cryptography & Biometrics">Security, Cryptography & Biometrics</option>
                      <option value="Foldables & Dynamic Aspect Ratios">Foldables & Dynamic Aspect Ratios</option>
                      <option value="Localization, Fonts & Accent Overflows">Localization, Fonts & Accent Overflows</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
                    My Device Lab Inventory
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Google Pixel 8 Pro', 'Samsung Galaxy S24 Ultra', 'OnePlus 12', 
                      'Galaxy Z Fold 5', 'Pixel 7a', 'Samsung Galaxy A54'
                    ].map((device) => {
                      const isChecked = profileDevices.includes(device);
                      return (
                        <div
                          key={device}
                          onClick={() => {
                            if (isChecked) {
                              setProfileDevices(profileDevices.filter(d => d !== device));
                            } else {
                              setProfileDevices([...profileDevices, device]);
                            }
                          }}
                          className={`border p-3 rounded-xl cursor-pointer flex items-center justify-between text-xs font-semibold select-none ${
                            isChecked
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-500'
                              : isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                          }`}
                        >
                          <span>{device}</span>
                          {isChecked ? <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" /> : <Clock className="w-4 h-4 opacity-15 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl cursor-pointer border-0 shadow-md shadow-indigo-500/5 text-center"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around z-50 ${
        isDarkMode ? 'bg-[#09090B] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {[
          { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
          { id: 'tasks', label: 'Tests', icon: <CheckSquare className="w-5 h-5" /> },
          { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
          { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
        ].map(link => (
          <button
            key={link.id}
            onClick={() => handleTabSelect(link.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 border-0 bg-transparent cursor-pointer ${
              activeTab === link.id 
                ? 'text-indigo-500' 
                : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {link.icon}
            <span className="text-[10px] font-bold">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
