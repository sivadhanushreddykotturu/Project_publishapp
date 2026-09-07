import { serverApi } from "@/lib/server-api";
import { type TicketSummary } from "@/components/dash/SupportCenter";
import { TesterSupportView } from "@/components/tester/TesterSupportView";

export const dynamic = "force-dynamic";

export default async function TesterSupportPage() {
  let tickets: TicketSummary[] = [];
  try {
    const data = await serverApi<{ tickets: TicketSummary[] }>("/support-tickets");
    tickets = data.tickets;
  } catch {
    tickets = [];
  }

  return <TesterSupportView tickets={tickets} />;
}
