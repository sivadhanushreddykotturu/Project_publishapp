"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";

interface Device {
  platform: string;
  model: string;
  osVersion: string;
}

export function TesterDeviceBadge() {
  const { getToken } = useAuth();
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDevice() {
      try {
        const token = await getToken();
        const data = await api<{
          tester: { devices?: Device[] };
        }>("/testers/me", { token });
        if (mounted && data.tester?.devices && data.tester.devices.length > 0) {
          setDevice(data.tester.devices[0]);
        }
      } catch {
        // best-effort
      }
    }
    loadDevice();
    return () => {
      mounted = false;
    };
  }, [getToken]);

  return (
    <div className="hidden sm:flex flex-col items-end text-right select-none">
      <span className="text-[13px] font-bold text-slate-900 leading-tight tracking-tight">
        {device?.model || "OPPO TX100"}
      </span>
      <span className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
        <span>{device?.platform ? (device.platform === "android" ? "Android" : device.platform) : "Android"}</span>
        <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
      </span>
    </div>
  );
}
