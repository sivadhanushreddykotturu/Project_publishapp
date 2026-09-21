"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ArrowRight, ShieldCheck, Minus, Plus } from "lucide-react";
import { formatINR } from "@/lib/format";

const MIN_TESTERS = 14;
const MAX_TESTERS = 25;
const BASE_PRICE_PAISE = 2_999_00; // base price for 14 testers
const PRICE_PER_EXTRA_TESTER_PAISE = 100_00; // ₹100 per extra tester (in paise)

export function Pricing() {
  const [testerCount, setTesterCount] = useState(MIN_TESTERS);

  const extraTesters = testerCount - MIN_TESTERS;
  const totalPaise = BASE_PRICE_PAISE + extraTesters * PRICE_PER_EXTRA_TESTER_PAISE;

  const features = [
    `${testerCount} real testers on physical Android devices`,
    "Google Play closed testing 14-day compliance",
    "Daily check-in & engagement tracking",
    "Inactive testers automatically replaced free",
    "Verified screenshot proof for every day",
    "Ready-to-submit Play Console completion report",
  ];

  function decrement() {
    setTesterCount((c) => Math.max(MIN_TESTERS, c - 1));
  }

  function increment() {
    setTesterCount((c) => Math.min(MAX_TESTERS, c + 1));
  }

  return (
    <section id="pricing" className="overflow-x-clip bg-paper py-24">
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

        {/* Pricing Card Container */}
        <div className="relative mt-14">
          {/* Floating Android Mascot pointing at the price */}
          <div className="pointer-events-none absolute right-2 top-2 z-20 hidden md:block">
            <img
              src="/android-pointing.gif"
              alt="Android pointing at price"
              className="h-[210px] w-[210px] object-contain drop-shadow-xl"
            />
          </div>

          {/* Pricing Card */}
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-black/8 bg-white p-8 shadow-xl shadow-ink-950/5 md:p-12">
            <div className="flex flex-col items-start justify-between gap-6 pb-6 md:flex-row md:items-center">
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
                14-day cycle · {testerCount} verified opted-in testers
              </p>
            </div>

            {/* Price display */}
            <div className="text-left md:text-right md:pr-[175px]">
              <div className="flex items-baseline gap-2 md:justify-end">
                <span className="text-[44px] font-bold tracking-tight text-ink-950">
                  {formatINR(totalPaise)}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium text-ink-500">
                one-time payment per app · incl. 18% GST
              </p>
            </div>
          </div>

          {/* Tester count toggle */}
          <div className="mt-8 flex items-center justify-between rounded-2xl bg-paper px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold text-ink-950">Number of testers</p>
              <p className="mt-0.5 text-[13px] text-ink-400">
                Min 14 · Max 25 · +{formatINR(PRICE_PER_EXTRA_TESTER_PAISE)} per extra tester
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrement}
                disabled={testerCount <= MIN_TESTERS}
                aria-label="Decrease tester count"
                className="grid size-9 place-items-center rounded-full border border-black/10 text-ink-950 transition-colors hover:bg-ink-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span className="w-8 text-center text-[20px] font-bold tabular-nums text-ink-950">
                {testerCount}
              </span>
              <button
                onClick={increment}
                disabled={testerCount >= MAX_TESTERS}
                aria-label="Increase tester count"
                className="grid size-9 place-items-center rounded-full border border-black/10 text-ink-950 transition-colors hover:bg-ink-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Features */}
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

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/8 pt-8 sm:flex-row">
            <div className="flex items-center gap-2 text-[13.5px] text-ink-500">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Full compliance guarantee · Real physical devices</span>
            </div>

            <Link
              href={`/sign-up?role=client&package=closed_testing_standard&testers=${testerCount}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-8 py-4 text-[15.5px] font-semibold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.99] sm:w-auto"
            >
              Start Your Closed Test
              <ArrowRight className="size-4" />
            </Link>
          </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[13.5px] text-ink-500">
          GST included · Instant setup · No recurring subscriptions
        </p>
      </div>
    </section>
  );
}
