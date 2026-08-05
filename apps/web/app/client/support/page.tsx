import { serverApi } from "@/lib/server-api";
import { SupportCenter, type TicketSummary } from "@/components/dash/SupportCenter";

export const dynamic = "force-dynamic";

export default async function ClientSupportPage() {
  let tickets: TicketSummary[] = [];
  try {
    const data = await serverApi<{ tickets: TicketSummary[] }>("/support-tickets");
    tickets = data.tickets;
  } catch {
    tickets = [];
  }
  return <SupportCenter tickets={tickets} isAdmin={false} />;
}
