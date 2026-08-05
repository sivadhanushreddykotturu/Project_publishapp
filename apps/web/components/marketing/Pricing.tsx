import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { PACKAGES } from "@launchops/types";
import { formatINR } from "@/lib/format";

export function Pricing() {
  return (
    <section id="pricing" className="bg-paper py-28">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-[clamp(2.2rem,5vw,3.6rem)] font-semibold tracking-display text-ink-950">
          One payment. Play-ready.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-center text-[16.5px] text-ink-600">
          Pick a track — every track includes tester recruitment, engagement
          tracking, replacements, and your completion report.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) =>
            pkg.featured ? (
              <FeaturedCard key={pkg.key} pkg={pkg} />
            ) : (
              <StandardCard key={pkg.key} pkg={pkg} />
            ),
          )}
        </div>

        <p className="mt-12 text-center text-[13.5px] text-ink-500">
          Prices in <span className="font-semibold text-orange-500">INR</span>,
          GST included. One-time payment per app — no subscription.
        </p>
      </div>
    </section>
  );
}

type Pkg = (typeof PACKAGES)[number];

function FeatureList({ pkg, dark }: { pkg: Pkg; dark?: boolean }) {
  return (
    <ul className="mt-7 space-y-3.5">
      {pkg.features.map((f) => (
        <li key={f} className="flex items-start gap-3">
          <Check
            className={`mt-0.5 size-[18px] shrink-0 ${dark ? "text-lime-300" : "text-blue-500"}`}
            strokeWidth={2.4}
          />
          <span
            className={`text-[14.5px] leading-snug ${dark ? "text-white/85" : "text-ink-600"}`}
          >
            {f}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StandardCard({ pkg }: { pkg: Pkg }) {
  return (
    <div className="flex flex-col rounded-[28px] border border-black/5 bg-white p-9 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-[26px] font-semibold tracking-tight text-ink-950">
        {pkg.name}
      </h3>
      <p className="mt-2.5 min-h-[44px] text-[14.5px] leading-snug text-ink-500">
        {pkg.description}
      </p>
      <div className="mt-6 flex items-baseline gap-2.5">
        <span className="text-[40px] font-semibold tracking-tight text-ink-950">
          {formatINR(pkg.pricePaise)}
        </span>
        <span className="text-[14px] text-ink-400">one-time</span>
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium text-orange-500">
        {pkg.requiredTesters} testers · {pkg.durationDays} days
      </p>
      <FeatureList pkg={pkg} />
      <div className="mt-9 flex-1" />
      <Link
        href={`/sign-up?role=client&package=${pkg.key}`}
        className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-ink-950 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        <Lock className="size-4" />
        Choose {pkg.name.split(" ")[0]}
      </Link>
    </div>
  );
}

function FeaturedCard({ pkg }: { pkg: Pkg }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-navy-900 p-9 shadow-xl shadow-navy-900/20">
      {/* subtle radial glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-lime-400/10 blur-3xl" />

      <span className="absolute right-6 top-6 rounded-full bg-lime-300 px-3.5 py-1.5 text-[12px] font-bold tracking-wide text-ink-950">
        MOST POPULAR
      </span>

      <h3 className="text-[26px] font-semibold tracking-tight text-white">
        {pkg.name}
      </h3>
      <p className="mt-2.5 min-h-[44px] text-[14.5px] leading-snug text-white/60">
        {pkg.description}
      </p>
      <div className="mt-6 flex items-baseline gap-2.5">
        <span className="text-[40px] font-semibold tracking-tight text-white">
          {formatINR(pkg.pricePaise)}
        </span>
        <span className="text-[14px] text-white/40">one-time</span>
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium text-lime-300">
        {pkg.requiredTesters} testers · {pkg.durationDays} days
      </p>
      <FeatureList pkg={pkg} dark />
      <div className="mt-9 flex-1" />
      <Link
        href={`/sign-up?role=client&package=${pkg.key}`}
        className="relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-blue-500 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600"
      >
        <Lock className="size-4" />
        Choose {pkg.name.split(" ")[0]}
      </Link>
    </div>
  );
}
