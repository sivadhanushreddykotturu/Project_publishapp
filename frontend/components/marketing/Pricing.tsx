"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ArrowRight, ShieldCheck, Minus, Plus, Sparkles, AlertCircle } from "lucide-react";
import { formatINR } from "@/lib/format";

const MIN_TESTERS = 14;
const MAX_TESTERS = 25;
const BASE_PRICE_PAISE = 2_999_00; // base price for 14 testers (₹2,999)
const PRICE_PER_EXTRA_TESTER_PAISE = 100_00; // ₹100 per extra tester

export function Pricing() {
  const [testerCount, setTesterCount] = useState(MIN_TESTERS);
  const [selectedPlanTab, setSelectedPlanTab] = useState<'all' | 'android' | 'ux' | 'apple'>('all');

  const extraTesters = testerCount - MIN_TESTERS;
  const totalPaise = BASE_PRICE_PAISE + extraTesters * PRICE_PER_EXTRA_TESTER_PAISE;

  function decrement() {
    setTesterCount((c) => Math.max(MIN_TESTERS, c - 1));
  }

  function increment() {
    setTesterCount((c) => Math.min(MAX_TESTERS, c + 1));
  }

  return (
    <section id="pricing" className="overflow-x-clip bg-[#F6F7FB] py-28 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#4F37FE]">
            Transparent Pricing
          </p>
          <h2 className="mt-2 text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold tracking-tight text-slate-900">
            Simple testing. Clear pricing.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-slate-600 font-medium">
            Everything you need to test, fix, and launch on Google Play & the App Store with complete confidence.
          </p>
        </div>

        {/* 3 Main Pricing Cards Grid */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 items-stretch">
          
          {/* 1. Android Closed Testing */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-bold tracking-wide text-[#4F37FE]">
                  ANDROID ESSENTIAL
                </span>
                <span className="flex items-center text-[12px] font-semibold text-slate-500">
                  <img
                    src="/android-5-logo.svg"
                    alt="Android"
                    className="h-3.5 w-auto object-contain"
                  />
                </span>
              </div>

              <h3 className="mt-4 text-[24px] font-extrabold text-slate-900">
                Play Store Closed Testing
              </h3>
              <p className="mt-1 text-[14px] text-slate-500 font-medium">
                14-day cycle with real opted-in testers to pass Google Play review.
              </p>

              {/* Price display */}
              <div className="mt-6 border-y border-slate-100 py-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black tracking-tight text-slate-900">
                    {formatINR(totalPaise)}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ app</span>
                </div>
                <p className="mt-1 text-[12.5px] font-medium text-slate-400">
                  One-time payment · 18% GST included
                </p>

                {/* Tester counter control */}
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/70 p-3">
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">Testers: {testerCount}</p>
                    <p className="text-[11px] text-slate-500">+₹100/extra tester</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={decrement}
                      disabled={testerCount <= MIN_TESTERS}
                      aria-label="Decrease tester count"
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="size-3.5" strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-slate-900">
                      {testerCount}
                    </span>
                    <button
                      onClick={increment}
                      disabled={testerCount >= MAX_TESTERS}
                      aria-label="Increase tester count"
                      className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-800 transition hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="size-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-3.5">
                {[
                  `${testerCount} real testers on physical Android devices`,
                  "Google Play closed testing 14-day compliance",
                  "Daily check-in & engagement tracking",
                  "Inactive testers automatically replaced free",
                  "Verified screenshot proof for every day",
                  "Ready-to-submit Play Console completion report",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 mt-0.5 border border-emerald-200">
                      <Check className="size-3" strokeWidth={2.6} />
                    </span>
                    <span className="text-[13.5px] font-medium text-slate-700">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/auth/client"
                className="w-full bg-[#4F37FE] hover:bg-[#432ee0] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                <span>Start Testing</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* 2. UX Testing (ONLY ANDROID) - RECOMMENDED */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#4F37FE] bg-white p-8 shadow-xl shadow-indigo-500/10 hover:shadow-2xl transition-all duration-300">
            {/* Top pill badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#4F37FE] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                <Sparkles className="size-3 text-amber-300" />
                <span>Recommended</span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-extrabold tracking-wide text-purple-700">
                  UX & QA STUDY
                </span>
                <span className="whitespace-nowrap rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  Only Android
                </span>
              </div>

              <h3 className="mt-4 text-[24px] font-extrabold text-slate-900">
                User Experience (UX) Testing
              </h3>
              <p className="mt-1 text-[14px] text-slate-500 font-medium">
                In-depth usability review, flow friction analysis, and detailed QA bug reports.
              </p>

              {/* Price display */}
              <div className="mt-6 border-y border-slate-100 py-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black tracking-tight text-slate-900">
                    ₹5,000
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ 14 testers</span>
                </div>
                <p className="mt-1 text-[12.5px] font-medium text-slate-400">
                  One-time payment · 14 verified testers included
                </p>

                {/* Important notice badge */}
                <div className="mt-4 rounded-xl bg-amber-50/80 border border-amber-200/90 p-3 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-bold text-amber-900 leading-tight">
                      No extra testers will be added. If needed contact us.
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800/80 pl-6">
                    Full closed testing 14-day cycle is already included in this service!
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-3.5">
                {[
                  "14 Real testers on physical Android devices (Only Android)",
                  "Complete 14-day closed testing coverage included",
                  "Usability analysis: onboarding, navigation & checkout friction",
                  "Consolidated QA & UX report with screenshots and video logs",
                  "Actionable design & workflow improvement suggestions",
                  "Dedicated coordinator & direct WhatsApp communication",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#4F37FE]/10 text-[#4F37FE] mt-0.5 border border-[#4F37FE]/20">
                      <Check className="size-3" strokeWidth={2.6} />
                    </span>
                    <span className="text-[13.5px] font-semibold text-slate-800">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/auth/client"
                className="w-full bg-[#4F37FE] hover:bg-[#432ee0] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01]"
              >
                <span>Start UX Testing</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* 3. Apple Connect Setup */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold tracking-wide text-slate-800">
                  APPLE SERVICES
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                  <img
                    src="/apple-black-logo.svg"
                    alt="Apple"
                    className="size-3.5 object-contain"
                  />
                  iOS / macOS
                </span>
              </div>

              <h3 className="mt-4 text-[24px] font-extrabold text-slate-900">
                Apple Connect Setup
              </h3>
              <p className="mt-1 text-[14px] text-slate-500 font-medium">
                Complete App Store Connect & developer account setup done for you.
              </p>

              {/* Price display */}
              <div className="mt-6 border-y border-slate-100 py-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[40px] font-black tracking-tight text-slate-900">
                    ₹2,499
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ app</span>
                </div>
                <p className="mt-1 text-[12.5px] font-medium text-slate-400">
                  One-time setup fee · 18% GST included
                </p>

                {/* Service scope note */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-left">
                  <p className="text-[12px] font-bold text-slate-800">
                    Only Apple Connect Setup
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Full setup assistance for certificates, identifiers, and TestFlight configuration.
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-3.5">
                {[
                  "Apple Developer & App Store Connect account onboarding",
                  "App ID, bundle identifier, & capabilities configuration",
                  "Certificates, signing keys & provisioning profiles setup",
                  "TestFlight internal & external beta testing group creation",
                  "App Review Guidelines compliance pre-flight checklist",
                  "Step-by-step guidance for build upload & release readiness",
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 mt-0.5 border border-slate-200">
                      <Check className="size-3" strokeWidth={2.6} />
                    </span>
                    <span className="text-[13.5px] font-medium text-slate-700">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/auth/client"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]"
              >
                <span>Get Apple Setup</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* 4. iOS Testing (COMING SOON) Banner */}
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
              <img
                src="/apple-black-logo.svg"
                alt="Apple"
                className="size-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-lg md:text-xl font-bold text-slate-900">
                  iOS Device Testing
                </h4>
                <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                We are actively building our physical iPhone and iPad tester community with automated TestFlight coordination.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom guarantee footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[13.5px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>100% Google Play 14-day compliance guarantee</span>
          </div>
          <span>·</span>
          <span>GST included</span>
          <span>·</span>
          <span>Real physical devices only</span>
          <span>·</span>
          <a
            href="mailto:support@uxos.in?subject=Custom%20App%20Testing"
            className="text-[#4F37FE] hover:underline font-bold"
          >
            Need enterprise or agency volume? Talk to us →
          </a>
        </div>
      </div>
    </section>
  );
}
