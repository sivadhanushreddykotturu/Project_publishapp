import { serverApi } from "@/lib/server-api";
import { SupportCenter, type TicketSummary } from "@/components/dash/SupportCenter";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  let tickets: TicketSummary[] = [];
  try {
    const data = await serverApi<{ tickets?: TicketSummary[] } | TicketSummary[]>("/support-tickets?limit=100").catch(() => null);
    tickets =
      data && typeof data === "object" && "tickets" in data && Array.isArray(data.tickets)
        ? data.tickets
        : Array.isArray(data)
        ? data
        : [];
  } catch {
    tickets = [];
  }
  return <SupportCenter tickets={tickets} isAdmin />;
}
