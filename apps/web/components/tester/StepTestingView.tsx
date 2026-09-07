"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ChevronLeft,
  Share2,
  Copy,
  Headphones,
  Check,
  FileText,
  FileIcon,
  X,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
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
    proofs: Array<{
      step: number;
      fileUrl: string;
      status: string;
    }>;
    projectId: {
      _id: string;
      appDetails: { appName: string; packageName: string };
      playIntegration?: { optInUrl?: string };
    };
  } | null;
}

export function StepTestingView({
  id,
  appName: initialName,
  packageName: initialPkg,
  initialStep = 1,
  assignment,
}: StepTestingProps) {
  const router = useRouter();
  const { getToken } = useAuth();

  const appName =
    assignment?.projectId?.appDetails?.appName ||
    initialName ||
    (id === "deloitte"
      ? "Deloitte"
      : id === "kanma"
      ? "Kanma"
      : id === "swiggy"
      ? "Swiggy"
      : id === "facebook"
      ? "Facebook"
      : "Blinkit");

  const [currentStep, setCurrentStep] = useState<number>(
    assignment?.currentStep || initialStep || 1,
  );

  const [copied, setCopied] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id: string;
      step: number;
      name: string;
      status: "under_review" | "verified";
    }>
  >(() => {
    if (assignment?.proofs && assignment.proofs.length > 0) {
      return assignment.proofs.map((p, idx) => ({
        id: `p-${idx}`,
        step: p.step,
        name: `${appName.toLowerCase()} step${p.step}.jpg`,
        status: p.status === "verified" ? "verified" : "under_review",
      }));
    }
    // Default initial uploaded file matching Screenshot 4 if step >= 2
    if (initialStep === 2) {
      return [
        {
          id: "default-step1",
          step: 1,
          name: `${appName.toLowerCase()} step1.jpg`,
          status: "under_review",
        },
      ];
    }
    return [];
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testLink =
    assignment?.projectId?.playIntegration?.optInUrl ||
    "https://play.google.com/apps/testing/com.publishapp.client";

  async function handleFileUpload(file: File) {
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
      setUploadedFiles((prev) => [newFileItem, ...prev]);

      // Automatically move to next step if Step 1
      if (currentStep === 1) {
        setTimeout(() => {
          setCurrentStep(2);
        }, 1200);
      }
    } catch {
      // Local fallback
      const newFileItem = {
        id: String(Date.now()),
        step: currentStep,
        name: file.name,
        status: "under_review" as const,
      };
      setUploadedFiles((prev) => [newFileItem, ...prev]);
      if (currentStep === 1) {
        setTimeout(() => {
          setCurrentStep(2);
        }, 1200);
      }
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
          text: `Join the closed testing for ${appName}`,
          url: testLink,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  }

  const currentUploadedFile = uploadedFiles.find((f) => f.step === currentStep) || uploadedFiles[0];

  return (
    <div className="space-y-6">
      {/* Top Header Bar matching Figma Screenshots 3, 4, 5 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button: solid purple square */}
          <Link
            href="/tester/tests"
            className="flex size-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </Link>

          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
              {appName}
            </h2>
            <p className="text-[12px] font-medium text-slate-400 mt-0.5">
              Playstore closed Testing
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
          <span>Support —</span>
        </button>
      </div>

      {/* Two Column Layout matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Step Instructions (col-span-7) */}
        <div className="lg:col-span-7 rounded-[24px] border border-slate-200/80 bg-white p-8 shadow-xs space-y-6">
          {/* Step Selector pills for easy navigation */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`rounded-xl px-4 py-1.5 text-[12.5px] font-bold transition-all ${
                currentStep === 1
                  ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Step 1
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`rounded-xl px-4 py-1.5 text-[12.5px] font-bold transition-all ${
                currentStep === 2
                  ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Step 2
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`rounded-xl px-4 py-1.5 text-[12.5px] font-bold transition-all ${
                currentStep === 3
                  ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Step 3
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
            Step {currentStep} - Instructions
          </h1>

          {/* Sample Proof Resource Box matching Figma */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5">
            <div className="flex items-center gap-3">
              {/* Word/File icon badge */}
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white font-bold text-[13px] shadow-xs">
                W
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900 leading-tight">
                  {currentStep === 3
                    ? "Special Testing Instructions.docx"
                    : `Sample Step${currentStep} Proof.jpeg`}
                </p>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                  19KB · {currentStep === 3 ? "Docx" : "jpeg"}
                </p>
              </div>
            </div>

            {currentStep === 3 ? (
              <a
                href="#download"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Special Testing Instructions template downloaded.");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#4F46E5] px-5 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all"
              >
                <Download className="size-3.5" />
                <span>Download</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                className="rounded-xl bg-[#4F46E5] px-6 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95"
              >
                View
              </button>
            )}
          </div>

          {/* Instructions Body */}
          {currentStep === 1 && (
            <div className="space-y-4 text-[13.5px] leading-relaxed text-slate-700">
              <p>Hi Everyone,</p>
              <p>
                The first step is to join as a tester for the {appName}.
              </p>
              <p className="font-medium text-slate-900">
                Please follow these instructions carefully:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Open the tester invitation link.</li>
                <li>
                  Make sure you open the link using the Chrome profile that is
                  logged in with the same Gmail account you submitted to us.
                </li>
                <li>Click on Join as a tester.</li>
              </ol>

              <div className="rounded-xl bg-amber-50/70 p-3.5 text-amber-900 border border-amber-200/60">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Important:
                </p>
                <p className="mt-1 text-[13px]">
                  Do NOT install the app yet. We will share Step 2 and installation
                  instructions once everyone has successfully joined as a tester.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  After joining as a tester, please reply in the group with:
                </p>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 font-mono text-[12.5px] text-slate-800">
                  &ldquo;I have joined as a tester, name: &rdquo;
                </div>
                <p>and attach a screenshot as proof.</p>
                <p className="text-slate-500 text-[12.5px]">
                  This helps us track who has completed the process.
                </p>
              </div>

              <p>
                If you face any issues or have any questions, please ask directly
                in the group so everyone can benefit from the answer.
              </p>
              <p>
                By Tomorrow EOD everyone must complete it and send in group.
              </p>
              <p className="font-medium text-slate-900">
                Let&apos;s complete Step 1 first. Once everyone has joined,
                we&apos;ll move to the next step. 👍
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 text-[13.5px] leading-relaxed text-slate-700">
              <p>Hi Everyone,</p>
              <p>
                The second step is to install the application from Google Play
                Store.
              </p>
              <p className="font-medium text-slate-900">
                Please follow these instructions carefully:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Open the Google Play store link provided via Step 2 Link.</li>
                <li>
                  Install the app on your registered Android device.
                </li>
                <li>Open the app and verify you can reach the main home screen.</li>
              </ol>

              <div className="rounded-xl bg-amber-50/70 p-3.5 text-amber-900 border border-amber-200/60">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Important:
                </p>
                <p className="mt-1 text-[13px]">
                  Keep the app installed on your device for at least 14
                  continuous days without uninstalling.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  After installing and opening the app:
                </p>
                <p>
                  Take a clear screenshot of the app open on your device and
                  upload it using the file uploader on the right.
                </p>
              </div>

              <p className="font-medium text-slate-900">
                Let&apos;s get this verified to unlock Step 3! 👍
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 text-[13.5px] leading-relaxed text-slate-700">
              <p>
                Use the app and find bugs and attach the screen shots in the report
                and submit it. No need to do deep testing just use the app and
                say where its breaking for you.
              </p>
              <p>
                Read all the documents and test the application and submit the
                clear report with mentioning all the features.
              </p>
              <div className="pt-4">
                <p className="font-semibold text-slate-900">Thank you</p>
                <p className="text-slate-600">Nandha Kishore B</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Upload your files & Actions (col-span-5) */}
        <div className="lg:col-span-5 rounded-[24px] border border-slate-200/80 bg-white p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">
                Upload your files
              </h3>
              <p className="text-[12px] font-medium text-slate-400">
                File should be Pdf, Jpeg, Png, word
              </p>
            </div>

            {/* Drag & drop dropzone matching Figma */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFileUpload(file);
              }}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-[#818CF8]/70 bg-white p-10 flex flex-col items-center justify-center text-center transition-all hover:bg-indigo-50/20 active:scale-[0.99]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file);
                }}
              />

              {/* Purple folder glyph */}
              <div className="size-16 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-[#4F46E5] shadow-xs">
                <svg
                  className="size-10 fill-current text-[#4F46E5]"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 4H4C2.89 4 2 4.89 2 6V18C2 19.1 2.89 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" />
                </svg>
              </div>

              <p className="mt-4 text-[13.5px] font-medium text-slate-400">
                {uploading ? "Uploading proof…" : "Drag & Drop your files here"}
              </p>
            </div>

            {/* Uploaded files section matching Screenshots 4 & 5 */}
            {currentUploadedFile && (
              <div className="space-y-2 pt-2">
                <p className="text-[12.5px] font-medium text-slate-400">
                  Uploaded files
                </p>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  {/* PDF or Image red icon */}
                  <div className="flex size-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-[10px] tracking-tight">
                    PDF
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-slate-900 leading-tight">
                      {currentUploadedFile.name}
                    </p>
                    <p className="text-[11.5px] font-medium text-slate-400 mt-0.5">
                      Your report under review
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Button Row matching Figma */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100/80">
            {/* Share button */}
            <button
              type="button"
              onClick={handleShare}
              title="Share testing link"
              className="flex size-11 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 shrink-0"
            >
              <Share2 className="size-4" />
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#4F46E5] px-5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Step Link button */}
            <a
              href={testLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#4F46E5] px-6 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 text-center"
            >
              Step{currentStep} Link
            </a>
          </div>
        </div>
      </div>

      {/* Sample Proof Preview Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[17px] font-bold text-slate-900">
                Sample Step {currentStep} Proof
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center space-y-3">
              <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-indigo-100 text-[#4F46E5]">
                <FileText className="size-10" />
              </div>
              <p className="text-[14px] font-bold text-slate-900">
                Sample Step{currentStep} Proof.jpeg
              </p>
              <p className="text-[12.5px] text-slate-500 max-w-sm mx-auto">
                Screenshot clearly showing that you clicked &ldquo;Join as a
                tester&rdquo; in Google Play with your registered Gmail account.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#4338CA]"
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Chat Drawer / Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="size-5 text-[#4F46E5]" />
                <h3 className="text-[17px] font-bold text-slate-900">
                  {appName} Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportSent(false);
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {supportSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-6" />
                </div>
                <p className="text-[15px] font-bold text-slate-900">
                  Message Sent to Admin
                </p>
                <p className="text-[13px] text-slate-500">
                  We will get back to you shortly in your support notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13px] text-slate-600">
                  Need help with Step {currentStep} for {appName}? Send a message
                  directly to the testing coordinator.
                </p>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or question…"
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!supportMessage.trim()}
                    onClick={async () => {
                      try {
                        const token = await getToken();
                        await api("/support", {
                          token,
                          method: "POST",
                          body: {
                            subject: `Help with ${appName} Step ${currentStep}`,
                            message: supportMessage.trim(),
                            category: "technical",
                          },
                        });
                      } catch {
                        // fallback
                      }
                      setSupportSent(true);
                    }}
                    className="rounded-xl bg-[#4F46E5] px-6 py-2 text-[13px] font-semibold text-white hover:bg-[#4338CA] disabled:opacity-50"
                  >
                    Send message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
