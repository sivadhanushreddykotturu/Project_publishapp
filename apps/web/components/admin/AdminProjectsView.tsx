"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, CheckCircle2, Clock, Play, DollarSign } from "lucide-react";
import { StatusPill } from "@/components/dash/StatusPill";
import { ActionButton } from "@/components/admin/ActionButton";
import { formatDate, formatINR } from "@/lib/format";

export interface AdminProjectRow {
  _id: string;
  packageKey: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: { appName: string; packageName: string; webOptInUrl?: string; playStoreUrl?: string };
  clientId?: { companyName?: string; contactName?: string };
  invoice?: { status: string; totalPaise: number } | null;
  createdAt: string;
}

export function AdminProjectsView({ projects }: { projects: AdminProjectRow[] }) {
  const [filter, setFilter] = useState<"all" | "pending_review" | "awaiting_payment" | "open" | "completed">("all");
  const [search, setSearch] = useState("");

  const pendingReviewCount = projects.filter(
    (p) => p.status === "active" && p.joinState === "closed",
  ).length;
  const awaitingPaymentCount = projects.filter(
    (p) => p.status === "awaiting_payment",
  ).length;
  const openCount = projects.filter((p) => p.joinState === "open").length;

  const filteredProjects = projects.filter((p) => {
    // Tab filter
    if (filter === "pending_review" && !(p.status === "active" && p.joinState === "closed")) {
      return false;
    }
    if (filter === "awaiting_payment" && p.status !== "awaiting_payment") {
      return false;
    }
    if (filter === "open" && p.joinState !== "open") {
      return false;
    }
    if (filter === "completed" && p.status !== "completed") {
      return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const appMatch = p.appDetails.appName.toLowerCase().includes(q);
      const pkgMatch = p.appDetails.packageName.toLowerCase().includes(q);
      const clientMatch =
        (p.clientId?.companyName || p.clientId?.contactName || "").toLowerCase().includes(q);
      return appMatch || pkgMatch || clientMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
              filter === "all"
                ? "bg-ink-950 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All ({projects.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("pending_review")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
              filter === "pending_review"
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Pending Review</span>
            {pendingReviewCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                filter === "pending_review" ? "bg-white/20 text-white" : "bg-indigo-100 text-[#4F46E5]"
              }`}>
                {pendingReviewCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter("open")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
              filter === "open"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Live / Open</span>
            {openCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                filter === "open" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
              }`}>
                {openCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter("awaiting_payment")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
              filter === "awaiting_payment"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Awaiting Payment</span>
            {awaitingPaymentCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-bold ${
                filter === "awaiting_payment" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                {awaitingPaymentCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
              filter === "completed"
                ? "bg-ink-950 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project or client…"
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5]"
          />
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <p className="text-[15px] font-medium text-slate-700">No projects found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredProjects.map((p) => {
            const clientName =
              p.clientId?.companyName || p.clientId?.contactName || "—";
            const isPendingReview = p.status === "active" && p.joinState === "closed";
            const isAwaitingPayment = p.status === "awaiting_payment";
            const isOpen = p.joinState === "open";

            return (
              <div
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/projects/${p._id}`}
                      className="text-[17px] font-bold text-slate-900 hover:text-[#4F46E5] transition-colors truncate"
                    >
                      {p.appDetails.appName}
                    </Link>

                    {isPendingReview && (
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-[#4F46E5]">
                        Awaiting Publish
                      </span>
                    )}

                    {isOpen && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-600" /> Live to Testers
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[13px] text-slate-500">
                    <span className="font-semibold text-slate-700">{clientName}</span> ·{" "}
                    <span className="font-mono text-[12px]">{p.appDetails.packageName}</span> ·{" "}
                    {formatDate(p.createdAt)}
                  </p>

                  {/* Testing URLs Preview */}
                  {(p.appDetails.webOptInUrl || p.appDetails.playStoreUrl) && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px]">
                      {p.appDetails.webOptInUrl && (
                        <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-mono text-amber-900 border border-amber-200/60 truncate max-w-xs">
                          Opt-In: {p.appDetails.webOptInUrl}
                        </span>
                      )}
                      {p.appDetails.playStoreUrl && (
                        <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-mono text-sky-900 border border-sky-200/60 truncate max-w-xs">
                          Store: {p.appDetails.playStoreUrl}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side stats & action buttons */}
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="text-right">
                    <div className="text-[13.5px] font-bold text-slate-900">
                      {p.activeTesterCount}/{p.requiredTesters} Testers
                    </div>
                    <div className="text-[11.5px] text-slate-400">
                      {p.waitlistCount} in queue
                    </div>
                  </div>

                  <StatusPill status={p.status} />

                  {/* Action 1: Mark Paid for unpaid projects */}
                  {isAwaitingPayment && (
                    <ActionButton
                      endpoint={`/projects/${p._id}/mark-paid`}
                      label="Confirm Payment"
                      tone="lime"
                      confirm={`Confirm payment for ${p.appDetails.appName}? It will activate and be ready for admin publishing.`}
                    />
                  )}

                  {/* Action 2: Publish to Testers for paid & pending review projects */}
                  {isPendingReview && (
                    <ActionButton
                      endpoint={`/projects/${p._id}/publish`}
                      label="Publish to Testers"
                      tone="lime"
                      confirm={`Publish the testing opportunity for ${p.appDetails.appName}? Testers will see it in the App Testing grid immediately.`}
                    />
                  )}

                  <Link
                    href={`/admin/projects/${p._id}`}
                    className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
