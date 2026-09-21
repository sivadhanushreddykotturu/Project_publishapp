import { serverApi } from "@/lib/server-api";
import { type TesterAssignment } from "@/components/tester/AssignmentCard";
import { MyAppsView } from "@/components/tester/MyAppsView";

export const dynamic = "force-dynamic";

export default async function MyTestsPage() {
  let assignments: TesterAssignment[] = [];
  try {
    const data = await serverApi<{ assignments?: TesterAssignment[] } | TesterAssignment[]>("/assignments/me");
    assignments = Array.isArray(data)
      ? data
      : Array.isArray(data?.assignments)
      ? data.assignments
      : [];
  } catch {
    assignments = [];
  }

  return <MyAppsView assignments={assignments} />;
}
