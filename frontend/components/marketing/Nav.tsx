"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Logo } from "./LogoMark";

const LINKS = [
  { href: "/#services", label: "SERVICES" },
  { href: "/#how-it-works", label: "HOW IT WORKS" },
  { href: "/#pricing", label: "PRICING" },
  { href: "/#agency", label: "AGENCIES" },
];

export function Nav() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" aria-label="UXOS home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 rounded-full border border-black/5 bg-slate-50/80 px-7 py-2.5 shadow-2xs backdrop-blur md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12.5px] font-semibold tracking-[0.08em] text-ink-800 transition-colors hover:text-orange-500"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {mounted ? (
            <>
              <SignedOut>
                <Link
                  href="/auth"
                  className="hidden text-[14px] font-medium text-ink-800 transition-colors hover:text-orange-500 sm:block"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/client"
                  className="btn btn-primary px-5 py-2 text-[14px]"
                >
                  Start Testing
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/client"
                  className="btn btn-primary px-5 py-2 text-[14px]"
                >
                  Dashboard
                </Link>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden text-[14px] font-medium text-ink-800 transition-colors hover:text-orange-500 sm:block"
              >
                Log In
              </Link>
              <Link
                href="/auth/client"
                className="btn btn-primary px-5 py-2 text-[14px]"
              >
                Start Testing
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border border-black/10 text-ink-950 transition-colors hover:bg-cream-100 md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-black/5 bg-white px-6 py-4 md:hidden"
        >
          {[...LINKS, { href: "/auth", label: "LOG IN" }].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[14px] font-semibold tracking-[0.08em] text-ink-800 transition-colors hover:text-orange-500"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
