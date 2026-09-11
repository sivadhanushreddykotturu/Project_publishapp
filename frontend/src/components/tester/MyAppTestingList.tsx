"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

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
  onBack: () => void;
  onOpenAppTesting: (appId: string, step?: number) => void;
}

export const DEFAULT_MY_APPS: MyAppItem[] = [
  {
    id: 'kanma',
    name: 'Kanma',
    subtitle: 'Playstore closed Testing',
    category: 'active',
    iconBg: '#8C1D24',
    iconContent: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
        <path d="M12 2L9 8H15L12 2ZM5 9L3 15H9L7 9H5ZM19 9L17 15H23L21 9H19ZM8.5 16C7.12 16 6 17.12 6 18.5C6 19.88 7.12 21 8.5 21H15.5C16.88 21 18 19.88 18 18.5C18 17.12 16.88 16 15.5 16H8.5Z" />
      </svg>
    ),
    statusText: 'Active - Aug 20',
    statusDotColor: 'green',
    description: 'After the training, you will be our core UX Testing panel, which will be involved in the actual mobile app testing projects we receive.',
    buttonLabel: 'Wait Other to Join',
    buttonVariant: 'primary'
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    subtitle: 'Playstore closed Testing',
    category: 'active',
    iconBg: '#F8CB38',
    iconContent: (
      <div className="text-center">
        <span className="text-[#0E5429] font-black text-base tracking-tight leading-none block">blinkit</span>
        <span className="text-[7px] font-semibold text-slate-800 leading-tight block">India's Last Minute App</span>
      </div>
    ),
    statusText: 'Filling up - Aug 20',
    statusDotColor: 'orange',
    description: 'The people selected for this panel will be expected to remain active, responsive and consistent when testing projects are assigned.',
    buttonLabel: 'Open Testing',
    buttonVariant: 'primary',
    step: 1
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    subtitle: 'Playstore closed Testing',
    category: 'active',
    iconBg: '#FC8019',
    iconContent: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    ),
    statusText: 'Wait in line - Aug 20',
    statusDotColor: 'yellow',
    description: 'If you are genuinely interested and ready to commit 2 hours a day for 1 week, complete the payment and send the screenshot here. Once verified, you will receive the group access and further training instructions.',
    buttonLabel: 'Replaced you are inactive',
    buttonVariant: 'primary'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    subtitle: 'Playstore closed Testing',
    category: 'queued',
    iconBg: '#1877F2',
    iconContent: (
      <span className="text-white font-black text-4xl leading-none font-sans select-none">
        f
      </span>
    ),
    statusText: 'Wait in line - Aug 20',
    statusDotColor: 'yellow',
    description: 'We are starting this as the foundation for a much bigger plan. The goal is to build a reliable UX testing team, work on real client applications, and gradually take this service to a much larger level.',
    buttonLabel: 'Joined Queue',
    buttonVariant: 'outline',
    testerStat: {
      highlight: 'UQL 14',
      sublabel: 'You are in Queue'
    }
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    subtitle: 'Playstore closed Testing',
    category: 'active',
    iconBg: '#050505',
    iconContent: (
      <div className="flex items-baseline text-white font-black text-2xl tracking-tighter">
        <span>D</span>
        <span className="w-2 h-2 rounded-full bg-[#86BC25] ml-0.5 mb-0.5"></span>
      </div>
    ),
    statusText: 'Wait in line - Aug 20',
    statusDotColor: 'yellow',
    description: 'this our business right now so I will say the nature of the business and i WILL tell you the exactly the market that we want to build upon so here we go in this process like this - first I will explain the what business we are and I will tell you the how we want to position it.',
    buttonLabel: 'Start Testing',
    buttonVariant: 'primary',
    step: 2
  }
];

export default function MyAppTestingList({
  isDarkMode,
  onBack,
  onOpenAppTesting
}: MyAppTestingListProps) {
  const [filter, setFilter] = useState<MyAppFilter>('all');

  const filteredApps = DEFAULT_MY_APPS.filter((app) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => {
          const dotColorClass = 
            app.statusDotColor === 'green' ? 'bg-[#10B981]' :
            app.statusDotColor === 'orange' ? 'bg-[#F97316]' :
            'bg-[#EAB308]';

          return (
            <div
              key={app.id}
              className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs transition-shadow duration-200 ${
                isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
              }`}
            >
              {/* Top Details Area */}
              <div className="p-6 pb-4">
                {/* Header: App Logo + Titles + Status */}
                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: app.iconBg }}
                  >
                    {app.iconContent}
                  </div>

                  {/* Titles and Badges */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-[19px] font-extrabold truncate ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                      {app.name}
                    </h3>
                    <p className="text-[13px] text-slate-400 font-medium truncate">
                      {app.subtitle}
                    </p>

                    {/* Avatars Pile & Status Dot */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center -space-x-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white dark:ring-slate-900">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white dark:ring-slate-900">
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80" alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-6 h-5 rounded-full bg-[#4F37FE] text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white dark:ring-slate-900">
                          4+
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
                        <span className={`w-2 h-2 rounded-full ${dotColorClass}`}></span>
                        <span>{app.statusText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glowing Middle Divider Line */}
                <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#4F37FE]/40 to-transparent my-4"></div>

                {/* Description Block */}
                <div>
                  <h4 className={`text-[15px] font-extrabold mb-1.5 ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                    Description
                  </h4>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                    {app.description}
                  </p>
                </div>
              </div>

              {/* Bottom Card Footer Strip with Button */}
              <div className={`p-4 mx-2 mb-2 rounded-2xl flex items-center transition-colors ${
                app.testerStat ? 'justify-between' : 'justify-center'
              } ${isDarkMode ? 'bg-[#181926]' : 'bg-[#F2F3FF]'}`}>
                {app.testerStat && (
                  <div>
                    <div className="text-[17px] font-extrabold leading-tight text-[#4F37FE]">
                      {app.testerStat.highlight}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
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
                    className={`${app.testerStat ? 'px-6' : 'w-full'} py-3 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[14px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center`}
                  >
                    {app.buttonLabel}
                  </button>
                ) : (
                  <button
                    className="px-6 py-2.5 bg-white dark:bg-transparent border border-[#4F37FE] text-[#4F37FE] text-[13px] font-bold rounded-xl hover:bg-[#4F37FE]/5 transition-colors cursor-pointer"
                  >
                    {app.buttonLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FOOTER STORAGE MANAGEMENT NOTICE ================= */}
      <div className="pt-6">
        <p className="text-[14px] text-slate-500 dark:text-slate-400 font-normal">
          Note : Once Testing completed the data will be deleted form backend for Storage Management.
        </p>
      </div>
    </div>
  );
}
