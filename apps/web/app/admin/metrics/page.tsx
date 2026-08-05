import { Gauge } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection, StatCard } from "@/components/dash/EmptySection";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Metrics {
  paymentToPublish: {
    samples: number;
    avgMinutes: number | null;
    withinFiveMinutes: number;
  };
  events: Record<string, number>;
  payouts: { totalPaise: number; count: number };
  recentEvents: Array<{ _id: string; type: string; at: string; meta: unknown }>;
}

export default async function AdminMetricsPage() {
  let m: Metrics | null = null;
  try {
    m = await serverApi<Metrics>("/admin/metrics");
  } catch {
    m = null;
  }

  if (!m) {
    return (
      <EmptySection
        icon={Gauge}
        title="Metrics unavailable"
        body="The metrics endpoint didn't answer. Check the API."
      />
    );
  }

  const e = m.events;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-orange-500">
          PRD target
        </p>
        <h3 className="mt-1 text-[22px] font-semibold tracking-tight text-ink-950">
          Payment → opportunity live in under 5 minutes
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Avg time to publish"
          value={m.paymentToPublish.avgMinutes != null ? `${m.paymentToPublish.avgMinutes.toFixed(1)} min` : "—"}
          hint={`${m.paymentToPublish.samples} projects measured`}
        />
        <StatCard
          label="Within 5 minutes"
          value={`${m.paymentToPublish.withinFiveMinutes}/${m.paymentToPublish.samples}`}
          hint="PRD success target"
        />
        <StatCard
          label="Payouts completed"
          value={formatINR(m.payouts.totalPaise)}
          hint={`${m.payouts.count} withdrawals paid`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Testers joined" value={String(e.tester_joined ?? 0)} />
        <StatCard label="Slots filled" value={String(e.slots_filled ?? 0)} />
        <StatCard label="Replacements" value={String(e.tester_replaced ?? 0)} />
        <StatCard label="Steps verified" value={String(e.step_verified ?? 0)} />
        <StatCard label="Link clicks" value={String(e.testing_link_clicked ?? 0)} />
        <StatCard label="Bugs filed" value={String(e.bug_submitted ?? 0)} />
        <StatCard label="Bugs published" value={String(e.bug_published ?? 0)} />
        <StatCard label="Projects completed" value={String(e.project_completed ?? 0)} />
      </div>

      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <h3 className="mb-4 text-[16px] font-semibold text-ink-950">Live event feed</h3>
        {m.recentEvents.length === 0 ? (
          <p className="text-[14px] text-ink-500">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {m.recentEvents.map((ev) => (
              <div
                key={ev._id}
                className="flex items-center justify-between rounded-xl bg-paper px-4 py-2.5 text-[13px]"
              >
                <span className="font-mono font-medium text-ink-800">{ev.type}</span>
                <span className="text-ink-400">
                  {new Date(ev.at).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
