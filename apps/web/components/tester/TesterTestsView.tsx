"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AssignmentCard, type TesterAssignment } from "./AssignmentCard";

export function TesterTestsView({ assignments }: { assignments: TesterAssignment[] }) {
  const [tab, setTab] = useState<"all" | "active" | "queued">("all");

  const activeAssignments = assignments.filter((a) => a.status === "active");
  const queuedAssignments = assignments.filter((a) => a.status === "queued");

  const displayedAssignments =
    tab === "active"
      ? activeAssignments
      : tab === "queued"
      ? queuedAssignments
      : assignments;

  return (
    <div className="space-y-6">
      {/* Figma Tabs matching Frame 37:2 */}
      <div className="flex items-center gap-2 border-b border-black/5 pb-3">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
            tab === "all"
              ? "bg-ink-950 text-white shadow-sm"
              : "text-ink-600 hover:bg-black/5"
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
            tab === "active"
              ? "bg-ink-950 text-white shadow-sm"
              : "text-ink-600 hover:bg-black/5"
          }`}
        >
          Active Testing ({activeAssignments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("queued")}
          className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all ${
            tab === "queued"
              ? "bg-ink-950 text-white shadow-sm"
              : "text-ink-600 hover:bg-black/5"
          }`}
        >
          Queued ({queuedAssignments.length})
        </button>
      </div>

      {displayedAssignments.length === 0 ? (
        <div className="rounded-[24px] border border-black/5 bg-white p-12 text-center shadow-sm">
          <p className="text-[16px] font-medium text-ink-950">
            {tab === "active"
              ? "No active tests right now."
              : tab === "queued"
              ? "You are not in any waiting queue."
              : "No tests found."}
          </p>
          <p className="mt-1 text-[13.5px] text-ink-400">
            Browse available opportunities to join testing.
          </p>
          <div className="mt-5">
            <Link
              href="/tester/opportunities"
              className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-2.5 text-[13.5px] font-semibold text-white hover:bg-black"
            >
              Browse opportunities <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {displayedAssignments.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
