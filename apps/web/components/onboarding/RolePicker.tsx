"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Rocket, Smartphone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/marketing/LogoMark";
import { getDeviceFingerprint } from "@/lib/fingerprint";

type Pick = "client" | "tester";

export function RolePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const { getToken } = useAuth();

  const prefill = params.get("role");
  const [role, setRole] = useState<Pick | null>(
    prefill === "client" || prefill === "tester" ? prefill : null,
  );
  const [name, setName] = useState("");

  // Tester upfront details (Single Android device only)
  const [deviceModel, setDeviceModel] = useState("");
  const [deviceOs, setDeviceOs] = useState("Android 14");
  const [upi, setUpi] = useState("");

  // Client target track
  const [clientTrack, setClientTrack] = useState<"android" | "ios" | "ux">("android");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!role || busy) return;

    if (role === "tester" && (!deviceModel.trim() || !deviceOs.trim())) {
      setError("Please provide your Android device model and OS version to register.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api("/onboarding", {
        token,
        method: "POST",
        body: {
          role,
          name: name.trim() || undefined,
          ...(role === "tester"
            ? {
                device: {
                  model: deviceModel.trim(),
                  osVersion: deviceOs.trim(),
                  fingerprint: getDeviceFingerprint(),
                },
                upi: upi.trim() || undefined,
              }
            : {}),
        },
      });

      // Fresh token so middleware/JWT sees the new role, then route by role
      await getToken({ skipCache: true });
      router.push("/post-auth");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <h1 className="text-center text-[30px] font-bold tracking-tight text-ink-950">
        Choose your account type
      </h1>
      <p className="mt-2 text-center text-[14.5px] text-ink-500">
        Are you launching an application as a <strong>Client</strong>, or testing apps as a <strong>Tester</strong>?
      </p>

      {/* Role selector cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <RoleCard
          active={role === "client"}
          onClick={() => {
            setRole("client");
            setError(null);
          }}
          icon={<Rocket className="size-7" strokeWidth={1.75} />}
          title="Client"
          desc="Publish an app. Launch Android closed testing, apply for iOS TestFlight, or request UX testing."
        />
        <RoleCard
          active={role === "tester"}
          onClick={() => {
            setRole("tester");
            setError(null);
          }}
          icon={<Smartphone className="size-7" strokeWidth={1.75} />}
          title="Tester"
          desc="Earn by testing apps on your Android phone. Only physical Android devices allowed."
        />
      </div>

      {/* Shared Name Field */}
      {role && (
        <div className="mt-6 space-y-5 rounded-[24px] border border-black/8 bg-white p-6 shadow-sm animate-in fade-in duration-200">
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-semibold text-ink-800">
              Your name <span className="font-normal text-ink-400">(optional)</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-[14.5px] outline-none placeholder:text-ink-400 focus:border-ink-950"
            />
          </label>

          {/* Tester-Specific Upfront Single Device Registration */}
          {role === "tester" && (
            <div className="space-y-4 border-t border-black/8 pt-5">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-lime-300 text-ink-950">
                  <ShieldCheck className="size-3.5" />
                </span>
                <span className="text-[14px] font-semibold text-ink-950">
                  Your Android Device (1 Device Allowed)
                </span>
              </div>
              <p className="text-[13px] text-ink-500">
                Testers test Android applications only. Enter the physical Android phone you will test with.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium text-ink-700">
                    Device Model *
                  </span>
                  <input
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S24"
                    className="w-full rounded-2xl border border-black/10 px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium text-ink-700">
                    Android Version *
                  </span>
                  <input
                    value={deviceOs}
                    onChange={(e) => setDeviceOs(e.target.value)}
                    placeholder="e.g. Android 14"
                    className="w-full rounded-2xl border border-black/10 px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                  />
                </label>
              </div>

              <label className="block pt-1">
                <span className="mb-1 block text-[12.5px] font-medium text-ink-700">
                  UPI ID for Payouts <span className="font-normal text-ink-400">(optional now, can add in dashboard)</span>
                </span>
                <input
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="w-full rounded-2xl border border-black/10 px-4 py-2.5 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                />
              </label>
            </div>
          )}

          {/* Client-Specific Track Intent */}
          {role === "client" && (
            <div className="space-y-3 border-t border-black/8 pt-5">
              <span className="block text-[13.5px] font-semibold text-ink-800">
                Primary track you want to run:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "android", label: "Android Play Store" },
                  { id: "ios", label: "iOS TestFlight" },
                  { id: "ux", label: "UX Testing" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setClientTrack(t.id as "android" | "ios" | "ux")}
                    className={`rounded-xl border py-2.5 px-3 text-[13px] font-semibold transition-all ${
                      clientTrack === t.id
                        ? "border-ink-950 bg-ink-950 text-white"
                        : "border-black/10 bg-white text-ink-700 hover:border-black/25"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[12.5px] text-ink-500">
                You can manage or add other tracks anytime inside your Client Dashboard.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-[13.5px] text-rose-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!role || busy}
        className="mt-6 w-full rounded-full bg-ink-950 py-4 text-[15.5px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
      >
        {busy ? "Setting up your account…" : "Complete Registration"}
      </button>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-pressed={active}
      className={`rounded-[24px] border-2 p-6 text-left transition-all ${
        active
          ? "border-ink-950 bg-white shadow-md ring-2 ring-black/5"
          : "border-black/8 bg-white/60 hover:border-black/20"
      }`}
    >
      <span
        className={`mb-4 inline-grid size-12 place-items-center rounded-2xl ${
          active ? "bg-lime-300 text-ink-950" : "bg-paper text-ink-800"
        }`}
      >
        {icon}
      </span>
      <span className="block text-[18px] font-bold text-ink-950">{title}</span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-500">
        {desc}
      </span>
    </button>
  );
}
