import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
          Don&apos;t wait for your users to find the problems.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-ink-600">
          Put your product in front of real people before launch and discover
          what needs to improve while you still have time to fix it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/client"
            className="btn btn-primary group px-8 py-4 text-[15.5px]"
          >
            Start Testing
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="mailto:support@uxos.in"
            className="btn btn-secondary px-8 py-4 text-[15.5px]"
          >
            Talk to Us
          </a>
        </div>
      </div>
    </section>
  );
}
