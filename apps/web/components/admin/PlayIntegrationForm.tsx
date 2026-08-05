"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";

/** Manual Play mode: paste the track opt-in URL → Step 2 opens + links go out. */
export function PlayIntegrationForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [optInUrl, setOptInUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function distribute() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(`/projects/${projectId}/play-integration`, {
        token,
        method: "POST",
        body: { optInUrl },
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Failed to save");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-[14px] leading-relaxed text-ink-600">
        All testers are verified. Copy their emails into your Play Console
        closed track, then paste the track&apos;s opt-in URL here — every
        tester gets their own tracked link automatically.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={optInUrl}
          onChange={(e) => setOptInUrl(e.target.value)}
          placeholder="https://play.google.com/apps/testing/com.example.app"
          type="url"
          className="min-w-[280px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
        />
        <button
          onClick={distribute}
          disabled={busy || !optInUrl.startsWith("http")}
          className="rounded-full bg-blue-500 px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
        >
          {busy ? "Distributing…" : "Distribute testing links"}
        </button>
      </div>
      {error && <p className="mt-3 text-[13px] text-rose-600">{error}</p>}
    </div>
  );
}
