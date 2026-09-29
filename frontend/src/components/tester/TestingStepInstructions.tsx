"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, Copy, FolderClosed, Headphones } from 'lucide-react';
import type { BugReport, TestApp, TesterAssignment } from '../../types';

interface Props {
  isDarkMode: boolean; appName?: string; appSubtitle?: string; initialStep?: 1 | 2 | 3;
  project?: TestApp; assignment?: TesterAssignment; onBack: () => void; onOpenSupport: () => void;
  onCompleteStep?: (step: number) => void; onUploadProof?: (file: File) => Promise<string>;
  onSubmitStep1Email?: (id: string, email: string, proof?: string) => void | Promise<void>;
  onClickStep3Link?: (id: string, proof?: string) => void | Promise<void>;
  bugs?: BugReport[]; device?: string; osVersion?: string;
  onSubmitBugReport?: (bug: Omit<BugReport, 'id' | 'createdAt' | 'testerName' | 'testerAvatar' | 'screenshot'> & { screenshot?: string }) => void | Promise<void>;
}

export default function TestingStepInstructions({ isDarkMode, appName = 'Testing project', appSubtitle = 'Testing campaign', initialStep = 1, project, assignment, onBack, onOpenSupport, onCompleteStep, onUploadProof, onSubmitStep1Email, onClickStep3Link, bugs = [], device = 'Unknown device', osVersion = '', onSubmitBugReport }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [email, setEmail] = useState(assignment?.testerEmail || '');
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugSeverity, setBugSeverity] = useState<BugReport['severity']>('Medium');
  const [bugSteps, setBugSteps] = useState('');
  const [submittingBug, setSubmittingBug] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setStep(initialStep), [initialStep]);
  useEffect(() => setEmail(assignment?.testerEmail || ''), [assignment?.testerEmail]);

  const act = async () => {
    if (!assignment) return alert('Join this project before submitting proof.');
    if (step === 2) return alert('Your email and proof are waiting for admin approval.');
    if (step === 1) {
      if (!email.trim() || !file || !onUploadProof || !onSubmitStep1Email) return alert('Enter your Google Play Gmail address and attach a screenshot as proof.');
      setSubmitting(true);
      try { const key = await onUploadProof(file); await onSubmitStep1Email(assignment.id, email.trim(), key); setStep(2); onCompleteStep?.(1); }
      finally { setSubmitting(false); }
      return;
    }
    if (!project?.optInUrl) return alert('The client has not shared the testing invitation link yet.');
    window.open(project.optInUrl, '_blank', 'noopener,noreferrer');
    if (file && onUploadProof && onClickStep3Link) {
      setSubmitting(true);
      try { const key = await onUploadProof(file); await onClickStep3Link(assignment.id, key); onCompleteStep?.(3); }
      finally { setSubmitting(false); }
    }
  };

  const label = submitting ? 'Submitting...' : step === 1 ? 'Submit Email & Proof' : step === 2 ? 'Waiting for Admin Approval' : project?.optInUrl ? 'Open Testing Link' : 'Testing Link Not Available';
  const submitBug = async () => {
    if (!project || !onSubmitBugReport || !bugTitle.trim()) return;
    setSubmittingBug(true);
    try {
      await onSubmitBugReport({
        appId: project.id, appName: project.name, title: bugTitle.trim(), category: 'Functionality', severity: bugSeverity,
        status: 'Open', device, osVersion, reproductionSteps: bugSteps.split('\n').map(item => item.trim()).filter(Boolean),
      });
      setBugTitle(''); setBugSteps(''); setBugSeverity('Medium');
    } finally { setSubmittingBug(false); }
  };
  return <div className="max-w-7xl mx-auto space-y-6">
    <header className="flex items-center justify-between"><div className="flex items-center gap-4">
      <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-[#4F37FE] text-white flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
      <div><h1 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{appName}</h1><p className="text-sm text-slate-400">{appSubtitle}</p></div>
    </div><button onClick={onOpenSupport} className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-bold ${isDarkMode ? 'bg-[#0F1017] border-white/10 text-white' : 'bg-white border-slate-200'}`}><Headphones className="w-4 h-4 text-[#4F37FE]" />Support</button></header>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section className={`lg:col-span-7 rounded-3xl p-8 border ${isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200'}`}>
        <h2 className="text-2xl font-black mb-6">Step {step} - Instructions</h2>
        {!!project?.clientFiles?.length && <div className="mb-6 space-y-3">{project.clientFiles.map(item => <div key={item.key} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#181926] border-white/5' : 'bg-[#FAFAFC] border-slate-200'}`}><p className="font-bold">{item.name}</p><p className="text-xs text-slate-400">{(item.size / 1024).toFixed(1)} KB · Client file</p></div>)}</div>}
        <div className={`text-sm leading-7 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {step === 1 ? <div className="space-y-4">
            <p>The first step is to join as a tester for <strong>{appName}</strong>.</p>
            <p className="font-bold">Please follow these instructions carefully:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open the tester invitation link.</li>
              <li>Make sure you open the link using the Chrome profile that is logged in with the same Gmail account you submitted to us.</li>
              <li>Click on <strong>Join as a tester</strong>.</li>
            </ol>
            <div><p className="font-bold text-amber-500">⚠️ Important:</p><p>Do NOT install the app yet. We will share Step 2 and installation instructions once everyone has successfully joined as a tester.</p></div>
            <div><p className="font-bold text-emerald-500">✅ After joining as a tester, please reply in the group with:</p><p className="my-2 border-l-2 border-slate-300 pl-4 italic dark:border-slate-700">“I have joined as a tester, name: ”</p><p>and attach a screenshot as proof.</p></div>
            <p>This helps us track who has completed the process.</p>
            <p>If you face any issues or have any questions, please ask directly in the group so everyone can benefit from the answer.</p>
            <p>By Tomorrow EOD everyone must complete it and send in group.</p>
            <p className="font-bold">Let&apos;s complete Step 1 first. Once everyone has joined, we&apos;ll move to the next step. 👍</p>
          </div> : step === 2 ? <p>Your submitted Gmail address and screenshot are under admin review. The next step unlocks after approval.</p> : <p>Open the testing link with your approved Google account, then upload the requested proof.</p>}
        </div>
      </section>

      <section className={`lg:col-span-5 rounded-3xl p-8 border space-y-5 ${isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="text-center"><h3 className="text-xl font-extrabold">Submit proof</h3><p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP or PDF</p></div>
        {step === 1 && <label className="block space-y-2">
          <span className="block text-sm font-bold">Google Play Store email address</span>
          <span className="block text-xs text-slate-400">Enter the Gmail address currently signed in to the Play Store and Chrome profile you will use for testing.</span>
          <textarea rows={3} value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" className="w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#4F37FE] dark:border-white/10" />
        </label>}
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] || null); }} onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-[#7E69FF]/60 rounded-3xl py-12 px-6 flex flex-col items-center cursor-pointer bg-[#FAFAFF] dark:bg-[#121320]">
          <input type="file" ref={inputRef} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf" /><FolderClosed className="w-12 h-12 text-[#4F37FE] mb-3" /><p className="text-sm text-slate-500">{file?.name || 'Drag and drop proof, or click to select'}</p>
        </div>
        {step === 3 && project?.optInUrl && <button onClick={async () => { await navigator.clipboard.writeText(project.optInUrl!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full flex justify-center gap-2 rounded-2xl border border-[#4F37FE] py-3 text-[#4F37FE] font-bold">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? 'Copied' : 'Copy Testing Link'}</button>}
        <button onClick={act} disabled={submitting || step === 2} className="w-full h-14 rounded-2xl bg-[#4F37FE] disabled:bg-slate-300 text-white font-bold">{label}</button>
      </section>
    </div>

    {assignment && assignment.currentStep >= 3 && <section className={`rounded-3xl p-8 border ${isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div><h2 className="text-xl font-black">Bug reports for this project</h2><p className="mt-1 text-sm text-slate-400">Reports you submit here are sent directly to the admin review queue.</p>
          <div className="mt-5 space-y-3">{bugs.length ? bugs.map(bug => <div key={bug.id} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}><div className="flex justify-between gap-4"><p className="font-bold">{bug.title}</p><span className="text-xs font-bold text-[#4F37FE]">{bug.status}</span></div><p className="mt-1 text-xs text-slate-400">{bug.severity} severity</p></div>) : <p className="text-sm text-slate-400">No bugs submitted for this project yet.</p>}</div>
        </div>
        <div className="space-y-3"><h3 className="font-black">Report a bug</h3>
          <input value={bugTitle} onChange={e => setBugTitle(e.target.value)} placeholder="Bug summary" className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#4F37FE] dark:border-white/10" />
          <select value={bugSeverity} onChange={e => setBugSeverity(e.target.value as BugReport['severity'])} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${isDarkMode ? 'border-white/10 bg-[#181926] text-white' : 'border-slate-200 bg-white text-slate-800'}`}><option value="Critical" className={isDarkMode ? 'bg-[#181926] text-white' : ''}>Critical</option><option value="High" className={isDarkMode ? 'bg-[#181926] text-white' : ''}>High</option><option value="Medium" className={isDarkMode ? 'bg-[#181926] text-white' : ''}>Medium</option><option value="Low" className={isDarkMode ? 'bg-[#181926] text-white' : ''}>Low</option></select>
          <textarea rows={4} value={bugSteps} onChange={e => setBugSteps(e.target.value)} placeholder="Reproduction steps, one per line" className="w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#4F37FE] dark:border-white/10" />
          <button onClick={submitBug} disabled={!bugTitle.trim() || submittingBug} className="w-full rounded-2xl bg-[#4F37FE] py-3.5 font-bold text-white disabled:bg-slate-300">{submittingBug ? 'Submitting...' : 'Submit Bug Report'}</button>
        </div>
      </div>
    </section>}
  </div>;
}
