"use client";

import React, { useState, useEffect } from 'react';
import { Play, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_EMAILS = `nandhakishoreboddeti@gmail.com,
harshidh23@gmail.com, binduhima@gmail.com,
bhavya3671@gmail.com, bhaskarbindu@gmail.com,
nandhakishoreboddi@gmail.com, nani@gmail.com,
harshidh23@gmail.com, binduhima@gmail.com,
bhavya3671@gmail.com, bhaskarbindu@gmail.com`;

interface Step5TesterEmailsProps {
  isDarkMode: boolean;
  onCompleted: () => void;
  onBack: () => void;
}

export default function Step5TesterEmails({
  isDarkMode,
  onCompleted,
  onBack
}: Step5TesterEmailsProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    // Simulate testers joining after 2.5 seconds
    const timer = setTimeout(() => {
      setIsJoined(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    if (!isJoined) return;
    navigator.clipboard.writeText(DEFAULT_EMAILS.replace(/\n/g, ' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-10 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-[34px] md:text-[40px] font-black tracking-tight ${
          isDarkMode ? 'text-white' : 'text-[#0E1015]'
        }`}>
          {isJoined 
            ? "Create and Add Testers emails to Email list.." 
            : "Testers are joining....!"}
        </h1>
      </div>

      {/* Main Two-Column Box */}
      <div className={`rounded-3xl border p-8 md:p-12 shadow-sm ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ================= LEFT: VIDEO TUTORIAL ================= */}
          <div className="lg:col-span-6 space-y-4">
            <div
              onClick={() => setShowVideoModal(true)}
              className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group cursor-pointer bg-slate-900 flex items-center justify-center"
            >
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80"
                alt="Email list tutorial"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute w-16 h-16 rounded-full bg-white/90 text-[#4F37FE] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-[#4F37FE] ml-1" />
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="flex items-start gap-2 pt-2 text-[14px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F37FE] shrink-0 mt-1.5"></span>
              <span>
                Copy the emails and past it in closed testing testers email list as shown in video and click on completed .
              </span>
            </div>
          </div>

          {/* ================= VERTICAL DIVIDER ================= */}
          <div className="hidden lg:flex lg:col-span-1 justify-center">
            <div className="w-[1.5px] h-64 bg-slate-200 dark:bg-white/10" />
          </div>

          {/* ================= RIGHT: EMAILS CONTAINER ================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[14px] font-bold text-[#4F37FE]">
              Testers emails
            </div>

            <div className={`p-6 rounded-2xl border min-h-[160px] flex items-center justify-center transition-all ${
              isDarkMode ? 'bg-[#181926] border-white/10' : 'bg-[#FAFAFC] border-slate-200/90'
            }`}>
              {!isJoined ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-6 h-6 border-2 border-[#4F37FE] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[14px] text-slate-400 font-medium">
                    Testers are Joining Please wait.....
                  </span>
                </div>
              ) : (
                <p className="text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-300 font-mono select-all">
                  {DEFAULT_EMAILS}
                </p>
              )}
            </div>

            {/* Copy Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCopy}
                disabled={!isJoined}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-[14px] transition-all cursor-pointer ${
                  isJoined
                    ? 'bg-[#4F37FE] hover:bg-[#432EE0] text-white shadow-md shadow-[#4F37FE]/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
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
          onClick={onCompleted}
          className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
        >
          Completed
        </button>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F1017] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold">How to Add Email List</h3>
            <p className="text-sm text-slate-500">
              In Google Play Console, go to Closed testing &gt; Testers &gt; Email lists. Click 'Create email list', paste the copied emails, name your list (e.g. 'UXOS Panel'), and save changes.
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
