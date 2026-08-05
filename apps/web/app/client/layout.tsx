import { redirect } from "next/navigation";
import { FolderKanban, LayoutDashboard, Receipt, LifeBuoy } from "lucide-react";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";

const NAV = [
  { href: "/client", label: "Overview", icon: LayoutDashboard },
  { href: "/client/projects", label: "Projects", icon: FolderKanban },
  { href: "/client/invoices", label: "Invoices", icon: Receipt },
  { href: "/client/support", label: "Support", icon: LifeBuoy },
];

const TITLES = {
  "/client/projects": "Projects",
  "/client/invoices": "Invoices",
  "/client/support": "Support",
  "/client": "Overview",
};

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "client") redirect(roleHome(session.role));

  return <DashboardShell nav={NAV} titleByPath={TITLES}>{children}</DashboardShell>;
}
