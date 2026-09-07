import {
  Smartphone,
  CalendarCheck,
  FileCheck2,
  CheckCircle2,
  Apple,
  Sparkles,
} from "lucide-react";

export function Features() {
  const steps = [
    {
      num: "01",
      icon: Smartphone,
      title: "Add your app details",
      desc: "Paste your Google Play closed test opt-in link and tell us about your app. Takes under two minutes.",
    },
    {
      num: "02",
      icon: CalendarCheck,
      title: "14 real testers engage daily",
      desc: "Real Android testers install and use your app daily for 14 continuous days. Inactive testers are automatically replaced.",
    },
    {
      num: "03",
      icon: FileCheck2,
      title: "Apply for production",
      desc: "Get your complete 14-day engagement timeline, screenshot proofs, and bug reports ready for Play Console review.",
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-paper py-24 scroll-mt-12">
      <div id="features" className="absolute -top-12" />
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            Simple Process
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
            How closed testing works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-ink-600">
            We handle the entire 14-day cycle so you can pass Google Play review and launch your app.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-[28px] border border-black/5 bg-white p-8 shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-cream-100 text-ink-950">
                  <step.icon className="size-6 text-ink-950" strokeWidth={1.75} />
                </span>
                <span className="font-mono text-[22px] font-semibold text-ink-300">
                  {step.num}
                </span>
              </div>
              <h3 className="mt-6 text-[19px] font-semibold text-ink-950">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Services Overview Banner */}
        <div className="mt-20 rounded-[32px] border border-black/5 bg-gradient-to-br from-cream-100/80 via-white to-cream-50 p-8 md:p-12">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-[22px] font-bold text-ink-950">
              Supported Tracks & Services
            </h3>
            <p className="mt-1 text-[14.5px] text-ink-500">
              Clients can apply for production on Android & iOS, or request a UX study. Testers exclusively test on Android physical devices.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Android Closed Testing */}
            <div className="rounded-[22px] border-2 border-ink-950 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-ink-950">
                  <Smartphone className="size-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-800">
                  <CheckCircle2 className="size-3.5" /> Auto-Publish
                </span>
              </div>
              <h4 className="mt-4 text-[18px] font-bold text-ink-950">
                Play Store Closed Testing
              </h4>
              <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
                14 real Android testers for 14 continuous days. Auto-published upon Razorpay payment to meet Google Play criteria.
              </p>
            </div>

            {/* iOS App Testing */}
            <div className="rounded-[22px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-800">
                  <Apple className="size-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-blue-700">
                  Client Track
                </span>
              </div>
              <h4 className="mt-4 text-[18px] font-bold text-ink-950">
                iOS TestFlight Testing
              </h4>
              <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
                Apply for iOS production & TestFlight beta testing. Connect directly with the admin after login to coordinate your release.
              </p>
            </div>

            {/* UX Testing */}
            <div className="rounded-[22px] border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-purple-100 text-purple-800">
                  <Sparkles className="size-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11.5px] font-semibold text-purple-700">
                  Client Track
                </span>
              </div>
              <h4 className="mt-4 text-[18px] font-bold text-ink-950">
                User Experience Testing
              </h4>
              <p className="mt-1.5 text-[13.5px] leading-snug text-ink-500">
                Apply for comprehensive UX & usability studies. Review user friction, recordings, and product feedback with the admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
