"use client";

import React, { useState } from 'react';
import { 
  LayoutGrid, Activity, Building2, Headphones, LogOut, Sun, Moon,
  ArrowLeft, Bell, Download, UploadCloud, FileText, CheckCircle2,
  ArrowUp, ArrowDown, Folder, X, Plus, ChevronRight, Share2, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const INITIAL_CLIENT_APPS: ClientAppItem[] = [
  {
    id: 'blinkit',
    name: 'Blinkit',
    category: 'Playstore closed Testing',
    logo: 'blinkit',
    bgColor: '#FFDE43',
    statusText: 'Filling up - Aug 20',
    statusColor: 'orange',
    testersCount: '4+',
    description: 'The people selected for this panel will be expected to remain active, responsive and consistent when testing projects are assigned.',
    buttonLabel: 'Play Store Closed Testing'
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    category: 'Playstore closed Testing',
    logo: 'deloitte',
    bgColor: '#000000',
    statusText: 'Wait in line - Aug 20',
    statusColor: 'yellow',
    testersCount: '4+',
    description: 'this our business right now so I will say the nature of the business and i WILL tell you the exactly the market that we want to build upon so here we go in this process like this - first I will explain the what business we are and I will tell you the how we want to position it.',
    buttonLabel: 'UX Testing'
  }
];

interface TesterRowData {
  id: string;
  name: string;
  direction: 'up' | 'down';
  becameTester: string;
  appInstalled: string;
  hasBugReport: boolean;
  bugReportFileName: string;
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
  newRegisteredApp
}: ClientAppDashboardProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(initialDarkMode);
  const [activeNav, setActiveNav] = useState<'dashboard' | 'testing' | 'services' | 'support'>('testing');
  const [activeFilterTab, setActiveFilterTab] = useState<'back' | 'all' | 'active'>('active');
  const [selectedApp, setSelectedApp] = useState<ClientAppItem | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(49);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Blinkit Screens.pdf', sub: 'Sent to testers group' }
  ]);

  // Merge registered app if passed
  const [apps, setApps] = useState<ClientAppItem[]>(() => {
    if (newRegisteredApp && newRegisteredApp.appName) {
      const isPlayStore = !newRegisteredApp.category || newRegisteredApp.category === 'Playstore closed Testing';
      const customApp: ClientAppItem = {
        id: newRegisteredApp.appName.toLowerCase().replace(/\s+/g, '-'),
        name: newRegisteredApp.appName,
        category: newRegisteredApp.category || 'Playstore closed Testing',
        logo: 'kanma',
        bgColor: newRegisteredApp.category === 'IOS App Publishing' 
          ? '#1D1E2C' 
          : newRegisteredApp.category === 'User Experience Testing' 
            ? '#3B1E54' 
            : '#7A000A',
        statusText: isPlayStore ? 'Active - Aug 21' : 'Consultation Scheduled',
        statusColor: isPlayStore ? 'green' : 'orange',
        testersCount: isPlayStore ? '14+' : 'Contacting',
        description: newRegisteredApp.description || (isPlayStore 
          ? 'Automated 14-day closed testing track with dedicated verified testers providing daily engagement and continuous telemetry.'
          : 'App submitted for dedicated specialist direct review and launch coordination.'),
        buttonLabel: newRegisteredApp.category || 'Play Store Closed Testing'
      };
      return [customApp, ...INITIAL_CLIENT_APPS];
    }
    return INITIAL_CLIENT_APPS;
  });

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => [...prev, { name: file.name, sub: 'Sent to testers group' }]);
    }
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

          {/* Right Header Badges: Kanma Active Testing + Bell + Avatar */}
          <div className="flex items-center gap-5">
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

            {/* Kanma Active Testing Badge */}
            <div className="text-right">
              <div className="text-[15px] font-black text-slate-900 dark:text-white">
                Kanma
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

            {/* User Profile Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Kanma Profile"
                className="w-full h-full object-cover"
              />
            </div>
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
                      {DEFAULT_TESTERS.map((tester) => (
                        <div
                          key={tester.id}
                          className="grid grid-cols-12 items-center py-4 text-[14px] font-medium"
                        >
                          {/* Tester Name with Up/Down Arrow Icon */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-[#4F37FE] text-[#4F37FE] flex items-center justify-center shrink-0">
                              {tester.direction === 'up' ? (
                                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {tester.name}
                            </span>
                          </div>

                          {/* Became Tester Status */}
                          <div className="col-span-3 text-center text-slate-600 dark:text-slate-400">
                            {tester.becameTester}
                          </div>

                          {/* App Installed Status */}
                          <div className="col-span-3 text-center text-slate-600 dark:text-slate-400">
                            {tester.appInstalled}
                          </div>

                          {/* Bug Report Download Button */}
                          <div className="col-span-2 flex justify-end">
                            <button
                              onClick={() => handleDownloadBugReport(tester)}
                              className="px-5 py-2 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[13px] font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: All Testing Files (4 cols) */}
                  <div className={`lg:col-span-4 rounded-3xl border p-7 shadow-sm flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                  }`}>
                    <div>
                      <h3 className="text-[18px] font-black text-center text-slate-900 dark:text-white">
                        All Testing files
                      </h3>

                      {/* Decorative fade line */}
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#4F37FE]/40 to-transparent my-4" />

                      <div className="space-y-4">
                        <div className="text-[13px] font-semibold text-slate-400">
                          Uploaded files
                        </div>

                        {/* File Item (PDF) */}
                        {uploadedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
                          >
                            <div className="w-10 h-11 bg-[#E02636] rounded-xl text-white font-black text-[10px] flex flex-col items-center justify-center shrink-0 shadow-sm">
                              <span>PDF</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                                {file.name}
                              </div>
                              <div className="text-[11px] font-medium text-slate-400">
                                {file.sub}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => alert("All reports package downloaded!")}
                        className="w-full py-3 bg-[#4F37FE]/10 hover:bg-[#4F37FE]/20 text-[#4F37FE] font-bold text-[13px] rounded-2xl transition-colors cursor-pointer text-center"
                      >
                        Download Full Archive (.ZIP)
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ROW: Upload Testing files */}
                <div className={`rounded-3xl border p-8 shadow-sm ${
                  isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="text-center mb-6">
                    <h3 className="text-[20px] font-black text-slate-900 dark:text-white">
                      Upload Testing files
                    </h3>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                      File should be Pdf, word
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left: Drag & Drop Zone */}
                    <div className="lg:col-span-7">
                      <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            setUploadedFiles(prev => [...prev, { name: file.name, sub: 'Sent to testers group' }]);
                          }
                        }}
                        className={`h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-[#4F37FE] bg-[#4F37FE]/10 scale-[1.01]'
                            : 'border-[#4F37FE]/40 hover:border-[#4F37FE] bg-slate-50/50 dark:bg-white/5'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {/* Purple Folder Icon */}
                        <div className="w-16 h-14 bg-[#4F37FE] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#4F37FE]/30 mb-3">
                          <Folder className="w-8 h-8 fill-white/20 stroke-white stroke-[2]" />
                        </div>
                        <span className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                          Drag & Drop your files here
                        </span>
                      </label>
                    </div>

                    {/* Right: Uploading files status */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="text-[13px] font-semibold text-slate-400">
                        Uploading files
                      </div>

                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-11 bg-[#E02636] rounded-xl text-white font-black text-[10px] flex flex-col items-center justify-center shrink-0 shadow-sm">
                            <span>PDF</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                                Blinkit Test scenarios.pdf
                              </span>
                              <span className="text-[12px] font-bold text-slate-400">
                                {uploadProgress}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                              <div
                                style={{ width: `${uploadProgress}%` }}
                                className="bg-[#4F37FE] h-full rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Support Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl border max-w-lg w-full p-7 space-y-5 shadow-2xl ${
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
                  onClick={() => {
                    if (supportMessage.trim()) {
                      setSupportSent(true);
                      setSupportMessage('');
                    }
                  }}
                  className="w-full py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white font-bold rounded-2xl transition-all cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
