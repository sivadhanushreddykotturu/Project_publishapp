import { serverApi } from "@/lib/server-api";
import { StepTestingView } from "@/components/tester/StepTestingView";

export const dynamic = "force-dynamic";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let assignment = null;
  // If id looks like a Mongo ObjectId (24 hex characters), attempt to fetch real assignment
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const data = await serverApi<{
        assignment: {
          _id: string;
          currentStep: number;
          status: string;
          proofs: Array<{ step: number; fileUrl: string; status: string }>;
          projectId: {
            _id: string;
            appDetails: { appName: string; packageName: string };
            playIntegration?: { optInUrl?: string };
          };
        };
      }>(`/assignments/${id}`);
      assignment = data.assignment;
    } catch {
      assignment = null;
    }
  }

  const appNames: Record<string, string> = {
    blinkit: "Blinkit",
    deloitte: "Deloitte",
    kanma: "Kanma",
    swiggy: "Swiggy",
    facebook: "Facebook",
  };

  const initialStep = id === "deloitte" ? 2 : 1;

  return (
    <StepTestingView
      id={id}
      appName={appNames[id.toLowerCase()]}
      initialStep={initialStep}
      assignment={assignment}
    />
  );
}
