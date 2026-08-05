"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const FAQS = [
  {
    q: "Why does Google Play require 14 testers?",
    a: "Since late 2023, Google asks new personal developer accounts to run a closed test with at least 14 testers who opt in and stay engaged for 14 days before the app can apply for production. It's Google's way of filtering abandoned or low-quality apps. LaunchOps exists because doing this with friends, family, and WhatsApp groups rarely survives day 4.",
  },
  {
    q: "Do you support iOS apps too, or only Android?",
    a: "Both. Android tests run on your Google Play closed track; iOS tests run as a TestFlight beta via public links. The workflow is identical either way — verified testers, daily engagement, deduplicated bug reports, and a completion report at the end.",
  },
  {
    q: "Are these real people on real devices?",
    a: "Yes. Every tester registers a physical Android or iOS device with a device fingerprint, verifies their account with a screenshot proof, and is reviewed by an admin before your test starts. Duplicate devices and recycled screenshots are flagged automatically.",
  },
  {
    q: "What happens if a tester goes quiet mid-test?",
    a: "If a tester is inactive for more than 48 hours during the early steps, they're removed and the next person on the waiting list is promoted automatically — your 14-day clock keeps running. Later in the test, an admin is alerted and replaces them manually so your track stays intact.",
  },
  {
    q: "Do you need my build or access to my developer account?",
    a: "No. In the standard flow you keep full control: you upload your own build to Play Console or App Store Connect, create the track or TestFlight group, and we hand you a verified list of tester accounts to invite, plus the opt-in link to share with us. We never ask for your developer account password.",
  },
  {
    q: "What do I receive when the test ends?",
    a: "A completion report built for Play Console: the engagement timeline across all 14 days, every tester's verified proofs, and a deduplicated bug summary with severity, device info, and reproduction steps for each issue.",
  },
  {
    q: "How do testers get paid?",
    a: "Testers earn wallet credits as each step of the test is verified by an admin. They withdraw to their UPI handle; payouts are reviewed and completed within 48 hours. Happy testers are why our tests finish.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-black/5 bg-paper py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 md:grid-cols-[1fr_1.6fr]">
        <div>
          <h2 className="text-[clamp(2.4rem,5vw,3.8rem)] font-semibold tracking-display text-ink-950">
            FAQs
          </h2>
          <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-ink-500">
            Something else on your mind? Write to us — a human replies.
          </p>
          <a
            href="mailto:hello@launchops.app"
            className="mt-3 inline-block text-[15px] font-medium text-orange-500 underline-offset-4 hover:underline"
          >
            hello@launchops.app
          </a>
        </div>

        <div>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-black/8">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="text-[17.5px] font-medium text-ink-950">
                    {item.q}
                  </span>
                  <span className="shrink-0 text-orange-500">
                    {isOpen ? (
                      <Minus className="size-5" strokeWidth={2.2} />
                    ) : (
                      <Plus className="size-5" strokeWidth={2.2} />
                    )}
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-ink-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
