import { Bug } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { BugReportForm } from "@/components/tester/BugReportForm";
import type { TesterAssignment } from "@/components/tester/AssignmentCard";

export const dynamic = "force-dynamic";

interface MyBug {
  _id: string;
  title: string;
  severity: string;
  category: string;
  status: string;
  createdAt: string;
  projectId?: { appDetails?: { appName?: string } };
}

export default async function TesterReportsPage() {
  let bugs: MyBug[] = [];
  let assignments: TesterAssignment[] = [];
  try {
    const [b, a] = await Promise.all([
      serverApi<{ bugs: MyBug[] }>("/bug-reports/me"),
      serverApi<{ assignments: TesterAssignment[] }>("/assignments/me"),
    ]);
    bugs = b.bugs;
    assignments = a.assignments.filter((x) =>
      ["active", "completed"].includes(x.status),
    );
  } catch {
    bugs = [];
  }

  return (
    <div className="space-y-8">
      {assignments.length > 0 && (
        <BugReportForm
          projects={assignments.map((a) => ({
            projectId: a.projectId._id,
            appName: a.projectId.appDetails.appName,
          }))}
        />
      )}

      {bugs.length === 0 ? (
        <EmptySection
          icon={Bug}
          title="No reports yet"
          body="Found something broken? File a structured report above — severity, expected vs actual, repro steps, evidence."
        />
      ) : (
        <div className="space-y-3">
          {bugs.map((b) => (
            <div
              key={b._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-[15.5px] font-semibold text-ink-950">
                  {b.title}
                </p>
                <p className="mt-0.5 text-[12.5px] capitalize text-ink-400">
                  {b.projectId?.appDetails?.appName ?? "—"} · {b.category} ·{" "}
                  {new Date(b.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusPill status={b.severity} />
                <StatusPill status={b.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
