"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { PACKAGES } from "@launchops/types";
import { api, ApiClientError } from "@/lib/api";
import { formatINR } from "@/lib/format";

export function NewProjectForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [packageKey, setPackageKey] = useState<string>("growth");
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      const { project } = await api<{ project: { _id: string } }>("/projects", {
        token,
        method: "POST",
        body: {
          packageKey,
          appDetails: {
            appName,
            packageName,
            playStoreUrl: playStoreUrl || undefined,
            description: description || undefined,
          },
        },
      });
      router.push(`/client/projects/${project._id}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not create the project",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* package picker */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PACKAGES.map((pkg) => {
          const active = packageKey === pkg.key;
          return (
            <button
              type="button"
              key={pkg.key}
              onClick={() => setPackageKey(pkg.key)}
              aria-pressed={active}
              className={`rounded-[20px] border-2 p-5 text-left transition-all ${
                active
                  ? "border-ink-950 bg-white shadow-md"
                  : "border-black/8 bg-white/60 hover:border-black/20"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-ink-950">
                  {pkg.name}
                </span>
                {active && (
                  <span className="grid size-5 place-items-center rounded-full bg-lime-400">
                    <Check className="size-3.5 text-ink-950" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className="mt-1 block text-[20px] font-semibold text-ink-950">
                {formatINR(pkg.pricePaise)}
              </span>
              <span className="mt-1 block text-[12.5px] text-ink-500">
                {pkg.requiredTesters} testers · {pkg.durationDays} days
              </span>
            </button>
          );
        })}
      </div>

      {/* app details */}
      <div className="space-y-5 rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <Field label="App name" required>
          <input
            required
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="e.g. Todo Master"
            className={inputCls}
          />
        </Field>
        <Field label="Package name" required hint="The applicationId from your build, e.g. com.example.myapp">
          <input
            required
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="com.example.myapp"
            pattern="[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+"
            className={inputCls}
          />
        </Field>
        <Field label="Play Console draft link" hint="Optional — the closed-track or store-listing URL if you have it">
          <input
            value={playStoreUrl}
            onChange={(e) => setPlayStoreUrl(e.target.value)}
            placeholder="https://play.google.com/…"
            type="url"
            className={inputCls}
          />
        </Field>
        <Field label="What should testers focus on?" hint="Optional">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Core flows, known rough edges, devices you care about…"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-[14px] text-orange-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-ink-950 py-4 text-[16px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:opacity-40"
      >
        {busy ? "Creating…" : "Create project & invoice"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-ink-400 focus:border-ink-950";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13.5px] font-medium text-ink-800">
        {label}
        {required && <span className="text-orange-500"> *</span>}
        {hint && (
          <span className="ml-2 font-normal text-ink-400">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}
