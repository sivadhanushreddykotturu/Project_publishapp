"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";
import { StatusPill } from "@/components/dash/StatusPill";

export interface AdminBug {
  _id: string;
  title: string;
  severity: string;
  category: string;
  status: string;
  description: string;
  device: { platform?: string; model: string; osVersion: string };
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  attachments: Array<{ url: string }>;
  duplicateOf?: string;
  createdAt: string;
  tester?: { userId?: { name?: string; email?: string } };
}

export function BugTriage({ bugs }: { bugs: AdminBug[] }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = bugs.filter((b) => b.status === "open");
  const selectedOpen = open.filter((b) => selected.has(b._id));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setSelected(new Set());
      setMergeTarget("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const publishSelected = () =>
    run(async () => {
      const token = await getToken();
      await api("/bug-reports/publish", {
        token,
        method: "POST",
        body: { ids: [...selected] },
      });
    });

  const mergeInto = (targetId: string) =>
    run(async () => {
      const token = await getToken();
      const sources = [...selected].filter((id) => id !== targetId);
      for (const sourceId of sources) {
        await api("/bug-reports/merge", {
          token,
          method: "POST",
          body: { sourceId, targetId },
        });
      }
    });

  return (
    <div className="space-y-4">
      {/* action bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm">
        <span className="text-[13px] font-medium text-ink-500">
          {selected.size} selected
        </span>
        <button
          onClick={publishSelected}
          disabled={busy || selectedOpen.length === 0}
          className="rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
        >
          Publish to client
        </button>
        <div className="flex items-center gap-2">
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-[13px] outline-none"
          >
            <option value="">Merge into…</option>
            {selectedOpen.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title.slice(0, 40)}
              </option>
            ))}
          </select>
          <button
            onClick={() => mergeInto(mergeTarget)}
            disabled={busy || !mergeTarget || selectedOpen.length < 2}
            className="rounded-full bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
          >
            Merge duplicates
          </button>
        </div>
        {error && <span className="text-[12.5px] text-rose-600">{error}</span>}
      </div>

      {/* report cards */}
      {bugs.map((b) => {
        const isDup = b.status === "duplicate";
        return (
          <div
            key={b._id}
            className={`rounded-[20px] border border-black/5 bg-white p-6 shadow-sm ${isDup ? "opacity-55" : ""}`}
          >
            <div className="flex flex-wrap items-start gap-4">
              {b.status === "open" && (
                <input
                  type="checkbox"
                  checked={selected.has(b._id)}
                  onChange={() => toggle(b._id)}
                  aria-label={`Select ${b.title}`}
                  className="mt-1.5 size-4.5 accent-ink-950"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[15.5px] font-semibold text-ink-950">{b.title}</p>
                  <StatusPill status={b.severity} />
                  <StatusPill status={b.status} />
                </div>
                <p className="mt-1 text-[12.5px] text-ink-400">
                  {b.tester?.userId?.name ?? "tester"} · {b.device.model} (
                  {b.device.platform === "ios" ? "iOS" : "Android"} {b.device.osVersion}
                  ) · {b.category}
                </p>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-600">
                  {b.description}
                </p>
                <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
                  <p className="rounded-xl bg-paper px-4 py-3">
                    <span className="font-semibold text-ink-800">Expected: </span>
                    <span className="text-ink-600">{b.expectedResult}</span>
                  </p>
                  <p className="rounded-xl bg-paper px-4 py-3">
                    <span className="font-semibold text-ink-800">Actual: </span>
                    <span className="text-ink-600">{b.actualResult}</span>
                  </p>
                </div>
                {b.stepsToReproduce.length > 0 && (
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-ink-600">
                    {b.stepsToReproduce.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
                {b.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.attachments.map((a) => (
                      <a
                        key={a.url}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-blue-50 px-3 py-1 text-[11.5px] font-medium text-blue-700 hover:underline"
                      >
                        Evidence
                      </a>
                    ))}
                  </div>
                )}
                {isDup && b.duplicateOf && (
                  <p className="mt-2 text-[12px] text-ink-400">
                    Merged into {b.duplicateOf.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
