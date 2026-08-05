import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { ActionButton } from "@/components/admin/ActionButton";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface AdminProjectRow {
  _id: string;
  packageKey: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: { appName: string; packageName: string };
  clientId?: { companyName?: string; contactName?: string };
  createdAt: string;
}

export default async function AdminProjects() {
  let projects: AdminProjectRow[] = [];
  try {
    const data = await serverApi<{ projects: AdminProjectRow[] }>("/projects");
    projects = data.projects;
  } catch {
    projects = [];
  }

  if (projects.length === 0) {
    return (
      <EmptySection
        icon={FolderKanban}
        title="No projects yet"
        body="Projects appear when clients buy packages. Payment confirmation and publishing happen from this console."
      />
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const clientName =
          p.clientId?.companyName || p.clientId?.contactName || "—";
        const canPublish = p.status === "active" && p.joinState === "closed";
        return (
          <div
            key={p._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/projects/${p._id}`}
                className="truncate text-[16px] font-semibold text-ink-950 hover:text-orange-500"
              >
                {p.appDetails.appName}
              </Link>
              <p className="mt-0.5 text-[12.5px] text-ink-400">
                {clientName} · {p.packageKey} · {formatDate(p.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[13px] font-medium text-ink-500">
                {p.activeTesterCount}/{p.requiredTesters} active · {p.waitlistCount} queued
              </span>
              <StatusPill status={p.joinState} />
              <StatusPill status={p.status} />
              {canPublish && (
                <ActionButton
                  endpoint={`/projects/${p._id}/publish`}
                  label="Publish opportunity"
                  tone="lime"
                  confirm={`Publish the testing opportunity for ${p.appDetails.appName}? Testers will be able to join immediately.`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
