"use client";

import React from 'react';
import { 
  LayoutGrid, 
  Activity, 
  Wallet, 
  Headphones, 
  LogOut, 
  Sun, 
  Moon, 
  Bell 
} from 'lucide-react';
import { motion } from 'framer-motion';

export type TesterNavTab = 'dashboard' | 'app-testing' | 'earnings' | 'support';

interface TesterNavLayoutProps {
  currentTab: TesterNavTab;
  onSelectTab: (tab: TesterNavTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  deviceName?: string;
  deviceOS?: string;
  userName?: string;
  userAvatar?: string;
  children: React.ReactNode;
}

export default function TesterNavLayout({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  deviceName = "OPPO TX100",
  deviceOS = "Android",
  userName = "Tester",
  userAvatar = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=150&auto=format&fit=crop&q=80",
  children
}: TesterNavLayoutProps) {
  const navItems: { id: TesterNavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5" />
    },
    {
      id: 'app-testing',
      label: 'App Testing',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'support',
      label: 'Support',
      icon: <Headphones className="w-5 h-5" />
    }
  ];

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#090A0F] text-slate-100' : 'bg-[#F4F5F8] text-slate-900'} transition-colors duration-200 font-sans`}>
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className={`w-64 shrink-0 flex flex-col justify-between py-7 px-4 border-r ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        {/* Brand / Logo */}
        <div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-2 border-0 bg-transparent cursor-pointer group text-left"
            title="Return to UXOS Home"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
              <img 
                src="/launchops-logo.png" 
                alt="UXOS" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[24px] font-black tracking-tight font-sans text-slate-900 dark:text-white leading-none">
              UXOS
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-2.5">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-150 text-left cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#181926] text-[#6355FF] shadow-[0_4px_20px_rgba(99,85,255,0.15)] font-bold'
                        : 'bg-white text-[#4F37FE] shadow-[0_4px_22px_rgba(79,55,254,0.12)] font-bold'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  {/* Active Left Indicator Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-7 rounded-r-full bg-[#4F37FE]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <span className={`transition-colors ${isActive ? 'text-[#4F37FE]' : 'text-slate-800 dark:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Logout & Light Mode Toggle */}
        <div className="space-y-5 px-3 pt-6 border-t border-slate-100 dark:border-white/5">
          {/* Logout */}
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 text-[14px] font-medium transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-rose-400' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-slate-400" />
              ) : (
                <Sun className="w-4 h-4 text-slate-600" />
              )}
              <span className={`text-[14px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                {isDarkMode ? 'Dark mode' : 'Light mode'}
              </span>
            </div>

            {/* Switch pill */}
            <button
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isDarkMode ? 'bg-slate-700' : 'bg-[#4F37FE]'
              }`}
              role="switch"
              aria-checked={!isDarkMode}
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  isDarkMode ? 'translate-x-1' : 'translate-x-5'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-2.5 h-2.5 text-slate-800" />
                ) : (
                  <Sun className="w-2.5 h-2.5 text-[#4F37FE]" />
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className={`h-20 flex items-center justify-between px-8 gap-4 border-b ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/70'
        }`}>
          {/* Top Left Navigation */}
          <div className="flex items-center gap-2.5">
          </div>

          <div className="flex items-center gap-4">
            {/* User Device Badge */}
            <div className="text-right">
              <div className={`text-[13px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                {deviceName}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-400">
                <span>{deviceOS}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]"></span>
              </div>
            </div>

          {/* Notification Bell */}
          <button 
            className="w-10 h-10 rounded-full bg-[#4F37FE] text-white flex items-center justify-center shadow-md shadow-[#4F37FE]/20 hover:opacity-90 transition-opacity cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 fill-white text-white" />
          </button>

          {/* Profile Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-white/10 shrink-0">
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-full h-full object-cover"
            />
          </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
