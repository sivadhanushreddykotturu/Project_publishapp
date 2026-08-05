"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, Plus, Smartphone, Trash2, Wallet } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/fingerprint";

interface DeviceRow {
  platform: "android" | "ios";
  model: string;
  osVersion: string;
  fingerprint: string;
}

/**
 * First-run tester setup — devices + UPI are collected before the dashboard
 * unlocks. Everything here stays editable later in Profile.
 */
export function TesterSetup() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [devices, setDevices] = useState<DeviceRow[]>([
    { platform: "android", model: "", osVersion: "", fingerprint: "" },
  ]);
  const [vpa, setVpa] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceStepValid = devices.some((d) => d.model.trim() && d.osVersion.trim());
  const vpaValid = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(vpa.trim());

  async function finish() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const clean = devices
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
          devices: clean,
          experienceLevel,
          upi: { vpa: vpa.trim().toLowerCase() },
        },
      });
      setStep(3);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* progress */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-lime-400" : "bg-black/8"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-[24px] border border-black/5 bg-white p-8 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-lime-200 text-ink-950">
            <Smartphone className="size-6" />
          </span>
          <h2 className="mt-5 text-[24px] font-semibold tracking-tight text-ink-950">
            First — your devices
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
            Add the Android or iOS devices you&apos;ll test on. This powers
            fraud checks and matches you to the right projects. You can add or
            remove devices anytime later.
          </p>

          <div className="mt-6 space-y-3">
            {devices.map((d, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2.5">
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
                  className="w-[110px] rounded-2xl border border-black/10 bg-white px-3 py-3 text-[14px] outline-none focus:border-ink-950"
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
                  className="min-w-[130px] flex-1 rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
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
                  className="w-[120px] rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                />
                {devices.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove device"
                    onClick={() => setDevices((ds) => ds.filter((_, j) => j !== i))}
                    className="grid size-11 place-items-center rounded-2xl border border-black/10 text-ink-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
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
              <Plus className="size-4" /> Add another device
            </button>
          )}

          <button
            onClick={() => deviceStepValid && setStep(2)}
            disabled={!deviceStepValid}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 py-4 text-[15px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:opacity-40"
          >
            Continue <ArrowRight className="size-4" />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-[24px] border border-black/5 bg-white p-8 shadow-sm">
          <span className="grid size-12 place-items-center rounded-2xl bg-lime-200 text-ink-950">
            <Wallet className="size-6" />
          </span>
          <h2 className="mt-5 text-[24px] font-semibold tracking-tight text-ink-950">
            Where do we send your payouts?
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-500">
            Your UPI handle receives every withdrawal. One handle per account —
            and you can change it later in Profile.
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[13.5px] font-medium text-ink-800">
              UPI ID
            </span>
            <input
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="yourname@okhdfcbank"
              className="w-full rounded-2xl border border-black/10 px-4 py-3.5 text-[15px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-[13.5px] font-medium text-ink-800">
              Testing experience
            </span>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-ink-950"
            >
              <option value="beginner">Beginner — new to app testing</option>
              <option value="intermediate">Intermediate — tested a few apps</option>
              <option value="expert">Expert — QA / regular tester</option>
            </select>
          </label>

          {error && (
            <p className="mt-4 rounded-xl bg-orange-500/10 px-4 py-3 text-[13.5px] text-orange-600">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-4 text-[14px] font-semibold text-ink-600 transition-colors hover:border-black/25"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <button
              onClick={finish}
              disabled={!vpaValid || busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-950 py-4 text-[15px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save & finish"} <Check className="size-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-[24px] border border-black/5 bg-white p-10 text-center shadow-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime-300 text-ink-950">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <h2 className="mt-6 text-[24px] font-semibold tracking-tight text-ink-950">
            You&apos;re set up.
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-500">
            Devices and payout handle saved. Browse open opportunities — slots
            are first come, first served.
          </p>
          <button
            onClick={() => router.refresh()}
            className="mt-8 rounded-full bg-ink-950 px-8 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            Start testing
          </button>
        </section>
      )}
    </div>
  );
}
