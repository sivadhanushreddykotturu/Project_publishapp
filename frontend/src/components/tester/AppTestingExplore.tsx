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

export const DEFAULT_EXPLORE_APPS: AppTestingCardData[] = [
  {
    id: 'kanma',
    name: 'Kanma',
    subtitle: 'Playstore closed Testing',
    iconBg: '#8C1D24',
    iconContent: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
        <path d="M12 2L9 8H15L12 2ZM5 9L3 15H9L7 9H5ZM19 9L17 15H23L21 9H19ZM8.5 16C7.12 16 6 17.12 6 18.5C6 19.88 7.12 21 8.5 21H15.5C16.88 21 18 19.88 18 18.5C18 17.12 16.88 16 15.5 16H8.5Z" />
      </svg>
    ),
    statusText: 'Active - Aug 20',
    statusDotColor: 'green',
    description: 'After the training, you will be our core UX Testing panel, which will be involved in the actual mobile app testing projects we receive.',
    userState: 'can_join',
    testerStat: {
      highlight: '10/15',
      sublabel: 'Testers Joined'
    }
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    subtitle: 'Playstore closed Testing',
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
    userState: 'joined_testing',
    testerStat: {
      highlight: '7th Tester',
      sublabel: 'You are tester now'
    }
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    subtitle: 'Playstore closed Testing',
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
    userState: 'can_join',
    testerStat: {
      highlight: '13/15',
      sublabel: 'Testers Joined'
    }
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    subtitle: 'Playstore closed Testing',
    iconBg: '#FC8019',
    iconContent: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    ),
    statusText: 'Wait in line - Aug 20',
    statusDotColor: 'yellow',
    description: 'If you are genuinely interested and ready to commit 2 hours a day for 1 week, complete the payment and send the screenshot here. Once verified, you will receive the group access and further training instructions.',
    userState: 'can_queue',
    testerStat: {
      highlight: 'QL 12',
      sublabel: 'Testers in queue'
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    subtitle: 'Playstore closed Testing',
    iconBg: '#1877F2',
    iconContent: (
      <span className="text-white font-black text-4xl leading-none font-sans select-none">
        f
      </span>
    ),
    statusText: 'Wait in line - Aug 20',
    statusDotColor: 'yellow',
    description: 'We are starting this as the foundation for a much bigger plan. The goal is to build a reliable UX testing team, work on real client applications, and gradually take this service to a much larger level.',
    userState: 'joined_queue',
    testerStat: {
      highlight: 'UQL 14',
      sublabel: 'You are in Queue'
    }
  }
];

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

              {/* Bottom Card Footer Strip with Glow & Action Button */}
              <div className={`p-4 mx-2 mb-2 rounded-2xl flex items-center justify-between transition-colors ${
                isDarkMode ? 'bg-[#181926]' : 'bg-[#F2F3FF]'
              }`}>
                {/* Left Stats */}
                <div>
                  <div className={`text-[17px] font-extrabold leading-tight ${
                    app.userState === 'joined_testing' || app.userState === 'joined_queue'
                      ? 'text-[#4F37FE]'
                      : isDarkMode ? 'text-white' : 'text-[#0E1015]'
                  }`}>
                    {app.testerStat.highlight}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {app.testerStat.sublabel}
                  </div>
                </div>

                {/* Right Action Button */}
                {app.userState === 'can_join' && (
                  <button
                    onClick={() => handleAction(app)}
                    className="px-6 py-2.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[13px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Join Testing
                  </button>
                )}

                {app.userState === 'joined_testing' && (
                  <button
                    onClick={() => handleAction(app)}
                    className="px-6 py-2.5 bg-white dark:bg-transparent border border-[#4F37FE] text-[#4F37FE] text-[13px] font-bold rounded-xl hover:bg-[#4F37FE]/5 transition-colors cursor-pointer"
                  >
                    Joined Testing
                  </button>
                )}

                {app.userState === 'can_queue' && (
                  <button
                    onClick={() => handleAction(app)}
                    className="px-6 py-2.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[13px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Join Queue
                  </button>
                )}

                {app.userState === 'joined_queue' && (
                  <button
                    onClick={() => handleAction(app)}
                    className="px-6 py-2.5 bg-white dark:bg-transparent border border-[#4F37FE] text-[#4F37FE] text-[13px] font-bold rounded-xl hover:bg-[#4F37FE]/5 transition-colors cursor-pointer"
                  >
                    Joined Queue
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
