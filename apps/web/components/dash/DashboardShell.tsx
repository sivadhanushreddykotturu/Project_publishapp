"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  LifeBuoy,
  Radar,
  FlaskConical,
  Wallet,
  Bug,
  UserRound,
  Building2,
  UsersRound,
  ShieldCheck,
  MailWarning,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/marketing/LogoMark";
import { NotificationBell } from "./NotificationBell";

export type DashRole = "client" | "tester" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Nav config lives here (client-side) — passing component references from a
// Server Component into this client shell would break RSC serialization.
const NAV_BY_ROLE: Record<DashRole, NavItem[]> = {
  client: [
    { href: "/client", label: "Overview", icon: LayoutDashboard },
    { href: "/client/projects", label: "Projects", icon: FolderKanban },
    { href: "/client/invoices", label: "Invoices", icon: Receipt },
    { href: "/client/support", label: "Support", icon: LifeBuoy },
  ],
  tester: [
    { href: "/tester", label: "Overview", icon: LayoutDashboard },
    { href: "/tester/opportunities", label: "Opportunities", icon: Radar },
    { href: "/tester/tests", label: "My Tests", icon: FlaskConical },
    { href: "/tester/wallet", label: "Wallet", icon: Wallet },
    { href: "/tester/reports", label: "My Reports", icon: Bug },
    { href: "/tester/support", label: "Support", icon: LifeBuoy },
    { href: "/tester/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/clients", label: "Clients", icon: Building2 },
    { href: "/admin/testers", label: "Testers", icon: UsersRound },
    { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
    { href: "/admin/bugs", label: "Bug Reports", icon: Bug },
    { href: "/admin/wallets", label: "Wallets", icon: Wallet },
    { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    { href: "/admin/notifications", label: "Notifications", icon: MailWarning },
    { href: "/admin/support", label: "Support", icon: LifeBuoy },
    { href: "/admin/metrics", label: "Metrics", icon: Gauge },
  ],
};

const TITLES_BY_ROLE: Record<DashRole, Record<string, string>> = {
  client: {
    "/client/projects": "Projects",
    "/client/invoices": "Invoices",
    "/client/support": "Support",
    "/client": "Overview",
  },
  tester: {
    "/tester/opportunities": "Opportunities",
    "/tester/tests": "My Tests",
    "/tester/wallet": "Wallet",
    "/tester/reports": "My Reports",
    "/tester/support": "Support",
    "/tester/profile": "Profile",
    "/tester": "Overview",
  },
  admin: {
    "/admin/projects": "Projects",
    "/admin/clients": "Clients",
    "/admin/testers": "Testers",
    "/admin/verification": "Verification Queue",
    "/admin/bugs": "Bug Reports",
    "/admin/wallets": "Wallets & Payouts",
    "/admin/invoices": "Invoices",
    "/admin/notifications": "Notifications",
    "/admin/support": "Support",
    "/admin/metrics": "Metrics",
    "/admin": "Overview",
  },
};

export function DashboardShell({
  role,
  children,
}: {
  role: DashRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = NAV_BY_ROLE[role];
  const title =
    Object.entries(TITLES_BY_ROLE[role])
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
