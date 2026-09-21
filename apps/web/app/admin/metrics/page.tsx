import { Gauge } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection, StatCard } from "@/components/dash/EmptySection";

export const dynamic = "force-dynamic";

// Backend AdminDashboardSummary from GET /metrics/admin-dashboard
interface Metrics {
  projects: { total: number; active: number };
  testers: { total: number; active: number; inactive: number };
  assignments: { total: number; active: number; queued: number; completed: number };
  bugs: { total: number; published: number; resolvedToday: number };
  payouts: { paidTotal: number; pending: number };
  replacementsToday: number;
  successRate: number;
  system: { status: string; serverTime: string; uptimeSeconds: number };
  inactivityThresholdHours: number;
}

export default async function AdminMetricsPage() {
  let m: Metrics | null = null;
  try {
    m = await serverApi<Metrics>("/metrics/admin-dashboard");
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-orange-500">
          Platform metrics
        </p>
        <h3 className="mt-1 text-[22px] font-semibold tracking-tight text-ink-950">
          Live LaunchOps Dashboard
        </h3>
        {m.system && (
          <p className="mt-1 text-[13px] text-ink-400">
            Server {m.system.status} · uptime {Math.round(m.system.uptimeSeconds / 3600)}h · {new Date(m.system.serverTime).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active projects"
          value={String(m.projects.active)}
          hint={`${m.projects.total} total`}
        />
        <StatCard
          label="Active testers"
          value={String(m.testers.active)}
          hint={`${m.testers.total} registered`}
        />
        <StatCard
          label="Success rate"
          value={`${m.successRate}%`}
          hint="Projects completed"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total assignments" value={String(m.assignments.total)} />
        <StatCard label="Active assignments" value={String(m.assignments.active)} />
        <StatCard label="Queued assignments" value={String(m.assignments.queued)} hint="Waiting for slot" />
        <StatCard label="Completed" value={String(m.assignments.completed)} />
        <StatCard label="Total bugs" value={String(m.bugs.total)} />
        <StatCard label="Published bugs" value={String(m.bugs.published)} />
        <StatCard label="Replacements today" value={String(m.replacementsToday)} />
        <StatCard label="Pending payouts" value={String(m.payouts.pending)} hint={`₹${(m.payouts.paidTotal / 100).toFixed(0)} paid`} />
      </div>
    </div>
  );

}
