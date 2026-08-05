import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-paper">
      <div className="mx-auto max-w-6xl px-6 pb-28 pt-40 text-center md:pt-48">
        {/* pill badge */}
        <div className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-black/5 bg-white px-4 py-2 shadow-sm">
          <span className="grid size-6 place-items-center rounded-full bg-lime-300">
            <BadgeCheck className="size-4 text-ink-950" strokeWidth={2.2} />
          </span>
          <span className="text-[13.5px] font-medium text-ink-800">
            Google Play closed testing · iOS TestFlight
          </span>
        </div>

        <h1 className="mx-auto max-w-4xl text-[clamp(2.9rem,8vw,6.4rem)] font-semibold leading-[1.02] tracking-display text-ink-950">
          Fourteen testers.
          <br />
          Fourteen days.
          <span className="relative ml-3 inline-block animate-float align-middle">
            <AppGridTile />
          </span>
          <br />
          Zero spreadsheets.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-[17px] leading-relaxed text-ink-600 md:text-[19px]">
          Google Play asks new developers for a closed test with 14 opted-in
          testers. LaunchOps runs the whole thing — on Android and iOS —
          recruitment, daily engagement, structured bug reports, and the
          completion report Play Console and App Store Connect want to see.
        </p>

        <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="group inline-flex items-center gap-2.5 rounded-full bg-ink-950 px-8 py-4 text-[16px] font-semibold text-white shadow-lg shadow-ink-950/10 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            START YOUR TEST
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center rounded-full border-2 border-lime-400 bg-lime-200/40 px-8 py-[14px] text-[16px] font-semibold text-ink-800 transition-colors hover:bg-lime-200"
          >
            See packages
          </a>
        </div>

        <p className="mt-8 text-[13.5px] text-ink-500">
          Real devices · Admin-verified proofs · Inactive testers replaced free
        </p>
      </div>
    </section>
  );
}

function AppGridTile() {
  const cells = [
    "bg-emerald-400", "bg-amber-300", "bg-orange-400",
    "bg-rose-400", "bg-ink-300", "bg-pink-400",
    "bg-violet-400", "bg-sky-400", "bg-teal-300",
  ];
  return (
    <span className="grid grid-cols-3 gap-[6px] rounded-[26%] border border-black/5 bg-white p-3 shadow-xl shadow-ink-950/10">
      {cells.map((c, i) => (
        <span key={i} className={`size-[clamp(10px,1.6vw,18px)] rounded-[30%] ${c}`} />
      ))}
    </span>
  );
}
