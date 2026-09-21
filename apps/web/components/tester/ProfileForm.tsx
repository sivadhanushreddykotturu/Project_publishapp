"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/fingerprint";

export interface TesterProfileData {
  devices: Array<{
    platform?: "android" | "ios";
    model: string;
    osVersion?: string;
    androidVersion?: string;
    fingerprint?: string;
  }>;
  experienceLevel?: string;
  upi?: { vpa?: string; qrImageUrl?: string };
  walletBalance?: number;
  ratingAvg?: number;
  ratingCount?: number;
  status?: string;
}

const ANDROID_VERSIONS = [
  "Android 17",
  "Android 16",
  "Android 15",
  "Android 14",
  "Android 13",
  "Android 12",
  "Android 11",
  "Android 10",
  "Android 9",
  "Android 8",
];

export function ProfileForm({ initial }: { initial: TesterProfileData | null }) {
  const router = useRouter();
  const { getToken } = useAuth();

  const initialDevices = initial?.devices?.length
    ? initial.devices.map((d) => ({
        platform: d.platform || ("android" as const),
        model: d.model || "",
        osVersion: d.osVersion || d.androidVersion || "Android 14",
        fingerprint: d.fingerprint || "",
      }))
    : [{ platform: "android" as const, model: "", osVersion: "Android 14", fingerprint: "" }];

  const [devices, setDevices] = useState(initialDevices);
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
        .filter((d) => d.model.trim())
        .map((d) => ({
          platform: "android" as const,
          model: d.model.trim(),
          osVersion: (d.osVersion || "Android 14").trim(),
          fingerprint: d.fingerprint || getDeviceFingerprint(),
        }));

      if (cleanDevices.length === 0) {
        setError("Please add at least one device model.");
        setBusy(false);
        return;
      }

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
      if (cleanDevices[0]) {
        const devObj = {
          model: cleanDevices[0].model,
          androidVersion: cleanDevices[0].osVersion || "Android 14",
        };
        try {
          localStorage.setItem("uxos_tester_device", JSON.stringify(devObj));
        } catch {}
        window.dispatchEvent(new Event("uxos_tester_device_updated"));
      }
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
        <h3 className="text-[16px] font-semibold text-ink-950">Your Android devices</h3>
        <p className="mt-1 text-[13px] text-ink-500">
          Physical Android devices you test on for Google Play closed testing.
        </p>
        <div className="mt-5 space-y-3">
          {devices.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3">
              <span className="rounded-2xl border border-black/10 bg-zinc-100 px-4 py-3 text-[14px] font-semibold text-ink-800">
                Android
              </span>
              <input
                value={d.model}
                onChange={(e) =>
                  setDevices((ds) =>
                    ds.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)),
                  )
                }
                placeholder="e.g. Redmi Note 13 or Galaxy S24"
                className="min-w-[140px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
              />
              <select
                value={d.osVersion}
                onChange={(e) =>
                  setDevices((ds) =>
                    ds.map((x, j) =>
                      j === i ? { ...x, osVersion: e.target.value } : x,
                    ),
                  )
                }
                className="w-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-[14px] font-medium outline-none cursor-pointer focus:border-ink-950"
              >
                {ANDROID_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
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
                { platform: "android", model: "", osVersion: "Android 14", fingerprint: "" },
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
        className="w-full rounded-full bg-ink-950 py-4 text-[15.5px] font-semibold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
