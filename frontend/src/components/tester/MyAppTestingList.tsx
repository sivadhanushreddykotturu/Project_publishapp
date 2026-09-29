"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TestApp, TesterAssignment } from '../../types';

export type MyAppFilter = 'all' | 'active' | 'queued';

export interface MyAppItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'active' | 'queued';
  iconBg: string;
  iconContent: React.ReactNode;
  statusText: string;
  statusDotColor: 'green' | 'yellow' | 'orange';
  description: string;
  buttonLabel: string;
  buttonVariant: 'primary' | 'outline' | 'disabled';
  testerStat?: {
    highlight: string;
    sublabel: string;
  };
  step?: 1 | 2 | 3;
}

interface MyAppTestingListProps {
  isDarkMode: boolean;
  projects?: TestApp[];
  assignments?: TesterAssignment[];
  onBack: () => void;
  onOpenAppTesting: (appId: string, step?: number) => void;
}

export const DEFAULT_MY_APPS: MyAppItem[] = [];

export default function MyAppTestingList({
  isDarkMode,
  projects = [],
  assignments = [],
  onBack,
  onOpenAppTesting
}: MyAppTestingListProps) {
  const [filter, setFilter] = useState<MyAppFilter>('all');

  const apps = useMemo<MyAppItem[]>(() => assignments.map((assignment) => {
    const project = projects.find((item) => item.id === assignment.projectId);
    const name = project?.name || assignment.appName;
    const queued = assignment.status === 'queued';
    const completed = assignment.status === 'completed';
    return {
      id: assignment.projectId,
      name,
      subtitle: project?.category || 'Testing campaign',
      category: queued ? 'queued' : 'active',
      iconBg: '#4F37FE',
      iconContent: <span className="text-2xl font-black text-white">{name.charAt(0).toUpperCase()}</span>,
      statusText: queued ? `Queue #${assignment.queuePosition ?? '-'}` : completed ? 'Completed' : 'Active',
      statusDotColor: queued ? 'yellow' : completed ? 'green' : 'green',
      description: project?.instructions || project?.releaseNotes || `Testing workflow for ${name}.`,
      buttonLabel: queued ? 'Waiting in queue' : completed ? 'View Testing' : 'Open Testing',
      buttonVariant: queued ? 'disabled' : 'primary',
      testerStat: queued
        ? { highlight: `#${assignment.queuePosition ?? '-'}`, sublabel: 'Queue position' }
        : { highlight: `Step ${assignment.currentStep}/6`, sublabel: completed ? 'Completed' : 'Current progress' },
      step: Math.min(3, assignment.currentStep) as 1 | 2 | 3,
    };
  }), [assignments, projects]);

  const filteredApps = apps.filter((app) => {
    if (filter === 'all') return true;
    if (filter === 'active') return app.category === 'active' && app.buttonLabel !== 'Replaced you are inactive' && app.buttonLabel !== 'Wait Other to Join';
    if (filter === 'queued') return app.category === 'queued';
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ================= TOP FILTER BUTTONS ================= */}
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`px-8 py-3 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer ${
            isDarkMode 
              ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          Back
        </button>

        {/* All Pill */}
        <button
          onClick={() => setFilter('all')}
          className={`px-8 py-3 rounded-2xl text-[14px] font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#4F37FE] text-white shadow-md shadow-[#4F37FE]/20'
              : isDarkMode
                ? 'bg-[#0F1017] border border-white/10 text-slate-300 hover:bg-white/5'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All
        </button>

        {/* Active Testing Pill */}
        <button
          onClick={() => setFilter('active')}
          className={`px-8 py-3 rounded-2xl text-[14px] font-bold transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-[#4F37FE] text-white shadow-md shadow-[#4F37FE]/20'
              : isDarkMode
                ? 'bg-[#0F1017] border border-white/10 text-slate-300 hover:bg-white/5'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Active Testing
        </button>

        {/* Queued Pill */}
        <button
          onClick={() => setFilter('queued')}
          className={`px-8 py-3 rounded-2xl text-[14px] font-bold transition-all cursor-pointer ${
            filter === 'queued'
              ? 'bg-[#4F37FE] text-white shadow-md shadow-[#4F37FE]/20'
              : isDarkMode
                ? 'bg-[#0F1017] border border-white/10 text-slate-300 hover:bg-white/5'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Queued
        </button>
      </div>

      {/* ================= APP CARDS GRID ================= */}
      {filteredApps.length === 0 ? (
        <div className={`p-12 text-center rounded-[28px] border ${
          isDarkMode ? 'bg-[#0F1017] border-white/5 text-slate-400' : 'bg-white border-slate-200/70 text-slate-500'
        }`}>
          <p className="text-base font-medium">You have not joined any testing campaigns yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredApps.map((app) => {
            const dotColorClass = 
              app.statusDotColor === 'green' ? 'bg-[#10B981]' :
              app.statusDotColor === 'orange' ? 'bg-[#F97316]' :
              'bg-[#EAB308]';

            return (
              <motion.div
                key={app.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`rounded-[28px] border flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0F1017] border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
                    : 'bg-white border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                }`}
              >
                {/* Top Details Area */}
                <div className="p-6 pb-4">
                  {/* Header: App Logo + Titles + Status */}
                  <div className="flex items-start gap-4">
                    {/* App Icon */}
                    <div 
                      className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shrink-0 shadow-md overflow-hidden"
                      style={{ backgroundColor: app.iconBg }}
                    >
                      {app.iconContent}
                    </div>

                    {/* Titles and Badges */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className={`text-[20px] font-black tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                        {app.name}
                      </h3>
                      <p className={`text-[13px] font-semibold truncate mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        {app.subtitle}
                      </p>

                      {/* Avatars Pile & Status Dot */}
                      <div className="flex items-center gap-2.5 mt-2.5">
                        <div className="flex items-center -space-x-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#0F1017]">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#0F1017]">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-6 h-5 rounded-full bg-[#4F37FE] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#0F1017]">
                            4+
                          </div>
                        </div>

                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${dotColorClass}`}></span>
                          <span>{app.statusText}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glowing Blue Wave/Gradient Divider Line */}
                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#5A45FF] to-transparent my-5 opacity-70"></div>

                  {/* Description Block */}
                  <div className="space-y-1.5">
                    <h4 className={`text-[16px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                      Description
                    </h4>
                    <p className={`text-[13px] leading-relaxed font-medium line-clamp-4 min-h-[78px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {app.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Card Footer Strip with Action Button */}
                <div className="p-3 pt-6 relative">
                  {/* Top Inner Soft Blue Gradient Fade matching reference */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-[#4F37FE]/5 to-[#4F37FE]/15 pointer-events-none rounded-b-[28px]" />

                  <div className={`px-4 py-3 rounded-[20px] flex items-center ${
                    app.testerStat ? 'justify-between' : 'justify-center'
                  } relative z-10 ${
                    isDarkMode ? 'bg-[#151624]' : 'bg-[#F2F3FF]'
                  }`}>
                    {app.testerStat && (
                      <div>
                        <div className="text-[18px] font-black leading-tight tracking-tight text-[#4F37FE]">
                          {app.testerStat.highlight}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {app.testerStat.sublabel}
                        </div>
                      </div>
                    )}

                    {app.buttonVariant === 'primary' ? (
                      <button
                        onClick={() => {
                          if (app.buttonLabel === 'Open Testing' || app.buttonLabel === 'Start Testing') {
                            onOpenAppTesting(app.id, app.step || 1);
                          }
                        }}
                        className={`${app.testerStat ? 'px-7' : 'w-full'} py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.97] text-white text-[14px] font-black rounded-xl shadow-md shadow-[#4F37FE]/25 transition-all cursor-pointer text-center`}
                      >
                        {app.buttonLabel}
                      </button>
                    ) : (
                      <button
                        className={`px-6 py-2.5 border-2 border-[#4F37FE] text-[13px] font-black rounded-xl hover:bg-[#4F37FE]/5 transition-all cursor-pointer ${
                          isDarkMode ? 'bg-[#0F1017] text-white' : 'bg-white text-[#4F37FE]'
                        }`}
                      >
                        {app.buttonLabel}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ================= FOOTER STORAGE MANAGEMENT NOTICE ================= */}
      <div className="pt-8 text-center sm:text-left">
        <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
          Note: Once testing is completed, the data will be deleted from the backend for storage management.
        </p>
      </div>
    </div>
  );
}
