"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, X } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";

export interface ReviewItem {
  proofId: string;
  assignmentId: string;
  step: number;
  fileUrl: string;
  fileHash?: string;
  submittedAt: string;
  tester: { userId?: { name?: string; email?: string }; devices?: Array<{ model: string }> };
  project: { appDetails?: { appName?: string } };
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testerName = item.tester?.userId?.name || "Unknown tester";
  const testerEmail = item.tester?.userId?.email || "";
  const appName = item.project?.appDetails?.appName ?? "—";
  const isImage = item.fileUrl.startsWith("http");

  async function review(approve: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(
        `/verification/${item.assignmentId}/proofs/${item.proofId}/review`,
        { token, method: "POST", body: { approve, reason: reason || undefined } },
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Review failed");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[15.5px] font-semibold text-ink-950">
            Step {item.step} proof · {appName}
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {testerName} · {testerEmail} ·{" "}
            {new Date(item.submittedAt).toLocaleString("en-IN")}
          </p>
          {item.fileHash && (
            <p className="mt-1 font-mono text-[11.5px] text-ink-300">
              hash {item.fileHash.slice(0, 16)}…
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => review(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            <Check className="size-4" /> Approve & pay
          </button>
          <button
            onClick={() => setRejecting((r) => !r)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-40"
          >
            <X className="size-4" /> Reject
          </button>
        </div>
      </div>

      {isImage ? (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block overflow-hidden rounded-2xl border border-black/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.fileUrl}
            alt="Proof screenshot"
            className="max-h-72 w-full object-contain bg-paper"
          />
        </a>
      ) : (
        <p className="mt-4 rounded-2xl bg-paper px-5 py-4 text-[14px] text-ink-600">
          {item.fileUrl.replace(/^note:/, "")}
        </p>
      )}

      {rejecting && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (sent to the tester)"
            className="min-w-[260px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-rose-400"
          />
          <button
            onClick={() => review(false)}
            disabled={busy || !reason.trim()}
            className="rounded-full bg-rose-600 px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-40"
          >
            {busy ? "Rejecting…" : "Confirm rejection"}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-[13px] text-rose-600">{error}</p>}
    </div>
  );
}
