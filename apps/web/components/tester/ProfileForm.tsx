"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/fingerprint";

export interface TesterProfileData {
  devices: Array<{
    platform: "android" | "ios";
    model: string;
    osVersion: string;
    fingerprint: string;
  }>;
  experienceLevel: string;
  upi: { vpa?: string; qrImageUrl?: string };
  walletBalance: number;
  ratingAvg: number;
  ratingCount: number;
  status: string;
}

export function ProfileForm({ initial }: { initial: TesterProfileData | null }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [devices, setDevices] = useState(
    initial?.devices?.length
      ? initial.devices
      : [{ platform: "android" as const, model: "", osVersion: "", fingerprint: "" }],
  );
  const [experienceLevel, setExperienceLevel] = useState(
    initial?.experienceLevel ?? "beginner",
  );
  const [vpa, setVpa] = useState(initial?.upi?.vpa ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const cleanDevices = devices
        .filter((d) => d.model.trim() && d.osVersion.trim())
        .map((d) => ({
          platform: d.platform,
          model: d.model.trim(),
          osVersion: d.osVersion.trim(),
          fingerprint: d.fingerprint || getDeviceFingerprint(),
        }));
      const token = await getToken();
      await api("/testers/me", {
        token,
        method: "PUT",
        body: {
          devices: cleanDevices,
          experienceLevel,
          ...(vpa.trim() ? { upi: { vpa: vpa.trim().toLowerCase() } } : {}),
        },
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* devices */}
      <section className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <h3 className="text-[16px] font-semibold text-ink-950">Your devices</h3>
        <p className="mt-1 text-[13px] text-ink-500">
          Android and iOS — the devices you test on. Fingerprints stop duplicate accounts.
        </p>
        <div className="mt-5 space-y-3">
          {devices.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <select
                value={d.platform}
                onChange={(e) =>
                  setDevices((ds) =>
                    ds.map((x, j) =>
                      j === i
                        ? { ...x, platform: e.target.value as "android" | "ios" }
                        : x,
                    ),
                  )
                }
                aria-label="Platform"
                className="w-[120px] rounded-2xl border border-black/10 bg-white px-3 py-3 text-[14px] outline-none focus:border-ink-950"
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
              <input
                value={d.model}
                onChange={(e) =>
                  setDevices((ds) =>
                    ds.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)),
                  )
                }
                placeholder={d.platform === "ios" ? "iPhone 15" : "Pixel 8a"}
                className="min-w-[140px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
              />
              <input
                value={d.osVersion}
                onChange={(e) =>
                  setDevices((ds) =>
                    ds.map((x, j) =>
                      j === i ? { ...x, osVersion: e.target.value } : x,
                    ),
                  )
                }
                placeholder={d.platform === "ios" ? "iOS 18" : "Android 15"}
                className="w-[130px] rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
              />
              <button
                type="button"
                aria-label="Remove device"
                onClick={() => setDevices((ds) => ds.filter((_, j) => j !== i))}
                className="grid size-11 place-items-center rounded-2xl border border-black/10 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        {devices.length < 3 && (
          <button
            type="button"
            onClick={() =>
              setDevices((ds) => [
                ...ds,
                { platform: "android", model: "", osVersion: "", fingerprint: "" },
              ])
            }
            className="mt-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-800 hover:text-orange-500"
          >
            <Plus className="size-4" /> Add a device
          </button>
        )}
      </section>

      {/* experience + upi */}
      <section className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <h3 className="text-[16px] font-semibold text-ink-950">Experience & payout</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-800">
              Testing experience
            </span>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none focus:border-ink-950"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-800">
              UPI handle <span className="text-ink-400">(for payouts)</span>
            </span>
            <input
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="name@okhdfcbank"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-[14px] text-orange-600">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-[14px] text-emerald-700">
          Saved. Your profile is up to date.
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="w-full rounded-full bg-ink-950 py-4 text-[15px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
