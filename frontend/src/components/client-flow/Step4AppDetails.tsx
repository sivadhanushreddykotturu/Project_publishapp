"use client";

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AppDetailsFormData {
  appName: string;
  webLink: string;
  appLink: string;
  packageName?: string;
}

interface Step4AppDetailsProps {
  isDarkMode: boolean;
  initialData?: Partial<AppDetailsFormData>;
  onNext: (data: AppDetailsFormData) => void;
  onBack: () => void;
}

export default function Step4AppDetails({
  isDarkMode,
  initialData,
  onNext,
  onBack
}: Step4AppDetailsProps) {
  const [appName, setAppName] = useState(initialData?.appName || 'UXOS');
  const [webLink, setWebLink] = useState(initialData?.webLink || '');
  const [appLink, setAppLink] = useState(initialData?.appLink || '');
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!appName.trim()) {
      alert("Please enter your app name.");
      return;
    }
    onNext({
      appName: appName.trim(),
      webLink: webLink.trim(),
      appLink: appLink.trim(),
      packageName: initialData?.packageName,
    });
  };

  return (
    <div className="w-full space-y-10 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-[34px] md:text-[40px] font-black tracking-tight ${
          isDarkMode ? 'text-white' : 'text-[#0E1015]'
        }`}>
          Give your App Details to get Started
        </h1>
      </div>

      {/* Main Two-Column Box */}
      <div className={`rounded-3xl border p-8 md:p-12 shadow-sm ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ================= LEFT: VIDEO GUIDE PREVIEW ================= */}
          <div className="lg:col-span-6 space-y-4">
            <div
              onClick={() => setShowVideoModal(true)}
              className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group cursor-pointer bg-slate-900 flex items-center justify-center"
            >
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"
                alt="Play console tutorial"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              />

              {/* Play Icon Button Overlay */}
              <div className="absolute w-16 h-16 rounded-full bg-white/90 text-[#4F37FE] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-[#4F37FE] ml-1" />
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="flex items-start gap-2 pt-2 text-[14px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F37FE] shrink-0 mt-1.5"></span>
              <span>
                Follow the instructions on your google play console account and paste those links in the given field.
              </span>
            </div>
          </div>

          {/* ================= VERTICAL DIVIDER ================= */}
          <div className="hidden lg:flex lg:col-span-1 justify-center">
            <div className="w-[1.5px] h-64 bg-slate-200 dark:bg-white/10" />
          </div>

          {/* ================= RIGHT: INPUT FIELDS ================= */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-6">
            {/* App Name */}
            <div>
              <label className="block text-[14px] font-bold text-[#4F37FE] mb-2">
                App Name
              </label>
              <input
                type="text"
                placeholder="UXOS"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className={`w-full px-5 py-3.5 rounded-2xl border text-[14px] outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
                }`}
              />
            </div>

            {/* Web Link */}
            <div>
              <label className="block text-[14px] font-bold text-[#4F37FE] mb-2">
                Web Link
              </label>
              <input
                type="text"
                placeholder="Step One link"
                value={webLink}
                onChange={(e) => setWebLink(e.target.value)}
                className={`w-full px-5 py-3.5 rounded-2xl border text-[14px] outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
                }`}
              />
            </div>

            {/* App Link */}
            <div>
              <label className="block text-[14px] font-bold text-[#4F37FE] mb-2">
                App Link
              </label>
              <input
                type="text"
                placeholder="Step Two link"
                value={appLink}
                onChange={(e) => setAppLink(e.target.value)}
                className={`w-full px-5 py-3.5 rounded-2xl border text-[14px] outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
                }`}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Navigation Buttons */}
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
          onClick={handleSubmit}
          className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1017] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold">Google Play Console Setup Guide</h3>
            <p className="text-sm text-slate-500">
              In Google Play Console: navigate to Release &gt; Testing &gt; Closed Testing. Copy the Web Opt-in URL and Android Play Store link and paste them into Step One and Step Two.
            </p>
            <button
              onClick={() => setShowVideoModal(false)}
              className="w-full py-3 bg-[#4F37FE] text-white font-bold rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
