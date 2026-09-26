"use client";

import React, { useState } from 'react';
import { Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import type { BackendClient, LaunchOpsUser } from '../../lib/launchops-api';

interface ClientWizardLayoutProps {
  isDarkMode: boolean;
  onOpenSupport?: () => void;
  children: React.ReactNode;
  currentUser?: LaunchOpsUser | null;
  currentClient?: BackendClient | null;
}

interface ClientLogoProps {
  currentUser?: LaunchOpsUser | null;
  currentClient?: BackendClient | null;
}

function ClerkUserLogo({ currentUser, currentClient }: ClientLogoProps) {
  const { user } = useUser();
  const [imgError, setImgError] = useState(false);

  // If user signed up with Google, user?.imageUrl contains their Google profile picture
  const imageUrl = !imgError ? (user?.imageUrl || currentClient?.logoUrl) : null;

  const displayName = 
    currentClient?.companyName ||
    currentUser?.name ||
    user?.fullName ||
    user?.firstName ||
    currentClient?.contactName ||
    currentUser?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    'Client';

  const firstLetter = displayName.trim().charAt(0).toUpperCase();

  if (imageUrl) {
    return (
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center shrink-0 overflow-hidden border-2 border-[#4F37FE]/30 bg-slate-900">
        <img
          src={imageUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-tr from-[#4F37FE] via-[#6366F1] to-[#9333EA] text-white border-2 border-white/20">
      <span className="text-2xl md:text-3xl font-black tracking-tight select-none drop-shadow-sm">
        {firstLetter}
      </span>
    </div>
  );
}

function FallbackUserLogo({ currentUser, currentClient }: ClientLogoProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = !imgError ? currentClient?.logoUrl : null;

  const displayName =
    currentClient?.companyName ||
    currentUser?.name ||
    currentClient?.contactName ||
    currentUser?.email ||
    'Client';

  const firstLetter = displayName.trim().charAt(0).toUpperCase();

  if (imageUrl) {
    return (
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center shrink-0 overflow-hidden border-2 border-[#4F37FE]/30 bg-slate-900">
        <img
          src={imageUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-tr from-[#4F37FE] via-[#6366F1] to-[#9333EA] text-white border-2 border-white/20">
      <span className="text-2xl md:text-3xl font-black tracking-tight select-none drop-shadow-sm">
        {firstLetter}
      </span>
    </div>
  );
}

class SafeClerkWrapper extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function ClientHeaderLogo({ currentUser, currentClient }: ClientLogoProps) {
  const fallback = <FallbackUserLogo currentUser={currentUser} currentClient={currentClient} />;
  return (
    <SafeClerkWrapper fallback={fallback}>
      <ClerkUserLogo currentUser={currentUser} currentClient={currentClient} />
    </SafeClerkWrapper>
  );
}

export default function ClientWizardLayout({
  isDarkMode,
  onOpenSupport,
  children,
  currentUser,
  currentClient
}: ClientWizardLayoutProps) {
  return (
    <div className={`min-h-screen relative flex flex-col justify-between py-10 px-4 md:px-12 font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0A0B10] text-slate-100' : 'bg-[#F2F4FB] text-slate-900'
    }`}>
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4F37FE]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ================= TOP HEADER: LOGOS ================= */}
      <header className="w-full flex items-center justify-center gap-6 z-10 pt-2 pb-4">
        {/* Left Circle / Client Emblem (Logo or First Letter) */}
        <ClientHeaderLogo currentUser={currentUser} currentClient={currentClient} />

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

