"use client";

import React, { useState } from 'react';
import { Apple, ArrowRight, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface IOSPublishingFlowProps {
  isDarkMode: boolean;
  onBack: () => void;
  onComplete: (details: { appName: string; bundleId: string; serviceType: string }) => void;
}

export default function IOSPublishingFlow({
  isDarkMode,
  onBack,
  onComplete
}: IOSPublishingFlowProps) {
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  const [selectedOption, setSelectedOption] = useState<'store-submission' | 'testflight'>('store-submission');
  const [appName, setAppName] = useState('My iOS App');
  const [bundleId, setBundleId] = useState('com.company.iosapp');
  const [primaryCategory, setPrimaryCategory] = useState('Utilities');
  const [testFlightLink, setTestFlightLink] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* SUBSTEP 1: Publishing Type Selection */}
      {subStep === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              iOS App Store Publishing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Select the publishing workflow you want UXOS specialists to coordinate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Option 1: Full Store Submission */}
            <div
              onClick={() => setSelectedOption('store-submission')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedOption === 'store-submission'
                  ? 'bg-[#4F37FE] text-white border-[#4F37FE] shadow-xl shadow-[#4F37FE]/20 ring-4 ring-[#4F37FE]/20'
                  : isDarkMode
                    ? 'bg-[#0F1017] border-white/10 text-white hover:border-[#4F37FE]/50'
                    : 'bg-white border-slate-200/90 text-slate-900 hover:border-[#4F37FE]/50'
              }`}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedOption === 'store-submission' ? 'bg-white/20 text-white' : 'bg-[#4F37FE]/10 text-[#4F37FE]'
                }`}>
                  <Apple className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">App Store Submission</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${selectedOption === 'store-submission' ? 'text-white/80' : 'text-slate-400'}`}>
                    Metadata validation, App Review Guidelines pre-check, and final App Store production release.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between">
                <span className="text-sm font-bold">₹4,999/- one time</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedOption === 'store-submission' ? 'bg-white text-[#4F37FE]' : 'bg-[#4F37FE] text-white'
                }`}>
                  {selectedOption === 'store-submission' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Option 2: TestFlight Beta Group */}
            <div
              onClick={() => setSelectedOption('testflight')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedOption === 'testflight'
                  ? 'bg-[#4F37FE] text-white border-[#4F37FE] shadow-xl shadow-[#4F37FE]/20 ring-4 ring-[#4F37FE]/20'
                  : isDarkMode
                    ? 'bg-[#0F1017] border-white/10 text-white hover:border-[#4F37FE]/50'
                    : 'bg-white border-slate-200/90 text-slate-900 hover:border-[#4F37FE]/50'
              }`}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  selectedOption === 'testflight' ? 'bg-white/20 text-white' : 'bg-[#4F37FE]/10 text-[#4F37FE]'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">TestFlight Beta Setup</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${selectedOption === 'testflight' ? 'text-white/80' : 'text-slate-400'}`}>
                    Public & external tester group creation, build approvals, and feedback log collection.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between">
                <span className="text-sm font-bold">₹3,499/- one time</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedOption === 'testflight' ? 'bg-white text-[#4F37FE]' : 'bg-[#4F37FE] text-white'
                }`}>
                  {selectedOption === 'testflight' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </div>
              </div>
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

      {/* SUBSTEP 2: App Store Metadata Details */}
      {subStep === 2 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              Provide iOS App Details
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Enter the App Store metadata required to connect your App Store release.
            </p>
          </div>

          <div className={`p-8 rounded-3xl border max-w-xl mx-auto space-y-6 ${
            isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                App Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. UXOS iOS"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Bundle Identifier (ID)
              </label>
              <input
                type="text"
                value={bundleId}
                onChange={(e) => setBundleId(e.target.value)}
                placeholder="e.g. com.yourcompany.app"
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Primary Category
              </label>
              <select
                value={primaryCategory}
                onChange={(e) => setPrimaryCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                  isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option>Utilities</option>
                <option>Productivity</option>
                <option>Social Networking</option>
                <option>Business</option>
                <option>Finance</option>
                <option>Health & Fitness</option>
              </select>
            </div>

            {selectedOption === 'testflight' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  TestFlight Public Invitation Link (Optional)
                </label>
                <input
                  type="text"
                  value={testFlightLink}
                  onChange={(e) => setTestFlightLink(e.target.value)}
                  placeholder="https://testflight.apple.com/join/..."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F37FE] ${
                    isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            )}
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

      {/* SUBSTEP 3: Confirmation & Launch */}
      {subStep === 3 && (
        <div className="space-y-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#0E1015]'
            }`}>
              iOS Track Ready for Launch
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Our App Store review specialists will verify <strong className="text-white">{appName}</strong> ({bundleId}) and coordinate the submission.
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
              onClick={() => onComplete({ appName, bundleId, serviceType: selectedOption })}
              className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Start iOS Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
