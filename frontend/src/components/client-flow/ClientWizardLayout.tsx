"use client";

import React from 'react';
import { Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientWizardLayoutProps {
  isDarkMode: boolean;
  onOpenSupport?: () => void;
  children: React.ReactNode;
}

export default function ClientWizardLayout({
  isDarkMode,
  onOpenSupport,
  children
}: ClientWizardLayoutProps) {
  return (
    <div className={`min-h-screen relative flex flex-col justify-between py-10 px-4 md:px-12 font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0A0B10] text-slate-100' : 'bg-[#F2F4FB] text-slate-900'
    }`}>
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4F37FE]/5 rounded-full blur-[140px] pointer-events-none" />



      {/* ================= TOP HEADER: LOGOS ================= */}
      <header className="w-full flex items-center justify-center gap-6 z-10 pt-2 pb-4">
        {/* Left Circle / Partner Emblem */}
        <div className="w-16 h-16 rounded-full shadow-md flex items-center justify-center shrink-0 overflow-hidden bg-[#7A000A]">
          <img 
            src="/client-partner-logo.png" 
            alt="Partner Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Cross / X */}
        <span className="text-slate-400 dark:text-slate-500 text-2xl font-light select-none">
          ✕
        </span>

        {/* Platform Logo Circle (UXOS logo) */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
          <img 
            src="/launchops-logo.png" 
            alt="UXOS Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </header>

      {/* ================= MAIN WIZARD BODY ================= */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 max-w-6xl w-full mx-auto my-4">
        {children}
      </main>

      {/* ================= BOTTOM RIGHT: FLOATING SUPPORT PILL ================= */}
      <footer className="w-full flex justify-end z-20 pt-4">
        <button
          onClick={onOpenSupport || (() => alert("Opening Client Support Desk..."))}
          className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[14px] font-bold shadow-sm transition-all cursor-pointer ${
            isDarkMode 
              ? 'bg-[#151622] border-white/10 text-white hover:bg-white/5' 
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Headphones className="w-4 h-4 text-[#4F37FE]" />
          <span>Support —</span>
        </button>
      </footer>
    </div>
  );
}
