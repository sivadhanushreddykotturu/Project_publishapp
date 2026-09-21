import { serverApi } from "@/lib/server-api";
import { TesterSupportView, type TesterSupportTicket } from "@/components/tester/TesterSupportView";
import { type TesterAssignment } from "@/components/tester/AssignmentCard";

export const dynamic = "force-dynamic";

export default async function TesterSupportPage() {
  let tickets: TesterSupportTicket[] = [];
  let assignments: TesterAssignment[] = [];

  try {
    const [ticketRes, assignRes] = await Promise.all([
      serverApi<{ tickets: TesterSupportTicket[] } | TesterSupportTicket[]>("/support-tickets").catch(() => []),
      serverApi<{ assignments?: TesterAssignment[] } | TesterAssignment[]>("/assignments/me").catch(() => []),
    ]);

    tickets = Array.isArray(ticketRes)
      ? ticketRes
      : Array.isArray(ticketRes?.tickets)
      ? ticketRes.tickets
      : [];

    assignments = Array.isArray(assignRes)
      ? assignRes
      : Array.isArray(assignRes?.assignments)
      ? assignRes.assignments
      : [];
  } catch {
    tickets = [];
    assignments = [];
  }

  return <TesterSupportView assignments={assignments} initialTickets={tickets} />;
}
