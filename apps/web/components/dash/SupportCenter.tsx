"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { StatusPill } from "@/components/dash/StatusPill";

export interface TicketSummary {
  _id: string;
  subject: string;
  status: string;
  updatedAt: string;
  raisedBy?: { name?: string; email?: string; role?: string };
  messages: Array<{ body: string; isAdmin: boolean; at: string }>;
}

/** One support center for all roles; admins get reply + status controls. */
export function SupportCenter({
  tickets,
  isAdmin,
}: {
  tickets: TicketSummary[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<TicketSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setReply("");
      setCreating(false);
      setSubject("");
      setBody("");
      router.refresh();
      setSelected(null);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const createTicket = () =>
    call(async () => {
      const token = await getToken();
      await api("/support-tickets", { token, method: "POST", body: { subject, body } });
    });

  const sendReply = () =>
    call(async () => {
      if (!selected) return;
      const token = await getToken();
      await api(`/support-tickets/${selected._id}/messages`, {
        token,
        method: "POST",
        body: { body: reply },
      });
    });

  const setStatus = (status: string) =>
    call(async () => {
      if (!selected) return;
      const token = await getToken();
      await api(`/support-tickets/${selected._id}/status`, {
        token,
        method: "PATCH",
        body: { status },
      });
    });

  // ---------------- thread view ----------------
  if (selected) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <button
          onClick={() => setSelected(null)}
          className="text-[13px] font-medium text-ink-400 hover:text-orange-500"
        >
          ← All tickets
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[19px] font-semibold text-ink-950">{selected.subject}</h3>
          <StatusPill status={selected.status} />
        </div>
        {isAdmin && selected.raisedBy && (
          <p className="mt-1 text-[13px] text-ink-400">
            {selected.raisedBy.name} · {selected.raisedBy.email} ·{" "}
            {selected.raisedBy.role}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {selected.messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed ${
                m.isAdmin
                  ? "ml-auto bg-navy-900 text-white"
                  : "bg-paper text-ink-800"
              }`}
            >
              {m.body}
              <span className={`mt-1 block text-[11px] ${m.isAdmin ? "text-white/50" : "text-ink-400"}`}>
                {m.isAdmin ? "Support" : "You"} ·{" "}
                {new Date(m.at).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
          />
          <button
            onClick={sendReply}
            disabled={busy || !reply.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            <Send className="size-4" /> Send
          </button>
        </div>

        {isAdmin && (
          <div className="mt-4 flex gap-2">
            {["in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={busy || selected.status === s}
                className="rounded-full border border-black/10 px-3.5 py-1.5 text-[12px] font-medium capitalize text-ink-600 transition-colors hover:border-black/25 disabled:opacity-30"
              >
                Mark {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-[13px] text-rose-600">{error}</p>}
      </div>
    );
  }

  // ---------------- list view ----------------
  return (
    <div className="space-y-5">
      {!isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <Plus className="size-4" /> New ticket
          </button>
        </div>
      )}

      {creating && (
        <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
          <h3 className="text-[16px] font-semibold text-ink-950">New support ticket</h3>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Describe the issue…"
            className="mt-3 w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={createTicket}
              disabled={busy || subject.length < 4 || body.length < 4}
              className="rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send ticket"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-full px-5 py-2.5 text-[14px] font-medium text-ink-500 hover:text-ink-950"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-3 text-[13px] text-rose-600">{error}</p>}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] border border-black/5 bg-white px-8 py-16 text-center shadow-sm">
          <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-paper text-ink-500">
            <LifeBuoy className="size-7" strokeWidth={1.5} />
          </span>
          <h2 className="text-[19px] font-semibold text-ink-950">No tickets</h2>
          <p className="mt-2 max-w-md text-[14.5px] text-ink-500">
            {isAdmin
              ? "Support tickets from clients and testers appear here."
              : "Need a hand? Open a ticket and we'll reply in the thread."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelected(t)}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink-950">
                  {t.subject}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-400">
                  {isAdmin && t.raisedBy ? `${t.raisedBy.name} · ` : ""}
                  {t.messages.length} message{t.messages.length === 1 ? "" : "s"} ·{" "}
                  {new Date(t.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <StatusPill status={t.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
