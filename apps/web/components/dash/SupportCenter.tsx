"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { LifeBuoy, Plus, Send, FolderKanban, Globe } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { StatusPill } from "@/components/dash/StatusPill";

export interface TicketSummary {
  _id: string;
  subject: string;
  status: string;
  updatedAt: string;
  projectId?: { _id?: string; appDetails?: { appName?: string; packageName?: string } } | string;
  raisedBy?: { name?: string; email?: string; role?: string };
  messages: Array<{ body: string; isAdmin: boolean; at: string }>;
}

export interface SupportProjectChoice {
  _id: string;
  appDetails?: { appName?: string; packageName?: string };
}

/** One support center for all roles; admins get reply + status controls. */
export function SupportCenter({
  tickets = [],
  projects = [],
  isAdmin,
}: {
  tickets: TicketSummary[];
  projects?: SupportProjectChoice[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<TicketSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "general" | "project">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "tester" | "client">("all");

  async function call(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setReply("");
      setCreating(false);
      setSubject("");
      setBody("");
      setSelectedProjectId("");
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
      await api("/support-tickets", {
        token,
        method: "POST",
        body: {
          subject,
          body,
          projectId: selectedProjectId.trim() ? selectedProjectId : undefined,
        },
      });
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

  // Filter calculations
  const filteredTickets = tickets.filter((t) => {
    const isProject = Boolean(t.projectId);
    if (typeFilter === "general" && isProject) return false;
    if (typeFilter === "project" && !isProject) return false;

    if (isAdmin && roleFilter !== "all") {
      if (t.raisedBy?.role !== roleFilter) return false;
    }
    return true;
  });

  const generalCount = tickets.filter((t) => !t.projectId).length;
  const projectCount = tickets.filter((t) => Boolean(t.projectId)).length;
  const testerCount = tickets.filter((t) => t.raisedBy?.role === "tester").length;
  const clientCount = tickets.filter((t) => t.raisedBy?.role === "client").length;

  // ---------------- thread view ----------------
  if (selected) {
    const selectedAppName =
      typeof selected.projectId === "object" && selected.projectId?.appDetails?.appName
        ? selected.projectId.appDetails.appName
        : null;

    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <button
          onClick={() => setSelected(null)}
          className="text-[13px] font-medium text-ink-400 hover:text-orange-500"
        >
          ← All tickets
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {selectedAppName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
                  📱 App: {selectedAppName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                  🌐 General / Platform Support
                </span>
              )}
            </div>
            <h3 className="text-[20px] font-semibold text-ink-950">{selected.subject}</h3>
          </div>
          <StatusPill status={selected.status} />
        </div>

        {isAdmin && selected.raisedBy && (
          <p className="mt-1 text-[13px] text-ink-400">
            {selected.raisedBy.name} · {selected.raisedBy.email} ·{" "}
            <span className="font-semibold uppercase text-ink-700">
              {selected.raisedBy.role}
            </span>
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
              <span
                className={`mt-1 block text-[11px] ${
                  m.isAdmin ? "text-white/50" : "text-ink-400"
                }`}
              >
                {m.isAdmin ? "Support Team" : "You"} ·{" "}
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
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            <Send className="size-4" /> Send
          </button>
        </div>

        {isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2">
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Filters: General vs Project Support */}
        <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 p-1 border border-black/5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              typeFilter === "all"
                ? "bg-white text-ink-950 shadow-xs"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("general")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              typeFilter === "general"
                ? "bg-white text-ink-950 shadow-xs"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            <Globe className="size-3.5 text-zinc-600" />
            General ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("project")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              typeFilter === "project"
                ? "bg-white text-ink-950 shadow-xs"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            <FolderKanban className="size-3.5 text-indigo-600" />
            Projects ({projectCount})
          </button>
        </div>

        {/* Admin Role Filters */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 p-1 border border-black/5">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                roleFilter === "all"
                  ? "bg-white text-ink-950 shadow-xs"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("tester")}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                roleFilter === "tester"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Testers ({testerCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("client")}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                roleFilter === "client"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              Clients ({clientCount})
            </button>
          </div>
        )}

        {/* New Ticket CTA for Client */}
        {!isAdmin && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <Plus className="size-4" /> New ticket
          </button>
        )}
      </div>

      {/* Ticket Creation Drawer / Form */}
      {creating && (
        <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-ink-950">Open Support Ticket</h3>
            <button
              onClick={() => setCreating(false)}
              className="text-[13px] font-medium text-ink-400 hover:text-ink-700"
            >
              Cancel
            </button>
          </div>

          {/* Context Selector: General vs Project */}
          <div>
            <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">
              Category
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none focus:border-ink-950"
            >
              <option value="">🌐 General / Account & Billing Support</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  📱 App: {p.appDetails?.appName || "Project"} ({p.appDetails?.packageName || p._id.slice(-6)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question about my Play Store closed test"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink-900 mb-1.5">
              Description
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Describe what you need assistance with…"
              className="w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={createTicket}
              disabled={busy || subject.trim().length < 4 || body.trim().length < 4}
              className="rounded-full bg-ink-950 px-6 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Submit Ticket"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-full px-5 py-2.5 text-[14px] font-medium text-ink-500 hover:text-ink-950"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[13px] text-rose-600">{error}</p>}
        </div>
      )}

      {/* Ticket List View */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] border border-black/5 bg-white px-8 py-16 text-center shadow-sm">
          <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-paper text-ink-500">
            <LifeBuoy className="size-7" strokeWidth={1.5} />
          </span>
          <h2 className="text-[19px] font-semibold text-ink-950">No tickets found</h2>
          <p className="mt-2 max-w-md text-[14.5px] text-ink-500">
            {isAdmin
              ? "Support tickets from clients and testers will appear here."
              : "Need a hand? Open a ticket and our team will respond directly in the thread."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const appName =
              typeof t.projectId === "object" && t.projectId?.appDetails?.appName
                ? t.projectId.appDetails.appName
                : null;
            const isProject = Boolean(appName || t.projectId);

            return (
              <button
                key={t._id}
                onClick={() => setSelected(t)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-black/10"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {isProject ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[11.5px] font-semibold text-indigo-800">
                        📱 {appName || "App Project"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-black/5 px-2.5 py-0.5 text-[11.5px] font-semibold text-zinc-700">
                        🌐 General Support
                      </span>
                    )}

                    {isAdmin && t.raisedBy?.role && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${
                          t.raisedBy.role === "tester"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.raisedBy.role}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-[15.5px] font-semibold text-ink-950">
                    {t.subject}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-400">
                    {isAdmin && t.raisedBy ? `${t.raisedBy.name || t.raisedBy.email} · ` : ""}
                    {t.messages.length} message{t.messages.length === 1 ? "" : "s"} ·{" "}
                    {new Date(t.updatedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
