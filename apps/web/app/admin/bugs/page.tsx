import { Bug } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { BugTriage, type AdminBug } from "@/components/admin/BugTriage";

export const dynamic = "force-dynamic";

interface ProjectOption {
  _id: string;
  appDetails: { appName: string };
}

export default async function AdminBugsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;

  let projects: ProjectOption[] = [];
  try {
    const data = await serverApi<{ projects: ProjectOption[] }>("/projects");
    projects = data.projects;
  } catch {
    projects = [];
  }

  const selectedId = projectId ?? projects[0]?._id;
  let bugs: AdminBug[] = [];
  if (selectedId) {
    try {
      const data = await serverApi<{ bugs: AdminBug[] }>(
        `/projects/${selectedId}/bug-reports`,
      );
      bugs = data.bugs;
    } catch {
      bugs = [];
    }
  }

  if (projects.length === 0) {
    return (
      <EmptySection
        icon={Bug}
        title="No projects, no bugs"
        body="Once testers file structured reports, triage happens here: merge duplicates, publish the clean set."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <a
            key={p._id}
            href={`/admin/bugs?project=${p._id}`}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              p._id === selectedId
                ? "bg-ink-950 text-white"
                : "bg-white text-ink-600 hover:text-ink-950"
            }`}
          >
            {p.appDetails.appName}
          </a>
        ))}
      </div>

      {bugs.length === 0 ? (
        <EmptySection
          icon={Bug}
          title="No reports for this project"
          body="Tester submissions land here in real time."
        />
      ) : (
        <BugTriage bugs={bugs} />
      )}
    </div>
  );
}
