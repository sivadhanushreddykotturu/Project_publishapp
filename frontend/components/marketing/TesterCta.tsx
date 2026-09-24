import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ACTIONS = [
  "Test real applications",
  "Discover usability issues",
  "Find bugs",
  "Share feedback",
  "Participate in testing cycles",
  "Get selected for relevant projects",
];

export function TesterCta() {
  return (
    <section className="bg-paper py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            For testers
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
            Want to become a tester?
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-600">
            Join a growing community that tests real applications, discovers
            problems, and shares feedback with product teams before launch.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/tester"
              className="btn btn-primary px-7 py-3.5 text-[15px]"
            >
              Join as a Tester
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/auth"
              className="btn btn-secondary px-7 py-3.5 text-[15px]"
            >
              Tester Login
            </Link>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((a) => (
            <li
              key={a}
              className="rounded-card border border-black/5 bg-white px-5 py-4 text-[14.5px] font-medium text-ink-800 shadow-card"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
