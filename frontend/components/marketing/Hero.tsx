import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-paper">
      {/* subtle grid bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink-950) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-950) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-36 text-center md:pt-44">
        {/* live badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-black/5 bg-white px-4 py-2 shadow-sm">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-lime-400" />
          </span>
          <span className="text-[13.5px] font-medium text-ink-800">
            Real users. Real feedback. Before launch.
          </span>
        </div>

        {/* headline */}
        <h1 className="mx-auto max-w-3xl text-[clamp(2.6rem,7vw,5.25rem)] font-semibold leading-[1.04] tracking-display text-ink-950">
          Test your product{" "}
          <span className="relative inline-block">
            before your users do.
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-orange-500"
            />
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-ink-600 md:text-[18px]">
          Don&apos;t wait until you&apos;re live to discover confusing screens,
          broken flows, and frustrating experiences. Put your app in front of
          real testers, find issues early, and improve before launch.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/client"
            id="hero-cta-primary"
            className="btn btn-primary group gap-2.5 px-8 py-4 text-[15.5px] shadow-lg shadow-ink-950/10"
          >
            Start Testing
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/#how-it-works"
            id="hero-cta-how"
            className="btn btn-secondary px-8 py-4 text-[15.5px]"
          >
            How It Works
          </Link>
        </div>

        <p className="mt-8 text-[14px] font-medium text-ink-500">
          Real testers · Real devices · Real feedback · Actionable reports
        </p>
      </div>
    </section>
  );
}
