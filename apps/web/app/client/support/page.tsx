import { serverApi } from "@/lib/server-api";
import { SupportCenter, type TicketSummary } from "@/components/dash/SupportCenter";

export const dynamic = "force-dynamic";

export default async function ClientSupportPage() {
  let tickets: TicketSummary[] = [];
  let projects: Array<{ _id: string; appDetails?: { appName?: string; packageName?: string } }> = [];

  try {
    const [ticketsRes, projectsRes] = await Promise.all([
      serverApi<{ tickets?: TicketSummary[] } | TicketSummary[]>("/support-tickets?limit=100").catch(() => null),
      serverApi<{ projects?: Array<{ _id: string; appDetails?: { appName?: string; packageName?: string } }> } | Array<{ _id: string; appDetails?: { appName?: string; packageName?: string } }>>("/projects/me").catch(() => null),
    ]);

    tickets =
      ticketsRes && typeof ticketsRes === "object" && "tickets" in ticketsRes && Array.isArray(ticketsRes.tickets)
        ? ticketsRes.tickets
        : Array.isArray(ticketsRes)
        ? ticketsRes
        : [];

    projects =
      projectsRes && typeof projectsRes === "object" && "projects" in projectsRes && Array.isArray(projectsRes.projects)
        ? projectsRes.projects
        : Array.isArray(projectsRes)
        ? projectsRes
        : [];
  } catch {
    tickets = [];
    projects = [];
  }

  return <SupportCenter tickets={tickets} projects={projects} isAdmin={false} />;
}
