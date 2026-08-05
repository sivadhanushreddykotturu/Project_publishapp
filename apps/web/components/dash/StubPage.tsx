import type { LucideIcon } from "lucide-react";
import { EmptySection } from "./EmptySection";

/** Interim page state while its phase is being built. */
export function StubPage({
  icon,
  title,
  body,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <span className="inline-block rounded-full bg-lime-300 px-3.5 py-1 text-[12px] font-bold text-ink-800">
        {phase}
      </span>
      <EmptySection icon={icon} title={title} body={body} />
    </div>
  );
}
