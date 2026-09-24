import React, { useState } from 'react';
import { 
  Wallet, Bell, LogOut, Compass, Smartphone, Headphones
} from 'lucide-react';
import { Tester, TestApp, TesterAssignment, BugReport, Transaction, WithdrawalRequest } from '../types';
import { motion } from 'framer-motion';
import type { BackendNotification, BackendSupportTicket } from '../lib/launchops-api';
import AppTestingExplore from './tester/AppTestingExplore';
import MyAppTestingList from './tester/MyAppTestingList';
import TestingStepInstructions from './tester/TestingStepInstructions';
import TesterEarningsView from './tester/TesterEarningsView';
import TesterSupportView from './tester/TesterSupportView';

interface TesterDashboardProps {
  isDarkMode: boolean;
  onToggleDarkMode?: () => void;
  activeTester: Tester;
  projects: TestApp[];
  assignments: TesterAssignment[];
  bugs: BugReport[];
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  notifications: BackendNotification[];
  supportTickets: BackendSupportTicket[];
  onReadNotification: (notificationId: string) => void;
  onUpdateTesterProfile: (updatedTester: Partial<Tester>) => void;
  onJoinProject: (projectId: string) => Promise<void>;
  onSubmitStep1Email: (assignmentId: string, email: string, screenshotUrl?: string) => void | Promise<void>;
  onClickStep3Link: (assignmentId: string, screenshotUrl?: string) => void;
  onLogStep4CheckIn: (assignmentId: string) => void;
  onUploadProof: (file: File) => Promise<string>;
  onSubmitBugReport: (bugReport: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }) => void | Promise<void>;
  onRequestWithdrawal: (amount: number, upiId: string) => { success: boolean; error?: string } | Promise<{ success: boolean; error?: string }>;
  onSendSupport: (input: { subject: string; message: string; projectId?: string }) => Promise<void>;
  onReplyToSupport: (ticketId: string, body: string) => Promise<void>;
  onLogout: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function TesterDashboard({
  isDarkMode,
  onToggleDarkMode,
  activeTester,
  projects,
  assignments,
  bugs,
  transactions,
  withdrawals,
  notifications,
  supportTickets,
  onReadNotification,
  onUpdateTesterProfile,
  onJoinProject,
  onSubmitStep1Email,
  onClickStep3Link,
  onLogStep4CheckIn,
  onUploadProof,
  onSubmitBugReport,
  onRequestWithdrawal,
  onSendSupport,
  onReplyToSupport,
  onLogout,
  initialTab,
  onTabChange
}: TesterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'explore' | 'my-apps' | 'instructions' | 'wallet' | 'support'>('explore');
  const [selectedAppId, setSelectedAppId] = useState<string>('blinkit');
  const [selectedStep, setSelectedStep] = useState<1 | 2 | 3>(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTabSelect = (tab: 'explore' | 'my-apps' | 'instructions' | 'wallet' | 'support') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab === 'explore' || tab === 'my-apps' ? 'projects' : tab);
    }
  };

  // Sidebar nav items
  const navLinks = [
    {
      id: 'explore' as const,
      label: 'App Testing',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M4 3h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-5v2h2c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1h2v-2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm2 4v6h12V7H6z" />
        </svg>
      ),
    },
    {
      id: 'wallet' as const,
      label: 'Earnings',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20 7H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-2 6h-3c-.55 0-1-.45-1-1s.45-1 1-1h3v2zM4 4h14c.55 0 1 .45 1 1s-.45 1-1 1H4C3.45 6 3 5.55 3 5s.45-1 1-1z" />
        </svg>
      ),
    },
    {
      id: 'support' as const,
      label: 'Support',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 3a9 9 0 0 0-9 9v6c0 1.66 1.34 3 3 3h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5v-2a7 7 0 0 1 14 0v2h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1c1.66 0 3-1.34 3-3v-6a9 9 0 0 0-9-9z" />
        </svg>
      ),
    },
  ];

  const headerTitle: Record<string, string> = {
    explore: 'App Testing',
    'my-apps': 'My Apps',
    instructions: 'Testing Steps',
    wallet: 'Earnings',
    support: 'Support',
  };

  const headerSub: Record<string, string> = {
    explore: 'Browse and join testing campaigns',
    'my-apps': 'Your active and queued testing slots',
    instructions: 'Step-by-step testing workflow',
    wallet: 'Manage your earnings and withdrawals',
    support: 'Chat with UXOS support team',
  };

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden font-sans transition-colors duration-300 flex flex-col md:flex-row ${
      isDarkMode ? 'bg-[#090A0F] text-slate-100' : 'bg-[#F4F5F8] text-slate-900'
    }`}>

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`hidden md:flex shrink-0 flex-col justify-between py-7 border-r transition-all duration-300 ${
        isCollapsed ? 'w-20 px-3 items-center' : 'w-64 px-4'
      } ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="w-full">
          {/* Logo + collapse toggle */}
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

          {/* Nav links */}
          <nav className="space-y-2.5 w-full">
            {/* Section heading — "Dashboard" label */}
            {!isCollapsed && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400/70 px-4 pb-1 select-none">
                Dashboard
              </p>
            )}
            {navLinks.map((link) => {
              const isActive =
                activeTab === link.id ||
                ((activeTab === 'my-apps' || activeTab === 'instructions') && link.id === 'explore');

              return (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id)}
                  className={`relative w-full flex items-center ${
                    isCollapsed ? 'justify-center py-3.5 px-0' : 'gap-3.5 px-4 py-3.5'
                  } rounded-2xl text-[15px] font-bold transition-all duration-150 cursor-pointer border-0 ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#181926] text-[#6355FF] shadow-[0_4px_20px_rgba(99,85,255,0.15)]'
                        : 'bg-white text-[#4F37FE] shadow-[0_4px_22px_rgba(79,55,254,0.12)]'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5 bg-transparent'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50 bg-transparent'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-7 rounded-r-full bg-[#4F37FE]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {isActive && isCollapsed && (
                    <>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#4F37FE]" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-l-full bg-[#4F37FE]" />
                    </>
                  )}
                  <span className={isActive ? 'text-[#4F37FE]' : ''}>{link.icon}</span>
                  {!isCollapsed && <span>{link.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: logout + dark mode toggle */}
        <div className={`w-full space-y-4 border-t border-slate-100 dark:border-white/5 pt-6 ${isCollapsed ? 'px-0 text-center' : 'px-3'}`}>
          <button
            onClick={onLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} text-[14px] font-bold transition-colors cursor-pointer border-0 bg-transparent ${
              isDarkMode ? 'text-slate-400 hover:text-rose-400' : 'text-slate-600 hover:text-rose-600'
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} pt-1`}>
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
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

        {/* Top Header */}
        <header className={`h-20 flex items-center justify-between px-8 gap-4 border-b shrink-0 ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/70'
        }`}>
          <div>
            <h1 className={`text-[18px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {headerTitle[activeTab]}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {headerSub[activeTab]}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Device info — dynamic */}
            {activeTester.devices && activeTester.devices.length > 0 && (
              <div className="text-right hidden sm:block">
                <div className={`text-[12px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {activeTester.devices[0]}
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-400">
                  <span>Android</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            )}

            {/* Bell with unread badge */}
            <div className="relative">
              <button
                className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer border-0 transition-all active:scale-95 ${
                  isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              {notifications && notifications.some(n => !n.readAt) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0F1017]" />
              )}
            </div>

            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 shrink-0 ${isDarkMode ? 'ring-white/10' : 'ring-slate-200'}`}>
              <img
                src={activeTester.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeTester.name)}&background=3B82F6&color=fff`}
                alt={activeTester.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Views */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'explore' && (
            <AppTestingExplore
              isDarkMode={isDarkMode}
              onOpenMyApps={() => handleTabSelect('my-apps')}
              onSelectApp={(appId) => {
                setSelectedAppId(appId);
                setActiveTab('instructions');
              }}
              onJoinTesting={async (appId) => {
                await onJoinProject(appId);
              }}
              onJoinQueue={async (appId) => {
                await onJoinProject(appId);
              }}
            />
          )}

          {activeTab === 'my-apps' && (
            <MyAppTestingList
              isDarkMode={isDarkMode}
              onBack={() => handleTabSelect('explore')}
              onOpenAppTesting={(appId, step) => {
                setSelectedAppId(appId);
                setSelectedStep((step as any) || 1);
                setActiveTab('instructions');
              }}
            />
          )}

          {activeTab === 'instructions' && (
            <TestingStepInstructions
              isDarkMode={isDarkMode}
              appName={
                selectedAppId === 'kanma' ? 'Kanma' :
                selectedAppId === 'blinkit' ? 'Blinkit' :
                selectedAppId === 'swiggy' ? 'Swiggy' :
                selectedAppId === 'deloitte' ? 'Deloitte' : 'Blinkit'
              }
              appSubtitle="Playstore closed Testing"
              initialStep={selectedStep}
              onBack={() => handleTabSelect('my-apps')}
              onOpenSupport={() => handleTabSelect('support')}
              onCompleteStep={(step) => {
                if (step < 3) setSelectedStep((step + 1) as any);
              }}
            />
          )}

          {activeTab === 'wallet' && (
            <TesterEarningsView
              isDarkMode={isDarkMode}
              walletBalance={activeTester.walletBalance}
              onRequestCashout={async (amount, upiId) => {
                const res = await onRequestWithdrawal(amount, upiId);
                return res.success;
              }}
            />
          )}

          {activeTab === 'support' && (
            <TesterSupportView
              isDarkMode={isDarkMode}
              onSubmitTicket={async (ticket) => {
                await onSendSupport({ subject: ticket.subject, message: ticket.message });
              }}
            />
          )}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around z-50 ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'
      }`}>
        {[
          { id: 'explore' as const, label: 'Testing', icon: <Smartphone className="w-5 h-5" /> },
          { id: 'wallet' as const, label: 'Earnings', icon: <Wallet className="w-5 h-5" /> },
          { id: 'support' as const, label: 'Support', icon: <Headphones className="w-5 h-5" /> },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => handleTabSelect(link.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 border-0 bg-transparent cursor-pointer ${
              activeTab === link.id || (link.id === 'explore' && (activeTab === 'my-apps' || activeTab === 'instructions'))
                ? 'text-[#4F37FE] font-bold'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
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