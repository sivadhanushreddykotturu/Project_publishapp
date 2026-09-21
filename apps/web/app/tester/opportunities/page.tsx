import { serverApi } from "@/lib/server-api";
import { AppTestingGrid } from "@/components/tester/AppTestingGrid";

export const dynamic = "force-dynamic";

interface Opportunity {
  _id: string;
  packageKey: string;
  projectType: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: { appName: string; packageName: string; description?: string };
  payoutINR?: number;
  myAssignment: { status: string; queuePosition?: number } | null;
}

export default async function OpportunitiesPage() {
  let opportunities: Opportunity[] = [];
  let activeTestsCount = 0;

  try {
    const [oppData, assignData] = await Promise.all([
      serverApi<{ opportunities?: Opportunity[] } | Opportunity[]>("/projects/opportunities").catch(() => []),
      serverApi<{ assignments?: Array<{ status: string }> } | Array<{ status: string }>>("/assignments/me").catch(() => []),
    ]);

    opportunities = Array.isArray(oppData)
      ? oppData
      : Array.isArray(oppData?.opportunities)
      ? oppData.opportunities
      : [];

    const assignments = Array.isArray(assignData)
      ? assignData
      : Array.isArray(assignData?.assignments)
      ? assignData.assignments
      : [];

    activeTestsCount = assignments.filter((a) => a.status === "active").length;
  } catch {
    opportunities = [];
    activeTestsCount = 0;
  }

  return (
    <AppTestingGrid
      initialOpportunities={opportunities}
      activeTestsCount={activeTestsCount}
    />
  );
}
