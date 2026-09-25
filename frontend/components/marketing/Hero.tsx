import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F6F7FB] via-white to-[#F6F7FB]">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] blur-[140px] rounded-full pointer-events-none z-0 bg-indigo-500/10" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] blur-[120px] rounded-full pointer-events-none z-0 bg-purple-500/10" />

      {/* subtle grid bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 text-center md:pt-44 z-10">
        {/* live badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 shadow-xs">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[13.5px] font-semibold text-slate-800">
            Real users · Real devices · Guaranteed compliance
          </span>
        </div>

        {/* headline */}
        <h1 className="mx-auto max-w-3xl text-[clamp(2.6rem,7vw,5.25rem)] font-extrabold leading-[1.04] tracking-tight text-slate-900">
          Test your product{" "}
          <span className="relative inline-block text-[#4F37FE]">
            before your users do.
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-[4px] w-full rounded-full bg-[#4F37FE]"
            />
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-slate-600 md:text-[18px] font-medium">
          Don&apos;t wait until you&apos;re live to discover confusing screens,
          broken flows, and frustrating experiences. Put your app in front of
          real testers, find issues early, and improve before launch.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/client"
            id="hero-cta-primary"
            className="bg-[#4F37FE] hover:bg-[#432ee0] text-white px-8 py-4 rounded-full font-bold text-[15.5px] shadow-lg shadow-indigo-500/25 flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <span>Start Testing</span>
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/#how-it-works"
            id="hero-cta-how"
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-8 py-4 rounded-full font-bold text-[15.5px] shadow-xs transition-colors flex items-center justify-center"
          >
            How It Works
          </Link>
        </div>

        <p className="mt-8 text-[14px] font-medium text-slate-400">
          Real testers · Physical Android devices · Full bug & UX reports · 14-day Play Store guarantee
        </p>
      </div>
    </section>
  );
}
