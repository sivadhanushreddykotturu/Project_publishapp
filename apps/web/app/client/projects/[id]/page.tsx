import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Lock, XCircle } from "lucide-react";
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
  appDetails: { appName: string; packageName: string; description?: string };
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
}

const STEP_LABELS: Record<string, string> = {
  verification: "Verification",
  play_store_invite: "Play Store invite",
  testflight_invite: "TestFlight invite",
  app_usage: "App usage",
  app_testing: "App testing",
  completion: "Completion",
};

/** What each stage means for the client (testers see the imperative instructions). */
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
  let bugs: PublishedBug[] = [];
  let report: CompletionReport | null = null;
  try {
    const data = await serverApi<{ project: ProjectDetail }>(`/projects/${id}`);
    project = data.project;
    const [inv, b] = await Promise.all([
      serverApi<{ invoices: InvoiceRow[] }>("/invoices/me"),
      serverApi<{ bugs: PublishedBug[] }>(`/projects/${id}/bug-reports`),
    ]);
    invoice = inv.invoices.find((i) => i.projectId === id) ?? null;
    bugs = b.bugs;
    if (project.status === "completed") {
      const r = await serverApi<{ report: CompletionReport }>(
        `/projects/${id}/completion-report`,
      );
      report = r.report;
    }
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/client/projects"
            className="text-[13px] font-medium text-ink-400 hover:text-orange-500"
          >
            ← All projects
          </Link>
          <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-950">
            {project!.appDetails.appName}
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-400">
            {project!.appDetails.packageName}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-[11.5px] font-semibold text-blue-800">
            {project!.projectType === "ios_testflight" ? "iOS · TestFlight" : "Android · Google Play"}
          </span>
          <StatusPill status={project!.joinState} />
          <StatusPill status={project!.status} />
        </div>
      </div>

      {/* payment banner */}
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
            Pay via UPI to{" "}
            <span className="font-semibold text-ink-950">
              defineux@upi
            </span>{" "}
            with your invoice ID as the note, and we&apos;ll confirm it here —
            usually within a few hours. Your tester workflow activates the
            moment payment confirms.
          </p>
          <p className="mt-3 font-mono text-[12.5px] text-ink-400">
            Invoice ID: {invoice._id}
          </p>
        </div>
      )}

      {/* tester counts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Testers on board" value={`${project!.activeTesterCount}/${project!.requiredTesters}`} />
        <MiniStat label="On the waitlist" value={String(project!.waitlistCount)} />
        <MiniStat label="Package" value={project!.packageKey} />
      </div>

      {/* workflow steps */}
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
      {/* published bug findings */}
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

      {/* completion report + ratings */}
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
