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

  if (!device) return null;

  return (
    <div className="hidden sm:flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[12.5px] shadow-sm">
      <Smartphone className="size-3.5 text-ink-600" />
      <span className="font-semibold text-ink-950">{device.model}</span>
      <span className="text-ink-400">·</span>
      <span className="font-medium text-ink-600 capitalize">{device.platform} {device.osVersion}</span>
    </div>
  );
}
