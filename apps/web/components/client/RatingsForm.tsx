"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Star } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";

interface RateableTester {
  testerId: string;
  name: string;
}

export function RatingsForm({
  projectId,
  testers,
}: {
  projectId: string;
  testers: RateableTester[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    const entries = Object.entries(ratings)
      .filter(([, r]) => r > 0)
      .map(([testerId, rating]) => ({ testerId, rating }));
    if (entries.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(`/projects/${projectId}/ratings`, {
        token,
        method: "POST",
        body: { ratings: entries },
      });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not submit ratings");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-2xl bg-emerald-500/10 px-5 py-4 text-[14px] text-emerald-700">
        Thanks — your ratings help us match better testers to future projects.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {testers.map((t) => (
        <div
          key={t.testerId}
          className="flex items-center justify-between rounded-2xl bg-paper px-5 py-3.5"
        >
          <span className="text-[14px] font-medium text-ink-950">{t.name}</span>
          <span className="flex gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                aria-label={`${r} star${r > 1 ? "s" : ""}`}
                onClick={() => setRatings((m) => ({ ...m, [t.testerId]: r }))}
                className="p-0.5"
              >
                <Star
                  className={`size-5 ${
                    (ratings[t.testerId] ?? 0) >= r
                      ? "fill-amber-400 text-amber-400"
                      : "text-ink-300"
                  }`}
                />
              </button>
            ))}
          </span>
        </div>
      ))}
      {error && <p className="text-[13px] text-rose-600">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || Object.keys(ratings).length === 0}
        className="rounded-full bg-ink-950 px-6 py-3 text-[14px] font-semibold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-40"
      >
        {busy ? "Submitting…" : "Submit ratings"}
      </button>
    </div>
  );
}
