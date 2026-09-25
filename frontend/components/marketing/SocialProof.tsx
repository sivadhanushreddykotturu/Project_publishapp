import { Users, Layers, Briefcase, Handshake, ExternalLink } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "400+",
    label: "Community Members",
    sub: "Testers on real devices",
    color: "bg-[#a7f3d0]",
    link: "https://chat.whatsapp.com/Il76kyPsNg684F2ITanNRY",
    badge: "Join WhatsApp ↗",
  },
  {
    icon: Briefcase,
    value: "16+",
    label: "Paying Customers",
    sub: "Teams already testing with us",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: Layers,
    value: "Multiple",
    label: "Applications Tested",
    sub: "Tested before launch",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: Handshake,
    value: "2+",
    label: "Agency Relationships",
    sub: "Studios using us as a testing partner",
    color: "bg-purple-100 text-purple-700",
  },
];

export function SocialProof() {
  return (
    <section className="border-y border-slate-200/80 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#4F37FE]">
            Traction
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold tracking-tight text-slate-900">
            Already testing real products.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-slate-600 font-medium">
            Our community is already being used to test applications before
            launch.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => {
            const content = (
              <>
                <div className="flex items-center justify-between">
                  <span
                    className={`grid size-12 place-items-center rounded-2xl ${s.color} text-slate-950 shadow-xs`}
                  >
                    <s.icon className="size-6" strokeWidth={1.8} />
                  </span>
                  {s.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 group-hover:bg-emerald-100 transition-colors">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="mt-6 text-[clamp(2.2rem,4vw,2.9rem)] font-black tracking-tight text-slate-900">
                  {s.value}
                </p>
                <p className="mt-1 text-[17px] font-bold text-slate-900">
                  {s.label}
                </p>
                <p className="mt-1 text-[13.5px] font-medium text-slate-500">{s.sub}</p>
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full ${s.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
                />
              </>
            );

            if (s.link) {
              return (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-400 hover:scale-[1.02] cursor-pointer block"
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
