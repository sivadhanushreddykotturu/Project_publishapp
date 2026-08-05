import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { AssignmentCard, type TesterAssignment } from "@/components/tester/AssignmentCard";

export const dynamic = "force-dynamic";

export default async function MyTestsPage() {
  let assignments: TesterAssignment[] = [];
  try {
    const data = await serverApi<{ assignments: TesterAssignment[] }>("/assignments/me");
    assignments = data.assignments;
  } catch {
    assignments = [];
  }

  if (assignments.length === 0) {
    return (
      <EmptySection
        icon={FlaskConical}
        title="No tests yet"
        body="Join an opportunity and your assignments show up here with step-by-step instructions."
        action={
          <Link
            href="/tester/opportunities"
            className="inline-flex items-center rounded-full bg-ink-950 px-6 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Browse opportunities
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {assignments.map((a) => (
        <AssignmentCard key={a._id} assignment={a} />
      ))}
    </div>
  );
}
