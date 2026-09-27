"use client";

import React, { useState } from 'react';
import { ChevronLeft, MessageSquare, Send } from 'lucide-react';
import type { BackendSupportTicket } from '../../lib/launchops-api';
import type { TestApp } from '../../types';

interface Props {
  isDarkMode: boolean;
  tickets?: BackendSupportTicket[];
  projects?: TestApp[];
  onSubmitTicket?: (ticket: { subject: string; message: string; projectId?: string }) => Promise<void>;
  onReply?: (ticketId: string, body: string) => Promise<void>;
}

function projectName(ticket: BackendSupportTicket) {
  return typeof ticket.projectId === 'object' ? ticket.projectId.appDetails?.appName : undefined;
}

function authorRole(message: BackendSupportTicket['messages'][number]) {
  return typeof message.authorId === 'object' ? message.authorId.role : undefined;
}

export default function TesterSupportView({ isDarkMode, tickets = [], projects = [], onSubmitTicket = async () => undefined, onReply = async () => undefined }: Props) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [projectId, setProjectId] = useState('');
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selected = tickets.find((ticket) => ticket._id === selectedId);
  const panel = isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200';

  if (selected) {
    return <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedId('')} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#4F37FE] text-white"><ChevronLeft /></button>
        <div><h2 className="text-xl font-black">{selected.subject}</h2><p className="text-xs text-slate-400">{projectName(selected) || 'General support'} · {selected.status.replace('_', ' ')}</p></div>
      </div>
      <section className={`rounded-3xl border p-6 ${panel}`}>
        <div className="min-h-80 space-y-4">
          {selected.messages.map((item, index) => {
            const fromSupport = authorRole(item) === 'admin';
            return <div key={`${item.createdAt}-${index}`} className={`flex ${fromSupport ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xl rounded-2xl px-5 py-3 ${fromSupport ? 'bg-[#4F37FE] text-white' : isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                <p className="text-xs font-bold opacity-70">{fromSupport ? 'UXOS Support' : 'You'}</p><p className="mt-1 text-sm whitespace-pre-wrap">{item.body}</p><p className="mt-2 text-[10px] opacity-60">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            </div>;
          })}
        </div>
        <form className="mt-6 flex gap-3" onSubmit={async (event) => { event.preventDefault(); if (!reply.trim()) return; setSaving(true); setError(''); try { await onReply(selected._id, reply.trim()); setReply(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send reply.'); } finally { setSaving(false); } }}>
          <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this conversation" className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`} />
          <button disabled={saving || !reply.trim()} className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#4F37FE] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />Send</button>
        </form>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </section>
    </div>;
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <section className={`rounded-3xl border p-6 ${panel}`}>
      <h2 className="text-lg font-black">Message UXOS Support</h2><p className="mt-1 text-xs text-slate-400">Create a ticket and continue the conversation when support replies.</p>
      <form className="mt-5 grid gap-3" onSubmit={async (event) => { event.preventDefault(); if (!subject.trim() || !message.trim()) return; setSaving(true); setError(''); try { await onSubmitTicket({ subject: subject.trim(), message: message.trim(), projectId: projectId || undefined }); setSubject(''); setMessage(''); setProjectId(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create ticket.'); } finally { setSaving(false); } }}>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDarkMode ? 'border-white/10 bg-[#181926]' : 'border-slate-200'}`}><option value="">General support</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
        </div>
        <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe what you need help with" className={`resize-none rounded-xl border px-4 py-3 text-sm outline-none ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        <button disabled={saving || !subject.trim() || !message.trim()} className="cursor-pointer rounded-xl bg-[#4F37FE] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Sending...' : 'Create Ticket'}</button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </section>
    <section className={`rounded-3xl border p-6 ${panel}`}><h2 className="text-lg font-black">Your tickets</h2>
      <div className="mt-4 space-y-3">{tickets.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No support tickets yet.</p> : tickets.map((ticket) => <button key={ticket._id} onClick={() => setSelectedId(ticket._id)} className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-[#4F37FE]" /><div><p className="text-sm font-bold">{ticket.subject}</p><p className="text-xs text-slate-400">{projectName(ticket) || 'General support'} · {ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'}</p></div></div><span className="rounded-full bg-[#4F37FE]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#4F37FE]">{ticket.status.replace('_', ' ')}</span></button>)}</div>
    </section>
  </div>;
}
