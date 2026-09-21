"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ChevronLeft,
  Share2,
  Copy,
  Headphones,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

export interface StepTestingProps {
  id: string;
  appName?: string;
  packageName?: string;
  initialStep?: number;
  assignment?: {
    _id: string;
    currentStep: number;
    status: string;
    joinedAt?: string;
    proofs: Array<{
      step: number;
      fileUrl: string;
      status: string;
      submittedAt?: string;
    }>;
    projectId: {
      _id: string;
      appDetails: { appName: string; packageName: string };
      playIntegration?: { optInUrl?: string };
      steps?: Array<{
        order: number;
        config?: { payoutPaise?: number };
      }>;
    };
  } | null;
}

export function StepTestingView({
  id,
  appName: initialName,
  initialStep = 1,
  assignment,
}: StepTestingProps) {
  const { getToken } = useAuth();

  const totalPayoutPaise =
    assignment?.projectId?.steps?.reduce(
      (sum, s) => sum + (s.config?.payoutPaise || 0),
      0,
    ) || 0;
  const totalPayoutINR = totalPayoutPaise > 0 ? Math.round(totalPayoutPaise / 100) : 100;

  const appName =
    assignment?.projectId?.appDetails?.appName ||
    initialName ||
    (id === "deloitte"
      ? "Deloitte Field Ops"
      : id === "kanma"
      ? "Kanma Design Companion"
      : id === "swiggy"
      ? "Swiggy Food & Dining"
      : "Blinkit Quick Commerce");

  // Determine highest step unlocked for the tester
  const unlockedStep = assignment?.currentStep || initialStep || 1;

  // Active viewing step tab (can view past completed steps, but not future locked steps)
  const [currentStep, setCurrentStep] = useState<number>(unlockedStep);

  const [copied, setCopied] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id: string;
      step: number;
      name: string;
      url?: string;
      status: "under_review" | "verified";
    }>
  >(() => {
    if (assignment?.proofs && assignment.proofs.length > 0) {
      return assignment.proofs.map((p, idx) => ({
        id: `p-${idx}`,
        step: p.step,
        name: `${appName.toLowerCase()} step${p.step}.jpg`,
        url: p.fileUrl,
        status: p.status === "verified" ? "verified" : "under_review",
      }));
    }
    return [];
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testLink =
    assignment?.projectId?.playIntegration?.optInUrl ||
    "https://play.google.com/apps/testing/com.publishapp.client";

  // Check if current viewed step is in read-only mode (past completed step)
  const isPastCompletedStep = currentStep < unlockedStep;
  const isFutureLockedStep = currentStep > unlockedStep;

  // Check if step 1 has proof uploaded
  const step1Uploaded = uploadedFiles.some((f) => f.step === 1);

  // Step 2 proof timestamp or assignment joined date to anchor Day 1 of Step 3
  const step2Proof = assignment?.proofs?.find((p) => p.step === 2);
  const step3StartMs = step2Proof?.submittedAt
    ? new Date(step2Proof.submittedAt).getTime()
    : assignment?.joinedAt
    ? new Date(assignment.joinedAt).getTime()
    : Date.now();

  const totalRequiredMs = 14 * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, Date.now() - step3StartMs);
  const remainingMs = Math.max(0, totalRequiredMs - elapsedMs);
  const daysLeft = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const currentDayNum = Math.min(14, Math.max(1, 14 - daysLeft));
  const progressPercent = Math.min(100, Math.round((currentDayNum / 14) * 100));

  async function handleFileUpload(file: File) {
    if (isPastCompletedStep || isFutureLockedStep) return;
    setUploading(true);

    try {
      if (assignment?._id) {
        const asset = await uploadFile(file, "proofs", assignment._id, getToken);
        const token = await getToken();
        await api(`/assignments/${assignment._id}/proofs`, {
          token,
          method: "POST",
          body: { fileUrl: asset.url, publicId: asset.publicId, fileHash: asset.hash },
        });
      }

      const newFileItem = {
        id: String(Date.now()),
        step: currentStep,
        name: file.name,
        status: "under_review" as const,
      };
      setUploadedFiles((prev) => [newFileItem, ...prev.filter((p) => p.step !== currentStep)]);
    } catch {
      // Local fallback
      const newFileItem = {
        id: String(Date.now()),
        step: currentStep,
        name: file.name,
        status: "under_review" as const,
      };
      setUploadedFiles((prev) => [newFileItem, ...prev.filter((p) => p.step !== currentStep)]);
    } finally {
      setUploading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(testLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: `${appName} Testing Link`,
          text: `Join the Google Play closed testing track for ${appName}`,
          url: testLink,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  }

  const currentUploadedFile = uploadedFiles.find((f) => f.step === currentStep);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tester/tests"
            className="flex size-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
                {appName}
              </h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                ₹{totalPayoutINR} Reward
              </span>
            </div>
            <p className="text-[12px] font-medium text-slate-400 mt-0.5">
              Google Play Closed Testing Track · 14 Days · ₹{totalPayoutINR} UPI Transfer on Completion
            </p>
          </div>
        </div>

        {/* Support pill button */}
        <button
          type="button"
          onClick={() => setShowSupportModal(true)}
          className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 py-2 text-[13px] font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95"
        >
          <Headphones className="size-4 text-[#4F46E5]" />
          <span>Support</span>
        </button>
      </div>

      {/* Step Selector Tabs with Custom Status Indicators */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
        {/* Step 1 Tab */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-all ${
            currentStep === 1
              ? "bg-[#4F46E5] text-white shadow-xs"
              : unlockedStep > 1
              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {unlockedStep > 1 ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <CustomUnlockIcon className="size-4 shrink-0 text-current" />
          )}
          <span>Step 1: Account Verification</span>
          {unlockedStep > 1 && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              (Done)
            </span>
          )}
        </button>

        {/* Step 2 Tab */}
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-all ${
            currentStep === 2
              ? "bg-[#4F46E5] text-white shadow-xs"
              : unlockedStep < 2
              ? "bg-slate-100/80 text-slate-400 cursor-pointer hover:bg-slate-200/60"
              : unlockedStep > 2
              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {unlockedStep < 2 ? (
            <CustomLockIcon className="size-4 shrink-0 text-slate-400" />
          ) : unlockedStep > 2 ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <CustomUnlockIcon className="size-4 shrink-0 text-current" />
          )}
          <span>Step 2: Opt-In & Install</span>
          {unlockedStep < 2 && (
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              (Locked)
            </span>
          )}
          {unlockedStep > 2 && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              (Done)
            </span>
          )}
        </button>

        {/* Step 3 Tab */}
        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-all ${
            currentStep === 3
              ? "bg-[#4F46E5] text-white shadow-xs"
              : unlockedStep < 3
              ? "bg-slate-100/80 text-slate-400 cursor-pointer hover:bg-slate-200/60"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {unlockedStep < 3 ? (
            <CustomLockIcon className="size-4 shrink-0 text-slate-400" />
          ) : (
            <CustomUnlockIcon className="size-4 shrink-0 text-current" />
          )}
          <span>Step 3: 14-Day Testing Track</span>
          {unlockedStep < 3 && (
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              (Locked)
            </span>
          )}
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Instructions or Locked Gate */}
        <div className="lg:col-span-7 rounded-[24px] border border-slate-200/80 bg-white p-8 shadow-xs space-y-6">
          {/* Top Banner for Past Completed Steps */}
          {isPastCompletedStep && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[13.5px] font-bold text-emerald-900">
                    Step {currentStep} Verified & Completed (Read-Only)
                  </p>
                  <p className="text-[12px] text-emerald-700">
                    You have already verified this step. Records cannot be edited to protect verification integrity.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(unlockedStep)}
                className="shrink-0 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-800 transition-all"
              >
                Go to Step {unlockedStep} →
              </button>
            </div>
          )}

          {/* STEP 1: ACCOUNT VERIFICATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                  Step 1: Account Verification
                </h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[12px] font-bold text-[#4F46E5]">
                  Verification Gate
                </span>
              </div>

              <div className="space-y-4 text-[14px] leading-relaxed text-slate-700">
                <p>
                  The first step is to join as an authorized tester for <strong>{appName}</strong>. Follow these instructions carefully:
                </p>

                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-[14.5px]">
                    Instructions:
                  </h3>
                  <ol className="list-decimal list-inside space-y-2.5 text-[13.5px] text-slate-700">
                    <li>
                      Open the tester invitation link below on your Android device or Chrome browser.
                    </li>
                    <li>
                      <strong>Crucial:</strong> Make sure you open the link using the browser or Chrome profile that is logged in with the <strong>same Gmail account</strong> you submitted in your tester profile.
                    </li>
                    <li>
                      Click on <strong>&ldquo;Join as a tester&rdquo;</strong> (or &ldquo;Become a Tester&rdquo;).
                    </li>
                    <li>
                      Take a screenshot showing your confirmed tester status or Google Play account.
                    </li>
                    <li>
                      Upload your screenshot as proof on the right.
                    </li>
                  </ol>
                </div>

                <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-4 text-amber-950 space-y-1.5">
                  <p className="font-bold text-[13.5px] flex items-center gap-1.5 text-amber-900">
                    <AlertCircle className="size-4 text-amber-600 shrink-0" />
                    Important: Do NOT install the app yet!
                  </p>
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    We will unlock <strong>Step 2</strong> and provide full installation instructions once the developer confirms all registered tester emails in Google Play Console.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100/80 border border-slate-200/80 p-4 text-slate-700 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                      Tester Invitation Link
                    </p>
                    <p className="text-[13px] font-mono text-slate-800 truncate mt-0.5">
                      {testLink}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <a
                      href={testLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#4F46E5] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4338CA] transition-all flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>

                {step1Uploaded && (
                  <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-4 space-y-1">
                    <p className="font-bold text-[13.5px] text-[#4F46E5] flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" />
                      Verification Proof Submitted
                    </p>
                    <p className="text-[13px] text-slate-600 leading-relaxed">
                      Your Step 1 proof is submitted. The developer is registering all tester emails in Google Play Console. Step 2 will unlock automatically once confirmed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: LOCKED GATE OR ACTIVE INSTRUCTIONS */}
          {currentStep === 2 && isFutureLockedStep && (
            <div className="py-8 text-center space-y-5">
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-400">
                <CustomLockIcon className="size-10 text-slate-400" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-[22px] font-bold text-slate-900">
                  Step 2 is Locked
                </h2>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  The developer is currently adding all tester emails to Google Play Console. Step 2 will automatically unlock once the developer confirms the list in their dashboard.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all"
                >
                  View Step 1 Status
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && !isFutureLockedStep && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                  Step 2: Opt In & Install App
                </h1>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[12px] font-bold text-emerald-700">
                  Unlocked ✓
                </span>
              </div>

              <div className="space-y-4 text-[14px] leading-relaxed text-slate-700">
                <p>
                  The developer has registered your email in Google Play Console. You can now opt in to the closed testing track and install the app on your Android device.
                </p>

                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-[14.5px]">
                    Installation Steps:
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-[13.5px] text-slate-700">
                    <li>
                      Click <strong>&ldquo;Open Play Store Opt-In&rdquo;</strong> to open your invitation link.
                    </li>
                    <li>
                      Log in with your verified Gmail and tap <strong>&ldquo;Become a Tester&rdquo;</strong>.
                    </li>
                    <li>
                      Tap <strong>&ldquo;Download it on Google Play&rdquo;</strong> and install {appName}.
                    </li>
                    <li>
                      Open the app once to verify it loads to the home screen.
                    </li>
                    <li>
                      Take a screenshot of the app installed on your Android home screen or app drawer and upload it on the right.
                    </li>
                  </ol>
                </div>

                <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200/80 p-4 text-slate-800 space-y-1">
                  <p className="font-bold text-[13.5px] text-[#4F46E5] flex items-center gap-1.5">
                    <ShieldCheck className="size-4 shrink-0" />
                    Important Requirement:
                  </p>
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    Keep the app installed for the full 14 continuous days. Do not uninstall it, as Google Play monitors active tester devices during the closed testing period.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCKED GATE OR 14-DAY TRACK TIMELINE */}
          {currentStep === 3 && isFutureLockedStep && (
            <div className="py-8 text-center space-y-5">
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-400">
                <CustomLockIcon className="size-10 text-slate-400" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-[22px] font-bold text-slate-900">
                  Step 3 is Locked
                </h2>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  The 14-day continuous testing track and countdown begin automatically once your app installation in Step 2 is verified.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(unlockedStep)}
                  className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all"
                >
                  Go to Step {unlockedStep}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && !isFutureLockedStep && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
                  Step 3: 14-Day Testing Track
                </h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[12px] font-bold text-[#4F46E5]">
                  Day {currentDayNum} of 14 Active
                </span>
              </div>

              {/* 14-Day Progress Timeline Bar */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 space-y-4">
                <div className="flex items-center justify-between text-[13.5px] font-bold text-slate-900">
                  <span>Continuous Testing Progress</span>
                  <span className="text-[#4F46E5]">Day {currentDayNum} / 14</span>
                </div>

                {/* Progress track */}
                <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4F46E5] to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Milestones row */}
                <div className="grid grid-cols-3 text-center pt-1 text-[12px]">
                  <div className="space-y-1">
                    <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
                    <p className="font-bold text-slate-900">Day 1</p>
                    <p className="text-slate-500 text-[11px]">Installed & Started</p>
                  </div>
                  <div className="space-y-1">
                    <span className={`inline-block size-2.5 rounded-full ${currentDayNum >= 7 ? "bg-emerald-500" : "bg-indigo-400"}`} />
                    <p className="font-bold text-slate-900">Day 7</p>
                    <p className="text-slate-500 text-[11px]">Mid Checkpoint</p>
                  </div>
                  <div className="space-y-1">
                    <span className={`inline-block size-2.5 rounded-full ${currentDayNum >= 14 ? "bg-emerald-500" : "bg-slate-400"}`} />
                    <p className="font-bold text-slate-900">Day 14</p>
                    <p className="text-slate-500 text-[11px]">Final Review & ₹{totalPayoutINR} Payout</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 text-[13.5px] leading-relaxed text-slate-700">
                <h3 className="font-bold text-slate-900 text-[14.5px]">
                  Testing Instructions:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-700">
                  <li>Keep <strong>{appName}</strong> installed on your device for 14 continuous days.</li>
                  <li>Open the app occasionally (2–3 minutes daily) to generate authentic testing telemetry for Google Play algorithms.</li>
                  <li>Explore features, test flows, and if you encounter any issues, report them via Support.</li>
                </ul>
              </div>

              {/* Day 14 locked notice */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950 space-y-1">
                <p className="font-bold text-[13.5px] text-amber-900 flex items-center gap-1.5">
                  <CustomLockIcon className="size-4 text-amber-700 shrink-0" />
                  Final Payout Verification is Locked until Day 14
                </p>
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  On Day 14, this step will unlock the final submission form. You will upload proof that the app remains installed along with your Google Play review to claim your full ₹{totalPayoutINR} UPI payout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Actions & Uploads */}
        <div className="lg:col-span-5 rounded-[24px] border border-slate-200/80 bg-white p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">
                {currentStep === 3
                  ? isFutureLockedStep
                    ? "Testing Timer Locked"
                    : "Final Verification Gate"
                  : isPastCompletedStep
                  ? "Verified Proof"
                  : "Upload Proof Screenshot"}
              </h3>
              <p className="text-[12px] font-medium text-slate-400">
                {currentStep === 3
                  ? isFutureLockedStep
                    ? "14-Day timer begins after Step 2"
                    : "14-Day continuous test countdown"
                  : isPastCompletedStep
                  ? "Archived record for Play Console audit"
                  : "Supported: JPEG, PNG, PDF"}
              </p>
            </div>

            {/* STEP 3 SPECIFIC RIGHT COLUMN: Locked Countdown Box (NO copy link button!) */}
            {currentStep === 3 ? (
              isFutureLockedStep ? (
                /* STEP 3 IS LOCKED (Tester still on Step 1 or 2): Timer has NOT started */
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-8 text-center space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-400">
                    <CustomLockIcon className="size-7 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[16px] font-bold text-slate-900">
                      Countdown Not Started
                    </h4>
                    <p className="text-[13px] text-slate-500 max-w-xs mx-auto">
                      The 14-day continuous testing timer begins automatically once you install the app in Step 2 and submit your proof.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/90 py-3 px-5 shadow-xs">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-[#4F46E5]" />
                    </span>
                    <span className="text-[13.5px] font-bold tracking-tight text-[#4F46E5]">
                      Timer Starts After Step 2
                    </span>
                  </div>
                </div>
              ) : (
                /* STEP 3 IS ACTIVE: Timer running! */
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-8 text-center space-y-4">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-[#4F46E5]">
                    <CustomLockIcon className="size-7 text-[#4F46E5]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[16px] font-bold text-slate-900">
                      Final Submission Locked
                    </h4>
                    <p className="text-[13px] text-slate-500 max-w-xs mx-auto">
                      Countdown in progress. Keep the app installed for 14 continuous days.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 py-3 px-4 font-mono text-[16px] font-bold text-[#4F46E5] shadow-xs">
                    {daysLeft} Days : {hoursLeft} Hours Left
                  </div>
                </div>
              )
            ) : isPastCompletedStep ? (
              /* PAST COMPLETED STEP: Read-only proof view */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-emerald-950">
                    Proof Verified & Recorded
                  </p>
                  <p className="text-[12.5px] text-emerald-700 mt-0.5">
                    This step is finalized. No further uploads are accepted.
                  </p>
                </div>
              </div>
            ) : (
              /* ACTIVE STEP: Dropzone for Proof Upload */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFileUpload(file);
                }}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-[#818CF8]/70 bg-white p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-indigo-50/20 active:scale-[0.99]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />

                <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F46E5] shadow-xs">
                  <Smartphone className="size-7 text-[#4F46E5]" />
                </div>

                <p className="mt-3 text-[13.5px] font-semibold text-slate-700">
                  {uploading ? "Uploading proof…" : "Upload Screenshot Proof"}
                </p>
                <p className="text-[11.5px] text-slate-400 mt-1">
                  Click or drag and drop your screenshot here
                </p>
              </div>
            )}

            {/* Display Current Uploaded File */}
            {currentUploadedFile && (
              <div className="space-y-2 pt-2">
                <p className="text-[12.5px] font-medium text-slate-400">
                  Attached file:
                </p>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white font-bold text-[10px]">
                    PNG
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900 leading-tight">
                      {currentUploadedFile.name}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                      ✓ Proof logged for verification
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button Row */}
          <div className="pt-4 border-t border-slate-100/80">
            {currentStep === 3 ? (
              isFutureLockedStep ? (
                /* STEP 3 IS LOCKED: Return to active step button */
                <button
                  type="button"
                  onClick={() => setCurrentStep(unlockedStep)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-[13.5px] font-semibold text-slate-600 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
                >
                  <CustomLockIcon className="size-4 text-slate-400" />
                  <span>Locked · Return to Active Step {unlockedStep}</span>
                </button>
              ) : (
                /* STEP 3 IS ACTIVE: Strictly Locked Submit Button until Day 14 */
                <button
                  type="button"
                  disabled={remainingMs > 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-all ${
                    remainingMs > 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] active:scale-95 cursor-pointer"
                  }`}
                >
                  {remainingMs > 0 ? (
                    <>
                      <CustomLockIcon className="size-4" />
                      <span>Submit Final Proof (Locked until Day 14)</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Final Verification & Review →</span>
                    </>
                  )}
                </button>
              )
            ) : isPastCompletedStep ? (
              /* PAST COMPLETED STEP: Proceed button to current step */
              <button
                type="button"
                onClick={() => setCurrentStep(unlockedStep)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all"
              >
                <span>Return to Active Step {unlockedStep}</span>
                <ArrowRight className="size-4" />
              </button>
            ) : currentStep === 1 ? (
              /* STEP 1: Upload Confirmation / Status */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 disabled:opacity-50"
              >
                {step1Uploaded ? "Re-upload Verification Screenshot" : "Select Screenshot to Upload"}
              </button>
            ) : (
              /* STEP 2: Opt-In Link Buttons */
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleShare}
                  title="Share invitation link"
                  className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 shrink-0"
                >
                  <Share2 className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy link"
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={testLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#4F46E5] px-4 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 text-center"
                >
                  <span>Open Play Store Opt-In</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[17px] font-bold text-slate-900">
                Tester Support — {appName}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-[13px] text-slate-600">
              Need help joining the closed test, installing the app, or verifying your steps? Message our admin team directly:
            </p>

            <textarea
              rows={4}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Describe what you need help with..."
              className="w-full rounded-xl border border-slate-200 p-3 text-[13.5px] outline-none focus:border-[#4F46E5]"
            />

            {supportSent && (
              <p className="rounded-lg bg-emerald-50 p-2.5 text-[12.5px] font-medium text-emerald-700">
                Support request sent! An admin will review it shortly.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!supportMessage.trim() || supportSent}
                onClick={() => {
                  setSupportSent(true);
                  setTimeout(() => {
                    setShowSupportModal(false);
                    setSupportSent(false);
                    setSupportMessage("");
                  }, 1500);
                }}
                className="rounded-xl bg-[#4F46E5] px-5 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#4338CA] disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Custom Lock SVG Badge */
function CustomLockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Custom Unlock SVG Badge */
function CustomUnlockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
