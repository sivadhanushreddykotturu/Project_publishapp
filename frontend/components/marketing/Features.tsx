import Link from "next/link";
import {
  Smartphone,
  ClipboardList,
  Users,
  FileCheck2,
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

function UxosHeaderLogoIcon({ className = "size-6" }: { className?: string; strokeWidth?: number }) {
  return (
    <img
      src="/launchops-logo.png"
      alt="UXOS Logo"
      className={`${className} object-contain`}
    />
  );
}

function GooglePlayStoreIcon({ className = "size-5.5" }: { className?: string; strokeWidth?: number }) {
  return (
    <img
      src="/google-play-store-logo.svg"
      alt="Google Play"
      className={`${className} object-contain`}
    />
  );
}

function AppleBlackLogoIcon({ className = "size-5" }: { className?: string; strokeWidth?: number }) {
  return (
    <img
      src="/apple-black-logo.svg"
      alt="Apple"
      className={`${className} object-contain`}
    />
  );
}

const services = [
  {
    icon: UxosHeaderLogoIcon,
    iconBg: "bg-purple-100 text-purple-700",
    title: "UX Testing",
    badge: "Only Android",
    desc: "14 testers on physical Android devices. Comprehensive usability, onboarding, and flow friction analysis with video evidence. Full closed testing cycle included! No extra testers will be added.",
    price: "₹5,000",
    cta: "Start UX Testing",
    href: "/auth/client",
  },
  {
    icon: GooglePlayStoreIcon,
    iconBg: "bg-indigo-50 text-indigo-700",
    title: "Play Store Closed Testing",
    badge: "Android",
    desc: "14-day Google Play closed testing with verified physical Android devices. Real opted-in testers, daily check-ins, automated free tester replacement, and completion reports.",
    price: "₹2,999",
    cta: "Start Play Testing",
    href: "/auth/client",
  },
  {
    icon: AppleBlackLogoIcon,
    iconBg: "bg-slate-100 text-slate-800",
    title: "Apple Connect Setup",
    badge: "Setup Only",
    desc: "Complete App Store Connect & Apple Developer setup: App ID, certificates, provisioning profiles, and TestFlight internal/external beta group creation.",
    price: "₹2,499",
    cta: "Get Apple Setup",
    href: "/auth/client",
  },
  {
    icon: AppleBlackLogoIcon,
    iconBg: "bg-amber-100 text-amber-800",
    title: "iOS App Testing",
    badge: "Coming Soon",
    desc: "Physical iPhone & iPad testing community with automated TestFlight tester management, crash diagnostics, and usability feedback.",
    price: "Coming Soon",
    cta: "Coming Soon",
    href: "#pricing",
    isComingSoon: true,
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
                className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid size-11 place-items-center rounded-2xl ${s.iconBg} shadow-xs`}
                    >
                      <s.icon className="size-5" strokeWidth={1.8} />
                    </span>
                    {s.badge && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        s.isComingSoon 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : s.badge === 'Only Android'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-indigo-50 text-[#4F37FE] border-indigo-100'
                      }`}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-[18px] font-bold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500 font-medium">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[12px] font-semibold text-slate-400">
                    {s.isComingSoon ? "Availability" : "Price"}
                  </p>
                  <p className="text-[20px] font-black text-slate-900">
                    {s.price}
                  </p>

                  {s.isComingSoon ? (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-[13.5px] font-semibold text-slate-400 select-none">
                      <span>Coming Soon</span>
                    </div>
                  ) : (
                    <Link
                      href={s.href}
                      className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#4F37FE] hover:bg-[#432ee0] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-sm transition-all"
                    >
                      <span>{s.cta}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
