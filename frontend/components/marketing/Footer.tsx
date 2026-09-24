import Link from "next/link";
import { Logo } from "./LogoMark";

const COLS = [
  {
    heading: "Product",
    links: [
      { label: "Services", href: "/#services" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "For Testers",
    links: [
      { label: "Become an Android Tester", href: "/auth/tester" },
      { label: "Tester Dashboard", href: "/tester" },
    ],
  },
  {
    heading: "Company",
    links: [
      {
        label: "Contact Us",
        href: "mailto:support@uxos.in",
      },
      {
        label: "Agency Enquiry",
        href: "mailto:support@uxos.in?subject=Agency%20Enquiry",
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Refund Policy", href: "#refunds" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* top row: logo + columns */}
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          {/* brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-[200px] text-[13.5px] leading-relaxed text-ink-400">
              Real users. Real feedback. Better products.
            </p>
            <p className="mt-4 text-[13px] text-ink-300">Made in India 🇮🇳</p>
          </div>

          {/* nav columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-ink-500 transition-colors hover:text-ink-950"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-8 sm:flex-row sm:items-center">
          <p className="text-[13px] text-ink-400">
            © {new Date().getFullYear()} UXOS. All rights reserved.
          </p>
          <p className="text-[13px] text-ink-400">
            Built for teams about to launch.
          </p>
        </div>
      </div>
    </footer>
  );
}
