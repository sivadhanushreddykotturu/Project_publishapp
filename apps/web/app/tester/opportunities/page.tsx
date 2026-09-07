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
  myAssignment: { status: string; queuePosition?: number } | null;
}

export default async function OpportunitiesPage() {
  let opportunities: Opportunity[] = [];
  try {
    const data = await serverApi<{ opportunities: Opportunity[] }>(
      "/projects/opportunities",
    );
    opportunities = data.opportunities;
  } catch {
    opportunities = [];
  }

  return <AppTestingGrid initialOpportunities={opportunities} />;
}
