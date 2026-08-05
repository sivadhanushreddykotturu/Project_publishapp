import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";
import { serverApi } from "@/lib/server-api";
import { DashboardShell } from "@/components/dash/DashboardShell";
import { SessionError } from "@/components/SessionError";
import { TesterSetup } from "@/components/tester/TesterSetup";

export default async function TesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getFreshRole();
  if (session && "error" in session) return <SessionError />;
  if (!session) redirect("/sign-in");
  if (session.role !== "tester") redirect(roleHome(session.role));

  // First-run gate: devices + UPI are required before the dashboard unlocks
  let needsSetup = false;
  try {
    const data = await serverApi<{
      tester: { devices?: unknown[]; upi?: { vpa?: string } };
    }>("/testers/me");
    needsSetup =
      (data.tester.devices?.length ?? 0) === 0 || !data.tester.upi?.vpa;
  } catch {
    // API hiccup — fail open; individual pages handle their own errors
  }

  return (
    <DashboardShell role="tester">
      {needsSetup ? <TesterSetup /> : children}
    </DashboardShell>
  );
}
