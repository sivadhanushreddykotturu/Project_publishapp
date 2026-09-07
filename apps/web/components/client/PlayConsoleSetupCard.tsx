"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Copy,
  Check,
  ArrowRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";

interface TesterEmailsData {
  emails: string[];
  commaSeparated: string;
  newlineSeparated: string;
  total: number;
  requiredTesters: number;
  isReady: boolean;
  step1Verified: boolean;
  step2Active: boolean;
}

export function PlayConsoleSetupCard({
  projectId,
  webOptInUrl,
  playStoreUrl,
  onAdvanced,
}: {
  projectId: string;
  webOptInUrl?: string;
  playStoreUrl?: string;
  onAdvanced?: () => void;
}) {
  const { getToken } = useAuth();
  const [data, setData] = useState<TesterEmailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<"comma" | "newline" | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const fetchEmails = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await api<TesterEmailsData>(`/projects/${projectId}/tester-emails`, {
        token,
      });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load tester emails");
    } finally {
      setLoading(false);
    }
  }, [getToken, projectId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  async function handleCopy(type: "comma" | "newline") {
    if (!data) return;
    const text = type === "comma" ? data.commaSeparated : data.newlineSeparated;
    await navigator.clipboard.writeText(text);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2500);
  }

  async function handleProceed() {
    if (busy || !data) return;
    setBusy(true);
    setError(null);

    try {
      const token = await getToken();
      await api(`/projects/${projectId}/advance-to-step-2`, {
        token,
        method: "POST",
      });
      await fetchEmails();
      if (onAdvanced) onAdvanced();
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not advance to Step 2. Make sure all testers have joined.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
        <span className="ml-3 text-[14px] text-ink-500 font-medium">Loading tester email list…</span>
      </div>
    );
  }

  if (!data) return null;

  const isStep2Active = data.step2Active || data.step1Verified;
  const isReadyToProceed = data.isReady && !isStep2Active;

  return (
    <div className="rounded-[24px] border-2 border-[#4F46E5]/20 bg-gradient-to-b from-white to-[#F8FAFC] p-7 shadow-sm space-y-6">
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-[#EEF2FF] px-3 py-0.5 text-[12px] font-bold text-[#4F46E5] uppercase tracking-wider">
              Google Play Console Setup
            </span>
            {isStep2Active ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Step 2 Active
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-900">
                Action Required
              </span>
            )}
          </div>
          <h3 className="mt-2 text-[20px] font-bold text-ink-950">
            {isStep2Active
              ? "Testers Added to Google Play Closed Track"
              : "Add Tester Emails to Google Play Console"}
          </h3>
          <p className="mt-1 text-[13.5px] text-ink-500 max-w-2xl leading-relaxed">
            Google Play requires tester Google accounts to be registered in your closed track email list before they can opt in and install your app.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-xs text-right">
          <div className="text-[12px] uppercase tracking-wider text-ink-400 font-semibold">
            Cohort Status
          </div>
          <div className="text-[18px] font-extrabold text-ink-950">
            {data.total} / {data.requiredTesters}{" "}
            <span className="text-[13px] font-medium text-ink-500">Testers</span>
          </div>
        </div>
      </div>

      {/* Instructions toggle */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 text-[13.5px]">
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex w-full items-center justify-between font-semibold text-[#4F46E5] hover:underline"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="size-4" /> How to add these emails in Google Play Console (4 easy steps)
          </span>
          <span className="text-[12px]">{showInstructions ? "Hide" : "Show instructions"}</span>
        </button>

        {showInstructions && (
          <ol className="mt-3.5 space-y-2 text-ink-700 pl-5 list-decimal text-[13px] border-t border-black/5 pt-3 leading-relaxed">
            <li>
              Log in to your{" "}
              <a
                href="https://play.google.com/console"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 underline inline-flex items-center gap-0.5"
              >
                Google Play Console <ExternalLink className="size-3" />
              </a>{" "}
              and select this application.
            </li>
            <li>
              In the left navigation menu, go to <strong>Release &gt; Testing &gt; Closed testing</strong>.
            </li>
            <li>
              Click on the track, switch to the <strong>Testers</strong> tab, and click <strong>Create email list</strong> (or select an existing list).
            </li>
            <li>
              Click the <strong>&quot;Copy comma-separated&quot;</strong> button below, paste the emails into the Play Console text box, and click <strong>Save</strong>.
            </li>
          </ol>
        )}
      </div>

      {/* Emails Display & Copy Area */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13.5px] font-bold text-ink-900">
            Tester Emails ({data.total} Available)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.total === 0}
              onClick={() => handleCopy("comma")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all ${
                copiedFormat === "comma"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs"
              } disabled:opacity-40`}
            >
              {copiedFormat === "comma" ? (
                <>
                  <Check className="size-3.5" strokeWidth={3} /> Copied comma-separated!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy comma-separated (email1, email2...)
                </>
              )}
            </button>

            <button
              type="button"
              disabled={data.total === 0}
              onClick={() => handleCopy("newline")}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              {copiedFormat === "newline" ? "Copied line-by-line!" : "Copy line-by-line"}
            </button>
          </div>
        </div>

        {/* Raw Emails Box */}
        {data.total === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-[13.5px] text-ink-400 bg-white">
            Waiting for testers to join this project. Emails will appear here in real time.
          </div>
        ) : (
          <div className="relative rounded-2xl border border-black/10 bg-slate-900 p-4 font-mono text-[12.5px] text-slate-200 shadow-inner max-h-36 overflow-y-auto break-all select-all">
            {data.commaSeparated}
          </div>
        )}
      </div>

      {/* Step 2 Progression Actions */}
      {isStep2Active ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-emerald-600 text-white shrink-0">
            <Check className="size-4" strokeWidth={3} />
          </div>
          <div>
            <div className="font-bold text-emerald-950 text-[14px]">
              Step 2 is Active & Running
            </div>
            <p className="text-[12.5px] text-emerald-800">
              All testers have received their opt-in link and instructions to download and test your app on Google Play.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[14.5px] font-bold text-amber-950">
                Pasted all emails into Google Play Console?
              </h4>
              <p className="mt-0.5 text-[13px] text-amber-800 leading-relaxed">
                Once you click the button below, we immediately unlock <strong>Step 2 (Opt-in & Install)</strong> for all {data.requiredTesters} testers and send them their testing link.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-[13px] text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-[12.5px] text-amber-800">
              {data.isReady ? (
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="size-4" /> All {data.requiredTesters} testers joined and ready!
                </span>
              ) : (
                <span>
                  Waiting for all {data.requiredTesters} testers ({data.total}/{data.requiredTesters} joined)
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={busy || !data.isReady}
              onClick={handleProceed}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#4F46E5] px-7 py-3.5 text-[14.5px] font-bold text-white transition-all hover:bg-[#4338CA] hover:scale-[1.02] disabled:opacity-40 shadow-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Activating Step 2…
                </>
              ) : (
                <>
                  I&apos;ve added testers — Proceed to Step 2 <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
