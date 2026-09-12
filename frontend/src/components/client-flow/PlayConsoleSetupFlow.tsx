"use client";

import React, { useState } from 'react';
import { Settings, ArrowRight, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PlayConsoleSetupFlowProps {
  isDarkMode: boolean;
  onBack: () => void;
  onComplete: (details: { appName: string; packageName: string }) => void;
}

export default function PlayConsoleSetupFlow({
  isDarkMode,
  onBack,
  onComplete
}: PlayConsoleSetupFlowProps) {
  const [subStep, setSubStep] = useState<1 | 2>(1);
  const [appName, setAppName] = useState('My Android App');
  const [packageName, setPackageName] = useState('com.company.app');
  const [hasDunsNumber, setHasDunsNumber] = useState(true);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* SUBSTEP 1: Play Console Requirements */}
      {subStep === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              Google Play Console App Setup
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              We guide and configure your Play Console account, store listing, and privacy policies.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border max-w-xl mx-auto space-y-6 ${
            isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Kanma Delivery Partner"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Package Name
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.company.app"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Our technical manager will share an invite email to be added as <strong>Release Manager</strong> on your Google Play Console to prepare the closed testing track.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onBack}
              className={`px-12 py-3.5 rounded-2xl text-[15px] font-bold border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
                  : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
              }`}
            >
              Back
            </button>
            <button
              onClick={() => setSubStep(2)}
              className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* SUBSTEP 2: Confirmation & Proceed */}
      {subStep === 2 && (
        <div className="space-y-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              Play Console Setup Initiated
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              We will configure <strong className="text-white">{appName}</strong> ({packageName}) and link it with the 14-day Closed Testing Track.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setSubStep(1)}
              className={`px-12 py-3.5 rounded-2xl text-[15px] font-bold border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
                  : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
              }`}
            >
              Back
            </button>
            <button
              onClick={() => onComplete({ appName, packageName })}
              className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Continue to Closed Testing Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
