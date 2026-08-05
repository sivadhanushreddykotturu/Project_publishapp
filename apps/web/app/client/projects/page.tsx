import Link from "next/link";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ProjectRow {
  _id: string;
  packageKey: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  appDetails: { appName: string; packageName: string };
  createdAt: string;
}

export default async function ClientProjects() {
  let projects: ProjectRow[] = [];
  try {
    const data = await serverApi<{ projects: ProjectRow[] }>("/projects/me");
    projects = data.projects;
  } catch {
    projects = [];
  }

  if (projects.length === 0) {
    return (
      <EmptySection
        icon={FolderKanban}
        title="No projects yet"
        body="Start your first closed test: pick a package, tell us about your app, and we handle the rest."
        action={
          <Link
            href="/client/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <Plus className="size-4" />
            New project
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          href="/client/projects/new"
          className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          <Plus className="size-4" />
          New project
        </Link>
      </div>

      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p._id}
            href={`/client/projects/${p._id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="truncate text-[16.5px] font-semibold text-ink-950">
                {p.appDetails.appName}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-400">
                {p.appDetails.packageName} · {p.packageKey} · created{" "}
                {formatDate(p.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-[13px] font-medium text-ink-500">
                {p.activeTesterCount}/{p.requiredTesters} testers
              </span>
              <StatusPill status={p.status} />
              <ArrowRight className="size-4 text-ink-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
