import { serverApi } from "@/lib/server-api";
import { StatCard } from "@/components/dash/EmptySection";

export const dynamic = "force-dynamic";

interface Summary {
  users: Record<string, number>;
  projects: Record<string, number>;
  pendingProofs: number;
  openBugs: number;
  pendingWithdrawals: number;
  pendingInvoices: number;
}

export default async function AdminOverview() {
  let summary: Summary | null = null;
  try {
    summary = await serverApi<Summary>("/admin/summary");
  } catch {
    summary = null;
  }

  const s = summary ?? {
    users: {},
    projects: {},
    pendingProofs: 0,
    openBugs: 0,
    pendingWithdrawals: 0,
    pendingInvoices: 0,
  };
  const activeProjects =
    (s.projects.active ?? 0) + (s.projects.in_progress ?? 0);

  return (
    <div className="space-y-8">
      <div className="rounded-[24px] bg-navy-900 p-8 text-white md:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-lime-300">
          Admin console
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight">
          The control surface.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Everything that used to live in WhatsApp and spreadsheets lives here:
          verification, replacements, bug merges, payouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active projects" value={String(activeProjects)} />
        <StatCard
          label="Testers"
          value={String(s.users.tester ?? 0)}
          hint={`${s.users.client ?? 0} clients`}
        />
        <StatCard
          label="Proofs awaiting review"
          value={String(s.pendingProofs)}
          hint="Verification queue"
        />
        <StatCard label="Open bug reports" value={String(s.openBugs)} />
        <StatCard
          label="Pending withdrawals"
          value={String(s.pendingWithdrawals)}
          hint="48h payout SLA"
        />
        <StatCard
          label="Pending invoices"
          value={String(s.pendingInvoices)}
          hint="Manual mark-paid available"
        />
      </div>
    </div>
  );
}
