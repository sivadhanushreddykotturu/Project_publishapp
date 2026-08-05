import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  FlaskConical,
  Wallet,
  Bug,
  LifeBuoy,
  UserRound,
} from "lucide-react";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";

const NAV = [
  { href: "/tester", label: "Overview", icon: LayoutDashboard },
  { href: "/tester/opportunities", label: "Opportunities", icon: Radar },
  { href: "/tester/tests", label: "My Tests", icon: FlaskConical },
  { href: "/tester/wallet", label: "Wallet", icon: Wallet },
  { href: "/tester/reports", label: "My Reports", icon: Bug },
  { href: "/tester/support", label: "Support", icon: LifeBuoy },
  { href: "/tester/profile", label: "Profile", icon: UserRound },
];

const TITLES = {
  "/tester/opportunities": "Opportunities",
  "/tester/tests": "My Tests",
  "/tester/wallet": "Wallet",
  "/tester/reports": "My Reports",
  "/tester/support": "Support",
  "/tester/profile": "Profile",
  "/tester": "Overview",
};

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "tester") redirect(roleHome(session.role));

  return <DashboardShell nav={NAV} titleByPath={TITLES}>{children}</DashboardShell>;
}
