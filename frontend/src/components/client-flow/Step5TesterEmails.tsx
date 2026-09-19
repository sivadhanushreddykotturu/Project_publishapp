"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';

interface Step5TesterEmailsProps {
  isDarkMode: boolean;
  projectId?: string;
  requiredTesters?: number;
  onLoadEmails?: (projectId: string) => Promise<{ emails: string[]; count: number }>;
  onCompleted: () => void;
  onBack?: () => void;
}

export default function Step5TesterEmails({ isDarkMode, projectId, requiredTesters = 14, onLoadEmails, onCompleted }: Step5TesterEmailsProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadEmails = useCallback(async (quiet = false) => {
    if (!projectId || !onLoadEmails) {
      setIsLoading(false);
      setError('The project must be created before tester emails can be loaded.');
      return;
    }
    if (!quiet) setIsLoading(true);
    try {
      const result = await onLoadEmails(projectId);
      setEmails(result.emails);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load tester emails.');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [onLoadEmails, projectId]);

  useEffect(() => {
    void loadEmails();
    const interval = window.setInterval(() => void loadEmails(true), 10000);
    return () => window.clearInterval(interval);
  }, [loadEmails]);

  const handleCopy = async () => {
    if (!emails.length) return;
    await navigator.clipboard.writeText(emails.join(', '));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="text-center">
        <h1 className={`text-[34px] font-black tracking-tight md:text-[40px] ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>Verified tester emails</h1>
        <p className="mt-2 text-sm text-slate-500">{emails.length} of {requiredTesters} tester emails are verified. This list updates automatically.</p>
      </div>

      <div className={`rounded-3xl border p-8 shadow-sm md:p-12 ${isDarkMode ? 'border-white/10 bg-[#0F1017]' : 'border-slate-200/90 bg-white'}`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#4F37FE]">Google Play closed-testing list</h2>
              <p className="mt-1 text-xs text-slate-500">Only Step 1 emails approved by an admin appear here.</p>
            </div>
            <button type="button" onClick={() => void loadEmails()} disabled={isLoading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-transparent px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className={`min-h-[190px] rounded-2xl border p-6 ${isDarkMode ? 'border-white/10 bg-[#181926]' : 'border-slate-200/90 bg-[#FAFAFC]'}`}>
            {isLoading && !emails.length ? (
              <div className="flex h-36 items-center justify-center gap-3 text-sm text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F37FE] border-t-transparent" />Loading verified emails...</div>
            ) : error ? (
              <div className="flex h-36 items-center justify-center text-center text-sm font-medium text-red-500">{error}</div>
            ) : emails.length ? (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-700 dark:text-slate-300">{emails.join(',\n')}</pre>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Waiting for verified tester emails</p>
                <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">After testers submit their Google Play email and an admin approves Step 1, their addresses will appear here.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => void handleCopy()} disabled={!emails.length} className="flex items-center gap-2 rounded-2xl bg-[#4F37FE] px-8 py-3 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied!' : `Copy${emails.length ? ` ${emails.length}` : ''} emails`}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button type="button" onClick={onCompleted} className="rounded-2xl bg-[#4F37FE] px-14 py-3.5 text-[15px] font-bold text-white shadow-md shadow-[#4F37FE]/20">Go to Dashboard</button>
      </div>
    </div>
  );
}
