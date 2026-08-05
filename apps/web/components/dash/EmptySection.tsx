import type { LucideIcon } from "lucide-react";

/** Empty states are invitations to act, not dead ends. */
export function EmptySection({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-black/5 bg-white px-8 py-16 text-center shadow-sm">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-paper text-ink-500">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <h2 className="text-[19px] font-semibold tracking-tight text-ink-950">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-500">
        {body}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </p>
      <p className="mt-2.5 text-[32px] font-semibold tracking-tight text-ink-950">
        {value}
      </p>
      {hint && <p className="mt-1 text-[13px] text-ink-500">{hint}</p>}
    </div>
  );
}
