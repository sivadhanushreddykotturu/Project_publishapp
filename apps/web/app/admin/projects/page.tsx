import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { FolderKanban } from "lucide-react";
import { AdminProjectsView, type AdminProjectRow } from "@/components/admin/AdminProjectsView";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  let projects: AdminProjectRow[] = [];
  try {
    // Backend returns flat array (api.ts unwraps { data: [] }).
    const data = await serverApi<AdminProjectRow[]>("/projects?limit=100");
    projects = Array.isArray(data) ? data : [];
  } catch {
    projects = [];
  }

  if (projects.length === 0) {
    return (
      <EmptySection
        icon={FolderKanban}
        title="No projects yet"
        body="Projects appear when clients purchase packages. Payment confirmation and publishing happen from this console."
      />
    );
  }

  return <AdminProjectsView projects={projects} />;
}
