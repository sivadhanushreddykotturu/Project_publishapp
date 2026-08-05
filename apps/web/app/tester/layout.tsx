import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "tester") redirect(roleHome(session.role));

  return <DashboardShell role="tester">{children}</DashboardShell>;
}
