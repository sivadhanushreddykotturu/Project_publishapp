import Link from "next/link";
import {
  Smartphone,
  ClipboardList,
  Users,
  FileCheck2,
  Apple,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Submit and define what to test",
    desc: "Share your app, build, or website, plus the flows, features, target users, and devices that matter.",
  },
  {
    num: "02",
    icon: Users,
    title: "We assign testers and testing begins",
    desc: "Relevant testers from our community follow your requested flows and explore the experience.",
  },
  {
    num: "03",
    icon: FileCheck2,
    title: "Get a consolidated report",
    desc: "Issues, usability concerns, and bugs with screenshots and observations, so you know what needs attention.",
  },
  {
    num: "04",
    icon: Smartphone,
    title: "Fix and retest",
    desc: "Make improvements and run another testing cycle when required.",
  },
];

const services = [
  {
    icon: Sparkles,
    iconBg: "bg-orange-100",
    title: "UX Testing",
    desc: "Real testers go through your defined flows: navigation, onboarding, usability, and friction. You get a consolidated report with evidence and recommendations.",
    price: "₹5,000",
    cta: "Start UX Testing",
  },
  {
    icon: Smartphone,
    iconBg: "bg-lime-300",
    title: "Google Play Closed Testing",
    desc: "An active tester community for your required closed-testing period: recruitment, distribution, coordination, and support.",
    price: "₹3,000",
    cta: "Start Play Store Testing",
  },
  {
    icon: FileCheck2,
    iconBg: "bg-blue-100",
    title: "Play Store Testing + Management",
    desc: "For teams that want more than testers: closed testing, coordination, and Play Store release-related assistance.",
    price: "₹5,000",
    cta: "Get Started",
  },
  {
    icon: Apple,
    iconBg: "bg-blue-100",
    title: "iOS / App Store Testing",
    desc: "Test your iOS application with real testers before releasing it publicly. Recruitment, coordination, and feedback collection.",
    price: "₹3,000",
    cta: "Start iOS Testing",
  },
];

export function Features() {
  return (
    <section id="how-it-works" className="relative bg-paper py-28 ">
      <div className="mx-auto max-w-6xl px-6">
        {/* header */}
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            How it works
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
            From app to actionable feedback.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-ink-600">
            Build → Test → Improve → Retest → Launch.
          </p>
        </div>

        {/* bento: left timeline + right steps */}
        <div className="mt-16 grid gap-6 md:grid-cols-[1.1fr_1fr]">
          {/* ── left: animated timeline card ── */}
          <div className="flex flex-col justify-between rounded-panel border border-black/5 bg-white p-8 shadow-card md:p-10">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                Example · Play Store 14-day cycle
              </p>
              <h3 className="mt-3 text-[22px] font-bold text-ink-950">
                Every day counts.
              </h3>
              <p className="mt-2 text-[14px] text-ink-500">
                Daily engagement is tracked and verified — so you have iron-clad
                proof when you apply for production.
              </p>
            </div>

            {/* timeline bar */}
            <div className="mt-10">
              {[
                { day: "Day 1", event: "Testers opt in & install", done: true },
                {
                  day: "Day 3",
                  event: "First engagement proofs submitted",
                  done: true,
                },
                {
                  day: "Day 7",
                  event: "Mid-cycle check — all testers active",
                  done: true,
                },
                { day: "Day 14", event: "Final proof & payout released", done: false },
              ].map((item, i, arr) => (
                <div key={item.day} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-[11px] font-bold ${
                        item.done
                          ? "bg-lime-300 text-ink-950"
                          : "border-2 border-dashed border-ink-300 bg-white text-ink-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {i < arr.length - 1 && (
                      <div
                        className={`my-1 w-0.5 flex-1 rounded-full ${
                          item.done ? "bg-lime-300" : "bg-ink-100"
                        }`}
                        style={{ height: 28 }}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-[12px] font-semibold text-orange-500">
                      {item.day}
                    </p>
                    <p className="text-[14px] font-medium text-ink-800">
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── right: 3 step cards stacked ── */}
          <div className="flex flex-col gap-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-5 rounded-card border border-black/5 bg-white p-6 shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream-100 text-ink-950">
                  <step.icon className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <span className="font-mono text-[11px] font-semibold text-ink-300">
                    {step.num}
                  </span>
                  <h3 className="mt-0.5 text-[17px] font-semibold text-ink-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* services */}
        <div id="services" className="mt-24">
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
              Services
            </p>
            <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
              Everything you need before your app goes live.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] text-ink-600">
              Choose the testing service based on where your product is in its
              launch journey.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="flex flex-col rounded-card border border-black/5 bg-white p-6 shadow-card transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${s.iconBg} text-ink-950`}
                >
                  <s.icon className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 text-[17px] font-bold text-ink-950">
                  {s.title}
                </h3>
                <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-ink-500">
                  {s.desc}
                </p>
                <p className="mt-5 text-[13px] text-ink-500">
                  Starting from{" "}
                  <span className="text-[18px] font-bold text-ink-950">
                    {s.price}
                  </span>
                </p>
                <Link
                  href="/auth/client"
                  className="btn btn-secondary mt-4 px-4 py-2.5 text-[14px]"
                >
                  {s.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
