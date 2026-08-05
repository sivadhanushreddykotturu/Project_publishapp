const STYLES: Record<string, string> = {
  // project statuses
  draft: "bg-black/5 text-ink-500",
  awaiting_payment: "bg-amber-100 text-amber-800",
  active: "bg-lime-200 text-ink-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-black/5 text-ink-400",
  // invoice statuses
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  manual_paid: "bg-emerald-100 text-emerald-800",
  // join states
  open: "bg-lime-200 text-ink-800",
  full: "bg-orange-100 text-orange-700",
  closed: "bg-black/5 text-ink-500",
  // assignment / proof
  queued: "bg-blue-100 text-blue-800",
  removed: "bg-rose-100 text-rose-700",
  submitted: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
  // bugs
  duplicate: "bg-black/5 text-ink-500",
  merged: "bg-violet-100 text-violet-800",
  published: "bg-emerald-100 text-emerald-800",
  // severity
  low: "bg-black/5 text-ink-500",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-rose-100 text-rose-700",
};

export function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-black/5 text-ink-500";
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold capitalize ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
