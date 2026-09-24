"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AppTestingCardData {
  id: string;
  name: string;
  subtitle: string;
  category?: string;
  iconBg: string;
  iconContent: React.ReactNode;
  statusText: string;
  statusDotColor: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
  userState: 'can_join' | 'joined_testing' | 'can_queue' | 'joined_queue';
  testerStat: {
    highlight: string;
    sublabel: string;
  };
  joinedTesters?: number;
  totalTesters?: number;
}

interface AppTestingExploreProps {
  isDarkMode: boolean;
  onOpenMyApps: () => void;
  onSelectApp: (appId: string) => void;
  onJoinTesting: (appId: string) => void;
  onJoinQueue: (appId: string) => void;
}

export const DEFAULT_EXPLORE_APPS: AppTestingCardData[] = [];

export default function AppTestingExplore({
  isDarkMode,
  onOpenMyApps,
  onSelectApp,
  onJoinTesting,
  onJoinQueue
}: AppTestingExploreProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<AppTestingCardData[]>(DEFAULT_EXPLORE_APPS);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (app: AppTestingCardData) => {
    if (app.userState === 'can_join') {
      onJoinTesting(app.id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, userState: 'joined_testing', testerStat: { highlight: '11th Tester', sublabel: 'You are tester now' } } : a));
    } else if (app.userState === 'joined_testing') {
      onSelectApp(app.id);
    } else if (app.userState === 'can_queue') {
      onJoinQueue(app.id);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, userState: 'joined_queue', testerStat: { highlight: 'UQL 13', sublabel: 'You are in Queue' } } : a));
    } else if (app.userState === 'joined_queue') {
      onOpenMyApps();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ================= TOP SEARCH & ACTION BAR ================= */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className={`flex-1 relative flex items-center rounded-2xl border px-4 py-3 shadow-xs ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400 ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}
          />
        </div>

        {/* My Apps Button */}
        <button
          onClick={onOpenMyApps}
          className="shrink-0 px-12 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.98] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all duration-150 cursor-pointer"
        >
          My Apps
        </button>
      </div>

      {/* ================= 3-COLUMN APP CARDS GRID ================= */}
      {filteredApps.length === 0 ? (
        <div className={`p-12 text-center rounded-[28px] border ${
          isDarkMode ? 'bg-[#0F1017] border-white/5 text-slate-400' : 'bg-white border-slate-200/70 text-slate-500'
        }`}>
          <p className="text-base font-medium">No testing campaigns currently available.</p>
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

                  {/* Glowing Blue Wave/Gradient Divider Line (as seen in mockup) */}
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

                {/* Bottom Card Footer Strip with Soft Glow Background */}
                <div className="p-3 pt-6 relative">
                  {/* Top Inner Soft Blue Gradient Fade matching reference */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-[#4F37FE]/5 to-[#4F37FE]/15 pointer-events-none rounded-b-[28px]" />

                  <div className={`px-4 py-3 rounded-[20px] flex items-center justify-between relative z-10 ${
                    isDarkMode ? 'bg-[#151624]' : 'bg-[#F2F3FF]'
                  }`}>
                    {/* Left Stats */}
                    <div>
                      <div className={`text-[18px] font-black leading-tight tracking-tight ${
                        app.userState === 'joined_testing' || app.userState === 'joined_queue'
                          ? 'text-[#4F37FE]'
                          : isDarkMode ? 'text-white' : 'text-[#0E1015]'
                      }`}>
                        {app.testerStat.highlight.includes(' ') ? (
                          <>
                            <span className="text-[#4F37FE]">{app.testerStat.highlight.split(' ')[0]}</span>{' '}
                            <span>{app.testerStat.highlight.split(' ').slice(1).join(' ')}</span>
                          </>
                        ) : (
                          app.testerStat.highlight
                        )}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        {app.testerStat.sublabel}
                      </div>
                    </div>

                    {/* Right Action Button */}
                    {app.userState === 'can_join' && (
                      <button
                        onClick={() => handleAction(app)}
                        className="px-7 py-3 bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.97] text-white text-[14px] font-black rounded-xl shadow-md shadow-[#4F37FE]/25 transition-all cursor-pointer"
                      >
                        Join Testing
                      </button>
                    )}

                    {app.userState === 'joined_testing' && (
                      <button
                        onClick={() => handleAction(app)}
                        className="px-6 py-2.5 bg-white dark:bg-[#0F1017] border-2 border-[#4F37FE] text-[#4F37FE] text-[13px] font-black rounded-xl hover:bg-[#4F37FE]/5 transition-all cursor-pointer"
                      >
                        Joined Testing
                      </button>
                    )}

                    {app.userState === 'can_queue' && (
                      <button
                        onClick={() => handleAction(app)}
                        className="px-7 py-3 bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.97] text-white text-[14px] font-black rounded-xl shadow-md shadow-[#4F37FE]/25 transition-all cursor-pointer"
                      >
                        Join Queue
                      </button>
                    )}

                    {app.userState === 'joined_queue' && (
                      <button
                        onClick={() => handleAction(app)}
                        className="px-6 py-2.5 bg-white dark:bg-[#0F1017] border-2 border-[#4F37FE] text-[#4F37FE] text-[13px] font-black rounded-xl hover:bg-[#4F37FE]/5 transition-all cursor-pointer"
                      >
                        Joined Queue
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
