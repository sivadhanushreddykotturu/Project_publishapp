"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, Copy, FolderClosed, Headphones } from 'lucide-react';
import type { TestApp, TesterAssignment } from '../../types';

interface Props {
  isDarkMode: boolean; appName?: string; appSubtitle?: string; initialStep?: 1 | 2 | 3;
  project?: TestApp; assignment?: TesterAssignment; onBack: () => void; onOpenSupport: () => void;
  onCompleteStep?: (step: number) => void; onUploadProof?: (file: File) => Promise<string>;
  onSubmitStep1Email?: (id: string, email: string, proof?: string) => void | Promise<void>;
  onClickStep3Link?: (id: string, proof?: string) => void | Promise<void>;
}

export default function TestingStepInstructions({ isDarkMode, appName = 'Testing project', appSubtitle = 'Testing campaign', initialStep = 1, project, assignment, onBack, onOpenSupport, onCompleteStep, onUploadProof, onSubmitStep1Email, onClickStep3Link }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [email, setEmail] = useState(assignment?.testerEmail || '');
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
          {project?.instructions?.trim() ? <p className="whitespace-pre-wrap">{project.instructions}</p> : step === 1 ? <><p>Register the Google Play Gmail address you will use for <strong>{appName}</strong>.</p><ol className="list-decimal pl-5 mt-3"><li>Use the Gmail account connected to your Play Store.</li><li>Upload a screenshot as proof.</li><li>Wait for approval before installing the app.</li></ol></> : step === 2 ? <p>Your Gmail address and proof are under admin review. The invitation unlocks after approval.</p> : <p>Open the client-provided testing link with your approved Google account, then upload installation proof.</p>}
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
  </div>;
}
