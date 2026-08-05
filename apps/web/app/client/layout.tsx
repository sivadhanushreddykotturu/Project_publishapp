import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "client") redirect(roleHome(session.role));

  return <DashboardShell role="client">{children}</DashboardShell>;
}
