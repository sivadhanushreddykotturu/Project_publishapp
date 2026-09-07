import Link from "next/link";
import { Logo } from "./LogoMark";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-12 md:flex-row md:items-center">
        <Logo />
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[14px] text-ink-500">
          <Link href="/#how-it-works" className="transition-colors hover:text-ink-950">
            How it works
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-ink-950">
            Pricing
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-ink-950">
            FAQ
          </Link>
          <Link href="/sign-up?role=tester" className="transition-colors hover:text-ink-950">
            Become an Android tester
          </Link>
        </nav>
        <p className="text-[13px] text-ink-400">
          © {new Date().getFullYear()} DefineUX. Built for builders.
        </p>
      </div>
    </footer>
  );
}
