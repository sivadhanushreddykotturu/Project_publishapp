import { serverApi } from "@/lib/server-api";
import { StepTestingView, type StepTestingProps } from "@/components/tester/StepTestingView";

export const dynamic = "force-dynamic";

type AssignmentRecord = NonNullable<StepTestingProps["assignment"]>;

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let assignment: AssignmentRecord | null = null;
  // If id looks like a Mongo ObjectId (24 hex characters), attempt to fetch real assignment
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const res = await serverApi<
        { assignment?: AssignmentRecord } | AssignmentRecord
      >(`/assignments/${id}`);

      assignment =
        res && typeof res === "object" && "assignment" in res && res.assignment
          ? res.assignment
          : (res as AssignmentRecord);
    } catch {
      assignment = null;
    }
  }

  // Fallback: Check tester's active assignments to find matching project or assignment
  if (!assignment) {
    try {
      const myRes = await serverApi<{ assignments?: AssignmentRecord[] } | AssignmentRecord[]>("/assignments/me");
      const list: AssignmentRecord[] = Array.isArray(myRes)
        ? myRes
        : Array.isArray(myRes?.assignments)
        ? myRes.assignments
        : [];

      const found = list.find(
        (a) =>
          a._id === id ||
          a.projectId?._id === id ||
          a.projectId?.appDetails?.appName?.toLowerCase() === id.toLowerCase() ||
          Boolean(a.projectId?.appDetails?.appName?.toLowerCase()?.includes(id.toLowerCase())),
      );
      if (found) {
        assignment = found;
      }
    } catch {
      // Ignore fallback error
    }
  }

  const appNames: Record<string, string> = {
    blinkit: "Blinkit",
    deloitte: "Deloitte",
    kanma: "Kanma",
    swiggy: "Swiggy",
    facebook: "Facebook",
  };

  const appName =
    assignment?.projectId?.appDetails?.appName ||
    appNames[id.toLowerCase()] ||
    "Android App";

  const initialStep = assignment?.currentStep ?? 1;

  return (
    <StepTestingView
      id={id}
      appName={appName}
      initialStep={initialStep}
      assignment={assignment}
    />
  );
}
