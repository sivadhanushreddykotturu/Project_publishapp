import { useState, useEffect } from 'react';
import { 
  Shield, Check, X, AlertTriangle, Plus, Smartphone, Bug, 
  Clock, DollarSign, Users, Award, CornerDownRight, ListFilter, Trash2, ArrowRight, ExternalLink, LogOut, 
  ChevronDown, ChevronUp, UserPlus, Calendar, Bell, Settings, BarChart2, Activity, FileText, AlertCircle, Sparkles, Landmark, RefreshCw, Search, Headphones
} from 'lucide-react';
import { TestApp, BugReport, TesterAssignment, Tester, WithdrawalRequest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import type { AdminDashboardSummary, BackendClient, BackendNotification, BackendProjectFile, BackendSupportTicket, LaunchOpsUser } from '../lib/launchops-api';
import UXOSBrandLogo from './ui/UXOSBrandLogo';

interface AdminConsoleProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
  projects: TestApp[];
  bugs: BugReport[];
  assignments: TesterAssignment[];
  testers: Tester[];
  clients: BackendClient[];
  withdrawals: WithdrawalRequest[];
  notifications: BackendNotification[];
  supportTickets: BackendSupportTicket[];
  currentUser: LaunchOpsUser | null;
  dashboardSummary: AdminDashboardSummary | null;
  onUpdateProfile: (input: { name?: string; phone?: string }) => Promise<void>;
  onReadNotification: (notificationId: string) => void;
  onApproveVerification: (projectId: string, customPrice?: number) => void;
  onRejectVerification: (projectId: string) => void;
  onAdvanceMilestone: (projectId: string, step: number, payload?: any) => void;
  onReplaceTester: (assignmentId: string) => void;
  onMergeBugs: (canonicalId: string, duplicateId: string) => void;
  onPublishBug: (bugId: string, adminNotes?: string) => void;
  onCompleteWithdrawal: (withdrawalId: string, transactionId: string) => Promise<void>;
  onRejectWithdrawal: (withdrawalId: string, reason: string) => Promise<void>;
  onLogout: () => void;
  onAddTesterToProject: (projectId: string, testerId: string) => Promise<void>;
  onRemoveTesterFromProject: (projectId: string, testerId: string) => void;
  onApproveTesterStep1: (projectId: string, testerId: string) => void;
  onVerifyTesterProof: (assignmentId: string, step: number, approve: boolean, reason?: string) => Promise<void>;
  onListProjectFiles: (projectId: string) => Promise<BackendProjectFile[]>;
  onDownloadProjectFile: (key: string) => Promise<void>;
  onClearProjectFiles: (projectId: string) => Promise<number>;
  onReplyToSupport: (ticketId: string, body: string) => Promise<void>;
  onUpdateSupportStatus: (ticketId: string, status: BackendSupportTicket['status']) => Promise<void>;
  onUpdateTesterStatus: (testerId: string, status: 'active' | 'inactive' | 'suspended') => Promise<void>;
  onPromoteQueuedTester: (assignmentId: string) => Promise<void>;
  onResendNotification: (notificationId: string) => Promise<void>;
  onDownloadCompletionReport: (projectId: string) => Promise<void>;
  onUpdatePlayIntegration: (projectId: string, input: { mode?: 'manual' | 'api'; track?: 'internal' | 'closed'; packageName?: string; aabFileUrl?: string; serviceAccountLinked?: boolean; testerGoogleGroupEmail?: string }) => Promise<void>;
  onSyncPlayIntegration: (projectId: string) => Promise<void>;
  onCreateProjectForClient: (input: { clientId: string; package: NonNullable<TestApp['packageTier']>; serviceType: NonNullable<TestApp['serviceType']>; serviceOption: string; requiredTesters: number; requiredDeviceModels: string[]; appDetails: { appName: string; packageName?: string; description?: string; playStoreUrl?: string }; paymentDisposition: 'bypassed' | 'pending' | 'manual_paid'; customAmount?: number }) => Promise<void>;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AdminConsole({
  isDarkMode,
  onToggleDarkMode,
  projects,
  bugs,
  assignments,
  testers,
  clients,
  withdrawals,
  notifications,
  supportTickets,
  currentUser,
  dashboardSummary,
  onUpdateProfile,
  onReadNotification,
  onApproveVerification,
  onRejectVerification,
  onAdvanceMilestone,
  onReplaceTester,
  onMergeBugs,
  onPublishBug,
  onCompleteWithdrawal,
  onRejectWithdrawal,
  onLogout,
  onAddTesterToProject,
  onRemoveTesterFromProject,
  onApproveTesterStep1,
  onVerifyTesterProof,
  onListProjectFiles,
  onDownloadProjectFile,
  onClearProjectFiles,
  onReplyToSupport,
  onUpdateSupportStatus,
  onUpdateTesterStatus,
  onPromoteQueuedTester,
  onResendNotification,
  onDownloadCompletionReport,
  onUpdatePlayIntegration,
  onSyncPlayIntegration,
  onCreateProjectForClient,
  initialTab,
  onTabChange
}: AdminConsoleProps) {
  const [supportReplies, setSupportReplies] = useState<Record<string, string>>({});
  const [adminProjectFormOpen, setAdminProjectFormOpen] = useState(false);
  const [adminProjectSaving, setAdminProjectSaving] = useState(false);
  const [adminProjectError, setAdminProjectError] = useState('');
  const [adminProjectForm, setAdminProjectForm] = useState({ clientId: '', appName: '', packageName: '', description: '', requiredTesters: '14', devices: '', package: 'testers_only' as NonNullable<TestApp['packageTier']>, paymentDisposition: 'bypassed' as 'bypassed' | 'pending' | 'manual_paid' });
  const [sendingSupportReply, setSendingSupportReply] = useState<string | null>(null);
  // Tabs map directly to sidebar menu options
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'testers' | 'verifications' | 'bugs' | 'support' | 'cashouts'>(() => {
    if (initialTab && ['dashboard', 'projects', 'testers', 'verifications', 'bugs', 'support', 'cashouts'].includes(initialTab)) {
      return initialTab as any;
    }
    return 'dashboard';
  });

  // Custom pricing modal/input states
  const [customPriceAppId, setCustomPriceAppId] = useState<string | null>(null);
  const [customPriceVal, setCustomPriceVal] = useState('15000');

  // Bug curation & UTR input states
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedUtrWithdrawalId, setSelectedUtrWithdrawalId] = useState<string | null>(null);
  const [utrVal, setUtrVal] = useState('');
  const [payoutValidationErr, setPayoutValidationErr] = useState('');
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<string | null>(null);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState('');
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  
  // Selection states for project assignments
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [addingTesterProjectId, setAddingTesterProjectId] = useState<string | null>(null);
  const [selectedTesterToAssign, setSelectedTesterToAssign] = useState<string>('');
  const [assigningTester, setAssigningTester] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, BackendProjectFile[]>>({});
  const [fileActionError, setFileActionError] = useState('');
  const [clearingFilesProjectId, setClearingFilesProjectId] = useState<string | null>(null);
  const [testerSearch, setTesterSearch] = useState('');
  const [testerCampaignFilter, setTesterCampaignFilter] = useState('all');
  const [testerSpecialtyFilter, setTesterSpecialtyFilter] = useState('all');
  const [bugProjectFilter, setBugProjectFilter] = useState('all');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const toggleProject = async (projectId: string) => {
    if (expandedProjectId === projectId) { setExpandedProjectId(null); return; }
    setExpandedProjectId(projectId);
    setFileActionError('');
    try {
      const files = await onListProjectFiles(projectId);
      setProjectFiles((current) => ({ ...current, [projectId]: files }));
    } catch (error) {
      setFileActionError(error instanceof Error ? error.message : 'Could not load project files.');
    }
  };

  useEffect(() => {
    if (initialTab && ['dashboard', 'projects', 'testers', 'verifications', 'bugs', 'support', 'cashouts'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    setProfileName(currentUser?.name ?? '');
    setProfilePhone(currentUser?.phone ?? '');
  }, [currentUser]);

  const handleTabSelect = (tab: 'dashboard' | 'projects' | 'testers' | 'verifications' | 'bugs' | 'support' | 'cashouts') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleCompletePayoutSubmit = async (e: React.FormEvent, withdrawalId: string) => {
    e.preventDefault();
    setPayoutValidationErr('');
    if (!utrVal.trim()) {
      setPayoutValidationErr('Bank UTR Transaction Reference is required.');
      return;
    }
    if (!/^\d{12}$/.test(utrVal.trim()) && utrVal.trim().length < 8) {
      setPayoutValidationErr('Please enter a valid bank reference number.');
      return;
    }
    setProcessingWithdrawalId(withdrawalId);
    try {
      await onCompleteWithdrawal(withdrawalId, utrVal.trim());
      setSelectedUtrWithdrawalId(null);
      setUtrVal('');
    } catch (error) {
      setPayoutValidationErr(error instanceof Error ? error.message : 'Could not complete this payout.');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleRejectPayoutSubmit = async (e: React.FormEvent, withdrawalId: string) => {
    e.preventDefault();
    const reason = withdrawalRejectReason.trim();
    if (!reason) {
      setPayoutValidationErr('A rejection reason is required.');
      return;
    }
    setProcessingWithdrawalId(withdrawalId);
    setPayoutValidationErr('');
    try {
      await onRejectWithdrawal(withdrawalId, reason);
      setRejectingWithdrawalId(null);
      setWithdrawalRejectReason('');
    } catch (error) {
      setPayoutValidationErr(error instanceof Error ? error.message : 'Could not reject this request.');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const activeProjects = projects.filter((project) => project.status === 'Testing');
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed');
  const pendingVerifications = projects.filter((project) => project.verificationStatus === 'pending');
  const completedPayoutTotal = withdrawals.filter((withdrawal) => withdrawal.status === 'completed').reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
  const successRate = assignments.length ? Math.round((completedAssignments.length / assignments.length) * 100) : 0;
  const dashboardStats = [
    { title: 'Active Projects', value: String(dashboardSummary?.projects.active ?? activeProjects.length), desc: `${dashboardSummary?.projects.total ?? projects.length} total projects` },
    { title: 'Total Testers', value: String(dashboardSummary?.testers.total ?? testers.length), desc: `${dashboardSummary?.testers.active ?? testers.filter((tester) => tester.status === 'Online').length} active` },
    { title: 'Tests In Progress', value: String(dashboardSummary?.assignments.active ?? activeAssignments.length), desc: `${dashboardSummary?.assignments.total ?? assignments.length} assignments` },
    { title: 'Bugs Reported', value: String(dashboardSummary?.bugs.total ?? bugs.length), desc: `${dashboardSummary?.bugs.published ?? bugs.filter((bug) => bug.isPublished).length} published` },
    { title: 'Total Payouts', value: `₹${((dashboardSummary?.payouts.paidTotal ?? completedPayoutTotal * 100) / 100).toFixed(2)}`, desc: `${dashboardSummary?.payouts.pending ?? withdrawals.filter((withdrawal) => withdrawal.status === 'pending').length} pending` },
    { title: 'Success Rate', value: `${dashboardSummary?.successRate ?? successRate}%`, desc: `${dashboardSummary?.assignments.completed ?? completedAssignments.length} completed` },
  ];
  const dashboardAlerts = [
    ...assignments.filter((assignment) => assignment.inactivityFlag).map((assignment) => ({ title: 'Tester inactivity flagged', app: assignment.appName, type: 'error' as const })),
    ...projects.filter((project) => project.playIntegration?.lastApiError).map((project) => ({ title: project.playIntegration!.lastApiError!, app: project.name, type: 'warning' as const })),
    ...pendingVerifications.map((project) => ({ title: 'Client verification awaiting review', app: project.name, type: 'info' as const })),
  ];
  const todayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
  const testerSpecialties = [...new Set(testers.map((tester) => tester.specialty))].sort();
  const testerCampaigns = [...new Map(
    activeAssignments.map((assignment) => [assignment.projectId, assignment.appName])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const normalizedTesterSearch = testerSearch.trim().toLowerCase();
  const filteredTesters = testers.filter((tester) => {
    const matchesSearch = !normalizedTesterSearch || [tester.name, ...tester.devices]
      .some((value) => value.toLowerCase().includes(normalizedTesterSearch));
    const matchesSpecialty = testerSpecialtyFilter === 'all' || tester.specialty === testerSpecialtyFilter;
    const testerActiveAssignments = activeAssignments.filter((assignment) => assignment.testerId === tester.id);
    const matchesCampaign = testerCampaignFilter === 'all'
      || (testerCampaignFilter === 'none' && testerActiveAssignments.length === 0)
      || testerActiveAssignments.some((assignment) => assignment.projectId === testerCampaignFilter);
    return matchesSearch && matchesSpecialty && matchesCampaign;
  });
  const testerFiltersActive = Boolean(normalizedTesterSearch) || testerCampaignFilter !== 'all' || testerSpecialtyFilter !== 'all';
  const projectsWithBugReports = projects.filter((project) => bugs.some((bug) => bug.appId === project.id));
  const filteredBugs = bugProjectFilter === 'all' ? bugs : bugs.filter((bug) => bug.appId === bugProjectFilter);
  const adminInitials = (currentUser?.name || 'Admin').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const totalTesterCount = dashboardSummary?.testers.total ?? testers.length;
  const activeTesterCount = dashboardSummary?.testers.active ?? testers.filter((tester) => tester.status === 'Online').length;
  const activeTesterPercent = totalTesterCount ? Math.round((activeTesterCount / totalTesterCount) * 100) : 0;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden flex ${isDarkMode ? 'bg-[#090A0F] text-slate-100' : 'bg-[#F4F5F8] text-slate-900'}`}>
      
      {/* ================= LEFT SIDEBAR (COLLAPSIBLE, MATCHING TESTER DASHBOARD) ================= */}
      <aside className={`hidden md:flex shrink-0 flex-col justify-between py-7 border-r transition-all duration-300 ${
        isCollapsed ? 'w-20 px-3 items-center' : 'w-64 px-4'
      } ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="w-full">
          {/* Platform Logo & Collapse Toggle */}
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`flex items-center mb-8 cursor-pointer select-none ${isCollapsed ? 'justify-center' : 'px-2 justify-between'}`}
            title="Click to collapse/expand sidebar"
          >
            <div className="flex items-center gap-3">
              <img src="/launchops-logo.png" alt="UXOS Logo" className="w-8 h-8 object-contain shrink-0" />
              {!isCollapsed && (
                <span className={`text-[22px] font-black tracking-tight font-sans ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  UXOS
                </span>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2.5 w-full">
            {[
              { 
                id: 'dashboard', 
                label: 'Dashboard', 
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="8" height="8" rx="2" />
                    <rect x="13" y="3" width="8" height="8" rx="2" />
                    <rect x="3" y="13" width="8" height="8" rx="2" />
                    <rect x="13" y="13" width="8" height="8" rx="2" />
                  </svg>
                ) 
              },
              { 
                id: 'projects', 
                label: 'Projects', 
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M4 3h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-5v2h2c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1h2v-2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm2 4v6h12V7H6zm2.5 3.5l1.5-1.5 2 3 2-3 1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) 
              },
              { 
                id: 'testers', 
                label: 'Testers', 
                icon: <Users className="w-5 h-5" /> 
              },
              { 
                id: 'bugs', 
                label: 'Bug Reports', 
                icon: <Bug className="w-5 h-5" /> 
              },
              { 
                id: 'support', 
                label: 'Support', 
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3a9 9 0 0 0-9 9v6c0 1.66 1.34 3 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5v-2a7 7 0 0 1 14 0v2h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1c1.66 0 3-1.34 3-3v-6a9 9 0 0 0-9-9z" />
                  </svg>
                ) 
              },
              { 
                id: 'cashouts', 
                label: 'Payouts', 
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20 7H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-2 6h-3c-.55 0-1-.45-1-1s.45-1 1-1h3v2zM4 4h14c.55 0 1 .45 1 1s-.45 1-1 1H4C3.45 6 3 5.55 3 5s.45-1 1-1z" />
                  </svg>
                ) 
              }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id as any)}
                  className={`relative w-full flex items-center ${isCollapsed ? 'justify-center py-3.5 px-0' : 'gap-3.5 px-4 py-3.5'} rounded-2xl text-[15px] font-bold transition-all duration-150 cursor-pointer border-0 ${
                    isActive 
                      ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20' 
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-white/5 bg-transparent'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  {/* Left Pill Indicator for Active Tab */}
                  {isActive && (
                    <motion.div 
                      layoutId="adminSidebarActiveIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full" 
                    />
                  )}
                  <span className="shrink-0">{link.icon}</span>
                  {!isCollapsed && <span>{link.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile and Logout Footer */}
        <div className={`pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} w-full`}>
          <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-3 border-0 bg-transparent p-0 text-left cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 font-sans shrink-0">
                {adminInitials}
              </div>
              {!isCollapsed && (
                <div className="text-left text-xs leading-none">
                  <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{currentUser?.name ?? 'Admin'}</span>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {currentUser?.role ?? 'admin'}
                  </span>
                </div>
              )}
            </button>
            {!isCollapsed && (
              <button 
                onClick={onLogout}
                className={`p-2 rounded-xl border-none cursor-pointer bg-transparent transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-white/5' : 'text-slate-500 hover:text-red-600 hover:bg-red-50/50'
                }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            {profileOpen && (
              <form onSubmit={async (event) => {
                event.preventDefault(); setProfileSaving(true); setProfileError('');
                try { await onUpdateProfile({ name: profileName, phone: profilePhone }); setProfileOpen(false); }
                catch (error) { setProfileError(error instanceof Error ? error.message : 'Could not update profile.'); }
                finally { setProfileSaving(false); }
              }} className={`absolute bottom-12 ${isCollapsed ? 'left-12' : 'left-0'} z-50 w-72 space-y-3 rounded-2xl border p-4 shadow-xl ${isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-black uppercase text-slate-500">Admin profile</p>
                <input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Name" className={`w-full rounded-lg border px-3 py-2 text-xs ${isDarkMode ? 'bg-black border-zinc-700 text-white' : 'border-slate-200'}`} />
                <input value={currentUser?.email ?? ''} readOnly className={`w-full rounded-lg border px-3 py-2 text-xs opacity-70 ${isDarkMode ? 'bg-black border-zinc-700 text-white' : 'border-slate-200'}`} />
                <input value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} placeholder="Phone" className={`w-full rounded-lg border px-3 py-2 text-xs ${isDarkMode ? 'bg-black border-zinc-700 text-white' : 'border-slate-200'}`} />
                <p className="text-[10px] text-slate-500">Status: {currentUser?.status ?? 'active'} · Role: {currentUser?.role ?? 'admin'}</p>
                {profileError && <p className="text-[10px] font-bold text-red-500">{profileError}</p>}
                <button disabled={profileSaving} className="w-full rounded-lg border-0 bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{profileSaving ? 'Saving...' : 'Save profile'}</button>
              </form>
            )}
          </div>

          {/* Theme Toggle (Dark vs Light) */}
          {onToggleDarkMode && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pt-4 border-t mt-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              {!isCollapsed && (
                <span className={`text-[13px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  {isDarkMode ? 'Dark mode' : 'Light mode'}
                </span>
              )}
              <button
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out border-0 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-[#4F37FE]'
                }`}
                title="Toggle Dark/Light Mode"
              >
                <span
                  className={`pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-xs transform transition duration-200 ease-in-out mt-0.5 ${
                    isDarkMode ? 'translate-x-0.5' : 'translate-x-5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-[#4F37FE]'}`} />
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MAIN WINDOW GRID ================= */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen md:h-screen overflow-y-auto pb-20 md:pb-0">
        
        {/* Main Header */}
        <header className={`px-4 md:px-8 py-3 sm:py-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
          isDarkMode ? 'bg-[#090A0F]/90 border-white/5' : 'bg-white/90 border-slate-200'
        }`}>
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 md:hidden mb-0.5">
              <img src="/launchops-logo.png" alt="UXOS Logo" className="w-6 h-6 object-contain" />
              <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>UXOS Admin</span>
            </div>
            <h1 className={`text-base sm:text-lg md:text-xl font-black tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'dashboard' && 'Admin Overview'}
              {activeTab === 'projects' && 'Projects'}
              {activeTab === 'testers' && 'Tester Management'}
              {activeTab === 'bugs' && 'Bug Reports'}
              {activeTab === 'support' && 'Support Inbox'}
              {activeTab === 'cashouts' && 'Payouts & Wallets'}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {activeTab === 'dashboard' && "Here's what's happening on UXOS today."}
              {activeTab === 'projects' && 'Manage all app testing campaigns'}
              {activeTab === 'testers' && 'Manage tester accounts and assignments'}
              {activeTab === 'bugs' && 'Review and publish bug reports'}
              {activeTab === 'support' && 'Reply to client and tester support tickets'}
              {activeTab === 'cashouts' && 'Process pending payout requests'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold ${
              isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{todayLabel}</span>
            </div>
            
            <div className="relative">
            <button onClick={() => setNotificationDropdownOpen((open) => !open)} className={`p-2 border rounded-xl relative hover:bg-slate-500/5 cursor-pointer ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <Bell className="w-4 h-4 text-slate-400" />
              {notifications.some((notification) => !notification.readAt) && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />}
            </button>
            {notificationDropdownOpen && <div className={`absolute right-0 top-12 w-72 sm:w-80 max-h-96 overflow-y-auto rounded-xl border p-2 shadow-xl ${isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'}`}>
              {notifications.filter((notification) => !notification.readAt).length === 0 ? <p className="p-3 text-xs text-slate-500">You're all caught up.</p> : notifications.filter((notification) => !notification.readAt).map((notification) => <button key={notification._id} onClick={() => { onReadNotification(notification._id); if (notification.type === 'project_request') handleTabSelect('projects'); else if (notification.type === 'support_request') handleTabSelect('support'); setNotificationDropdownOpen(false); }} className={`w-full text-left p-3 rounded-lg text-xs border mb-1 transition-colors ${isDarkMode ? 'bg-blue-500/15 border-blue-500/30 text-white' : 'bg-blue-50 border-blue-200 text-slate-900'}`}><span className="flex items-center justify-between gap-2 font-bold"><span>{notification.type === 'project_request' ? 'New published project' : notification.type.replace(/_/g, ' ')}</span><span className="text-[8px] uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white">New</span></span><span className="text-slate-500 block mt-1">{String(notification.payload.appName ?? '')}</span></button>) }
              {notifications.filter((notification) => notification.status === 'failed').map((notification) => <div key={`failed-${notification._id}`} className="mb-1 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs"><p className="font-bold text-red-500">Failed: {notification.type.replace(/_/g, ' ')}</p><p className="mt-1 truncate text-[9px] text-slate-500">{notification.lastError || 'Delivery failed'}</p><button type="button" onClick={() => { void onResendNotification(notification._id); }} className="mt-2 rounded-lg border-0 bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase text-white">Retry delivery</button></div>)}
            </div>}
            </div>

            <button onClick={() => handleTabSelect('projects')} className="hidden sm:inline-flex px-4 py-2 text-white text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 border-0 cursor-pointer active:scale-[0.97] transition-all">
              Manage Projects
            </button>
          </div>
        </header>

        {/* Outer Dashboard Scroll View */}
        <div className="p-4 md:p-8 pb-24 md:pb-8 flex-grow overflow-y-auto space-y-8">

          {/* TAB 1: MAIN METRIC DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* 1. Stat cards widgets grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {dashboardStats.map((stat, i) => (
                  <div key={i} className={`p-5 border rounded-2xl relative overflow-hidden transition-all duration-300 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800/80' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{stat.title}</span>
                    <h3 className={`text-xl font-black mt-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stat.value}</h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] text-slate-400 font-semibold">{stat.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Main content split layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left primary splits: Projects & Steps */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Projects Overview */}
                  <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200/5">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Projects Overview</h3>
                      <button onClick={() => handleTabSelect('projects')} className="text-xs font-extrabold text-indigo-500 hover:underline border-0 bg-transparent cursor-pointer">
                        View All Projects
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200/5">
                            <th className="pb-3">Project</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3 text-center">Testers (Joined/Slots)</th>
                            <th className="pb-3">Progress</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Deadline</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-semibold">
                          {projects.slice(0, 5).map((project) => ({
                            name: project.name,
                            pkg: project.playIntegration?.packageName || project.version,
                            type: project.packageTier?.replace(/_/g, ' ') || project.category,
                            slots: `${project.testersCount} / ${project.testersRequired || 0}`,
                            prog: Math.round(project.progress),
                            status: project.status === 'Testing' ? 'In Progress' : project.status,
                            date: project.launchDate,
                          })).map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5">
                              <td className="py-4.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 font-extrabold">
                                    {p.name[0]}
                                  </div>
                                  <div>
                                    <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</span>
                                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{p.pkg}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4.5">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                  p.type === 'Play Store' ? 'bg-indigo-500/10 text-indigo-500' :
                                  p.type === 'Closed Beta' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>{p.type}</span>
                              </td>
                              <td className="py-4.5 text-center font-mono font-bold text-slate-600 dark:text-slate-350">
                                {p.slots}
                              </td>
                              <td className="py-4.5">
                                <div className="flex items-center gap-2 max-w-[120px]">
                                  <div className="w-full h-1.5 bg-slate-500/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-550 rounded-full" style={{ width: `${p.prog}%` }} />
                                  </div>
                                  <span className="font-mono text-[10px]">{p.prog}%</span>
                                </div>
                              </td>
                              <td className="py-4.5">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                  p.status === 'In Progress' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500'
                                }`}>{p.status}</span>
                              </td>
                              <td className="py-4.5 font-mono text-slate-500 text-[10px]">
                                {p.date}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mission Steps Overview */}
                  <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200/5">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Mission Steps Overview</h3>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase font-mono">Real-time Whitelists</span>
                    </div>

                    <div className="space-y-6">
                      {projects.slice(0, 4).map((project) => ({
                        name: project.name,
                        steps: [1, 2, 3, 4, 5].map((step) => assignments.filter((assignment) => assignment.projectId === project.id && assignment.currentStep >= step).length),
                      })).map((p, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b last:border-0 border-slate-500/5">
                          <div className="w-[180px] shrink-0">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</span>
                          </div>
                          
                          {/* Connect lines rendering */}
                          <div className="flex-grow flex items-center justify-between relative max-w-lg">
                            <div className="absolute left-0 right-0 h-0.5 bg-slate-500/10 z-0" />
                            {p.steps.map((val, stepIdx) => (
                              <div key={stepIdx} className="flex flex-col items-center relative z-10 text-[9px] font-semibold">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black ${
                                  val > 0 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/35' 
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                                }`}>
                                  {val}
                                </div>
                                <span className="text-[8px] text-slate-400 mt-1 font-mono uppercase">Step {stepIdx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebars: radial stats, snapshots, feeds */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Radial Analytics */}
                  <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Real-time Overview</h3>
                    
                    <div className="flex items-center justify-center py-6">
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        {/* Tester distribution ring */}
                        <div className="absolute inset-0 rounded-full border-[14px] border-slate-500/5" />
                        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#4f46e5 0 ${activeTesterPercent}%, #e2e8f0 ${activeTesterPercent}% 100%)`, mask: 'radial-gradient(farthest-side, transparent calc(100% - 14px), #000 0)', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 14px), #000 0)' }} />
                        <div className="text-center z-10">
                          <span className={`text-3xl font-black block tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{totalTesterCount}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider mt-1 block">Total Testers</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 text-[10px] font-semibold">
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-500/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-slate-500">Active</span>
                        <span className="font-mono font-black ml-auto">{dashboardSummary?.testers.active ?? activeTesterCount}</span>
                      </div>
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-500/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        <span className="text-slate-500">In Progress</span>
                        <span className="font-mono font-black ml-auto">{dashboardSummary?.assignments.active ?? activeAssignments.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-slate-500">Waiting</span>
                        <span className="font-mono font-black ml-auto">{dashboardSummary?.assignments.queued ?? assignments.filter((assignment) => assignment.status === 'queued').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-405 shrink-0" />
                        <span className="text-slate-500">Inactive</span>
                        <span className="font-mono font-black ml-auto">{dashboardSummary?.testers.inactive ?? testers.filter((tester) => tester.status !== 'Online').length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts Feed */}
                  <div className={`p-6 border rounded-2xl ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Alerts</h3>
                    
                    <div className="space-y-4">
                      {dashboardAlerts.map((alert, i) => (
                        <div key={i} className={`p-4 border rounded-xl flex gap-3 text-xs ${
                          alert.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                          alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'
                        }`}>
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold block">{alert.title}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1">{alert.app}</span>
                          </div>
                        </div>
                      ))}
                      {dashboardAlerts.length === 0 && <p className="text-xs font-semibold text-slate-500">No operational alerts.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS MANAGEMENT */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Testing Track Command</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Verify sync steps, view assigned tester lists, and advance project milestones.</p>
                </div>
                <button type="button" onClick={() => setAdminProjectFormOpen((open) => !open)} className="rounded-xl border-0 bg-indigo-600 px-5 py-2.5 text-xs font-black text-white"><Plus className="mr-1 inline h-4 w-4" />Create for Client</button>
              </div>

              {adminProjectFormOpen && <form onSubmit={async (event) => { event.preventDefault(); setAdminProjectSaving(true); setAdminProjectError(''); try { await onCreateProjectForClient({ clientId: adminProjectForm.clientId, package: adminProjectForm.package, serviceType: 'play_store_closed_testing', serviceOption: adminProjectForm.package, requiredTesters: Number(adminProjectForm.requiredTesters), requiredDeviceModels: adminProjectForm.devices.split(',').map((item) => item.trim()).filter(Boolean), appDetails: { appName: adminProjectForm.appName.trim(), packageName: adminProjectForm.packageName.trim() || undefined, description: adminProjectForm.description.trim() || undefined }, paymentDisposition: adminProjectForm.paymentDisposition }); setAdminProjectFormOpen(false); setAdminProjectForm({ clientId: '', appName: '', packageName: '', description: '', requiredTesters: '14', devices: '', package: 'testers_only', paymentDisposition: 'bypassed' }); } catch (createError) { setAdminProjectError(createError instanceof Error ? createError.message : 'Could not create project.'); } finally { setAdminProjectSaving(false); } }} className={`rounded-2xl border p-5 ${isDarkMode ? 'border-zinc-800 bg-[#18181B]' : 'border-slate-200 bg-white'}`}>
                <div className="mb-4"><h3 className="text-sm font-black">Create project on behalf of a client</h3><p className="mt-1 text-[10px] text-slate-500">The selected client becomes the owner and receives a notification. The admin is recorded in the audit trail.</p></div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <select required value={adminProjectForm.clientId} onChange={(event) => setAdminProjectForm((form) => ({ ...form, clientId: event.target.value }))} className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200 bg-white'}`}><option value="">Select client</option>{clients.map((client) => <option key={client._id} value={client._id}>{client.companyName || client.contactName || client.userId.name} — {client.userId.email}</option>)}</select>
                  <input required value={adminProjectForm.appName} onChange={(event) => setAdminProjectForm((form) => ({ ...form, appName: event.target.value }))} placeholder="App/project name" className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`} />
                  <input value={adminProjectForm.packageName} onChange={(event) => setAdminProjectForm((form) => ({ ...form, packageName: event.target.value }))} placeholder="Package name (com.example.app)" className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`} />
                  <select value={adminProjectForm.package} onChange={(event) => setAdminProjectForm((form) => ({ ...form, package: event.target.value as NonNullable<TestApp['packageTier']> }))} className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`}><option value="testers_only">Testers only</option><option value="managed_testing">Managed testing</option><option value="launch_ready">Launch ready</option></select>
                  <input required min="1" type="number" value={adminProjectForm.requiredTesters} onChange={(event) => setAdminProjectForm((form) => ({ ...form, requiredTesters: event.target.value }))} placeholder="Required testers" className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`} />
                  <select value={adminProjectForm.paymentDisposition} onChange={(event) => setAdminProjectForm((form) => ({ ...form, paymentDisposition: event.target.value as typeof form.paymentDisposition }))} className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`}><option value="bypassed">Payment bypassed</option><option value="pending">Payment pending</option><option value="manual_paid">Manually paid</option></select>
                  <input value={adminProjectForm.devices} onChange={(event) => setAdminProjectForm((form) => ({ ...form, devices: event.target.value }))} placeholder="Required devices, comma-separated" className={`rounded-xl border px-3 py-2.5 text-xs md:col-span-2 ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`} />
                  <input value={adminProjectForm.description} onChange={(event) => setAdminProjectForm((form) => ({ ...form, description: event.target.value }))} placeholder="Project description" className={`rounded-xl border px-3 py-2.5 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200'}`} />
                </div>
                {adminProjectError && <p className="mt-3 text-xs font-bold text-red-500">{adminProjectError}</p>}
                <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setAdminProjectFormOpen(false)} className="rounded-xl border border-slate-500/20 bg-transparent px-4 py-2 text-xs font-bold">Cancel</button><button disabled={adminProjectSaving || clients.length === 0} className="rounded-xl border-0 bg-emerald-600 px-5 py-2 text-xs font-black text-white disabled:opacity-40">{adminProjectSaving ? 'Creating...' : 'Create Project'}</button></div>
              </form>}

              {projects.map((proj) => {
                const isExpanded = expandedProjectId === proj.id;
                const activeAss = assignments.filter(a => a.projectId === proj.id && a.status === 'active');
                const queuedAss = assignments.filter(a => a.projectId === proj.id && a.status === 'queued');
                
                return (
                  <div 
                    key={proj.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Project Header Row */}
                    <div 
                      onClick={() => { void toggleProject(proj.id); }}
                      className="p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {proj.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            Category: {proj.category} · Required: {proj.testersRequired || 14}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <span className="px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase bg-slate-500/10">
                          {proj.status}
                        </span>

                        <div className="flex items-center gap-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-500/5 p-6 space-y-6">
                        
                        {/* Control actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-500/5 p-5 rounded-2xl">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-500 block font-mono">Milestone control</span>
                            <h4 className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              Simulate Google Play Console integration
                            </h4>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => { void onDownloadCompletionReport(proj.id); }} className="rounded-xl border border-slate-500/25 bg-transparent px-4 py-2.5 text-xs font-black text-slate-500">Download Report</button>
                            <button onClick={async () => {
                              const packageName = window.prompt('Google Play package name', proj.playIntegration?.packageName || proj.packageName || '');
                              if (!packageName) return;
                              const aabFileUrl = window.prompt('AAB file URL', proj.playIntegration?.aabFileUrl || '');
                              if (!aabFileUrl) return;
                              const testerGoogleGroupEmail = window.prompt('Tester Google Group email (optional)', proj.playIntegration?.testerGoogleGroupEmail || '') || undefined;
                              await onUpdatePlayIntegration(proj.id, { mode: 'api', track: 'closed', packageName, aabFileUrl, testerGoogleGroupEmail, serviceAccountLinked: window.confirm('Has the Google service account been granted Play Console access?') });
                            }} className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 px-4 py-2.5 text-xs font-black text-indigo-500">Configure Play API</button>
                            {proj.playIntegration?.mode === 'api' && <button onClick={() => { void onSyncPlayIntegration(proj.id); }} className="rounded-xl border-0 bg-purple-600 px-4 py-2.5 text-xs font-black text-white">Sync Play Release</button>}
                            <button
                              onClick={() => {
                                const currentStep = Math.round((proj.progress || 0) / 16.6);
                                const nextStep = Math.min(currentStep + 1, 6);
                                onAdvanceMilestone(proj.id, nextStep, { optInUrl: proj.optInUrl });
                              }}
                              className="px-5 py-2.5 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-md hover:opacity-90 transition-all"
                              style={{ backgroundColor: '#4F46E5' }}
                            >
                              Advance Project Milestone
                            </button>
                            
                            <button
                              onClick={() => setAddingTesterProjectId(proj.id)}
                              className="px-5 py-2.5 text-xs font-black rounded-xl border border-slate-500/25 bg-transparent hover:bg-slate-500/5 cursor-pointer text-slate-400"
                            >
                              Add Tester Slot
                            </button>
                          </div>
                        </div>

                        {/* Add Tester Box inline form */}
                        {addingTesterProjectId === proj.id && (
                          <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-grow">
                              <label className="text-[9px] font-black uppercase text-indigo-500 block mb-2 font-mono">Select Tester to assign</label>
                              <select
                                value={selectedTesterToAssign}
                                onChange={(e) => setSelectedTesterToAssign(e.target.value)}
                                className={`w-full max-w-md px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-indigo-500 ${
                                  isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                                }`}
                              >
                                <option value="">-- Choose Candidate --</option>
                                {testers
                                  .filter(t => t.status === 'Online')
                                  .filter(t => !activeAss.some(a => a.testerId === t.id))
                                  .map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.devices.join(', ')})</option>
                                  ))}
                              </select>
                            </div>
                            <div className="flex gap-2 shrink-0">
                            <button
                              disabled={!selectedTesterToAssign || assigningTester}
                              onClick={async () => {
                                if (selectedTesterToAssign && !assigningTester) {
                                  setAssigningTester(true);
                                  setAssignmentError('');
                                  try {
                                    await onAddTesterToProject(proj.id, selectedTesterToAssign);
                                    setSelectedTesterToAssign('');
                                    setAddingTesterProjectId(null);
                                  } catch (error) {
                                    setAssignmentError(error instanceof Error ? error.message : 'Could not allocate this tester.');
                                  } finally {
                                    setAssigningTester(false);
                                  }
                                }
                              }}
                                className="px-4 py-2 text-xs font-black text-white bg-green-600 hover:bg-green-550 border-0 rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigningTester ? 'Allocating...' : 'Confirm Allocation'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTesterToAssign('');
                                  setAddingTesterProjectId(null);
                                }}
                                className="px-4 py-2 text-xs font-black text-slate-400 border border-slate-500/20 rounded-xl cursor-pointer hover:bg-slate-500/5 bg-transparent"
                              >
                                Cancel
                              </button>
                            </div>
                            {assignmentError && <p className="text-xs font-semibold text-red-600 md:basis-full">{assignmentError}</p>}
                          </div>
                        )}

                        {/* Testers List Table */}
                        <div>
                          <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-4 font-mono">Assigned Tester Slot List</h4>
                          
                          {activeAss.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs font-semibold">No testers assigned to this track.</div>
                          ) : (
                            <div className="space-y-3">
                              {activeAss.map((ass) => {
                                const tester = testers.find(t => t.id === ass.testerId);
                                const hasPendingStep1 = ass.pendingProofSteps?.includes(1) ?? false;
                                return (
                                  <div 
                                    key={ass.id}
                                    className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${
                                      isDarkMode ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-extrabold">
                                        {tester?.name[0]}
                                      </div>
                                      <div>
                                        <span className={`text-xs font-extrabold block ${isDarkMode ? 'text-white' : 'text-slate-805'}`}>{tester?.name}</span>
                                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Devices: {tester?.devices.join(', ')}</span>
                                        {hasPendingStep1 && ass.testerEmail && (
                                          <span className="mt-1 block text-[9px] font-semibold text-indigo-500">Google Play email: {ass.testerEmail}</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black bg-slate-500/10 text-slate-400">
                                        {hasPendingStep1 ? 'Step 1 Pending' : `Step ${ass.currentStep} / 6`}
                                      </span>

                                      <div className="flex items-center gap-1.5">
                                        {hasPendingStep1 && ass.testerEmail && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                onApproveTesterStep1(proj.id, ass.testerId);
                                              }}
                                              className="cursor-pointer rounded-lg border-0 bg-emerald-600 px-2.5 py-1.5 text-[9px] font-extrabold uppercase text-white transition hover:bg-emerald-700 hover:shadow-md active:scale-95"
                                            >
                                              Approve Step 1
                                            </button>
                                            <button
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                const reason = window.prompt('Reason for rejecting Step 1');
                                                if (reason) void onVerifyTesterProof(ass.id, 1, false, reason);
                                              }}
                                              className="cursor-pointer rounded-lg border-0 bg-red-600 px-2 py-1.5 text-[9px] font-extrabold uppercase text-white transition hover:bg-red-700 active:scale-95"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}
                                        {ass.pendingProofSteps?.filter((step) => step !== 1 && (step !== 4 || ass.step4CheckInsCompleted >= 14)).map((step) => <div key={step} className="flex items-center gap-1"><button onClick={(event) => { event.stopPropagation(); void onVerifyTesterProof(ass.id, step, true); }} className="cursor-pointer rounded-lg border-0 bg-emerald-600 px-2.5 py-1.5 text-[9px] font-extrabold uppercase text-white transition hover:bg-emerald-700 hover:shadow-md active:scale-95">Approve Step {step}</button><button onClick={(event) => { event.stopPropagation(); const reason = window.prompt(`Reason for rejecting Step ${step}`); if (reason) void onVerifyTesterProof(ass.id, step, false, reason); }} className="cursor-pointer rounded-lg border-0 bg-red-600 px-2 py-1.5 text-[9px] font-extrabold uppercase text-white transition hover:bg-red-700 active:scale-95">Reject</button></div>)}

                                        {ass.inactivityFlag && (
                                          <button
                                            onClick={() => onReplaceTester(ass.id)}
                                            className="px-2.5 py-1.5 text-white font-extrabold text-[9px] uppercase border-0 rounded-lg cursor-pointer bg-red-600 hover:bg-red-700"
                                          >
                                            Replace
                                          </button>
                                        )}

                                        <button
                                          onClick={() => onRemoveTesterFromProject(proj.id, ass.testerId)}
                                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition cursor-pointer"
                                          title="Remove Tester"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Waitlist ({queuedAss.length})</h4>
                          {queuedAss.length === 0 ? <p className="text-xs text-slate-500">No testers waiting for a slot.</p> : <div className="space-y-2">{queuedAss.map((ass) => { const tester = testers.find((item) => item.id === ass.testerId); const hasSpace = activeAss.length < (proj.testersRequired ?? 14); return <div key={ass.id} className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div><p className="text-xs font-bold">{tester?.name || 'Tester'}</p><p className="text-[9px] text-slate-500">Queue position {ass.queuePosition ?? '-'}</p></div><button disabled={!hasSpace} onClick={() => { void onPromoteQueuedTester(ass.id); }} className="rounded-lg border-0 bg-emerald-600 px-3 py-1.5 text-[9px] font-black uppercase text-white disabled:opacity-40" title={hasSpace ? 'Promote into the open slot' : 'Remove or replace an active tester first'}>Promote</button></div>; })}</div>}
                        </div>

                        <div className={`rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider">Client testing files</h4>
                              <p className="mt-1 text-[10px] text-slate-500">Files uploaded by the client for this project.</p>
                            </div>
                            <button
                              disabled={!proj.testingWindowEnded || clearingFilesProjectId === proj.id || !(projectFiles[proj.id]?.length)}
                              onClick={async () => {
                                if (!window.confirm(`Permanently delete all files for ${proj.name}? This cannot be undone.`)) return;
                                setClearingFilesProjectId(proj.id);
                                setFileActionError('');
                                try {
                                  await onClearProjectFiles(proj.id);
                                  setProjectFiles((current) => ({ ...current, [proj.id]: [] }));
                                } catch (error) {
                                  setFileActionError(error instanceof Error ? error.message : 'Could not clear files.');
                                } finally {
                                  setClearingFilesProjectId(null);
                                }
                              }}
                              className="rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
                              title={proj.testingWindowEnded ? 'Delete files from R2 and MongoDB' : 'Available after the testing window ends'}
                            >
                              {clearingFilesProjectId === proj.id ? 'Clearing…' : 'Clear files'}
                            </button>
                          </div>
                          {fileActionError && <p className="mb-3 text-xs font-semibold text-red-500">{fileActionError}</p>}
                          <div className="space-y-2">
                            {(projectFiles[proj.id] ?? []).map((file) => (
                              <div key={file.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-500/10 p-3">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold">{file.name}</p>
                                  <p className="text-[9px] text-slate-500">{(file.size / 1024).toFixed(1)} KB · {new Date(file.uploadedAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => { void onDownloadProjectFile(file.key); }} className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black text-indigo-500">Download</button>
                              </div>
                            ))}
                            {(projectFiles[proj.id] ?? []).length === 0 && <p className="py-4 text-center text-xs text-slate-500">No client files uploaded.</p>}
                          </div>
                          {!proj.testingWindowEnded && <p className="mt-3 text-[10px] font-semibold text-amber-500">Cleanup unlocks when the project is completed, closed, or cancelled.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: TESTER LIST */}
          {activeTab === 'testers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className={`text-lg sm:text-xl font-black break-words ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Registered QA Specialists</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Review profiles, target testing devices, and verified overall bug count.</p>
                </div>

                <div className={`grid grid-cols-1 gap-3 rounded-2xl border p-4 md:grid-cols-3 ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <label className="relative block">
                    <span className="sr-only">Search testers by name or device</span>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={testerSearch}
                      onChange={(event) => setTesterSearch(event.target.value)}
                      placeholder="Search name or device"
                      className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 ${
                        isDarkMode ? 'bg-[#09090B] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter by active campaign</span>
                    <select
                      value={testerCampaignFilter}
                      onChange={(event) => setTesterCampaignFilter(event.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none focus:border-indigo-500 ${
                        isDarkMode ? 'bg-[#09090B] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="all">All active campaigns</option>
                      <option value="none">No active campaigns</option>
                      {testerCampaigns.map(([projectId, appName]) => <option key={projectId} value={projectId}>{appName}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filter by specialty</span>
                    <select
                      value={testerSpecialtyFilter}
                      onChange={(event) => setTesterSpecialtyFilter(event.target.value)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none focus:border-indigo-500 ${
                        isDarkMode ? 'bg-[#09090B] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="all">All specialties</option>
                      {testerSpecialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Showing {filteredTesters.length} of {testers.length} testers</span>
                  {testerFiltersActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setTesterSearch('');
                        setTesterCampaignFilter('all');
                        setTesterSpecialtyFilter('all');
                      }}
                      className="border-0 bg-transparent text-indigo-500 cursor-pointer font-bold hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTesters.map((t) => (
                  <div 
                    key={t.id}
                    className={`border rounded-2xl p-6 ${
                      isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-500 flex items-center justify-center shrink-0">
                        {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{t.name[0]}</span>}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t.name}</h3>
                        <span className="text-[10px] text-slate-400 block font-mono">{t.country}</span>
                      </div>
                      <select value={t.accountStatus ?? (t.status === 'Online' ? 'active' : 'inactive')} onChange={(event) => { void onUpdateTesterStatus(t.id, event.target.value as 'active' | 'inactive' | 'suspended'); }} className={`ml-auto rounded-lg border px-2 py-1 text-[9px] font-black uppercase ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200 bg-white'}`}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="space-y-4 text-xs border-t pt-4 border-slate-200/5 font-semibold text-slate-600 dark:text-slate-355">
                      {/* Personal details */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 font-mono">Personal Details</span>
                        <div className="space-y-1.5 pl-1.5 border-l border-indigo-500/20">
                          <p className="flex justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span className="font-mono text-[10px]">{t.email || 'Not available'}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">Mobile:</span>
                            <span className="font-mono text-[10px]">Profile ID: {t.id.slice(-8)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">Specialty:</span>
                            <span>{t.specialty}</span>
                          </p>
                        </div>
                      </div>

                      {/* Wallet and Earnings */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 font-mono">Wallet & Payouts</span>
                        <div className="space-y-1.5 pl-1.5 border-l border-emerald-500/20">
                          <p className="flex justify-between">
                            <span className="text-slate-400">Wallet Balance:</span>
                            <span className="font-mono text-emerald-500">₹{t.walletBalance.toFixed(2)}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">UPI ID:</span>
                            <span className="font-mono text-[10px]">{t.upiId || 'Not registered'}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400">Paid Out:</span>
                            <span className="font-mono text-slate-450">₹{withdrawals.filter(w => w.testerId === t.id && w.status === 'completed').reduce((sum, w) => sum + w.amount, 0).toFixed(2)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Active Project Campaigns */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 font-mono">Active Campaigns</span>
                        <div className="pl-1.5 border-l border-purple-500/20">
                          {(() => {
                            const activeApps = assignments.filter(a => a.testerId === t.id && a.status === 'active');
                            if (activeApps.length === 0) {
                              return <span className="text-slate-500 text-[10px] italic">No active tracks</span>;
                            }
                            return (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {activeApps.map((a, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md text-[8px] bg-purple-500/10 text-purple-500 font-mono">
                                    {a.appName} (Step {a.currentStep})
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Registered Devices */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 font-mono">Registered Devices</span>
                        <div className="flex flex-wrap gap-1 pl-1.5">
                          {t.devices.map((dev, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md text-[8px] bg-slate-500/10 text-slate-500 font-mono">{dev}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTesters.length === 0 && (
                  <div className={`col-span-full rounded-2xl border p-10 text-center text-xs font-semibold text-slate-500 ${
                    isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    No testers match these filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APP VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ownership Vettings Queue</h2>
                <p className="text-[11px] text-slate-500 mt-1">Audit verification console screenshot proof requests submitted by app developers.</p>
              </div>

              {projects.filter(p => p.verificationStatus === 'pending').length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  All application ownership requests have been resolved.
                </div>
              ) : (
                <div className="space-y-6">
                  {projects
                    .filter(p => p.verificationStatus === 'pending')
                    .map((p) => (
                      <div 
                        key={p.id}
                        className={`p-6 border rounded-2xl flex flex-col md:flex-row justify-between gap-6 ${
                          isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="space-y-3">
                          <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                          <div className="text-xs space-y-1 font-semibold text-slate-500">
                            <p>Package ID: <span className="font-mono text-slate-400">{p.playIntegration?.packageName || 'Not configured'}</span></p>
                            <p>Selected Package Plan: <span className="capitalize text-indigo-500">{p.packageTier?.replace('_', ' ')}</span></p>
                            {p.whatsappGroupLink && (
                              <p className="flex items-center gap-2">
                                Console Screenshot Link: 
                                <a href={p.whatsappGroupLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">
                                  View Screenshot <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2 shrink-0 md:w-44">
                          <button
                            onClick={() => onApproveVerification(p.id)}
                            className="w-full px-4 py-2.5 text-xs text-white font-black rounded-xl border-0 cursor-pointer hover:opacity-90"
                            style={{ backgroundColor: '#10B981' }}
                          >
                            Approve Dashboard
                          </button>
                          
                          <button
                            onClick={() => onRejectVerification(p.id)}
                            className="w-full px-4 py-2.5 text-xs text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl cursor-pointer"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BUG REPORTS CURATION */}
          {activeTab === 'bugs' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verified Bug Curation Room</h2>
                  <p className="text-[11px] text-slate-500 mt-1">Audit raw logs submitted by testers, filter, and publish canonical issues to client rooms.</p>
                </div>
                <label className="w-full sm:w-64">
                  <span className="mb-1.5 block text-[9px] font-black uppercase text-slate-500 font-mono">Project</span>
                  <select
                    value={bugProjectFilter}
                    onChange={(event) => {
                      setBugProjectFilter(event.target.value);
                      setSelectedBugId(null);
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-[#09090B] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">All projects ({bugs.length})</option>
                    {projectsWithBugReports.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({bugs.filter((bug) => bug.appId === project.id).length})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {bugs.length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  No bug reports logged.
                </div>
              ) : filteredBugs.length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  No bug reports are logged for this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Raw incoming bug list */}
                  <div className="lg:col-span-7 space-y-4">
                    {filteredBugs.map((b) => (
                      <div 
                        key={b.id}
                        onClick={() => setSelectedBugId(b.id)}
                        className={`p-5 border rounded-2xl cursor-pointer transition-all duration-300 ${
                          selectedBugId === b.id 
                            ? (isDarkMode ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-indigo-50/50 border-indigo-600 shadow-md')
                            : (isDarkMode ? 'bg-[#18181B] border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-350 shadow-xs')
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                            b.severity === 'Critical' ? 'bg-red-500/15 text-red-500' :
                            b.severity === 'High' ? 'bg-amber-500/15 text-amber-500' : 'bg-indigo-500/15 text-indigo-500'
                          }`}>{b.severity}</span>
                          
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">{b.status}</span>
                        </div>

                        <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{b.title}</h4>
                        <span className="text-[9px] text-slate-400 block mt-1 font-semibold">{b.appName} · Tester: {b.testerName}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selected Bug Curator Form */}
                  <div className="lg:col-span-5">
                    {selectedBugId ? (
                      (() => {
                        const bug = filteredBugs.find(b => b.id === selectedBugId);
                        if (!bug) return null;
                        return (
                          <div className={`p-6 border rounded-2xl space-y-5 sticky top-28 ${
                            isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider border-b pb-3 border-slate-500/5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              Curator Panel
                            </h3>

                            <div className="text-xs space-y-2 font-semibold text-slate-500">
                              <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{bug.title}</p>
                              <p>Tester Device: <span className="font-mono text-slate-400">{bug.device} · {bug.osVersion}</span></p>
                              <p>Logged steps:</p>
                              <ol className="list-decimal pl-4 space-y-1">
                                {bug.reproductionSteps.map((step, idx) => (
                                  <li key={idx} className="font-medium text-[11px]">{step}</li>
                                ))}
                              </ol>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-500/5">
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-500 block mb-2 font-mono">Curator/Admin verification notes</label>
                                <textarea
                                  placeholder="Confirm reproduction, link debug stack logs, or add comments."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={3}
                                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                                    isDarkMode ? 'bg-black border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                />
                              </div>

                              <button
                                onClick={() => {
                                  onPublishBug(bug.id, adminNotes);
                                  setAdminNotes('');
                                  setSelectedBugId(null);
                                }}
                                className="w-full px-4 py-2.5 text-xs text-white font-black rounded-xl border-0 cursor-pointer shadow-md hover:opacity-90"
                                style={{ backgroundColor: '#4F46E5' }}
                              >
                                Publish Verified Bug
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-20 text-slate-500 text-xs font-semibold">Select a raw bug from the queue to start curation.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Support Inbox</h2>
                <p className="mt-1 text-[11px] text-slate-500">Client and tester support requests received by the backend.</p>
              </div>
              {supportTickets.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center text-xs font-semibold text-slate-500 ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'}`}>No support requests received.</div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map((ticket) => {
                    const sender = typeof ticket.raisedBy === 'object' ? ticket.raisedBy : null;
                    const projectName = typeof ticket.projectId === 'object' ? ticket.projectId.appDetails?.appName : undefined;
                    return (
                      <article key={ticket._id} className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[9px] font-black uppercase text-indigo-500">{sender?.role ?? 'user'}</span>
                              <select value={ticket.status} onChange={(event) => { void onUpdateSupportStatus(ticket._id, event.target.value as BackendSupportTicket['status']); }} className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase ${isDarkMode ? 'border-zinc-700 bg-zinc-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
                            </div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</h3>
                            <p className="mt-1 text-[11px] text-slate-500">{sender?.name ?? 'Unknown sender'} · {sender?.email ?? 'Email unavailable'}{projectName ? ` · ${projectName}` : ''}</p>
                          </div>
                          <time className="text-[10px] text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</time>
                        </div>
                        <div className="mt-4 space-y-2 border-t border-slate-500/10 pt-4">
                          {ticket.messages.map((message, index) => {
                            const author = typeof message.authorId === 'object' ? message.authorId : null;
                            return <div key={`${ticket._id}-${index}`} className={`rounded-xl p-3 text-xs ${author?.role === 'admin' ? 'ml-8 bg-indigo-500/10 text-indigo-600' : isDarkMode ? 'mr-8 bg-black/30 text-slate-300' : 'mr-8 bg-slate-50 text-slate-700'}`}>
                              <p className="mb-1 text-[9px] font-black uppercase opacity-70">{author?.role === 'admin' ? 'Admin response' : `${author?.role ?? 'User'} message`}</p>
                              <p>{message.body}</p>
                            </div>;
                          })}
                          <form className="flex gap-2 pt-2" onSubmit={async (event) => {
                            event.preventDefault();
                            const body = supportReplies[ticket._id]?.trim();
                            if (!body) return;
                            setSendingSupportReply(ticket._id);
                            try {
                              await onReplyToSupport(ticket._id, body);
                              setSupportReplies((current) => ({ ...current, [ticket._id]: '' }));
                            } finally { setSendingSupportReply(null); }
                          }}>
                            <input value={supportReplies[ticket._id] ?? ''} onChange={(event) => setSupportReplies((current) => ({ ...current, [ticket._id]: event.target.value }))} placeholder="Reply to this user" className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs ${isDarkMode ? 'border-zinc-700 bg-zinc-950 text-white' : 'border-slate-200 bg-white'}`} />
                            <button disabled={sendingSupportReply === ticket._id} className="rounded-xl border-0 bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{sendingSupportReply === ticket._id ? 'Sending...' : 'Reply'}</button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PAYOUTS & WALLETS */}
          {activeTab === 'cashouts' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>UPI Cashout Processing Desk</h2>
                <p className="text-[11px] text-slate-500 mt-1">Audit outstanding cashout requests, transfer payouts manually, and record bank UTR receipt reference numbers.</p>
              </div>

              {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  All cashout transactions are complete.
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals
                    .filter(w => w.status === 'pending')
                    .map((w) => {
                      const tester = testers.find(t => t.id === w.testerId);
                      const isEnteringUtr = selectedUtrWithdrawalId === w.id;
                      
                      return (
                        <div 
                          key={w.id}
                          className={`p-6 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                            isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                ₹{w.amount.toFixed(2)}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-amber-500/10 text-amber-500">
                                {w.status}
                              </span>
                            </div>
                            <div className="text-xs space-y-1 font-semibold text-slate-500">
                              <p>UPI ID: <span className="font-mono text-slate-400">{w.upiId || 'Not registered'}</span></p>
                              <p>Tester: <span className="text-slate-400">{tester?.name || 'Unknown'}</span></p>
                              <p className="text-[9.5px] font-mono">Date Requested: {w.createdAt}</p>
                            </div>
                          </div>

                          <div className="shrink-0 w-full md:w-auto">
                            {isEnteringUtr ? (
                              <form onSubmit={(e) => handleCompletePayoutSubmit(e, w.id)} className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-500 block mb-1.5 font-mono">Bank UTR Transaction ID</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter 12-digit UTR ID"
                                    value={utrVal}
                                    onChange={(e) => setUtrVal(e.target.value)}
                                    className={`w-full md:w-64 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                                      isDarkMode 
                                        ? `${payoutValidationErr ? 'border-red-500 bg-red-500/5' : 'border-white/10'} text-white` 
                                        : `${payoutValidationErr ? 'border-red-500 bg-red-500/5' : 'border-slate-200'} text-slate-800`
                                    }`}
                                  />
                                  {payoutValidationErr && <p className="mt-1.5 text-[10px] font-bold text-red-500">{payoutValidationErr}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={processingWithdrawalId === w.id}
                                    className="px-4 py-2 text-xs font-black text-white bg-green-600 hover:bg-green-550 border-0 rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {processingWithdrawalId === w.id ? 'Saving...' : 'Confirm Transfer'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUtrWithdrawalId(null);
                                      setUtrVal('');
                                      setPayoutValidationErr('');
                                    }}
                                    className="px-4 py-2 text-xs font-black text-slate-400 border border-slate-500/20 rounded-xl cursor-pointer hover:bg-slate-500/5 bg-transparent"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : rejectingWithdrawalId === w.id ? (
                              <form onSubmit={(event) => { void handleRejectPayoutSubmit(event, w.id); }} className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-500 block mb-1.5 font-mono">Rejection reason</label>
                                  <textarea
                                    required
                                    rows={3}
                                    value={withdrawalRejectReason}
                                    onChange={(event) => setWithdrawalRejectReason(event.target.value)}
                                    placeholder="Explain why this cashout cannot be processed"
                                    className={`w-full md:w-72 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                                      isDarkMode ? 'bg-black border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                                    }`}
                                  />
                                  {payoutValidationErr && <p className="mt-1.5 text-[10px] font-bold text-red-500">{payoutValidationErr}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={processingWithdrawalId === w.id}
                                    className="px-4 py-2 text-xs font-black text-white bg-red-600 border-0 rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {processingWithdrawalId === w.id ? 'Rejecting...' : 'Confirm Rejection'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingWithdrawalId(null);
                                      setWithdrawalRejectReason('');
                                      setPayoutValidationErr('');
                                    }}
                                    className="px-4 py-2 text-xs font-black text-slate-400 border border-slate-500/20 rounded-xl cursor-pointer hover:bg-slate-500/5 bg-transparent"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => setSelectedUtrWithdrawalId(w.id)}
                                  className="w-full px-5 py-2.5 text-xs text-white font-black rounded-xl border-0 cursor-pointer shadow-md hover:opacity-90 transition-all"
                                  style={{ backgroundColor: '#4F46E5' }}
                                >
                                  Process & Complete Payout
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setRejectingWithdrawalId(w.id);
                                    setWithdrawalRejectReason('');
                                    setPayoutValidationErr('');
                                  }}
                                  className="w-full px-5 py-2.5 text-xs text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-xl cursor-pointer"
                                >
                                  Reject Request
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

        </div>




      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around z-50 ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'
      }`}>
        {[
          { id: 'dashboard', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
          { id: 'projects', label: 'Projects', icon: <Smartphone className="w-5 h-5" /> },
          { id: 'testers', label: 'Testers', icon: <Users className="w-5 h-5" /> },
          { id: 'cashouts', label: 'Payouts', icon: <Landmark className="w-5 h-5" /> },
          { id: 'support', label: 'Support', icon: <Headphones className="w-5 h-5" /> }
        ].map(link => (
          <button
            key={link.id}
            onClick={() => handleTabSelect(link.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 border-0 bg-transparent cursor-pointer ${
              activeTab === link.id ? 'text-[#3B82F6] font-bold' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {link.icon}
            <span className="text-[10px]">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
