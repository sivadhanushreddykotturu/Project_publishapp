import Link from "next/link";
import { Building2 } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface AdminClientRow {
  _id: string;
  companyName: string;
  contactName: string;
  billingInfo?: { gstin?: string };
  projects: Array<{ _id: string; status: string; appDetails?: { appName?: string } }>;
  communications: Array<{ type: string; subject: string; at: string }>;
  userId?: { name?: string; email?: string; createdAt?: string };
}

export default async function AdminClientsPage() {
  let clients: AdminClientRow[] = [];
  try {
    const data = await serverApi<{ clients: AdminClientRow[] }>("/admin/clients");
    clients = data.clients;
  } catch {
    clients = [];
  }

  if (clients.length === 0) {
    return (
      <EmptySection
        icon={Building2}
        title="No clients yet"
        body="Client accounts appear after onboarding, with their projects and communication history."
      />
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((c) => (
        <div
          key={c._id}
          className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-semibold text-ink-950">
                {c.companyName || c.contactName || c.userId?.name || "—"}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-400">
                {c.userId?.email}
                {c.billingInfo?.gstin ? ` · GSTIN ${c.billingInfo.gstin}` : ""} · joined{" "}
                {c.userId?.createdAt ? formatDate(c.userId.createdAt) : "—"}
              </p>
            </div>
            <span className="rounded-full bg-paper px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-600">
              {c.projects.length} project{c.projects.length === 1 ? "" : "s"}
            </span>
          </div>

          {c.projects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {c.projects.map((p) => (
                <Link
                  key={p._id}
                  href={`/admin/projects/${p._id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-ink-800 hover:border-black/20 hover:bg-zinc-100 transition-colors"
                >
                  <span className="font-semibold text-ink-950">{p.appDetails?.appName ?? "Project"}</span>
                  <StatusPill status={p.status} />
                </Link>
              ))}
            </div>
          )}

          {c.communications.length > 0 && (
            <p className="mt-4 border-t border-black/5 pt-3 text-[12.5px] text-ink-500">
              Last contact: {c.communications[c.communications.length - 1].subject} ·{" "}
              {formatDate(c.communications[c.communications.length - 1].at)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
