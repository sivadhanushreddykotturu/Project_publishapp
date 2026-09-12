"use client";

import React, { useState } from 'react';
import { Users, ArrowRight, ArrowUpRight, CheckCircle2, Eye, FileSpreadsheet } from 'lucide-react';

interface UXTestingFlowProps {
  isDarkMode: boolean;
  onBack: () => void;
  onComplete: (details: { appName: string; prototypeUrl: string; focusArea: string }) => void;
}

export default function UXTestingFlow({
  isDarkMode,
  onBack,
  onComplete
}: UXTestingFlowProps) {
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [targetAudience, setTargetAudience] = useState<'general' | 'fintech' | 'ecommerce'>('general');
  const [appName, setAppName] = useState('UXOS Interactive');
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [focusArea, setFocusArea] = useState('First Time User Onboarding & Checkout');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* SUBSTEP 1: Target Audience Selection */}
      {subStep === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              User Experience Testing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Choose your target demographic panel for detailed UX and qualitative feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              {
                id: 'general' as const,
                title: 'General Consumer',
                desc: 'Diverse mobile user panel across tier 1 & 2 cities.',
                icon: <Users className="w-6 h-6" />,
                price: '₹3,499/-'
              },
              {
                id: 'fintech' as const,
                title: 'Fintech & Tech Savvy',
                desc: 'Users familiar with UPI, wallets, and advanced banking flows.',
                icon: <Eye className="w-6 h-6" />,
                price: '₹4,499/-'
              },
              {
                id: 'ecommerce' as const,
                title: 'E-commerce Shoppers',
                desc: 'Active online shoppers reviewing cart & checkout friction.',
                icon: <FileSpreadsheet className="w-6 h-6" />,
                price: '₹3,999/-'
              }
            ].map((panel) => {
              const isSelected = targetAudience === panel.id;
              return (
                <div
                  key={panel.id}
                  onClick={() => setTargetAudience(panel.id)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#4F37FE] text-white border-[#4F37FE] shadow-xl shadow-[#4F37FE]/20 ring-4 ring-[#4F37FE]/20 scale-[1.02]'
                      : isDarkMode
                        ? 'bg-[#0F1017] border-white/10 text-white hover:border-[#4F37FE]/50'
                        : 'bg-white border-slate-200/90 text-slate-900 hover:border-[#4F37FE]/50'
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#4F37FE]/10 text-[#4F37FE]'
                    }`}>
                      {panel.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight">{panel.title}</h3>
                      <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {panel.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                    <span className="text-xs font-bold">{panel.price}</span>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-white text-[#4F37FE]' : 'bg-[#4F37FE] text-white'
                    }`}>
                      {isSelected ? <ArrowUpRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* SUBSTEP 2: Prototype & Focus Areas */}
      {subStep === 2 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              Provide UX Scope & Prototype
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Give testers access to your prototype or live mobile build.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border max-w-xl mx-auto space-y-6 ${
            isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Project / App Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. UXOS Mobile"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Figma Prototype or APK Download URL
              </label>
              <input
                type="text"
                value={prototypeUrl}
                onChange={(e) => setPrototypeUrl(e.target.value)}
                placeholder="https://figma.com/proto/... or https://..."
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Specific Focus Areas for Testers
              </label>
              <textarea
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                rows={3}
                placeholder="e.g. Check ease of registration, drop-off during address entry, clarity of CTA buttons."
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
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
              onClick={() => setSubStep(3)}
              className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* SUBSTEP 3: Confirmation & Panel Dispatch */}
      {subStep === 3 && (
        <div className="space-y-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              UX Panel Ready for Dispatch
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Our curated panel will test <strong className="text-white">{appName}</strong> focusing on <strong className="text-white">{focusArea}</strong> and compile screen recordings & survey insights.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setSubStep(2)}
              className={`px-12 py-3.5 rounded-2xl text-[15px] font-bold border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
                  : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
              }`}
            >
              Back
            </button>
            <button
              onClick={() => onComplete({ appName, prototypeUrl, focusArea })}
              className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Start UX Testing Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
