"use client";

import React from 'react';
import { 
  Activity, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TesterDashboardOverviewProps {
  isDarkMode: boolean;
  onNavigateToTesting: () => void;
  onNavigateToEarnings: () => void;
}

export default function TesterDashboardOverview({
  isDarkMode,
  onNavigateToTesting,
  onNavigateToEarnings
}: TesterDashboardOverviewProps) {
  const stats = [
    {
      title: "Active Campaigns",
      value: "3",
      subtext: "2 In Testing • 1 Queued",
      icon: <Activity className="w-5 h-5 text-[#4F37FE]" />,
      bg: "bg-[#4F37FE]/10"
    },
    {
      title: "Total Earnings",
      value: "₹2,400",
      subtext: "Available for UPI cashout",
      icon: <Wallet className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-500/10"
    },
    {
      title: "Consecutive Check-ins",
      value: "8 / 14 Days",
      subtext: "Next check-in in 14 hours",
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-500/10"
    },
    {
      title: "Tester Reputation",
      value: "4.9 ★",
      subtext: "Top 5% Verified Panelist",
      icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className={`p-8 rounded-3xl border shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
      }`}>
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F37FE]/10 text-[#4F37FE] text-[12px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Play 14-Day Testing Panel</span>
          </div>
          <h1 className={`text-[28px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
            Welcome back, Tester
          </h1>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">
            You currently have 2 active test cycles requiring daily check-ins. Keep testing every day to maintain your payout eligibility!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={onNavigateToTesting}
            className="px-8 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[14px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Go to Testing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Glow backdrop */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#4F37FE]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-semibold text-slate-400">{s.title}</span>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.bg}`}>
                {s.icon}
              </div>
            </div>
            <div>
              <div className={`text-[26px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                {s.value}
              </div>
              <div className="text-[12px] text-slate-400 font-medium mt-1">
                {s.subtext}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Test Card Preview */}
        <div className={`p-6 rounded-3xl border shadow-xs ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-[17px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              Current Assigned Task
            </h3>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              In Progress
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F8CB38] flex items-center justify-center font-black text-[#0E5429] text-base shrink-0 shadow-xs">
              blinkit
            </div>
            <div>
              <h4 className={`text-[16px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                Blinkit - Playstore closed Testing
              </h4>
              <p className="text-[12px] text-slate-400">
                Step 1 Verified • 8 of 14 continuous check-ins recorded
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToTesting}
            className="w-full py-3 rounded-xl bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[14px] font-bold shadow-xs transition-colors cursor-pointer text-center"
          >
            Continue Testing Workflow
          </button>
        </div>

        {/* Payout & Wallet Shortcut */}
        <div className={`p-6 rounded-3xl border shadow-xs flex flex-col justify-between ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-[17px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                Wallet & Cashout
              </h3>
              <span className="text-xs font-bold text-[#4F37FE] bg-[#4F37FE]/10 px-2.5 py-1 rounded-full">
                Instant UPI
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-[32px] font-black ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                ₹2,400.00
              </span>
              <span className="text-xs font-semibold text-slate-400">Available Balance</span>
            </div>
            <p className="text-[12px] text-slate-500 font-medium mb-4">
              Withdraw straight to any UPI VPA (Google Pay, PhonePe, Paytm). 48-Hour SLA guarantee.
            </p>
          </div>

          <button
            onClick={onNavigateToEarnings}
            className={`w-full py-3 rounded-xl border font-bold text-[14px] transition-colors cursor-pointer text-center ${
              isDarkMode 
                ? 'border-white/10 text-white hover:bg-white/5' 
                : 'border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            View Earnings & Cashout
          </button>
        </div>
      </div>
    </div>
  );
}
