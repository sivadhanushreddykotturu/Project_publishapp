"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatINR } from "@/lib/format";

export interface AdminWithdrawal {
  _id: string;
  amountPaise: number;
  status: string;
  upiRef?: string;
  expectedCompletionAt?: string;
  createdAt: string;
  testerId?: {
    upi?: { vpa?: string };
    userId?: { name?: string; email?: string };
  };
}

export function WithdrawalRow({
  w,
  readOnly = false,
}: {
  w: AdminWithdrawal;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [upiRef, setUpiRef] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overdue =
    w.expectedCompletionAt && new Date(w.expectedCompletionAt) < new Date();

  async function run(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(path, { token, method: "POST", body });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Action failed");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-ink-950">
            {formatINR(w.amountPaise)} →{" "}
            <span className="font-mono text-[13.5px]">{w.testerId?.upi?.vpa ?? "no UPI"}</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ink-400">
            {w.testerId?.userId?.name ?? "—"} · {w.testerId?.userId?.email} · requested{" "}
            {new Date(w.createdAt).toLocaleString("en-IN")}
            {overdue && w.status === "pending" && (
              <span className="ml-2 font-semibold text-rose-600">SLA breached</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={w.status} />
          {w.upiRef && (
            <span className="font-mono text-[12px] text-ink-400">ref {w.upiRef}</span>
          )}
        </div>
      </div>

      {!readOnly && w.status === "pending" && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              placeholder="UPI transaction ref (UTR)"
              className="min-w-[240px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
            <button
              onClick={() => run(`/wallet/withdrawals/${w._id}/complete`, { upiRef })}
              disabled={busy || upiRef.trim().length < 6}
              className="rounded-full bg-emerald-600 px-5 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy ? "Working…" : "Mark paid"}
            </button>
            <button
              onClick={() => setRejecting((r) => !r)}
              disabled={busy}
              className="rounded-full bg-rose-50 px-5 py-3 text-[13.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              Reject
            </button>
          </div>
          {rejecting && (
            <div className="flex flex-wrap gap-3">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (the amount returns to the tester's wallet)"
                className="min-w-[240px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-rose-400"
              />
              <button
                onClick={() => run(`/wallet/withdrawals/${w._id}/reject`, { reason })}
                disabled={busy || reason.trim().length < 3}
                className="rounded-full bg-rose-600 px-5 py-3 text-[13.5px] font-semibold text-white disabled:opacity-40"
              >
                Confirm rejection
              </button>
            </div>
          )}
          {error && <p className="text-[13px] text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
