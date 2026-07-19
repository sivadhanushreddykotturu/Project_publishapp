"use client";

import { ArrowLeft, KeyRound } from "lucide-react";

type AuthConfigurationScreenProps = {
  isDarkMode: boolean;
  onBackToHome: () => void;
};

export default function AuthConfigurationScreen({ isDarkMode, onBackToHome }: AuthConfigurationScreenProps) {
  return (
    <div
      className={`min-h-[calc(100vh-80px)] mt-20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative ${
        isDarkMode ? "bg-[#050505]" : "bg-slate-50"
      }`}
    >
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 blur-[120px] rounded-full pointer-events-none ${
          isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100/50"
        }`}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <button
          onClick={onBackToHome}
          className={`inline-flex items-center gap-2 mb-8 text-sm font-semibold transition-colors cursor-pointer ${
            isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div
          className={`border rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-[#0C0C0F]/90 border-white/5 shadow-indigo-500/5"
              : "bg-white border-slate-100 shadow-slate-200/50"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-950"}`}>
            Clerk auth is not configured
          </h2>
          <p className={`mt-3 text-sm leading-6 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Add <span className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to the frontend environment to enable real sign-in and account creation.
          </p>
        </div>
      </div>
    </div>
  );
}
