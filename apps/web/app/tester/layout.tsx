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

    let needsSetup = false;
    let initialDevice: { model: string; osVersion: string } | null = null;
    try {
      const data = await serverApi<{
        tester?: { devices?: Array<{ model: string; osVersion?: string; androidVersion?: string }>; upi?: { vpa?: string } };
        devices?: Array<{ model: string; osVersion?: string; androidVersion?: string }>;
        upi?: { vpa?: string };
      }>("/testers/me");
      const profile = data && "tester" in data && data.tester ? data.tester : data;
      needsSetup = (profile?.devices?.length ?? 0) === 0;
      const first = profile?.devices?.[0];
      if (first) {
        initialDevice = {
          model: first.model,
          osVersion: first.osVersion || first.androidVersion || "Android 14",
        };
      }
    } catch {
      // API hiccup — fail open; individual pages handle their own errors
    }

  return (
    <DashboardShell role="tester" initialDevice={initialDevice}>
      {needsSetup ? <TesterSetup /> : children}
    </DashboardShell>
  );
}
