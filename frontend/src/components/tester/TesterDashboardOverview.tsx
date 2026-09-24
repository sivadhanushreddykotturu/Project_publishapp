"use client";

import React from 'react';
import { Wallet, Smartphone, Bug, ChevronRight, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TesterDashboardOverviewProps {
  isDarkMode: boolean;
  onNavigateToTesting: () => void;
  onNavigateToEarnings: () => void;
  testerName?: string;
  walletBalance?: number;
  activeTestsCount?: number;
  bugsReported?: number;
  earningsThisMonth?: number;
}

export default function TesterDashboardOverview({
  isDarkMode,
  onNavigateToTesting,
  onNavigateToEarnings,
  testerName = 'Tester',
  walletBalance = 2400,
  activeTestsCount = 2,
  bugsReported = 7,
  earningsThisMonth = 1200,
}: TesterDashboardOverviewProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      label: 'Wallet Balance',
      value: `₹${walletBalance.toLocaleString('en-IN')}`,
      sub: 'Available to withdraw',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      onClick: onNavigateToEarnings,
    },
    {
      label: 'Active Tests',
      value: String(activeTestsCount),
      sub: 'Currently running',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
      onClick: onNavigateToTesting,
    },
    {
      label: 'Bugs Reported',
      value: String(bugsReported),
      sub: 'Across all projects',
      icon: <Bug className="w-5 h-5" />,
      color: 'text-rose-500',
      bg: isDarkMode ? 'bg-rose-500/10' : 'bg-rose-50',
      onClick: onNavigateToTesting,
    },
    {
      label: 'Earned This Month',
      value: `₹${earningsThisMonth.toLocaleString('en-IN')}`,
      sub: 'Aug 2026',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-violet-500',
      bg: isDarkMode ? 'bg-violet-500/10' : 'bg-violet-50',
      onClick: onNavigateToEarnings,
    },
  ];

  const recentActivity = [
    { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, text: 'Step 1 completed for Blinkit testing', time: '2h ago' },
    { icon: <Bug className="w-4 h-4 text-rose-500" />, text: 'Bug report submitted on Deloitte app', time: '5h ago' },
    { icon: <Clock className="w-4 h-4 text-amber-500" />, text: 'Joined Swiggy testing queue', time: 'Yesterday' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting + CTA Row */}
      <div className={`rounded-3xl p-8 relative overflow-hidden border ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20 ${
            isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
          }`} />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold text-slate-400 mb-1">{greeting} 👋</p>
            <h2 className={`text-[28px] font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {testerName}
            </h2>
            <p className={`text-[14px] font-medium mt-2 max-w-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              You have <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeTestsCount} active test{activeTestsCount !== 1 ? 's' : ''}</span> in progress. Keep testing to earn more!
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onNavigateToTesting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-[14px] font-bold rounded-2xl shadow-md shadow-blue-600/20 border-0 cursor-pointer transition-all"
            >
              <Smartphone className="w-4 h-4" />
              My Testing Apps
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToEarnings}
              className={`flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold rounded-2xl border cursor-pointer transition-all active:scale-[0.97] ${
                isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              View Earnings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.button
            key={i}
            onClick={stat.onClick}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ y: -2 }}
            className={`text-left p-6 rounded-3xl border cursor-pointer w-full transition-all duration-200 ${
              isDarkMode ? 'bg-[#0F1017] border-white/5 hover:border-white/10' : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <div className={`text-[26px] font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {stat.value}
            </div>
            <div className="text-[12px] font-bold text-slate-400 mt-1.5">{stat.label}</div>
            <div className="text-[11px] text-slate-400/70 mt-0.5">{stat.sub}</div>
          </motion.button>
        ))}
      </div>

      {/* Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className={`lg:col-span-7 rounded-3xl border p-6 ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <h3 className={`text-[16px] font-extrabold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 pb-4 ${i < recentActivity.length - 1 ? `border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}` : ''}`}>
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold leading-snug ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {item.text}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-5 space-y-4">
          {[
            {
              title: 'Explore App Testing',
              desc: 'Browse new testing campaigns and join a project',
              icon: <Smartphone className="w-5 h-5 text-blue-500" />,
              bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
              onClick: onNavigateToTesting,
            },
            {
              title: 'Request Payout',
              desc: `₹${walletBalance.toLocaleString('en-IN')} available · UPI transfer · 48h SLA`,
              icon: <Wallet className="w-5 h-5 text-emerald-500" />,
              bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
              onClick: onNavigateToEarnings,
            },
          ].map((action, i) => (
            <motion.button
              key={i}
              onClick={action.onClick}
              whileHover={{ y: -2 }}
              className={`w-full text-left p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition-all ${
                isDarkMode ? 'bg-[#0F1017] border-white/5 hover:border-white/10' : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl ${action.bg} flex items-center justify-center shrink-0`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {action.title}
                </div>
                <div className="text-[12px] text-slate-400 mt-0.5 truncate">{action.desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
