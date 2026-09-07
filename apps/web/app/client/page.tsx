import { serverApi, type MeResponse } from "@/lib/server-api";
import { ClientDashboardTabs, type ProjectRow } from "@/components/client/ClientDashboardTabs";

export const dynamic = "force-dynamic";

export default async function ClientOverview() {
  let me: MeResponse | null = null;
  let projects: ProjectRow[] = [];

  try {
    const [meData, projData] = await Promise.all([
      serverApi<MeResponse>("/users/me").catch(() => null),
      serverApi<{ projects: ProjectRow[] }>("/projects/me").catch(() => null),
    ]);
    me = meData;
    projects = projData?.projects ?? [];
  } catch {
    me = null;
    projects = [];
  }

  const name = me?.user.name || "there";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-[24px] bg-gradient-to-br from-cream-100 via-white to-paper p-8 md:p-10 border border-black/5 shadow-sm">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-orange-500">
          Client portal
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-ink-950">
          Welcome, {name}.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">
          Manage your app testing tracks. Select Android, iOS, or UX to review your releases or create a new test project.
        </p>
      </div>

      {/* 3 Tracks: Android, iOS, UX */}
      <ClientDashboardTabs projects={projects} />
    </div>
  );
}
