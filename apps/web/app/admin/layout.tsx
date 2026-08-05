import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  UsersRound,
  ShieldCheck,
  Bug,
  Wallet,
  Receipt,
  MailWarning,
  LifeBuoy,
  Gauge,
} from "lucide-react";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";

const NAV = [
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
];

const TITLES = {
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
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (!session) redirect("/sign-in");
  if (session.role !== "admin") redirect(roleHome(session.role));

  return <DashboardShell nav={NAV} titleByPath={TITLES}>{children}</DashboardShell>;
}
