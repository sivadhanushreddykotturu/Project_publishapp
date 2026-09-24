import { LayoutGrid, Users, FileText, ArrowRight } from "lucide-react";

const PERKS = [
  {
    icon: Users,
    title: "Save internal resources",
    desc: "Skip recruiting and coordinating testers yourself.",
  },
  {
    icon: LayoutGrid,
    title: "Scale testing",
    desc: "Run testing across multiple client applications.",
  },
  {
    icon: FileText,
    title: "One testing partner",
    desc: "Send apps to us whenever a client needs external testing.",
  },
];

export function AgencySection() {
  return (
    <section id="agency" className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-panel border border-black/5 bg-gradient-to-br from-ink-950 via-ink-800 to-navy-900 p-10 md:p-14">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* left copy */}
            <div>
              <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-lime-300">
                For Agencies & Studios
              </span>
              <h2 className="mt-5 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.1] tracking-display text-white">
                Your clients build the product.
                <br />
                We help you validate it.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                Software agency, development company, freelancer, or product
                studio? You don&apos;t need to build your own testing
                community. Use ours.
              </p>

              <a
                href="mailto:support@uxos.in?subject=Agency%20Enquiry"
                id="agency-contact-cta"
                className="group mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[14.5px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Partner with us
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* right perk cards */}
            <div className="flex flex-col gap-4">
              {PERKS.map((p) => (
                <div
                  key={p.title}
                  className="flex items-start gap-4 rounded-card border border-white/8 bg-white/6 p-5 backdrop-blur-sm"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime-300 text-ink-950">
                    <p.icon className="size-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-[13.5px] text-white/70">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
