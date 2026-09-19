"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutGrid, Activity, Building2, Headphones, LogOut, Sun, Moon,
  ArrowLeft, Bell, Download, FileText, CheckCircle2,
  ArrowUp, ArrowDown, X, Plus, ChevronRight, Share2, Phone, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TestApp } from '../../types';
import type { BackendAssignment, BackendNotification, BackendProjectFile, BackendSupportTicket, LaunchOpsUser } from '../../lib/launchops-api';

export interface ClientAppItem {
  id: string;
  name: string;
  category: string;
  logo: string;
  bgColor: string;
  statusText: string;
  statusColor: 'green' | 'orange' | 'yellow' | 'red';
  testersCount: string;
  description: string;
  buttonLabel: string;
}

interface TesterRowData {
  id: string;
  name: string;
  direction: 'up' | 'down';
  becameTester: string;
  appInstalled: string;
  hasBugReport: boolean;
  bugReportFileName: string;
}

interface EmailDetails {
  subject: string;
  from: string;
  sentVia?: string;
  to: string[];
  cc: string[];
  replyTo?: string;
  body: string;
  slaHours: number;
  slaDueAt?: string;
}

const DEFAULT_TESTERS: TesterRowData[] = [
  {
    id: '1',
    name: 'Nandha Kishore',
    direction: 'up',
    becameTester: 'Completed',
    appInstalled: 'Pending',
    hasBugReport: true,
    bugReportFileName: 'nandha_kishore_bug_report.pdf'
  },
  {
    id: '2',
    name: 'Prathik kumar',
    direction: 'down',
    becameTester: 'Completed',
    appInstalled: 'Installed',
    hasBugReport: true,
    bugReportFileName: 'prathik_kumar_bug_report.pdf'
  },
  {
    id: '3',
    name: 'Dhanish reddy',
    direction: 'up',
    becameTester: 'Completed',
    appInstalled: 'Installed',
    hasBugReport: true,
    bugReportFileName: 'dhanish_reddy_bug_report.pdf'
  },
  {
    id: '4',
    name: 'Sai Lakshmi Ch',
    direction: 'up',
    becameTester: 'Replaced',
    appInstalled: 'Replaced',
    hasBugReport: true,
    bugReportFileName: 'sai_lakshmi_bug_report.pdf'
  }
];

interface ClientAppDashboardProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
  onLogout: () => void;
  onNewAppWizard: () => void;
  projects: TestApp[];
  isLoading?: boolean;
  error?: string;
  currentUser: LaunchOpsUser | null;
  notifications: BackendNotification[];
  onLoadProjectDetails: (projectId: string) => Promise<{ assignments: BackendAssignment[]; files: BackendProjectFile[] }>;
  onDownloadProjectFile: (key: string) => Promise<void>;
  onUploadProjectFile: (projectId: string, file: File) => Promise<BackendProjectFile>;
  onSubmitTestingLink: (projectId: string, optInUrl: string) => Promise<void>;
  onConfirmEmailsAdded: (projectId: string) => Promise<void>;
  onGetVerifiedTesterEmails: (projectId: string) => Promise<{ emails: string[]; count: number }>;
  onSendSupport: (input: { subject: string; message: string; cc: string[] }, projectId?: string) => Promise<void>;
  supportTickets: BackendSupportTicket[];
  onReplyToSupport: (ticketId: string, body: string) => Promise<void>;
  newRegisteredApp?: {
    appName: string;
    category?: string;
    tier?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    appLink?: string;
  } | null;
}

export default function ClientAppDashboard({
  isDarkMode: initialDarkMode,
  onToggleDarkMode,
  onLogout,
  onNewAppWizard,
  projects,
  isLoading = false,
  error = '',
  currentUser,
  notifications,
  onLoadProjectDetails,
  onDownloadProjectFile,
  onUploadProjectFile,
  onSubmitTestingLink,
  onConfirmEmailsAdded,
  onGetVerifiedTesterEmails,
  onSendSupport,
  supportTickets,
  onReplyToSupport
}: ClientAppDashboardProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(initialDarkMode);
  const [activeNav, setActiveNav] = useState<'dashboard' | 'testing' | 'services' | 'support'>('testing');
  const [activeFilterTab, setActiveFilterTab] = useState<'back' | 'all' | 'active'>('active');
  const [selectedApp, setSelectedApp] = useState<ClientAppItem | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('Client dashboard support request');
  const [supportCc, setSupportCc] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [projectAssignments, setProjectAssignments] = useState<BackendAssignment[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<BackendProjectFile[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<BackendNotification | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [testingLink, setTestingLink] = useState('');
  const [testingLinkSaving, setTestingLinkSaving] = useState(false);
  const [testingLinkMessage, setTestingLinkMessage] = useState('');
  const [verifiedEmails, setVerifiedEmails] = useState<string[]>([]);
  const [emailWorkflowBusy, setEmailWorkflowBusy] = useState(false);
  const [emailWorkflowMessage, setEmailWorkflowMessage] = useState('');
  const [supportReplies, setSupportReplies] = useState<Record<string, string>>({});

  const apps: ClientAppItem[] = projects
    .filter((project) => activeFilterTab !== 'active' || project.status === 'Testing')
    .map((project) => ({
      id: project.id,
      name: project.name,
      category: project.category.replace(/_/g, ' '),
      logo: 'project',
      bgColor: '#4F37FE',
      statusText: `${project.status} - ${project.launchDate}`,
      statusColor: project.status === 'Testing' ? 'green' : project.status === 'Completed' ? 'yellow' : 'orange',
      testersCount: `${project.testersCount}/${project.testersRequired ?? 14}`,
      description: project.instructions || project.releaseNotes || 'Play Store closed testing project managed by UXOS.',
      buttonLabel: project.serviceType === 'play_store_closed_testing'
        ? project.serviceOption === 'console_setup'
          ? 'Play Console App Setup'
          : `${project.testersRequired ?? 14} Testers - Closed Testing`
        : project.category,
    }));

  const handleToggleDark = () => {
    setIsDarkMode(!isDarkMode);
    if (onToggleDarkMode) onToggleDarkMode();
  };

  const handleDownloadBugReport = (tester: TesterRowData) => {
    const blob = new Blob([
      `UXOS Bug Report\nTester: ${tester.name}\nStatus: ${tester.becameTester}\nInstallation: ${tester.appInstalled}\nDate: August 20, 2026\nIssues Found: None critical. App functions smoothly.`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tester.bugReportFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!selectedApp) return;
    const project = projects.find((item) => item.id === selectedApp.id);
    setTestingLink(project?.optInUrl ?? '');
    setTestingLinkMessage('');
    setDetailLoading(true);
    setDetailError('');
    void Promise.all([onLoadProjectDetails(selectedApp.id), onGetVerifiedTesterEmails(selectedApp.id)])
      .then(([result, emailResult]) => { setProjectAssignments(result.assignments); setUploadedFiles(result.files); setVerifiedEmails(emailResult.emails); })
      .catch((err) => setDetailError(err instanceof Error ? err.message : 'Could not load project details.'))
      .finally(() => setDetailLoading(false));
  }, [selectedApp?.id]);

  const emailTimeline = notifications.filter((notification) =>
    notification.channel === 'email' &&
    (notification.payload.projectId === selectedApp?.id || notification.relatedId === selectedApp?.id)
  );
  const selectedProjectModel = projects.find((project) => project.id === selectedApp?.id);
  const verificationStep = selectedProjectModel?.workflowSteps?.find((step) => step.type === 'verification');
  const emailReviewStep = selectedProjectModel?.workflowSteps?.find((step) => step.type === 'google_email_review');
  const workflowStage = selectedProjectModel?.status === 'Completed'
    ? 'Completed'
    : selectedProjectModel?.optInUrl
      ? '14-day testing in progress'
      : emailReviewStep?.state === 'verified'
        ? 'Google review approved — testing link ready'
        : emailReviewStep?.state === 'submitted'
          ? 'Google email review pending'
          : verificationStep?.state === 'verified'
            ? 'Verified emails ready to add'
            : 'Collecting verified tester emails';

  const emailTitle = (type: string) => type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const getEmailDetails = (notification: BackendNotification): EmailDetails => {
    const stored = notification.payload.email as Partial<EmailDetails> | undefined;
    return {
      subject: stored?.subject || String(notification.payload.subject || emailTitle(notification.type)),
      from: stored?.from || 'UXOS Support <support@uxos.in>',
      sentVia: stored?.sentVia,
      to: stored?.to || [],
      cc: stored?.cc || [],
      replyTo: stored?.replyTo,
      body: stored?.body || 'Email content was not recorded for this earlier event.',
      slaHours: stored?.slaHours || 24,
      slaDueAt: stored?.slaDueAt,
    };
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0B0C10] text-slate-100' : 'bg-[#F6F7FB] text-slate-900'
    }`}>
      {/* ========================================================= */}
      {/* LEFT SIDEBAR (Matching Menu.png & media_1788953798293.png) */}
      {/* ========================================================= */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 select-none py-8 px-5 transition-colors ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/80'
      }`}>
        <div className="space-y-10">
          {/* Logo */}
          <div className="px-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
              <img 
                src="/launchops-logo.png" 
                alt="UXOS" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              UXOS
            </span>
          </div>

          {/* Navigation items */}
          <nav className="space-y-2">
            {/* Dashboard */}
            <button
              onClick={() => {
                setActiveNav('dashboard');
                setSelectedApp(null);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? isDarkMode
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
              <span>Dashboard</span>
            </button>

            {/* App Testing (Active in screenshot) */}
            <div className="relative">
              {activeNav === 'testing' && (
                <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#4F37FE] rounded-r-full" />
              )}
              <button
                onClick={() => {
                  setActiveNav('testing');
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
                  activeNav === 'testing'
                    ? isDarkMode
                      ? 'bg-white/10 text-[#4F37FE] shadow-sm'
                      : 'bg-white text-[#4F37FE] shadow-lg shadow-[#4F37FE]/10 border border-slate-100/90'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#4F37FE] stroke-[2.4]" />
                </div>
                <span className="font-extrabold text-[#4F37FE]">App Testing</span>
              </button>
            </div>

            {/* Services */}
            <button
              onClick={() => {
                setActiveNav('services');
                onNewAppWizard();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
                activeNav === 'services'
                  ? isDarkMode
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
              }`}
            >
              <Building2 className="w-5 h-5 stroke-[2.2]" />
              <span>Services</span>
            </button>

            {/* Support */}
            <button
              onClick={() => {
                setActiveNav('support');
                setIsSupportOpen(true);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold transition-all cursor-pointer ${
                activeNav === 'support'
                  ? isDarkMode
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-md shadow-slate-200/60 border border-slate-100'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
              }`}
            >
              <Headphones className="w-5 h-5 stroke-[2.2]" />
              <span>Support</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar: Logout & Light mode toggle */}
        <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[15px] font-bold text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 stroke-[2.2]" />
            <span>Logout</span>
          </button>

          {/* Light Mode Switch (matching the toggle in Menu.png) */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-[15px] font-bold">
              <Sun className="w-5 h-5 stroke-[2.2]" />
              <span>Light mode</span>
            </div>

            <button
              onClick={handleToggleDark}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer relative flex items-center ${
                !isDarkMode ? 'bg-[#4F37FE]' : 'bg-slate-700'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-200 ${
                !isDarkMode ? 'translate-x-6 text-[#4F37FE]' : 'translate-x-0 text-slate-700'
              }`}>
                {!isDarkMode ? <Sun className="w-3.5 h-3.5 stroke-[2.5]" /> : <Moon className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0">
          {/* Left: Back / Title or empty */}
          <div>
            {selectedApp ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-11 h-11 rounded-xl bg-[#4F37FE] hover:bg-[#432EE0] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-[#4F37FE]/20 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h2 className="text-[22px] font-black text-slate-900 dark:text-white leading-tight">
                    {selectedApp.name}
                  </h2>
                  <p className="text-[13px] font-medium text-slate-400">
                    {selectedApp.category}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-5 relative">
            {/* Support Pill button if inside app detail */}
            {selectedApp && (
              <button
                onClick={() => setIsSupportOpen(true)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[13px] font-bold shadow-sm cursor-pointer transition-all hover:scale-105 ${
                  isDarkMode
                    ? 'bg-[#0F1017] border-white/10 text-white'
                    : 'bg-white border-slate-200 text-[#4F37FE]'
                }`}
              >
                <Headphones className="w-4 h-4 text-[#4F37FE] stroke-[2.5]" />
                <span>Support —</span>
              </button>
            )}

            <div
              className="text-right cursor-pointer"
              onMouseEnter={() => setProfileOpen(true)}
              onClick={() => setProfileOpen((open) => !open)}
            >
              <div className="text-[15px] font-black text-slate-900 dark:text-white">
                {currentUser?.name || 'Client'}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 justify-end">
                <span>Active Testing</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="w-10 h-10 rounded-full bg-[#4F37FE] text-white flex items-center justify-center shadow-md shadow-[#4F37FE]/20 cursor-pointer">
              <Bell className="w-5 h-5 stroke-[2.3]" />
            </div>

            <div onMouseEnter={() => setProfileOpen(true)} onClick={() => setProfileOpen((open) => !open)} className="w-10 h-10 rounded-full bg-[#4F37FE] text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm font-black cursor-pointer">
              {(currentUser?.name || currentUser?.email || 'C').charAt(0).toUpperCase()}
            </div>
            {profileOpen && (
              <div onMouseLeave={() => setProfileOpen(false)} className={`absolute right-0 top-12 z-50 w-72 rounded-2xl border p-4 shadow-xl ${isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'}`}>
                <p className="font-black">{currentUser?.name || 'Client'}</p>
                <p className="mt-1 text-sm text-slate-500 break-all">{currentUser?.email || 'No email available'}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#4F37FE]">Client account</p>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic View: Apps Listing OR App Detail */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedApp ? (
              // =========================================================
              // SCREEN 1: CLIENT APPS LISTING (media_1788953798293.png)
              // =========================================================
              <motion.div
                key="apps-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Top Filter Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNewAppWizard()}
                    className={`px-6 py-2.5 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
                        : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Back
                  </button>

                  <button
                    onClick={() => setActiveFilterTab('all')}
                    className={`px-7 py-2.5 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer ${
                      activeFilterTab === 'all'
                        ? 'bg-[#4F37FE] text-white border-[#4F37FE]'
                        : isDarkMode
                          ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5'
                          : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>

                  <button
                    onClick={() => setActiveFilterTab('active')}
                    className={`px-7 py-2.5 rounded-2xl text-[14px] font-bold transition-all cursor-pointer shadow-md ${
                      activeFilterTab === 'active'
                        ? 'bg-[#4F37FE] text-white shadow-[#4F37FE]/20'
                        : isDarkMode
                          ? 'bg-[#0F1017] border border-white/10 text-white hover:bg-white/5'
                          : 'bg-white border border-slate-200/90 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Active Testing
                  </button>
                </div>

                {/* Cards Grid (Blinkit, Deloitte, etc.) */}
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}
                {isLoading && <div className="py-16 text-center text-sm font-semibold text-slate-500">Loading projects from MongoDB…</div>}
                {!isLoading && !error && apps.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
                    <p className="font-bold text-slate-700">No matching projects found</p>
                    <button onClick={onNewAppWizard} className="mt-4 rounded-xl bg-[#4F37FE] px-5 py-2.5 text-sm font-bold text-white">Create a testing project</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`rounded-3xl border p-7 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:scale-[1.01] ${
                        isDarkMode
                          ? 'bg-[#0F1017] border-white/10'
                          : 'bg-white border-slate-200/90 shadow-sm'
                      }`}
                    >
                      {/* Top App Header */}
                      <div>
                        <div className="flex items-start gap-4">
                          {/* App Brand Logo */}
                          <div
                            style={{ backgroundColor: app.bgColor }}
                            className="w-18 h-18 rounded-2xl flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-sm"
                          >
                            {app.logo === 'blinkit' ? (
                              <div>
                                <span className="text-[17px] font-black tracking-tight text-[#0E1015] leading-none block">
                                  blinkit
                                </span>
                                <span className="text-[7.5px] font-semibold text-slate-800 leading-none block mt-0.5">
                                  India's Last Minute App
                                </span>
                              </div>
                            ) : app.logo === 'deloitte' ? (
                              <div className="flex items-baseline text-white text-[28px] font-black leading-none">
                                D<span className="text-emerald-400 text-3xl font-black">.</span>
                              </div>
                            ) : (
                              <div className="text-white text-2xl font-black">
                                {app.name.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* App Meta Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[20px] font-black tracking-tight text-slate-900 dark:text-white truncate">
                              {app.name}
                            </h3>
                            <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                              {app.category}
                            </p>

                            {/* Avatars + Status Pill */}
                            <div className="flex items-center gap-3 mt-3">
                              {/* 4+ Tester Avatar Bubble */}
                              <div className="flex items-center bg-slate-100 dark:bg-white/10 rounded-full pl-1 pr-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <div className="flex -space-x-1.5 mr-1.5">
                                  <img
                                    className="w-4 h-4 rounded-full border border-white"
                                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&auto=format&fit=crop&q=80"
                                    alt="Tester 1"
                                  />
                                  <img
                                    className="w-4 h-4 rounded-full border border-white"
                                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&auto=format&fit=crop&q=80"
                                    alt="Tester 2"
                                  />
                                </div>
                                <span className="text-[#4F37FE] font-black">{app.testersCount}</span>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  app.statusColor === 'green' ? 'bg-emerald-500' :
                                  app.statusColor === 'orange' ? 'bg-orange-500' :
                                  app.statusColor === 'yellow' ? 'bg-amber-400' : 'bg-red-500'
                                }`} />
                                <span>{app.statusText}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subtle Horizontal Gradient Line */}
                        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#4F37FE]/30 to-transparent my-5" />

                        {/* Description Section */}
                        <div className="space-y-2">
                          <h4 className="text-[16px] font-black tracking-tight text-slate-900 dark:text-white">
                            Description
                          </h4>
                          <p className="text-[13px] font-normal leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-4">
                            {app.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Button (Full Width Purple) */}
                      <div className="pt-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="w-full py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer text-center"
                        >
                          {app.buttonLabel}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              // =========================================================
              // SCREEN 2: APP TESTING DETAILS (media_1788953827522.png)
              // =========================================================
              <motion.div
                key="app-detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Direct Consultation Status Banner for iOS and UX Testing */}
                {selectedApp.category !== 'Playstore closed Testing' && (
                  <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                    isDarkMode ? 'bg-[#151622] border-white/10' : 'bg-slate-50 border-slate-200/90'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-black text-slate-900 dark:text-white">
                          Direct Specialist Consultation Active
                        </h4>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Our dedicated {selectedApp.category === 'IOS App Publishing' ? 'iOS App Store release team' : 'UX testing research lead'} will contact you via WhatsApp and phone call to coordinate requirements.
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-[#25D366]/15 text-[#25D366] font-bold text-xs shrink-0 self-start sm:self-auto">
                      Contact Scheduled
                    </span>
                  </div>
                )}

                {/* TOP ROW: Tester Table (Left) + All Testing Files (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* LEFT: Tester Progress Table (8 cols) */}
                  <div className={`lg:col-span-8 rounded-3xl border p-7 shadow-sm ${
                    isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                  }`}>
                    {/* Table Header Row */}
                    <div className="grid grid-cols-12 text-[14px] font-bold text-[#4F37FE] pb-4 border-b border-slate-100 dark:border-white/10">
                      <div className="col-span-4">Tester Name</div>
                      <div className="col-span-3 text-center">Became Tester</div>
                      <div className="col-span-3 text-center">App Installed</div>
                      <div className="col-span-2 text-right">Bug Report</div>
                    </div>

                    {/* Table Body Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {projectAssignments.map((assignment) => {
                        const tester = typeof assignment.testerId === 'object' ? assignment.testerId.userId : undefined;
                        const testerName = tester?.name || tester?.email || 'Assigned tester';
                        return (
                        <div
                          key={assignment._id}
                          className="grid grid-cols-12 items-center py-4 text-[14px] font-medium"
                        >
                          {/* Tester Name with Up/Down Arrow Icon */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-[#4F37FE] text-[#4F37FE] flex items-center justify-center shrink-0">
                              {assignment.status === 'active' || assignment.status === 'completed' ? (
                                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {testerName}
                            </span>
                          </div>

                          {/* Became Tester Status */}
                          <div className="col-span-3 text-center text-slate-600 dark:text-slate-400">
                            {assignment.currentStep > 1 ? 'Completed' : 'Pending'}
                          </div>

                          {/* App Installed Status */}
                          <div className="col-span-3 text-center text-slate-600 dark:text-slate-400">
                            {assignment.currentStep > 3 ? 'Installed' : 'Pending'}
                          </div>

                          {/* Bug Report Download Button */}
                          <div className="col-span-2 flex justify-end">
                            <span className="text-xs font-semibold text-slate-400">From bug reports</span>
                          </div>
                        </div>
                      )})}
                      {!detailLoading && projectAssignments.length === 0 && <div className="py-8 text-center text-sm text-slate-500">No testers assigned yet.</div>}
                    </div>
                  </div>

                  {/* RIGHT: Email timeline (4 cols) */}
                  <div className={`lg:col-span-4 rounded-3xl border p-7 shadow-sm flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                  }`}>
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-5 h-5 text-[#4F37FE]" />
                        <h3 className="text-[18px] font-black text-slate-900 dark:text-white">Email timeline</h3>
                      </div>
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#4F37FE]/40 to-transparent my-4" />
                      <div className="space-y-3">
                        {emailTimeline.map((notification, index) => (
                          <div key={notification._id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className={`mt-1 w-2.5 h-2.5 rounded-full ${notification.status === 'sent' ? 'bg-emerald-500' : notification.status === 'failed' ? 'bg-red-500' : 'bg-amber-400'}`} />
                              {index < emailTimeline.length - 1 && <span className="w-px flex-1 min-h-10 bg-slate-200 dark:bg-white/10" />}
                            </div>
                            <button onClick={() => setSelectedEmail(notification)} className="flex-1 pb-4 text-left text-sm font-bold text-slate-900 dark:text-white hover:text-[#4F37FE] transition-colors">
                              {getEmailDetails(notification).subject}
                            </button>
                          </div>
                        ))}
                        {emailTimeline.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No emails yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Play manual workflow */}
                <div className={`rounded-3xl border p-8 shadow-sm ${
                  isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#4F37FE]/10 text-[#4F37FE]"><Share2 className="h-5 w-5" /></div>
                    <div>
                      <h3 className="text-[20px] font-black text-slate-900 dark:text-white">Google Play testing workflow</h3>
                      <p className="mt-0.5 text-[12px] font-medium text-slate-400">Current stage: <span className="font-bold text-[#4F37FE]">{workflowStage}</span></p>
                    </div>
                  </div>
                  <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
                    {['Collect emails', 'Add to Play Console', 'Google review', 'Share testing link', '14-day testing'].map((label, index) => {
                      const activeIndex = selectedProjectModel?.optInUrl ? 4 : emailReviewStep?.state === 'verified' ? 3 : emailReviewStep?.state === 'submitted' ? 2 : verificationStep?.state === 'verified' ? 1 : 0;
                      return <div key={label} className={`rounded-xl px-3 py-2 text-center text-[10px] font-bold ${index <= activeIndex ? 'bg-[#4F37FE]/10 text-[#4F37FE]' : 'bg-slate-500/10 text-slate-400'}`}>{index + 1}. {label}</div>;
                    })}
                  </div>

                  <div className={`mb-6 rounded-2xl border p-5 ${isDarkMode ? 'border-white/10 bg-[#181926]' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div><p className="text-sm font-bold">Verified tester emails ({verifiedEmails.length}/{selectedProjectModel?.testersRequired ?? 0})</p><p className="mt-1 text-xs text-slate-400">Copy these addresses into the Google Play closed-testing email list.</p></div>
                      <button type="button" disabled={!verifiedEmails.length} onClick={async () => { await navigator.clipboard.writeText(verifiedEmails.join(', ')); setEmailWorkflowMessage(`${verifiedEmails.length} emails copied.`); }} className="rounded-xl bg-[#4F37FE] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40">Copy comma-separated</button>
                    </div>
                    <div className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/5 p-3 font-mono text-xs dark:bg-black/20">{verifiedEmails.length ? verifiedEmails.join(',\n') : 'No verified emails yet.'}</div>
                    <button type="button" disabled={emailWorkflowBusy || !verifiedEmails.length || emailReviewStep?.state === 'submitted' || emailReviewStep?.state === 'verified'} onClick={async () => { if (!selectedApp) return; setEmailWorkflowBusy(true); setEmailWorkflowMessage(''); try { await onConfirmEmailsAdded(selectedApp.id); setEmailWorkflowMessage('Confirmed. The admin has been notified and Google email review is pending.'); } catch (confirmError) { setEmailWorkflowMessage(confirmError instanceof Error ? confirmError.message : 'Could not confirm the email list.'); } finally { setEmailWorkflowBusy(false); } }} className="mt-4 rounded-xl border border-[#4F37FE] bg-transparent px-5 py-2.5 text-xs font-bold text-[#4F37FE] disabled:opacity-40">{emailReviewStep?.state === 'submitted' ? 'Google Review Pending' : emailReviewStep?.state === 'verified' ? 'Email Review Approved' : emailWorkflowBusy ? 'Confirming...' : 'I Added These Emails to Play Console'}</button>
                    {emailWorkflowMessage && <p className="mt-3 text-xs font-semibold text-slate-500">{emailWorkflowMessage}</p>}
                  </div>

                  <p className="mb-3 text-xs font-semibold text-slate-500">After Google approves the email list, paste the closed-testing opt-in URL below.</p>
                  <form className="flex flex-col gap-3 md:flex-row" onSubmit={async (event) => {
                    event.preventDefault();
                    if (!selectedApp || !testingLink.trim()) return;
                    setTestingLinkSaving(true);
                    setTestingLinkMessage('');
                    try {
                      await onSubmitTestingLink(selectedApp.id, testingLink.trim());
                      const eligibleCount = projectAssignments.filter((assignment) => assignment.status === 'active' && assignment.currentStep >= 3).length;
                      setTestingLinkMessage(`Testing link saved and sent to ${eligibleCount} eligible enrolled tester${eligibleCount === 1 ? '' : 's'}.`);
                    } catch (submitError) {
                      setTestingLinkMessage(submitError instanceof Error ? submitError.message : 'Could not save the testing link.');
                    } finally {
                      setTestingLinkSaving(false);
                    }
                  }}>
                    <input type="url" required value={testingLink} onChange={(event) => setTestingLink(event.target.value)} placeholder="https://play.google.com/apps/testing/com.example.app" className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[#4F37FE] ${isDarkMode ? 'border-white/10 bg-[#181926] text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
                    <button disabled={testingLinkSaving || !testingLink.trim() || emailReviewStep?.state !== 'verified'} className="rounded-2xl bg-[#4F37FE] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{testingLinkSaving ? 'Sharing...' : selectedProjectModel?.optInUrl ? 'Update & Resend' : 'Save & Notify Testers'}</button>
                  </form>
                  {emailReviewStep?.state !== 'verified' && <p className="mt-3 text-xs text-amber-600">This action unlocks when the admin confirms Google approved the tester email list.</p>}
                  {testingLinkMessage && <p className={`mt-3 text-xs font-semibold ${testingLinkMessage.startsWith('Testing link saved') ? 'text-emerald-600' : 'text-red-500'}`}>{testingLinkMessage}</p>}
                </div>

                {/* BOTTOM ROW: optional project files */}
                <div className={`rounded-3xl border p-8 shadow-sm ${
                  isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-[#4F37FE]/10 text-[#4F37FE] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-black text-slate-900 dark:text-white">Project Files <span className="text-sm font-semibold text-slate-400">(Optional)</span></h3>
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5">Share supporting instructions, credentials, screenshots, or app builds only when needed.</p>
                    </div>
                  </div>
                  {selectedApp && <label className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#4F37FE] px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />{uploadingFile ? 'Uploading...' : 'Add Optional File'}<input type="file" className="hidden" disabled={uploadingFile} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploadingFile(true); try { const saved = await onUploadProjectFile(selectedApp.id, file); setUploadedFiles((items) => [saved, ...items]); } finally { setUploadingFile(false); event.target.value = ''; } }} /></label>}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                        <div className="w-10 h-11 bg-[#E02636] rounded-xl text-white font-black text-[10px] flex items-center justify-center shrink-0"><span>FILE</span></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => void onDownloadProjectFile(file.key)} className="text-xs font-bold text-[#4F37FE]">Download</button>
                      </div>
                    ))}
                    {uploadedFiles.length === 0 && <p className="py-8 text-sm text-slate-500">No testing files available.</p>}
                  </div>
                  {uploadedFiles.length > 0 && <button onClick={() => uploadedFiles.forEach((file) => void onDownloadProjectFile(file.key))} className="mt-6 px-5 py-3 bg-[#4F37FE]/10 hover:bg-[#4F37FE]/20 text-[#4F37FE] font-bold text-sm rounded-2xl">Download All Files</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Email detail modal */}
      {selectedEmail && (() => {
        const details = getEmailDetails(selectedEmail);
        const triggeredAt = new Date(selectedEmail.createdAt);
        const dueAt = details.slaDueAt ? new Date(details.slaDueAt) : new Date(triggeredAt.getTime() + details.slaHours * 3600000);
        return (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedEmail(null)}>
            <div onClick={(event) => event.stopPropagation()} className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[28px] border shadow-2xl ${isDarkMode ? 'bg-[#0F1017] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="p-7 sm:p-9 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-4 border-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0"><Mail className="w-8 h-8" /></div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">Email</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-1 break-words">{details.subject}</h2>
                  </div>
                </div>
                <button onClick={() => setSelectedEmail(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-7 sm:p-9 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div><p className="text-xs uppercase font-bold text-slate-400">From</p><p className="mt-2 text-sm font-semibold break-all">{details.from}</p></div>
                  <div><p className="text-xs uppercase font-bold text-slate-400">Sent via</p><p className="mt-2 text-sm font-semibold break-all">{details.sentVia || details.from}</p></div>
                  <div><p className="text-xs uppercase font-bold text-slate-400">To</p><p className="mt-2 text-sm font-semibold break-all">{details.to.join(', ') || 'Not recorded'}</p></div>
                  <div><p className="text-xs uppercase font-bold text-slate-400">CC</p><p className="mt-2 text-sm font-semibold break-all">{details.cc.join(', ') || 'None'}</p></div>
                  <div><p className="text-xs uppercase font-bold text-slate-400">Status</p><span className={`inline-flex mt-2 px-3 py-1 rounded-lg text-xs font-bold capitalize ${selectedEmail.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : selectedEmail.status === 'failed' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{selectedEmail.status}</span></div>
                </div>

                {details.replyTo && <div><p className="text-xs uppercase font-bold text-slate-400">Reply-to</p><p className="mt-2 text-sm font-semibold break-all">{details.replyTo}</p></div>}

                <div>
                  <p className="text-xs uppercase font-bold text-slate-400 mb-4">SLA timeline</p>
                  <div className="rounded-2xl border border-dotted border-slate-300 dark:border-white/15 p-7 bg-slate-50/60 dark:bg-white/[0.03]">
                    <div className="grid grid-cols-3 relative">
                      <div className="absolute top-5 left-[16.66%] right-[16.66%] h-0.5 bg-slate-200 dark:bg-white/10" />
                      {[
                        { label: 'Triggered', time: triggeredAt, done: true },
                        { label: selectedEmail.status === 'failed' ? 'Delivery failed' : 'Email sent', time: selectedEmail.sentAt ? new Date(selectedEmail.sentAt) : triggeredAt, done: selectedEmail.status === 'sent' },
                        { label: `${details.slaHours}h SLA`, time: dueAt, done: false },
                      ].map((step) => (
                        <div key={step.label} className="relative z-10 text-center">
                          <div className={`mx-auto w-10 h-10 rounded-xl border flex items-center justify-center font-black ${step.done ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white dark:bg-[#0F1017] border-slate-200 dark:border-white/15 text-slate-400'}`}>{step.done ? '✓' : '○'}</div>
                          <p className="mt-3 text-xs sm:text-sm font-bold">{step.label}</p>
                          <p className="mt-1 text-[10px] sm:text-xs text-slate-400">{step.time.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="inline-flex rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-bold">Configuration</span>
                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
                    <p className="text-lg font-black">Email body</p>
                    <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">{details.body.replace(/<[^>]*>/g, '')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Support Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-h-[90vh] overflow-y-auto rounded-3xl border max-w-2xl w-full p-7 space-y-5 shadow-2xl ${
            isDarkMode ? 'bg-[#0F1017] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4F37FE] text-white flex items-center justify-center">
                  <Headphones className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-none">Support Desk</h3>
                  <p className="text-xs text-slate-400 mt-1">24/7 dedicated support engineers</p>
                </div>
              </div>
              <button
                onClick={() => { setIsSupportOpen(false); setSupportSent(false); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {supportSent ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-lg font-bold">Ticket Submitted!</h4>
                <p className="text-sm text-slate-400">Our engineering lead will reply via email within 15 minutes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Subject</label>
                  <input
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="Email subject"
                    className={`mt-1.5 w-full p-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">CC <span className="font-normal text-slate-400">(optional, comma separated)</span></label>
                  <input
                    type="text"
                    value={supportCc}
                    onChange={(e) => setSupportCc(e.target.value)}
                    placeholder="person@example.com, team@example.com"
                    className={`mt-1.5 w-full p-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe what you need assistance with..."
                  className={`w-full p-4 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                    isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <button
                  onClick={async () => {
                    if (supportSubject.trim() && supportMessage.trim()) {
                      setSupportSending(true);
                      try {
                        const cc = supportCc.split(',').map((email) => email.trim()).filter(Boolean);
                        await onSendSupport({ subject: supportSubject.trim(), message: supportMessage.trim(), cc }, selectedApp?.id);
                        setSupportSent(true);
                        setSupportMessage('');
                        setSupportCc('');
                      } catch (err) {
                        setDetailError(err instanceof Error ? err.message : 'Could not send support request.');
                      } finally {
                        setSupportSending(false);
                      }
                    }
                  }}
                  disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}
                  className="w-full py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white font-bold rounded-2xl transition-all cursor-pointer"
                >
                  {supportSending ? 'Sending…' : 'Send to support@uxos.in'}
                </button>
              </div>
            )}
            <div className="space-y-3 border-t border-slate-500/15 pt-4">
              <h4 className="text-sm font-black">My support conversations</h4>
              {supportTickets.length === 0 ? <p className="text-xs text-slate-500">No support conversations yet.</p> : supportTickets.map((ticket) => <article key={ticket._id} className="rounded-2xl border border-slate-500/15 p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{ticket.subject}</strong><span className="text-[9px] font-black uppercase text-[#4F37FE]">{ticket.status.replace('_', ' ')}</span></div><div className="mt-3 space-y-2">{ticket.messages.map((message, index) => { const author = typeof message.authorId === 'object' ? message.authorId : null; const isAdmin = author?.role === 'admin'; return <div key={index} className={`rounded-xl p-3 text-xs ${isAdmin ? 'ml-8 bg-[#4F37FE]/10 text-[#4F37FE]' : 'mr-8 bg-slate-500/10'}`}><p className="mb-1 text-[9px] font-black uppercase opacity-60">{isAdmin ? 'Admin response' : 'You'}</p>{message.body}</div>; })}</div><form className="mt-3 flex gap-2" onSubmit={async (event) => { event.preventDefault(); const body = supportReplies[ticket._id]?.trim(); if (!body) return; await onReplyToSupport(ticket._id, body); setSupportReplies((items) => ({ ...items, [ticket._id]: '' })); }}><input value={supportReplies[ticket._id] ?? ''} onChange={(event) => setSupportReplies((items) => ({ ...items, [ticket._id]: event.target.value }))} placeholder="Reply" className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} /><button className="rounded-xl border-0 bg-[#4F37FE] px-4 text-xs font-bold text-white">Send</button></form></article>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
