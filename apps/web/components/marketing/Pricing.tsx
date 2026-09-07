import Link from "next/link";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/format";

export function Pricing() {
  const pricePaise = 2_999_00;
  const originalPricePaise = 3_499_00;

  const features = [
    "14 real testers on physical Android devices",
    "Google Play closed testing 14-day compliance",
    "Daily check-in & engagement tracking",
    "Inactive testers automatically replaced free",
    "Verified screenshot proof for every day",
    "Ready-to-submit Play Console completion report",
  ];

  return (
    <section id="pricing" className="bg-paper py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            Simple Pricing
          </p>
          <h2 className="mt-2 text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-display text-ink-950">
            One payment. Play Store ready.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-ink-600">
            Everything you need to complete your 14-day Google Play closed test requirement.
          </p>
        </div>

        {/* Focused Pricing Card */}
        <div className="mt-14 overflow-hidden rounded-[32px] border border-black/8 bg-white p-8 shadow-xl shadow-ink-950/5 md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 border-b border-black/8 pb-8 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-lime-300 px-3 py-1 text-[12px] font-bold tracking-wide text-ink-950">
                  STANDARD PACKAGE
                </span>
                <span className="text-[13px] font-medium text-ink-500">
                  Android Closed Testing
                </span>
              </div>
              <h3 className="mt-3 text-[28px] font-bold text-ink-950">
                Play Store Closed Testing
              </h3>
              <p className="mt-1 text-[15px] text-ink-500">
                14-day cycle · 14 verified opted-in testers
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-[44px] font-bold tracking-tight text-ink-950">
                  {formatINR(pricePaise)}
                </span>
                <span className="text-[18px] text-ink-400 line-through">
                  {formatINR(originalPricePaise)}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink-400">one-time payment per app</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime-200 text-ink-950">
                  <Check className="size-3.5" strokeWidth={2.6} />
                </span>
                <span className="text-[15px] font-medium text-ink-800">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/8 pt-8 sm:flex-row">
            <div className="flex items-center gap-2 text-[13.5px] text-ink-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Full compliance guarantee · Real physical devices</span>
            </div>

            <Link
              href="/sign-up?role=client&package=closed_testing_standard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-8 py-4 text-[15.5px] font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              Start Your Closed Test
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-[13.5px] text-ink-500">
          GST included · Instant setup · No recurring subscriptions
        </p>
      </div>
    </section>
  );
}
