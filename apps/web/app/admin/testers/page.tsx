import { UsersRound } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { TesterStatusButton } from "@/components/admin/TesterStatusButton";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface AdminTesterRow {
  _id: string;
  status: string;
  walletBalance: number;
  ratingAvg: number;
  ratingCount: number;
  devices: Array<{ platform?: string; model: string; osVersion: string }>;
  upi: { vpa?: string };
  userId?: { name?: string; email?: string; status?: string };
}

export default async function AdminTestersPage() {
  let testers: AdminTesterRow[] = [];
  try {
    const data = await serverApi<{ testers: AdminTesterRow[] }>("/testers");
    testers = data.testers;
  } catch {
    testers = [];
  }

  if (testers.length === 0) {
    return (
      <EmptySection
        icon={UsersRound}
        title="No testers yet"
        body="Testers appear after onboarding. Their devices, UPI handles, ratings, and workload show up here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-black/5 text-[12px] uppercase tracking-[0.08em] text-ink-400">
            <th className="px-6 py-4 font-semibold">Tester</th>
            <th className="px-6 py-4 font-semibold">Devices</th>
            <th className="px-6 py-4 font-semibold">UPI</th>
            <th className="px-6 py-4 font-semibold">Wallet</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {testers.map((t) => (
            <tr key={t._id} className="border-b border-black/5 last:border-0">
              <td className="px-6 py-4">
                <span className="font-medium text-ink-950">
                  {t.userId?.name || "—"}
                </span>
                <span className="block text-[12.5px] text-ink-400">
                  {t.userId?.email}
                </span>
              </td>
              <td className="px-6 py-4 text-[13px] text-ink-600">
                {t.devices.length
                  ? t.devices
                      .map(
                        (d) =>
                          `${d.model} (${d.platform === "ios" ? "iOS" : "Android"} ${d.osVersion})`,
                      )
                      .join(", ")
                  : "—"}
              </td>
              <td className="px-6 py-4 font-mono text-[12.5px] text-ink-600">
                {t.upi?.vpa ?? "—"}
              </td>
              <td className="px-6 py-4 font-semibold text-ink-950">
                {formatINR(t.walletBalance)}
              </td>
              <td className="px-6 py-4">
                <StatusPill status={t.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <TesterStatusButton testerId={t._id} status={t.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
