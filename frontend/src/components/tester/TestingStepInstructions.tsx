"use client";

import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  Headphones, 
  Share2, 
  Copy, 
  FileText, 
  Upload, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  FolderClosed,
  Eye,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TestingStepInstructionsProps {
  isDarkMode: boolean;
  appName?: string;
  appSubtitle?: string;
  initialStep?: 1 | 2 | 3;
  onBack: () => void;
  onOpenSupport: () => void;
  onCompleteStep?: (step: number) => void;
}

export default function TestingStepInstructions({
  isDarkMode,
  appName = "Blinkit",
  appSubtitle = "Playstore closed Testing",
  initialStep = 1,
  onBack,
  onOpenSupport,
  onCompleteStep
}: TestingStepInstructionsProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size?: string;
    progress: number;
    statusText?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        progress: 100,
        statusText: 'Your report under review'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        progress: 100,
        statusText: 'Your report under review'
      });
    }
  };

  const handleStepLinkAction = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setUploadedFile({
        name: `${appName.toLowerCase()} step2.jpg`,
        progress: 49,
        statusText: ''
      });
      if (onCompleteStep) onCompleteStep(1);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      setUploadedFile({
        name: `${appName.toLowerCase()}_bug report.pdf`,
        progress: 100,
        statusText: 'Your report under review'
      });
      if (onCompleteStep) onCompleteStep(2);
    } else {
      alert("Testing workflow completed successfully! Payout will be processed.");
      if (onCompleteStep) onCompleteStep(3);
      onBack();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ================= TOP HEADER ================= */}
      <div className="flex items-center justify-between">
        {/* Left: Back Arrow + App Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] text-white flex items-center justify-center shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>

          <div>
            <h1 className={`text-[24px] font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              {appName}
            </h1>
            <p className="text-[13px] text-slate-400 font-medium">
              {appSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Support Button */}
        <button
          onClick={onOpenSupport}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-[14px] font-bold transition-all shadow-xs cursor-pointer ${
            isDarkMode
              ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5'
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Headphones className="w-4 h-4 text-[#4F37FE]" />
          <span>Support —</span>
        </button>
      </div>

      {/* ================= TWO-COLUMN WORKFLOW GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: INSTRUCTIONS ================= */}
        <div className={`lg:col-span-7 rounded-3xl p-8 border shadow-xs ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <h2 className={`text-[24px] font-black mb-6 ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
            Step {currentStep} - Instructions
          </h2>

          {/* Sample Attachment Card */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border mb-6 ${
            isDarkMode ? 'bg-[#181926] border-white/5' : 'bg-[#FAFAFC] border-slate-200/80'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2B579A] text-white flex items-center justify-center font-bold text-xl shadow-xs">
                W
              </div>
              <div>
                <div className={`text-[15px] font-bold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                  {currentStep === 1 && "Sample Step1 Proof.jpeg"}
                  {currentStep === 2 && "Sample Step2 Proof.jpeg"}
                  {currentStep === 3 && "Special Testing Instructions.docx"}
                </div>
                <div className="text-[12px] text-slate-400 font-medium">
                  {currentStep === 3 ? "19KB . Docx" : "19KB . jpeg"}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Viewing attachment for Step ${currentStep}`);
              }}
              className="px-8 py-2.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[14px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {currentStep === 3 ? "Download" : "View"}
            </button>
          </div>

          {/* Instructions Body */}
          <div className={`text-[14px] leading-relaxed space-y-4 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {currentStep < 3 ? (
              <>
                <p>Hi Everyone,</p>
                <p>The first step is to join as a tester for the AutinCore.</p>
                <p className="font-semibold">Please follow these instructions carefully:</p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Open the tester invitation link.</li>
                  <li>Make sure you open the link using the Chrome profile that is logged in with the same Gmail account you submitted to us.</li>
                  <li>Click on Join as a tester.</li>
                </ol>

                <div className="pt-2">
                  <p className="font-bold flex items-center gap-1.5 text-amber-500">
                    <span>⚠️</span>
                    <span>Important:</span>
                  </p>
                  <p className="mt-1">
                    Do NOT install the app yet. We will share Step 2 and installation instructions once everyone has successfully joined as a tester.
                  </p>
                </div>

                <div className="pt-2">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-500">
                    <span>✅</span>
                    <span>After joining as a tester, please reply in the group with:</span>
                  </p>
                  <p className="italic mt-1 pl-4 border-l-2 border-slate-300 dark:border-slate-700">
                    "I have joined as a tester, name: "
                  </p>
                  <p className="mt-1.5">and attach a screenshot as proof.</p>
                </div>

                <p className="pt-1">
                  This helps us track who has completed the process.
                </p>

                <p>
                  If you face any issues or have any questions, please ask directly in the group so everyone can benefit from the answer.
                </p>

                <p>
                  By Tomorrow EOD everyone must complete it and send in group.
                </p>

                <p className="font-semibold pt-1">
                  Let's complete Step {currentStep} first. Once everyone has joined, we'll move to the next step. 👍
                </p>
              </>
            ) : (
              <>
                <p>
                  Use the app and find bugs and attach the screen shorts in the report and submit it. Read all the documents and test the application and submit the clear report with mentioning all the features.
                </p>
                <div className="pt-6">
                  <p className="font-medium text-slate-400">Thank you</p>
                  <p className="font-bold text-base text-slate-800 dark:text-slate-200">Nandha Kishore B</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: UPLOAD & ACTIONS ================= */}
        <div className={`lg:col-span-5 rounded-3xl p-8 border shadow-xs space-y-6 ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          {/* Upload Header */}
          <div className="text-center">
            <h3 className={`text-[20px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              Upload your files
            </h3>
            <p className="text-[12px] text-slate-400 font-medium mt-1">
              File should be Pdf, Jpeg, Png, word
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#7E69FF]/60 hover:border-[#4F37FE] rounded-3xl py-12 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#FAFAFF] dark:bg-[#121320]"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.jpeg,.jpg,.png,.doc,.docx" 
            />

            <div className="w-16 h-14 rounded-2xl bg-[#6355FF] flex items-center justify-center text-white mb-3 shadow-md shadow-[#6355FF]/20">
              <FolderClosed className="w-8 h-8 fill-white/20 text-white" />
            </div>

            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
              Drag & Drop your files here
            </p>
          </div>

          {/* Uploaded File List */}
          {uploadedFile && (
            <div className="space-y-2">
              <span className="text-[12px] text-slate-400 font-medium">
                Uploaded files
              </span>

              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                isDarkMode ? 'bg-[#181926] border-white/5' : 'bg-[#FAFAFC] border-slate-200/80'
              }`}>
                {/* Red PDF Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#E11D48] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <span className="text-[10px] font-black tracking-widest uppercase">PDF</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                    {uploadedFile.name}
                  </div>

                  {uploadedFile.statusText ? (
                    <div className="text-[11px] text-slate-400 font-medium">
                      {uploadedFile.statusText}
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-[#4F37FE] rounded-full transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {uploadedFile.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="pt-6 flex items-center gap-3">
            {/* Share Button */}
            <button
              onClick={() => alert("Share link copied!")}
              className="w-14 h-14 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.96] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer border-0"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 px-7 h-14 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.96] text-white text-[15px] font-bold shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer border-0"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Step Link Button */}
            <button
              onClick={handleStepLinkAction}
              className="flex-1 h-14 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] active:scale-[0.96] text-white text-[16px] font-bold shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer text-center border-0"
            >
              {currentStep === 1 && (uploadedFile ? "Step2 Link" : "Step1 Link")}
              {currentStep === 2 && (uploadedFile?.progress === 100 ? "Step3 Link" : "Step2 Link")}
              {currentStep === 3 && "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
