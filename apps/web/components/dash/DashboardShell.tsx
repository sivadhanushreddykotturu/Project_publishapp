"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/marketing/LogoMark";
import { NotificationBell } from "./NotificationBell";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  nav,
  titleByPath,
  children,
}: {
  nav: NavItem[];
  titleByPath: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title =
    Object.entries(titleByPath)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Overview";

  return (
    <div className="flex min-h-screen bg-paper">
      {/* sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-black/5 bg-white md:flex">
        <div className="px-6 py-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="border-t border-black/5 px-6 py-4">
          <Link
            href="/"
            className="text-[13px] font-medium text-ink-400 transition-colors hover:text-orange-500"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[260px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/80 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <span className="md:hidden">
                <LogoMark size={30} />
              </span>
              <h1 className="text-[20px] font-semibold tracking-tight text-ink-950">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserButton />
            </div>
          </div>
          {/* mobile nav */}
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
            {nav.map((item) => {
              const active =
                item.href.split("/").filter(Boolean).length <= 2
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
                    active ? "bg-ink-950 text-white" : "bg-white text-ink-600"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-5 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const depth = item.href.split("/").filter(Boolean).length;
  const active = depth <= 2 ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors ${
        active
          ? "bg-ink-950 text-white"
          : "text-ink-600 hover:bg-paper hover:text-ink-950"
      }`}
    >
      <item.icon className="size-[18px]" strokeWidth={1.8} />
      {item.label}
    </Link>
  );
}

function LogoMark({ size }: { size: number }) {
  // local minimal mark for the mobile topbar
  return (
    <span
      className="inline-grid grid-cols-3 place-items-center rounded-[28%] bg-ink-950"
      style={{ width: size, height: size, padding: size * 0.18, gap: size * 0.06 }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={`rounded-[30%] ${i === 4 ? "bg-lime-400" : "bg-white"}`}
          style={{ width: size * 0.15, height: size * 0.15 }}
        />
      ))}
    </span>
  );
}
