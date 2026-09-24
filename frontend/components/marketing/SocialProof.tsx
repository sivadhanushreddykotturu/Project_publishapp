import { Users, Layers, Briefcase, Handshake } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "400+",
    label: "Community Members",
    sub: "Testers on real devices",
    color: "bg-lime-300",
  },
  {
    icon: Briefcase,
    value: "16+",
    label: "Paying Customers",
    sub: "Teams already testing with us",
    color: "bg-orange-100",
  },
  {
    icon: Layers,
    value: "Multiple",
    label: "Applications Tested",
    sub: "Tested before launch",
    color: "bg-blue-100",
  },
  {
    icon: Handshake,
    value: "2+",
    label: "Agency Relationships",
    sub: "Studios using us as a testing partner",
    color: "bg-lime-200",
  },
];

export function SocialProof() {
  return (
    <section className="border-y border-black/5 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            Traction
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
            Already testing real products.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-ink-600">
            Our community is already being used to test applications before
            launch.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-panel border border-black/5 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span
                className={`grid size-11 place-items-center rounded-2xl ${s.color} text-ink-950`}
              >
                <s.icon className="size-5" strokeWidth={1.8} />
              </span>
              <p className="mt-6 text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tight text-ink-950">
                {s.value}
              </p>
              <p className="mt-1 text-[17px] font-semibold text-ink-950">
                {s.label}
              </p>
              <p className="mt-1 text-[13.5px] text-ink-500">{s.sub}</p>
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full ${s.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
