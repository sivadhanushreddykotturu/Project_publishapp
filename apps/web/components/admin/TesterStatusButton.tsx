"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";

export function TesterStatusButton({
  testerId,
  status,
}: {
  testerId: string;
  status: string;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = status === "active" ? "suspended" : "active";

  async function toggle() {
    if (busy) return;
    if (!window.confirm(`Set this tester to ${next}?`)) return;
    setBusy(true);
    try {
      const token = await getToken();
      await api(`/testers/${testerId}/status`, {
        token,
        method: "PATCH",
        body: { status: next },
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-40 ${
          next === "suspended"
            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {busy ? "Working…" : next === "suspended" ? "Suspend" : "Reactivate"}
      </button>
      {error && <span className="text-[12px] text-rose-600">{error}</span>}
    </span>
  );
}
