import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "admin") redirect(roleHome(session.role));

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
