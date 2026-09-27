"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser, useAuth } from "@clerk/nextjs";
import UXOSBrandLogo from "@/src/components/ui/UXOSBrandLogo";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "https://chat.whatsapp.com/Il76kyPsNg684F2ITanNRY", label: "Community", external: true },
  { href: "/tester", label: "Tester Hub" },
];

export function Nav() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [dashboardHref, setDashboardHref] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("launchops_user_role")?.toLowerCase();
      if (stored === "tester") return "/tester";
      if (stored === "admin") return "/admin";
    }
    return "/client";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. Check Clerk public metadata
    const metaRole = (user.publicMetadata?.role as string | undefined)?.toLowerCase();
    if (metaRole === "tester") {
      setDashboardHref("/tester");
      return;
    }
    if (metaRole === "admin") {
      setDashboardHref("/admin");
      return;
    }
    if (metaRole === "client") {
      setDashboardHref("/client");
      return;
    }

    // 2. Check localStorage
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("launchops_user_role")?.toLowerCase();
      if (storedRole === "tester") {
        setDashboardHref("/tester");
        return;
      }
      if (storedRole === "admin") {
        setDashboardHref("/admin");
        return;
      }
      if (storedRole === "client") {
        setDashboardHref("/client");
        return;
      }
    }

    // 3. Fallback: resolve from backend
    let cancelled = false;
    async function resolveRole() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const role = json?.data?.user?.role?.toLowerCase();
          if (!cancelled && role) {
            if (typeof window !== "undefined") {
              localStorage.setItem("launchops_user_role", role);
            }
            if (role === "tester") setDashboardHref("/tester");
            else if (role === "admin") setDashboardHref("/admin");
            else setDashboardHref("/client");
          }
        }
      } catch {
        // fail open
      }
    }
    void resolveRole();
    return () => {
      cancelled = true;
    };
  }, [user, getToken]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all font-sans shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-20">
        <Link href="/" aria-label="UXOS home" className="flex items-center">
          <UXOSBrandLogo isDarkMode={false} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              className="text-[14px] font-semibold text-slate-600 transition-colors hover:text-[#4F37FE]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3.5">
          {mounted ? (
            <>
              <SignedOut>
                <Link
                  href="/auth"
                  className="hidden text-[14px] font-bold text-slate-700 transition-colors hover:text-[#4F37FE] sm:block px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/client"
                  className="bg-[#4F37FE] hover:bg-[#432ee0] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer border-0"
                >
                  <span>Start Testing</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href={dashboardHref}
                  className="bg-[#4F37FE] hover:bg-[#432ee0] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer border-0"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden text-[14px] font-bold text-slate-700 transition-colors hover:text-[#4F37FE] sm:block px-3 py-2"
              >
                Log In
              </Link>
              <Link
                href="/auth/client"
                className="bg-[#4F37FE] hover:bg-[#432ee0] text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer border-0"
              >
                <span>Start Testing</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-slate-200 bg-white px-6 py-4 lg:hidden shadow-lg"
        >
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[14.5px] font-semibold text-slate-700 transition-colors hover:text-[#4F37FE]"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {hasClerkKey ? (
              <>
                <SignedOut>
                  <Link
                    href="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-[14px] font-bold text-slate-800"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/client"
                    onClick={() => setMenuOpen(false)}
                    className="bg-[#4F37FE] text-white text-center py-2.5 rounded-xl font-bold text-sm"
                  >
                    Start Testing
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className="bg-[#4F37FE] text-white text-center py-2.5 rounded-xl font-bold text-sm"
                  >
                    Dashboard
                  </Link>
                </SignedIn>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-[14px] font-bold text-slate-800"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/client"
                  onClick={() => setMenuOpen(false)}
                  className="bg-[#4F37FE] text-white text-center py-2.5 rounded-xl font-bold text-sm"
                >
                  Start Testing
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
