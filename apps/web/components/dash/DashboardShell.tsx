"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  LifeBuoy,
  Activity,
  CreditCard,
  Headphones,
  Bug,
  Building2,
  UsersRound,
  ShieldCheck,
  MailWarning,
  Gauge,
  LogOut,
  Sun,
  Moon,
  Search,
  Smartphone,
  UserCircle,
  User,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/marketing/LogoMark";
import { NotificationBell } from "./NotificationBell";
import { TesterDeviceBadge } from "@/components/tester/TesterDeviceBadge";

export type DashRole = "client" | "tester" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<DashRole, NavItem[]> = {
  client: [
    { href: "/client", label: "Overview", icon: LayoutDashboard },
    { href: "/client/projects", label: "Projects", icon: FolderKanban },
    { href: "/client/invoices", label: "Invoices", icon: Receipt },
    { href: "/client/support", label: "Support", icon: LifeBuoy },
  ],
  tester: [
    { href: "/tester", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tester/opportunities", label: "App Testing", icon: Activity },
    { href: "/tester/tests", label: "My Apps", icon: Smartphone },
    { href: "/tester/wallet", label: "Earnings", icon: CreditCard },
    { href: "/tester/profile", label: "Profile", icon: UserCircle },
    { href: "/tester/support", label: "Support", icon: Headphones },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/clients", label: "Clients", icon: Building2 },
    { href: "/admin/testers", label: "Testers", icon: UsersRound },
    { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
    { href: "/admin/bugs", label: "Bug Reports", icon: Bug },
    { href: "/admin/wallets", label: "Wallets", icon: CreditCard },
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
    "/tester/opportunities": "App Testing",
    "/tester/tests": "My Apps",
    "/tester/wallet": "Earnings",
    "/tester/reports": "My Reports",
    "/tester/support": "Support",
    "/tester/profile": "Profile",
    "/tester": "Dashboard",
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
  initialDevice,
  children,
}: {
  role: DashRole;
  initialDevice?: { model: string; osVersion?: string; androidVersion?: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [isNightMode, setIsNightMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("publishapp_night_mode");
      if (stored !== null) {
        setIsNightMode(stored === "true");
      }
    } catch {}
  }, []);

  const toggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("publishapp_night_mode", String(next));
      } catch {}
      return next;
    });
  };

  const nav = NAV_BY_ROLE[role];
  const title =
    Object.entries(TITLES_BY_ROLE[role])
      .sort((a, b) => b[0].length - a[0].length)
      .find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Dashboard";

  const isTester = role === "tester";

  return (
    <div
      className={`dashboard-root flex min-h-screen transition-colors duration-300 ${
        isNightMode ? "dark bg-[#0B0F19]" : "bg-[#F8F9FA]"
      }`}
    >
      {/* sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-slate-200/80 bg-white md:flex select-none">
        <div className="px-6 py-6">
          <Link href="/">
            <Logo dark={isNightMode} />
          </Link>
        </div>

        <nav suppressHydrationWarning className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-6">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} role={role} />
          ))}
        </nav>

        {/* Sidebar bottom: Logout & Night mode with extra clearance for dev overlays */}
        {isTester ? (
          <div className="border-t border-slate-100 px-6 py-5 pb-8 space-y-4">
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex w-full items-center gap-3 text-[13.5px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <LogOut className="size-4 text-slate-400" />
              <span>Logout</span>
            </button>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[13.5px] font-medium text-slate-600">
                {isNightMode ? (
                  <Moon className="size-4 text-[#818CF8]" />
                ) : (
                  <Sun className="size-4 text-slate-400" />
                )}
                <span>Night mode</span>
              </div>
              <button
                type="button"
                onClick={toggleNightMode}
                aria-label="Toggle night mode"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isNightMode ? "bg-[#4F46E5]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-flex size-5 transform items-center justify-center rounded-full bg-white shadow-xs transition-transform ${
                    isNightMode ? "translate-x-5" : "translate-x-1"
                  }`}
                >
                  {isNightMode ? (
                    <Moon className="size-3 text-[#4F46E5]" />
                  ) : (
                    <Sun className="size-3 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-black/5 px-6 py-4 pb-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
                {isNightMode ? (
                  <Moon className="size-3.5 text-[#818CF8]" />
                ) : (
                  <Sun className="size-3.5 text-slate-400" />
                )}
                <span>Night mode</span>
              </div>
              <button
                type="button"
                onClick={toggleNightMode}
                aria-label="Toggle night mode"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isNightMode ? "bg-[#4F46E5]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-flex size-4 transform items-center justify-center rounded-full bg-white shadow-xs transition-transform ${
                    isNightMode ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <Link
              href="/"
              className="block text-[13px] font-medium text-ink-400 transition-colors hover:text-orange-500"
            >
              ← Back to site
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[250px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3.5 md:px-10">
            {isTester ? (
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="md:hidden">
                    <LogoMark size={30} />
                  </span>
                  <div className="relative w-48 sm:w-64 md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full rounded-full bg-slate-50 border border-slate-200/80 pl-9 pr-4 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
                    />
                  </div>
                  <Link
                    href="/tester/tests"
                    className="rounded-xl bg-[#4F46E5] px-5 py-2 text-[13.5px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all whitespace-nowrap"
                  >
                    My Apps
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <TesterDeviceBadge initialDevice={initialDevice} />
                  <NotificationBell variant="purple" />
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Tester Profile"
                        href="/tester/profile"
                        labelIcon={<User className="size-4" />}
                      />
                      <UserButton.Link
                        label="My Apps"
                        href="/tester/tests"
                        labelIcon={<Smartphone className="size-4" />}
                      />
                      <UserButton.Link
                        label="Earnings & UPI"
                        href="/tester/wallet"
                        labelIcon={<CreditCard className="size-4" />}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* mobile nav */}
          <nav suppressHydrationWarning className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
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
                    active
                      ? isTester
                        ? "bg-[#4F46E5] text-white"
                        : "bg-ink-950 text-white"
                      : "bg-white text-ink-600 border border-slate-200"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-5 py-6 md:px-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  role,
}: {
  item: NavItem;
  pathname: string;
  role: DashRole;
}) {
  const depth = item.href.split("/").filter(Boolean).length;
  const active = depth <= 2 ? pathname === item.href : pathname.startsWith(item.href);
  const isTester = role === "tester";

  let styleClasses = "";
  if (active) {
    styleClasses = isTester
      ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] font-semibold"
      : "bg-ink-950 text-white";
  } else {
    styleClasses = isTester
      ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
      : "text-ink-600 hover:bg-paper hover:text-ink-950 font-medium";
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13.5px] transition-all ${styleClasses}`}
    >
      <item.icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />
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
