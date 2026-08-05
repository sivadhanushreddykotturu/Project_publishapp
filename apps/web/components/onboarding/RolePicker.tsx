"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Rocket, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/marketing/LogoMark";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!role || busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api("/onboarding", {
        token,
        method: "POST",
        body: { role, name: name || undefined },
      });
      // fresh token so middleware/JWT sees the new role, then route by role
      await getToken({ skipCache: true });
      router.push("/post-auth");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-10 flex justify-center">
        <Logo />
      </div>
      <h1 className="text-center text-[32px] font-semibold tracking-display text-ink-950">
        What brings you to LaunchOps?
      </h1>
      <p className="mt-3 text-center text-[15px] text-ink-500">
        This sets up the right dashboard for you. It can&apos;t be changed
        later without support.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <RoleCard
          active={role === "client"}
          onClick={() => setRole("client")}
          icon={<Rocket className="size-8" strokeWidth={1.5} />}
          title="Ship my app"
          desc="I need 14+ testers for my Google Play closed test."
        />
        <RoleCard
          active={role === "tester"}
          onClick={() => setRole("tester")}
          icon={<Smartphone className="size-8" strokeWidth={1.5} />}
          title="Test apps"
          desc="I have an Android device and want to earn by testing."
        />
      </div>

      <label className="mt-8 block">
        <span className="mb-2 block text-[13.5px] font-medium text-ink-800">
          Your name <span className="text-ink-400">(optional)</span>
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Harika"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition-colors placeholder:text-ink-400 focus:border-ink-950"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-orange-500/10 px-4 py-3 text-[14px] text-orange-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!role || busy}
        className="mt-8 w-full rounded-full bg-ink-950 py-4 text-[16px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Setting up…" : "Continue"}
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
      aria-pressed={active}
      className={`rounded-[24px] border-2 p-6 text-left transition-all ${
        active
          ? "border-ink-950 bg-white shadow-lg"
          : "border-black/8 bg-white/60 hover:border-black/20"
      }`}
    >
      <span
        className={`mb-4 inline-grid size-14 place-items-center rounded-2xl ${
          active ? "bg-lime-300 text-ink-950" : "bg-paper text-ink-800"
        }`}
      >
        {icon}
      </span>
      <span className="block text-[17px] font-semibold text-ink-950">{title}</span>
      <span className="mt-1.5 block text-[13.5px] leading-snug text-ink-500">
        {desc}
      </span>
    </button>
  );
}
