import { useState, useEffect } from 'react';
import { 
  Shield, Check, X, AlertTriangle, Plus, Smartphone, Bug, 
  Clock, DollarSign, Users, Award, CornerDownRight, ListFilter, Trash2, ArrowRight, ExternalLink, LogOut, 
  ChevronDown, ChevronUp, UserPlus, Calendar, Bell, Settings, BarChart2, Activity, FileText, AlertCircle, Sparkles, Landmark, RefreshCw
} from 'lucide-react';
import { TestApp, BugReport, TesterAssignment, Tester, WithdrawalRequest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackendNotification } from '../lib/launchops-api';

interface AdminConsoleProps {
  isDarkMode: boolean;
  projects: TestApp[];
  bugs: BugReport[];
  assignments: TesterAssignment[];
  testers: Tester[];
  withdrawals: WithdrawalRequest[];
  notifications: BackendNotification[];
  onReadNotification: (notificationId: string) => void;
  onApproveVerification: (projectId: string, customPrice?: number) => void;
  onRejectVerification: (projectId: string) => void;
  onAdvanceMilestone: (projectId: string, step: number, payload?: any) => void;
  onReplaceTester: (assignmentId: string) => void;
  onMergeBugs: (canonicalId: string, duplicateId: string) => void;
  onPublishBug: (bugId: string, adminNotes?: string) => void;
  onCompleteWithdrawal: (withdrawalId: string, transactionId: string) => void;
  onRejectWithdrawal: (withdrawalId: string, reason: string) => void;
  onLogout: () => void;
  onAddTesterToProject: (projectId: string, testerId: string) => void;
  onRemoveTesterFromProject: (projectId: string, testerId: string) => void;
  onApproveTesterStep1: (projectId: string, testerId: string) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AdminConsole({
  isDarkMode,
  projects,
  bugs,
  assignments,
  testers,
  withdrawals,
  notifications,
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
  initialTab,
  onTabChange
}: AdminConsoleProps) {
  // Tabs map directly to sidebar menu options
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'testers' | 'verifications' | 'bugs' | 'cashouts'>(() => {
    if (initialTab && ['dashboard', 'projects', 'testers', 'verifications', 'bugs', 'cashouts'].includes(initialTab)) {
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
  
  // Selection states for project assignments
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [addingTesterProjectId, setAddingTesterProjectId] = useState<string | null>(null);
  const [selectedTesterToAssign, setSelectedTesterToAssign] = useState<string>('');
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialTab && ['dashboard', 'projects', 'testers', 'verifications', 'bugs', 'cashouts'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleTabSelect = (tab: 'dashboard' | 'projects' | 'testers' | 'verifications' | 'bugs' | 'cashouts') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleCompletePayoutSubmit = (e: React.FormEvent, withdrawalId: string) => {
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
    onCompleteWithdrawal(withdrawalId, utrVal);
    setSelectedUtrWithdrawalId(null);
    setUtrVal('');
  };

  const activeProjects = projects.filter((project) => project.status === 'Testing');
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active');
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed');
  const pendingVerifications = projects.filter((project) => project.verificationStatus === 'pending');
  const completedPayoutTotal = withdrawals.filter((withdrawal) => withdrawal.status === 'completed').reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
  const successRate = assignments.length ? Math.round((completedAssignments.length / assignments.length) * 100) : 0;
  const dashboardStats = [
    { title: 'Active Projects', value: activeProjects.length.toString(), desc: `${projects.length} total projects` },
    { title: 'Total Testers', value: testers.length.toString(), desc: `${testers.filter((tester) => tester.status === 'Online').length} active` },
    { title: 'Tests In Progress', value: activeAssignments.length.toString(), desc: `${assignments.length} assignments` },
    { title: 'Bugs Reported', value: bugs.length.toString(), desc: `${bugs.filter((bug) => bug.isPublished).length} published` },
    { title: 'Total Payouts', value: `₹${completedPayoutTotal.toFixed(2)}`, desc: `${withdrawals.filter((withdrawal) => withdrawal.status === 'pending').length} pending` },
    { title: 'Success Rate', value: `${successRate}%`, desc: `${completedAssignments.length} completed` },
  ];
  const dashboardAlerts = [
    ...assignments.filter((assignment) => assignment.inactivityFlag).map((assignment) => ({ title: 'Tester inactivity flagged', app: assignment.appName, type: 'error' as const })),
    ...projects.filter((project) => project.playIntegration?.lastApiError).map((project) => ({ title: project.playIntegration!.lastApiError!, app: project.name, type: 'warning' as const })),
    ...pendingVerifications.map((project) => ({ title: 'Client verification awaiting review', app: project.name, type: 'info' as const })),
  ];
  const todayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

  return (
    <div className={`h-screen overflow-hidden flex ${isDarkMode ? 'bg-[#09090B] text-slate-105' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ================= LEFT SIDEBAR (THEME AWARE LIKE TESTER/CLIENT DASHBOARDS) ================= */}
      <aside className={`hidden md:flex w-[260px] border-r shrink-0 flex-col justify-between p-6 sticky top-0 h-screen z-20 ${
        isDarkMode ? 'bg-[#09090B] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-md shadow-indigo-600/30">
              <span className="text-white font-extrabold italic text-sm">LO</span>
            </div>
            <span className="font-black tracking-wider text-lg uppercase font-display">
              Launch<span className="text-indigo-600">Ops</span>
            </span>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
              { id: 'projects', label: 'Projects', icon: <Smartphone className="w-4 h-4" /> },
              { id: 'testers', label: 'Testers', icon: <Users className="w-4 h-4" /> },
              { id: 'bugs', label: 'Bug Reports', icon: <Bug className="w-4 h-4" /> },
              { id: 'cashouts', label: 'Payouts & Wallets', icon: <Landmark className="w-4 h-4" /> }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-none cursor-pointer text-left ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-zinc-800/30 bg-transparent'
                        : 'text-slate-650 hover:text-slate-900 hover:bg-indigo-50/30 bg-transparent'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile and Logout Footer */}
        <div className={`pt-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 font-display">
                AD
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>LaunchOps Admin</span>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Super Admin
                </span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className={`p-2 rounded-xl border-none cursor-pointer bg-transparent transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-red-450 hover:bg-zinc-800/30' : 'text-slate-500 hover:text-red-600 hover:bg-red-50/50'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN WINDOW GRID ================= */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Main Header */}
        <header className={`px-8 py-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
          isDarkMode ? 'bg-[#09090B]/90 border-zinc-800/60' : 'bg-white/90 border-slate-200'
        }`}>
          <div>
            <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Admin Control Center
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Here's what's happening on LaunchOps today.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold ${
              isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{todayLabel}</span>
            </div>
            
            <div className="relative">
            <button onClick={() => setNotificationDropdownOpen((open) => !open)} className={`p-2 border rounded-xl relative hover:bg-slate-500/5 border-slate-250 cursor-pointer ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}>
              <Bell className="w-4 h-4 text-slate-400" />
              {notifications.some((notification) => !notification.readAt) && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />}
            </button>
            {notificationDropdownOpen && <div className={`absolute right-0 top-12 w-80 max-h-96 overflow-y-auto rounded-xl border p-2 shadow-xl ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'}`}>
              {notifications.length === 0 ? <p className="p-3 text-xs text-slate-500">No notifications.</p> : notifications.map((notification) => <button key={notification._id} onClick={() => { onReadNotification(notification._id); if (notification.type === 'project_request') handleTabSelect('projects'); setNotificationDropdownOpen(false); }} className={`w-full text-left p-3 rounded-lg text-xs ${notification.readAt ? 'opacity-55' : ''} ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-slate-50'}`}><span className="font-bold block">{notification.type === 'project_request' ? 'New published project' : notification.type.replace(/_/g, ' ')}</span><span className="text-slate-500 block mt-1">{String(notification.payload.appName ?? '')}</span></button>) }
            </div>}
            </div>

            <button onClick={() => handleTabSelect('projects')} className="px-4 py-2 text-white text-xs font-black rounded-xl bg-indigo-655 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 border-0 cursor-pointer" style={{ backgroundColor: '#4F46E5' }}>
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
                        <div className="absolute inset-0 rounded-full border-[14px] border-indigo-600 border-t-purple-500 border-r-amber-500 border-b-transparent transform rotate-45" />
                        <div className="text-center z-10">
                          <span className={`text-3xl font-black block tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{testers.length}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider mt-1 block">Total Testers</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 text-[10px] font-semibold">
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-500/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-slate-500">Active</span>
                        <span className="font-mono font-black ml-auto">{testers.filter((tester) => tester.status === 'Online').length}</span>
                      </div>
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-500/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                        <span className="text-slate-500">In Progress</span>
                        <span className="font-mono font-black ml-auto">{new Set(activeAssignments.map((assignment) => assignment.testerId)).size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-slate-500">Waiting</span>
                        <span className="font-mono font-black ml-auto">{assignments.filter((assignment) => assignment.status === 'queued').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-405 shrink-0" />
                        <span className="text-slate-500">Inactive</span>
                        <span className="font-mono font-black ml-auto">{testers.filter((tester) => tester.status !== 'Online').length}</span>
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
              </div>

              {projects.map((proj) => {
                const isExpanded = expandedProjectId === proj.id;
                const activeAss = assignments.filter(a => a.projectId === proj.id && a.status === 'active');
                
                return (
                  <div 
                    key={proj.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Project Header Row */}
                    <div 
                      onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
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
                            <button
                              onClick={() => {
                                const currentStep = Math.round((proj.progress || 0) / 16.6);
                                const nextStep = Math.min(currentStep + 1, 6);
                                onAdvanceMilestone(proj.id, nextStep, { optInUrl: 'https://play.google.com/apps/testing/' + (proj.playIntegration?.packageName || 'com.launchops.app') });
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
                                  .filter(t => !activeAss.some(a => a.testerId === t.id))
                                  .map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.devices.join(', ')})</option>
                                  ))}
                              </select>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  if (selectedTesterToAssign) {
                                    onAddTesterToProject(proj.id, selectedTesterToAssign);
                                    setSelectedTesterToAssign('');
                                    setAddingTesterProjectId(null);
                                  }
                                }}
                                className="px-4 py-2 text-xs font-black text-white bg-green-600 hover:bg-green-550 border-0 rounded-xl cursor-pointer"
                              >
                                Confirm Allocation
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
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black bg-slate-500/10 text-slate-400">
                                        Step {ass.currentStep} / 6
                                      </span>

                                      <div className="flex items-center gap-1.5">
                                        {/* Verify Step 1 Button */}
                                        {ass.currentStep === 1 && ass.testerEmail && ass.step1Screenshot && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onApproveTesterStep1(proj.id, ass.testerId);
                                            }}
                                            className="px-2.5 py-1.5 text-white font-extrabold text-[9px] uppercase border-0 rounded-lg cursor-pointer hover:opacity-90"
                                            style={{ backgroundColor: '#10B981' }}
                                          >
                                            Verify Step 1
                                          </button>
                                        )}

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
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Registered QA Specialists</h2>
                <p className="text-[11px] text-slate-500 mt-1">Review profiles, target testing devices, and verified overall bug count.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testers.map((t) => (
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
                    </div>

                    <div className="space-y-4 text-xs border-t pt-4 border-slate-200/5 font-semibold text-slate-600 dark:text-slate-355">
                      {/* Personal details */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 font-mono">Personal Details</span>
                        <div className="space-y-1.5 pl-1.5 border-l border-indigo-500/20">
                          <p className="flex justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span className="font-mono text-[10px]">{t.name.toLowerCase().replace(/\s+/g, '')}@launchops.com</span>
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
                            <p>Package ID: <span className="font-mono text-slate-400">{p.playIntegration?.packageName || 'com.launchops.app'}</span></p>
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
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verified Bug Curation Room</h2>
                <p className="text-[11px] text-slate-500 mt-1">Audit raw logs submitted by testers, filter, and publish canonical issues to client rooms.</p>
              </div>

              {bugs.length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  No bug reports logged.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Raw incoming bug list */}
                  <div className="lg:col-span-7 space-y-4">
                    {bugs.map((b) => (
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
                        const bug = bugs.find(b => b.id === selectedBugId);
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

          {/* TAB 6: PAYOUTS & WALLETS */}
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
                              <p>UPI ID: <span className="font-mono text-slate-400">{w.upiId}</span></p>
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
                                    className="px-4 py-2 text-xs font-black text-white bg-green-600 hover:bg-green-550 border-0 rounded-xl cursor-pointer"
                                  >
                                    Confirm Transfer
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
                                  onClick={() => onRejectWithdrawal(w.id, 'Incorrect UPI address or account flag.')}
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

        {/* ================= BOTTOM STATUS ROW ================= */}
        <footer className={`px-8 py-5 border-t grid grid-cols-2 md:grid-cols-5 gap-6 text-xs font-semibold ${
          isDarkMode ? 'bg-[#0A0A0C]/90 border-zinc-800/60 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <span className="text-[10px] text-slate-405 block font-mono">Auto Replacements</span>
              <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>5 Today</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-405 block font-mono">Inactive (48h+)</span>
              <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>7 Testers</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-405 block font-mono">Bugs Resolved</span>
              <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>28 Today</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-405 block font-mono">Play Store Sync</span>
              <span className="font-black text-green-500">All Good</span>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-405 block font-mono">System Status</span>
              <span className="font-black text-green-500">Operational</span>
            </div>
          </div>
        </footer>

      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0C] border-t border-zinc-800/60 flex items-center justify-around z-50">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-5 h-5" /> },
          { id: 'projects', label: 'Apps', icon: <Smartphone className="w-5 h-5" /> },
          { id: 'cashouts', label: 'Payouts', icon: <Landmark className="w-5 h-5" /> }
        ].map(link => (
          <button
            key={link.id}
            onClick={() => handleTabSelect(link.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 border-0 bg-transparent cursor-pointer ${
              activeTab === link.id ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200'
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
