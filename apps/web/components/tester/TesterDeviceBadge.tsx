"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";

interface Device {
  platform?: string;
  model: string;
  androidVersion: string;
}

export function TesterDeviceBadge({
  initialDevice,
}: {
  initialDevice?: { model: string; osVersion?: string; androidVersion?: string } | null;
} = {}) {
  const { getToken } = useAuth();
  const [device, setDevice] = useState<Device | null>(() => {
    if (initialDevice) {
      return {
        model: initialDevice.model,
        androidVersion: initialDevice.osVersion || initialDevice.androidVersion || "Android 14",
      };
    }
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("uxos_tester_device");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    let mounted = true;
    async function loadDevice() {
      try {
        const token = await getToken();
        const data = await api<{ tester?: { devices?: Array<{ model: string; osVersion?: string; androidVersion?: string }> } }>("/testers/me", { token });
        const profile = data && "tester" in data && data.tester ? data.tester : (data as unknown as { devices?: Array<{ model: string; osVersion?: string; androidVersion?: string }> });
        const firstDevice = profile?.devices?.[0];
        if (mounted && firstDevice) {
          const devObj = {
            model: firstDevice.model,
            androidVersion: firstDevice.osVersion || firstDevice.androidVersion || "Android 14",
          };
          setDevice(devObj);
          try {
            localStorage.setItem("uxos_tester_device", JSON.stringify(devObj));
          } catch {}
        }
      } catch {
        // best-effort
      }
    }
    void loadDevice();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  if (!device) {
    return (
      <Link
        href="/tester/profile"
        title="Setup your Android device & profile"
        className="hidden sm:flex flex-col items-end text-right select-none group hover:opacity-85 transition-opacity"
      >
        <span className="text-[13px] font-bold text-slate-900 group-hover:text-[#4F46E5] leading-tight tracking-tight transition-colors">
          Android Device
        </span>
        <span className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-amber-600 leading-tight mt-0.5">
          <span>+ Add Device</span>
          <span className="inline-block size-1.5 rounded-full bg-amber-500" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/tester/profile"
      title="Manage device & profile"
      className="hidden sm:flex flex-col items-end text-right select-none group hover:opacity-85 transition-opacity"
    >
      <span className="text-[13px] font-bold text-slate-900 group-hover:text-[#4F46E5] leading-tight tracking-tight transition-colors">
        {device.model}
      </span>
      <span className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
        <span>{device.androidVersion || "Android"}</span>
        <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
      </span>
    </Link>
  );
}
