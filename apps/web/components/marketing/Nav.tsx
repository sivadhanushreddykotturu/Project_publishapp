import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Logo } from "./LogoMark";

const LINKS = [
  { href: "/#how-it-works", label: "HOW IT WORKS" },
  { href: "/#pricing", label: "PRICING" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="DefineUX home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 rounded-full border border-black/5 bg-white/80 px-7 py-3 shadow-sm backdrop-blur md:flex">
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
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden text-[14px] font-medium text-ink-800 transition-colors hover:text-orange-500 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/post-auth"
              className="rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
