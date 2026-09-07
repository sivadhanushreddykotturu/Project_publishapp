import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Users, Smartphone, ShieldCheck, Play } from "lucide-react";
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
  appDetails: {
    appName: string;
    packageName: string;
    webOptInUrl?: string;
    playStoreUrl?: string;
    description?: string;
  };
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
  testerId?: {
    userId?: { name?: string; email?: string };
    devices?: Array<{ platform?: string; model: string; osVersion: string }>;
  };
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

  const isPendingReview = project.status === "active" && project.joinState === "closed";
  const isAwaitingPayment = project.status === "awaiting_payment";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="text-[13px] font-medium text-ink-400 hover:text-[#4F46E5]"
          >
            ← All projects
          </Link>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-ink-950">
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

      {/* Admin Action: Publish Opportunity */}
      {isPendingReview && (
        <div className="rounded-[24px] border-2 border-indigo-500/30 bg-indigo-50/70 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11.5px] font-bold text-[#4F46E5] uppercase tracking-wider block">
              Admin Action · Ready to Go Live
            </span>
            <h3 className="mt-1 text-[17px] font-bold text-ink-950">
              Publish Testing Opportunity to Android Testers
            </h3>
            <p className="mt-1 text-[13.5px] text-ink-600 max-w-xl">
              Payment is confirmed. Review the client&apos;s testing URLs below, then click to make the opportunity live in the tester catalog.
            </p>
          </div>
          <ActionButton
            endpoint={`/projects/${project._id}/publish`}
            label="Publish Opportunity Now"
            tone="lime"
            confirm={`Publish ${project.appDetails.appName} to testers? It will immediately appear in the App Testing grid.`}
          />
        </div>
      )}

      {/* Admin Action: Manual Payment Confirmation */}
      {isAwaitingPayment && (
        <div className="rounded-[24px] border-2 border-amber-500/30 bg-amber-50/70 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11.5px] font-bold text-amber-800 uppercase tracking-wider block">
              Payment Pending · Manual Approval
            </span>
            <h3 className="mt-1 text-[17px] font-bold text-ink-950">
              Confirm Payment & Activate Project
            </h3>
            <p className="mt-1 text-[13.5px] text-ink-600 max-w-xl">
              Confirm that the client payment was received offline/UPI. This activates the project workflow.
            </p>
          </div>
          <ActionButton
            endpoint={`/projects/${project._id}/mark-paid`}
            label="Confirm Payment"
            tone="lime"
            confirm="Confirm payment for this project? The project will be activated and ready to publish."
          />
        </div>
      )}

      {/* Client's Submitted Testing Links */}
      {(project.appDetails.webOptInUrl || project.appDetails.playStoreUrl) && (
        <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="text-[15px] font-bold text-ink-950 mb-3">
            Client&apos;s Submitted Testing Links
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {project.appDetails.webOptInUrl && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                <span className="text-[12px] font-semibold text-amber-900 block uppercase tracking-wider">
                  1. Google Play Web Opt-In URL
                </span>
                <a
                  href={project.appDetails.webOptInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 truncate text-[13.5px] font-medium text-blue-600 hover:underline"
                >
                  <span className="truncate">{project.appDetails.webOptInUrl}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </div>
            )}
            {project.appDetails.playStoreUrl && (
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4">
                <span className="text-[12px] font-semibold text-sky-900 block uppercase tracking-wider">
                  2. Play Store App Download URL
                </span>
                <a
                  href={project.appDetails.playStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 truncate text-[13.5px] font-medium text-blue-600 hover:underline"
                >
                  <span className="truncate">{project.appDetails.playStoreUrl}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step states */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-ink-950">Workflow Stages</h3>
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

      {/* Play integration (manual mode) */}
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

      {/* Active Testers Table */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-ink-950">
            Active Testers ({active.length}/{project.requiredTesters})
          </h3>
          <span className="text-[12px] text-ink-400">
            {project.requiredTesters - active.length} slots remaining
          </span>
        </div>

        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/10 p-6 text-center text-[13.5px] text-ink-400">
            No active testers have joined this project yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {active.map((a) => {
              const device = a.testerId?.devices?.[0];
              const deviceStr = device
                ? `${device.model} (${device.platform || "Android"} ${device.osVersion})`
                : "Android";

              return (
                <div
                  key={a._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-white border border-black/10 font-bold text-[12px] flex items-center justify-center text-ink-800">
                      {(a.testerId?.userId?.name || "T").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-950 text-[14px]">
                        {a.testerId?.userId?.name || "Tester"}
                      </div>
                      <div className="text-[12px] text-ink-400 font-mono">
                        {a.testerId?.userId?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[12.5px]">
                    <div className="flex items-center gap-1.5 text-ink-600">
                      <Smartphone className="size-3.5 text-ink-400" />
                      <span>{deviceStr}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                      Step {a.currentStep}/5
                    </span>

                    {a.inactivityFlag && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                        inactive
                      </span>
                    )}

                    <ActionButton
                      endpoint={`/assignments/${a._id}/replace`}
                      label="Remove Tester"
                      tone="danger"
                      confirm={`Remove ${a.testerId?.userId?.name ?? "this tester"} from this project? The #1 person in the queue will be promoted automatically.`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="rounded-[20px] border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[16px] font-bold text-ink-950">
          Waiting Queue ({queued.length})
        </h3>
        {queued.length === 0 ? (
          <p className="text-[13.5px] text-ink-400">No testers currently in the queue.</p>
        ) : (
          <div className="space-y-2.5">
            {queued.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between rounded-2xl bg-paper px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-800">
                    {a.queuePosition}
                  </span>
                  <div>
                    <span className="font-semibold text-ink-950 text-[14px]">
                      {a.testerId?.userId?.name || "Tester"}
                    </span>
                    <span className="block text-[12px] text-ink-400 font-mono">
                      {a.testerId?.userId?.email}
                    </span>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-slate-500">
                  Ready to auto-promote if a slot opens
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
