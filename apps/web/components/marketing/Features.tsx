import {
  Users,
  CalendarCheck2,
  Bug,
  Merge,
  RefreshCcw,
  Fingerprint,
  Wallet,
  ClipboardCheck,
  MousePointerClick,
  ShieldCheck,
  BellRing,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  badge?: string;
  accent?: boolean;
}

const FEATURES: Feature[] = [
  { icon: Users, title: "14 real testers on real Android devices", accent: true },
  { icon: CalendarCheck2, title: "Daily engagement for the full 14 days" },
  { icon: Bug, title: "Structured bug reports with evidence", accent: true },
  { icon: Merge, title: "Duplicates merged before you see them", badge: "Clean" },
  { icon: RefreshCcw, title: "Inactive testers auto-replaced from the waitlist", badge: "Guaranteed", accent: true },
  { icon: Fingerprint, title: "Device-fingerprint anti-fraud checks" },
  { icon: Wallet, title: "Testers paid by UPI when steps verify", accent: true },
  { icon: ClipboardCheck, title: "Completion report, ready for Play Console", badge: "Included" },
  { icon: MousePointerClick, title: "Per-tester testing links, click tracked" },
  { icon: ShieldCheck, title: "Every proof reviewed by an admin", accent: true },
  { icon: BellRing, title: "Automatic reminders keep testers on pace" },
  { icon: BarChart3, title: "Live metrics across every project" },
];

export function Features() {
  return (
    <section id="features" className="bg-paper py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
          Everything handled
        </p>
        <h2 className="mb-16 max-w-2xl text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.05] tracking-display text-ink-950">
          The whole closed test, run for you
        </h2>

        <div className="grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group">
              <div className="relative mb-5 inline-block">
                <f.icon
                  className="size-11 text-ink-950 transition-transform duration-300 group-hover:-translate-y-1"
                  strokeWidth={1.4}
                />
                {f.accent && (
                  <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-paper bg-blue-500" />
                )}
              </div>
              <p className="max-w-[220px] text-[16.5px] font-medium leading-snug text-ink-950">
                {f.title}
              </p>
              {f.badge && (
                <span className="mt-2.5 inline-block rounded-full bg-lime-300 px-2.5 py-1 text-[11.5px] font-semibold text-ink-800">
                  {f.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
