"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const FAQS = [
  {
    q: "Why does Google Play require 14 testers for 14 days?",
    a: "Google requires new personal developer accounts to run a closed test with at least 14 opted-in testers for 14 continuous days before applying for production access. DefineUX coordinates the entire test with real Android testers so you pass Google's review.",
  },
  {
    q: "Do you support iOS or UX testing?",
    a: "Our automated self-serve platform is currently dedicated exclusively to Android Google Play closed testing. iOS TestFlight and UX testing capabilities are planned for upcoming releases.",
  },
  {
    q: "Are these real people on physical Android devices?",
    a: "Yes. Every tester registers a physical Android device with hardware fingerprinting. They opt in through your Play Console track link, install your app, and submit daily usage proofs.",
  },
  {
    q: "What happens if a tester becomes inactive?",
    a: "We continuously monitor engagement. If a tester becomes inactive, our system automatically replaces them from our waitlist so your 14-day requirement is never compromised.",
  },
  {
    q: "Do you need access to my Google Play Console?",
    a: "No. You retain 100% control of your account, source code, and builds. You simply upload your app to Play Console's closed track and share the join link with us.",
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
            href="mailto:hello@defineux.app"
            className="mt-3 inline-block text-[15px] font-medium text-orange-500 underline-offset-4 hover:underline"
          >
            hello@defineux.app
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
