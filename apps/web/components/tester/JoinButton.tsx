"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";

export function JoinButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await api<{ queued: boolean }>(`/projects/${projectId}/join`, {
        token,
        method: "POST",
      });
      router.push(res.queued ? "/tester/opportunities" : "/tester/tests");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not join");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={join}
        disabled={busy}
        className="rounded-full bg-ink-950 px-6 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-40"
      >
        {busy ? "Joining…" : "Join now"}
      </button>
      {error && <span className="max-w-[220px] text-right text-[12px] text-rose-600">{error}</span>}
    </span>
  );
}
