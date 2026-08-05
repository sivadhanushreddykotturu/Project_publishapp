import Link from "next/link";
import { notFound } from "next/navigation";
import { serverApi } from "@/lib/server-api";
import { StatusPill } from "@/components/dash/StatusPill";
import { ActionButton } from "@/components/admin/ActionButton";
import { PlayIntegrationForm } from "@/components/admin/PlayIntegrationForm";
import { VerifiedEmails } from "@/components/admin/VerifiedEmails";

export const dynamic = "force-dynamic";

interface AdminProjectDetail {
  _id: string;
  packageKey: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: { appName: string; packageName: string };
  steps: Array<{ order: number; type: string; state: string }>;
  playIntegration: { mode: string; optInUrl?: string; track?: string };
  clientId?: { companyName?: string; contactName?: string };
}

interface AdminAssignment {
  _id: string;
  status: string;
  currentStep: number;
  queuePosition?: number;
  inactivityFlag: boolean;
  testerId?: { userId?: { name?: string; email?: string } };
}

export default async function AdminProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project: AdminProjectDetail;
  let assignments: AdminAssignment[];
  try {
    const [p, a] = await Promise.all([
      serverApi<{ project: AdminProjectDetail }>(`/projects/${id}`),
      serverApi<{ assignments: AdminAssignment[] }>(`/projects/${id}/assignments`),
    ]);
    project = p.project;
    assignments = a.assignments;
  } catch {
    notFound();
  }

  const active = assignments.filter((a) => a.status === "active");
  const queued = assignments
    .filter((a) => a.status === "queued")
    .sort((x, y) => (x.queuePosition ?? 0) - (y.queuePosition ?? 0));
  const step1Verified = project.steps.find((s) => s.order === 1)?.state === "verified";
  const step2Active = project.steps.find((s) => s.order === 2)?.state === "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="text-[13px] font-medium text-ink-400 hover:text-orange-500"
          >
            ← All projects
          </Link>
          <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-950">
            {project.appDetails.appName}
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-400">
            {project.appDetails.packageName} ·{" "}
            {project.clientId?.companyName || project.clientId?.contactName || "—"} ·{" "}
            {project.packageKey}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill status={project.joinState} />
          <StatusPill status={project.status} />
        </div>
      </div>

      {/* step states */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-ink-950">Workflow</h3>
        <div className="flex flex-wrap gap-2.5">
          {project.steps.map((s) => (
            <span
              key={s.order}
              className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-ink-800"
            >
              {s.order}. {s.type.replace(/_/g, " ")} <StatusPill status={s.state} />
            </span>
          ))}
        </div>
      </div>

      {/* play integration (manual mode) */}
      {project.status === "active" && (
        <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="text-[15px] font-semibold text-ink-950">
            Play integration · manual mode
          </h3>
          {step2Active ? (
            <p className="mt-2 text-[14px] text-ink-600">
              Testing links distributed. Opt-in URL:{" "}
              <a
                href={project.playIntegration.optInUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {project.playIntegration.optInUrl}
              </a>
            </p>
          ) : step1Verified ? (
            <PlayIntegrationForm projectId={project._id} />
          ) : (
            <p className="mt-2 text-[14px] text-ink-500">
              The opt-in URL form unlocks once every active tester clears Step 1.
            </p>
          )}
          {step1Verified && (
            <div className="mt-5">
              <VerifiedEmails projectId={project._id} />
            </div>
          )}
        </div>
      )}

      {/* active testers */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-ink-950">
          Active testers ({active.length}/{project.requiredTesters})
        </h3>
        {active.length === 0 ? (
          <p className="text-[14px] text-ink-500">No active testers yet.</p>
        ) : (
          <div className="space-y-2.5">
            {active.map((a) => (
              <div
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-medium text-ink-950">
                    {a.testerId?.userId?.name || "—"}
                  </span>
                  <span className="text-[12.5px] text-ink-400">
                    {a.testerId?.userId?.email}
                  </span>
                  {a.inactivityFlag && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                      inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12.5px] font-medium text-ink-500">
                    Step {a.currentStep}/5
                  </span>
                  <ActionButton
                    endpoint={`/assignments/${a._id}/replace`}
                    label="Replace"
                    tone="danger"
                    confirm={`Replace ${a.testerId?.userId?.name ?? "this tester"}? The next person in queue takes the slot.`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* queue */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-ink-950">
          Waiting list ({queued.length})
        </h3>
        {queued.length === 0 ? (
          <p className="text-[14px] text-ink-500">No one waiting.</p>
        ) : (
          <div className="space-y-2.5">
            {queued.map((a) => (
              <div
                key={a._id}
                className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3"
              >
                <span className="grid size-7 place-items-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-800">
                  {a.queuePosition}
                </span>
                <span className="text-[14px] font-medium text-ink-950">
                  {a.testerId?.userId?.name || "—"}
                </span>
                <span className="text-[12.5px] text-ink-400">
                  {a.testerId?.userId?.email}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
