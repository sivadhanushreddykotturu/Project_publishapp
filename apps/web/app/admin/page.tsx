import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { StatCard } from "@/components/dash/EmptySection";

export const dynamic = "force-dynamic";

// Real backend shape from GET /metrics/admin-dashboard
interface AdminDashboardSummary {
  projects: { total: number; active: number };
  testers: { total: number; active: number; inactive: number };
  assignments: { total: number; active: number; queued: number; completed: number };
  bugs: { total: number; published: number; resolvedToday: number };
  payouts: { paidTotal: number; pending: number };
  replacementsToday: number;
  successRate: number;
}

export default async function AdminOverview() {
  let summary: AdminDashboardSummary | null = null;
  try {
    summary = await serverApi<AdminDashboardSummary>("/metrics/admin-dashboard");
  } catch {
    summary = null;
  }

  // Map backend AdminDashboardSummary to display values
  const activeProjects = summary?.projects.active ?? 0;
  const totalTesters = summary?.testers.total ?? 0;
  const activeTesters = summary?.testers.active ?? 0;
  const pendingProofs = summary?.assignments.queued ?? 0;
  const openBugs = summary?.bugs.total ?? 0;
  const pendingWithdrawals = summary?.payouts.pending ?? 0;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-[24px] bg-navy-900 p-8 text-white md:p-10 shadow-sm">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-lime-300">
          Admin console
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight">
          The control surface.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Oversee testing cycles, review and publish client projects, track real-time Android tester progress, and approve payouts.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-2.5 text-[13.5px] font-bold text-navy-950 hover:bg-lime-400 transition-colors"
          >
            Manage Projects <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/admin/testers"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-white/15 transition-colors"
          >
            View Testers
          </Link>
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-white/15 transition-colors"
          >
            View Clients
          </Link>
        </div>
      </div>

      {/* Grid of Clickable Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/projects" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Active projects" value={String(activeProjects)} hint="View project list" />
        </Link>
        <Link href="/admin/testers" className="block transition-transform hover:scale-[1.01]">
          <StatCard
            label="Testers"
            value={String(totalTesters)}
            hint={`${activeTesters} active`}
          />
        </Link>
        <Link href="/admin/verification" className="block transition-transform hover:scale-[1.01]">
          <StatCard
            label="Queued assignments"
            value={String(pendingProofs)}
            hint="Verification queue"
          />
        </Link>
        <Link href="/admin/bugs" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Open bug reports" value={String(openBugs)} hint="QA bug triage" />
        </Link>
        <Link href="/admin/wallets" className="block transition-transform hover:scale-[1.01]">
          <StatCard
            label="Pending withdrawals"
            value={String(pendingWithdrawals)}
            hint="48h payout SLA"
          />
        </Link>
        <Link href="/admin/invoices" className="block transition-transform hover:scale-[1.01]">
          <StatCard
            label="Success rate"
            value={`${summary?.successRate ?? 0}%`}
            hint="Projects completed successfully"
          />
        </Link>
      </div>
    </div>
  );

}
