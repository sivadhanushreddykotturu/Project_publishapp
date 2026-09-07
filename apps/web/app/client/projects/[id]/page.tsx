/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Lock, XCircle, Users, ExternalLink, ShieldCheck } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { StatusPill } from "@/components/dash/StatusPill";
import { RatingsForm } from "@/components/client/RatingsForm";
import { formatDate, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface ProjectDetail {
  _id: string;
  packageKey: string;
  projectType: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: {
    appName: string;
    packageName: string;
    description?: string;
    iconUrl?: string;
    webOptInUrl?: string;
    playStoreUrl?: string;
  };
  steps: Array<{
    order: number;
    type: string;
    state: string;
    config: { instructions: string };
  }>;
  createdAt: string;
}

interface InvoiceRow {
  _id: string;
  projectId?: string;
  totalPaise: number;
  status: string;
  gatewayRef?: string;
}

interface ProjectAssignment {
  _id: string;
  status: string;
  currentStep: number;
  queuePosition?: number;
  joinedAt?: string;
  createdAt: string;
  testerId?: {
    userId?: { name?: string; email?: string };
    devices?: Array<{ platform?: string; model: string; osVersion: string }>;
  };
}

const STEP_LABELS: Record<string, string> = {
  verification: "Verification",
  play_store_invite: "Play Store invite",
  testflight_invite: "TestFlight invite",
  app_usage: "App usage",
  app_testing: "App testing",
  completion: "Completion",
};

const CLIENT_STEP_DESCRIPTIONS: Record<string, string> = {
  verification:
    "We verify every tester's account and device with a screenshot proof before they're accepted onto your project.",
  play_store_invite:
    "Testers opt in to your closed track, install the app from the Play Store, and prove the install with a screenshot.",
  testflight_invite:
    "Testers accept your TestFlight invite, install the app, and prove the install with a screenshot.",
  app_usage:
    "Testers use your app daily for 14 days, submitting a short check-in note or screenshot each day.",
  app_testing:
    "Testers hunt for bugs and file structured reports — our QA team deduplicates them before they reach you.",
  completion:
    "Testers keep the app installed through the final day, and your completion report is generated.",
};

interface PublishedBug {
  _id: string;
  title: string;
  severity: string;
  category: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string[];
  device: { platform?: string; model: string; osVersion: string };
}

interface CompletionReport {
  generatedAt: string;
  window: {
    paymentConfirmedAt?: string;
    opportunityPublishedAt?: string;
    slotsFilledAt?: string;
    completedAt?: string;
  };
  testers: Array<{
    testerId?: string;
    tester?: { name?: string; email?: string };
    status: string;
    stepsCompleted: number;
    proofsVerified: number;
  }>;
  bugs: PublishedBug[];
  timeline: Array<{ type: string; at: string }>;
}

export default async function ClientProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: ProjectDetail | null = null;
  let invoice: InvoiceRow | null = null;
  let assignments: ProjectAssignment[] = [];
  let bugs: PublishedBug[] = [];
  let report: CompletionReport | null = null;

  try {
    const data = await serverApi<{ project: ProjectDetail }>(`/projects/${id}`);
    project = data.project;

    const [inv, b, assignRes] = await Promise.all([
      serverApi<{ invoices: InvoiceRow[] }>("/invoices/me").catch(() => ({ invoices: [] })),
      serverApi<{ bugs: PublishedBug[] }>(`/projects/${id}/bug-reports`).catch(() => ({ bugs: [] })),
      serverApi<{ assignments: ProjectAssignment[] }>(`/projects/${id}/assignments`).catch(() => ({ assignments: [] })),
    ]);

    invoice = inv.invoices.find((i) => i.projectId === id) ?? null;
    bugs = b.bugs;
    assignments = assignRes.assignments;

    if (project.status === "completed") {
      const r = await serverApi<{ report: CompletionReport }>(
        `/projects/${id}/completion-report`,
      ).catch(() => ({ report: null }));
      report = r.report;
    }
  } catch {
    notFound();
  }

  const fallbackLetter = (project!.appDetails.appName.trim()[0] || "A").toUpperCase();
  const fillPercent = Math.min(
    100,
    Math.round(((project!.activeTesterCount ?? 0) / (project!.requiredTesters || 14)) * 100),
  );

  const activeAssignments = assignments.filter((a) => a.status === "active");
  const queuedAssignments = assignments.filter((a) => a.status === "queued");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-md flex items-center justify-center">
            {project!.appDetails.iconUrl ? (
              <img
                src={project!.appDetails.iconUrl}
                alt={project!.appDetails.appName}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-[26px] font-extrabold shadow-sm">
                {fallbackLetter}
              </div>
            )}
          </div>
          <div>
            <Link
              href="/client/projects"
              className="text-[13px] font-medium text-ink-400 hover:text-orange-500"
            >
              ← All projects
            </Link>
            <h2 className="mt-1 text-[26px] font-bold tracking-tight text-ink-950">
              {project!.appDetails.appName}
            </h2>
            <p className="text-[13.5px] text-ink-400">
              {project!.appDetails.packageName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-[11.5px] font-semibold text-blue-800">
            {project!.projectType === "ios_testflight" ? "iOS · TestFlight" : "Android · Google Play"}
          </span>
          <StatusPill status={project!.joinState} />
          <StatusPill status={project!.status} />
        </div>
      </div>

      {/* Admin Review Banner */}
      {project!.status === "active" && project!.joinState === "closed" && (
        <div className="rounded-[24px] border border-indigo-200 bg-indigo-50/70 p-6 flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-xl bg-[#4F46E5] text-white shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-ink-950">
              Payment Confirmed · Under Admin Review
            </h3>
            <p className="mt-1 text-[13.5px] text-ink-600 leading-relaxed max-w-2xl">
              Your testing project and Google Play links have been received. The admin team is verifying your configuration and will publish the opportunity to Android testers shortly.
            </p>
          </div>
        </div>
      )}

      {/* Live Testers Joining Banner */}
      {project!.joinState === "open" && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6 flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-ink-950">
              Opportunity Live · Testers Joining
            </h3>
            <p className="mt-1 text-[13.5px] text-ink-600 leading-relaxed max-w-2xl">
              Your app is live in the tester catalog. Verified Android testers are opting in and installing your app. View real-time participants below.
            </p>
          </div>
        </div>
      )}

      {/* Payment Pending Banner */}
      {project!.status === "awaiting_payment" && invoice && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-7">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-amber-700">
            Payment pending
          </p>
          <p className="mt-2 text-[16px] font-medium text-ink-950">
            Invoice total: {formatINR(invoice.totalPaise)}{" "}
            <span className="text-[13.5px] font-normal text-ink-500">
              (incl. GST)
            </span>
          </p>
          <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-600">
            Your testing project is awaiting payment confirmation. Once payment is confirmed, the admin team prepares and publishes the project to testers.
          </p>
          <p className="mt-3 font-mono text-[12.5px] text-ink-400">
            Invoice ID: {invoice._id}
          </p>
        </div>
      )}

      {/* Testing Links Card */}
      {(project!.appDetails.webOptInUrl || project!.appDetails.playStoreUrl) && (
        <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="text-[15px] font-bold text-ink-950 mb-3">
            Testing Links for Closed Track
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {project!.appDetails.webOptInUrl && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                <span className="text-[12px] font-semibold text-amber-900 block uppercase tracking-wider">
                  1. Google Play Web Opt-In Link
                </span>
                <a
                  href={project!.appDetails.webOptInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 truncate text-[13.5px] font-medium text-blue-600 hover:underline"
                >
                  <span className="truncate">{project!.appDetails.webOptInUrl}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </div>
            )}
            {project!.appDetails.playStoreUrl && (
              <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-4">
                <span className="text-[12px] font-semibold text-sky-900 block uppercase tracking-wider">
                  2. Play Store App Download Link
                </span>
                <a
                  href={project!.appDetails.playStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1.5 truncate text-[13.5px] font-medium text-blue-600 hover:underline"
                >
                  <span className="truncate">{project!.appDetails.playStoreUrl}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tester Counts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
          <span className="text-[13px] text-ink-500">Testers on board</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold text-ink-950">
              {project!.activeTesterCount}/{project!.requiredTesters}
            </span>
            <span className="text-[13px] font-semibold text-emerald-600">
              ({fillPercent}%)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
        <MiniStat label="On the waitlist / Queue" value={String(project!.waitlistCount)} />
        <MiniStat label="Track Package" value={project!.packageKey} />
      </div>

      {/* REAL-TIME TESTERS JOINED SECTION */}
      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-ink-950">
              Testers Joined ({activeAssignments.length}/{project!.requiredTesters})
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Real Android users participating in your 14-day continuous closed testing track.
            </p>
          </div>
          {queuedAssignments.length > 0 && (
            <span className="rounded-full bg-blue-50 px-3.5 py-1 text-[12px] font-semibold text-blue-700">
              +{queuedAssignments.length} in queue
            </span>
          )}
        </div>

        {activeAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center bg-slate-50/50">
            <Users className="mx-auto size-10 text-slate-300 mb-2" />
            <p className="text-[15px] font-semibold text-ink-950">
              {project!.joinState === "open"
                ? "Waiting for testers to opt in"
                : "Testing opportunity not yet published"}
            </p>
            <p className="mt-1 text-[13px] text-ink-500 max-w-md mx-auto">
              {project!.joinState === "open"
                ? "Your testing link is visible in the tester app. Testers will appear here as soon as they join."
                : "Once admin approves and publishes your project, verified Android testers will start joining."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Tester</th>
                  <th className="px-5 py-3.5">Device</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeAssignments.map((a) => {
                  const testerName = a.testerId?.userId?.name || "Tester";
                  const testerEmail = a.testerId?.userId?.email || "";
                  const maskedEmail = testerEmail
                    ? testerEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
                    : "—";
                  const device = a.testerId?.devices?.[0];
                  const deviceText = device
                    ? `${device.model} (${device.platform || "Android"} ${device.osVersion})`
                    : "Android Device";

                  return (
                    <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold text-[12px] flex items-center justify-center shrink-0">
                            {testerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{testerName}</div>
                            <div className="text-[12px] text-slate-400 font-mono">{maskedEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-[13px]">
                        {deviceText}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Step {a.currentStep}/5
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[12.5px]">
                        {formatDate(a.joinedAt || a.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <h3 className="text-[17px] font-semibold text-ink-950">
          Testing workflow
        </h3>
        <p className="mt-1 text-[13px] text-ink-400">
          Where your tester cohort stands, stage by stage.
        </p>
        {project!.steps.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-500">
            The five-step workflow appears here once payment is confirmed.
          </p>
        ) : (
          <ol className="mt-5 space-y-4">
            {project!.steps.map((s) => (
              <li key={s.order} className="flex items-start gap-4">
                <StepIcon state={s.state} />
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink-950">
                    Step {s.order} · {STEP_LABELS[s.type] ?? s.type}
                  </p>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-ink-500">
                    {CLIENT_STEP_DESCRIPTIONS[s.type] ?? s.config.instructions}
                  </p>
                </div>
                <span className="ml-auto shrink-0">
                  <StatusPill status={s.state} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Published Bug Findings */}
      {bugs.length > 0 && (
        <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
          <h3 className="text-[17px] font-semibold text-ink-950">
            Published findings ({bugs.length})
          </h3>
          <p className="mt-1 text-[13px] text-ink-400">
            Reviewed and deduplicated by our QA team — one report per bug.
          </p>
          <div className="mt-5 space-y-4">
            {bugs.map((b) => (
              <div key={b._id} className="rounded-2xl bg-paper p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[15px] font-semibold text-ink-950">{b.title}</p>
                  <StatusPill status={b.severity} />
                  <span className="text-[12px] capitalize text-ink-400">{b.category}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">
                  {b.description}
                </p>
                <div className="mt-3 grid gap-2.5 text-[12.5px] sm:grid-cols-2">
                  <p className="rounded-xl bg-white px-4 py-2.5">
                    <span className="font-semibold">Expected: </span>
                    {b.expectedResult}
                  </p>
                  <p className="rounded-xl bg-white px-4 py-2.5">
                    <span className="font-semibold">Actual: </span>
                    {b.actualResult}
                  </p>
                </div>
                {b.stepsToReproduce.length > 0 && (
                  <ol className="mt-2.5 list-decimal space-y-0.5 pl-5 text-[12.5px] text-ink-600">
                    {b.stepsToReproduce.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
                <p className="mt-2.5 text-[11.5px] text-ink-400">
                  {b.device.model} · {b.device.platform === "ios" ? "iOS" : "Android"}{" "}
                  {b.device.osVersion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Report + Ratings */}
      {report && (
        <div className="space-y-6">
          <div className="rounded-[24px] bg-navy-900 p-8 text-white">
            <h3 className="text-[19px] font-semibold">Completion report</h3>
            <p className="mt-1 text-[13px] text-white/50">
              Generated {formatDate(report.generatedAt)} — everything Play Console
              needs to see.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[
                ["Payment confirmed", report.window.paymentConfirmedAt],
                ["Opportunity live", report.window.opportunityPublishedAt],
                ["Slots filled", report.window.slotsFilledAt],
                ["Completed", report.window.completedAt],
              ].map(([label, at]) => (
                <div key={label as string}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-lime-300">
                    {label}
                  </p>
                  <p className="mt-1 text-[15px] font-medium">
                    {at ? formatDate(at as string) : "—"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[13px] text-white/60">
              {report.testers.filter((t) => t.status === "completed").length} testers
              completed all 5 steps · {report.testers.reduce((n, t) => n + t.proofsVerified, 0)}{" "}
              verified proofs · {report.bugs.length} published findings ·{" "}
              {report.timeline.length} tracked events.
            </p>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
            <h3 className="mb-4 text-[17px] font-semibold text-ink-950">
              Rate your testers
            </h3>
            <RatingsForm
              projectId={project!._id}
              testers={report.testers
                .filter((t) => t.testerId && t.tester?.name)
                .map((t) => ({
                  testerId: String(t.testerId),
                  name: t.tester!.name!,
                }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </p>
      <p className="mt-1.5 text-[24px] font-semibold capitalize tracking-tight text-ink-950">
        {value}
      </p>
    </div>
  );
}

function StepIcon({ state }: { state: string }) {
  switch (state) {
    case "verified":
    case "completed":
      return <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />;
    case "active":
    case "submitted":
      return <Clock className="mt-0.5 size-5 text-amber-500" />;
    case "rejected":
      return <XCircle className="mt-0.5 size-5 text-rose-500" />;
    default:
      return <Lock className="mt-0.5 size-5 text-ink-300" />;
  }
}
