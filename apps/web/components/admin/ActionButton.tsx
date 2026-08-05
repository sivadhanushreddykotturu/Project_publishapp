"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";

/** Small admin action trigger: POST to an endpoint, then refresh the page data. */
export function ActionButton({
  endpoint,
  label,
  confirm,
  tone = "dark",
}: {
  endpoint: string;
  label: string;
  confirm?: string;
  tone?: "dark" | "lime" | "danger";
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(endpoint, { token, method: "POST" });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Action failed");
      setBusy(false);
    }
  }

  const tones = {
    dark: "bg-ink-950 text-white hover:scale-[1.03]",
    lime: "bg-lime-300 text-ink-950 hover:bg-lime-400",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all disabled:opacity-40 ${tones[tone]}`}
      >
        {busy ? "Working…" : label}
      </button>
      {error && <span className="text-[12px] text-rose-600">{error}</span>}
    </span>
  );
}
