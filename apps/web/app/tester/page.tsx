import Link from "next/link";
import { ArrowRight, Radar, Smartphone, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { serverApi, type MeResponse } from "@/lib/server-api";
import { EmptySection, StatCard } from "@/components/dash/EmptySection";
import { formatINR } from "@/lib/format";
import type { TesterAssignment } from "@/components/tester/AssignmentCard";

export const dynamic = "force-dynamic";

interface TesterProfile {
  walletBalance?: number;
  ratingAvg?: number;
  ratingCount?: number;
  devices?: Array<{ platform?: string; model?: string; osVersion?: string }>;
  status?: string;
}

export default async function TesterOverview() {
  let me: MeResponse | null = null;
  let assignments: TesterAssignment[] = [];

  try {
    const [meData, assignData] = await Promise.all([
      serverApi<MeResponse>("/users/me").catch(() => null),
      serverApi<{ assignments?: TesterAssignment[] } | TesterAssignment[]>("/assignments/me").catch(() => []),
    ]);
    me = meData;
    assignments = Array.isArray(assignData)
      ? assignData
      : Array.isArray(assignData?.assignments)
      ? assignData.assignments
      : [];
  } catch {
    me = null;
    assignments = [];
  }

  const name = me?.user.name || "there";
  const profile = (me?.profile ?? {}) as TesterProfile;
  const balance = profile.walletBalance ?? 0;
  const devicesCount = profile.devices?.length ?? 0;

  const activeAssignments = assignments.filter((a) => a.status === "active");
  const queuedAssignments = assignments.filter((a) => a.status === "queued");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-[24px] bg-gradient-to-br from-indigo-50/70 via-white to-orange-50/50 dark:from-[#131C2E] dark:via-[#111827] dark:to-[#171E30] p-8 md:p-10 border border-slate-200/70 dark:border-[#1F293D] shadow-xs">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#4F46E5] dark:text-[#818CF8] flex items-center gap-1.5">
          <Sparkles className="size-4" />
          Tester Dashboard
        </p>
        <h2 className="mt-2 text-[30px] font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Welcome, {name}.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          Join testing tracks, test real Android applications, and earn UPI payouts as each step verifies.
        </p>
      </div>

      {/* Device Registration Callout if no devices */}
      {devicesCount === 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[20px] border border-amber-200 bg-amber-50/90 p-5 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <Smartphone className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-[14px] font-bold text-amber-950">
                Action required: Add your Android device to qualify for tests
              </p>
              <p className="text-[13px] text-amber-800 mt-0.5">
                Developers require physical Android devices for Google Play closed testing. Setup takes under 1 minute.
              </p>
            </div>
          </div>
          <Link
            href="/tester/profile"
            className="shrink-0 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all flex items-center gap-1.5"
          >
            Add Android Device
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Wallet balance" value={formatINR(balance)} hint="Withdrawable from ₹100" />
        <StatCard
          label="Active tests"
          value={`${activeAssignments.length} / 3`}
          hint={
            activeAssignments.length >= 3
              ? "Max slots reached (3/3)"
              : `${3 - activeAssignments.length} slot${3 - activeAssignments.length > 1 ? "s" : ""} available`
          }
        />
        <div className="flex flex-col justify-between rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Registered Devices
          </span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[26px] font-bold tracking-tight text-slate-900">
              {devicesCount}
            </span>
            {profile.devices?.[0]?.model && (
              <span className="text-[13.5px] font-medium text-slate-500 truncate">
                ({profile.devices[0].model})
              </span>
            )}
          </div>
          <Link
            href="/tester/profile"
            className="text-[12px] font-medium text-[#4F46E5] hover:underline"
          >
            {devicesCount === 0 ? "+ Register Android device" : "Manage in Profile →"}
          </Link>
        </div>
      </div>

      {/* Enrolled Active Tests Section */}
      {assignments.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[19px] font-bold tracking-tight text-slate-900">
              Your Active Testing Opportunities
            </h3>
            <Link
              href="/tester/tests"
              className="text-[13.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
            >
              View all apps & tests
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeAssignments.map((a) => {
              const app = a.projectId?.appDetails;
              const appName = app?.appName || "Android App";
              const totalSteps = 3;
              const currentStepNum = a.currentStep || 1;
              // Progress reflects completed steps: on Step 1 -> 0 completed (0%), on Step 2 -> 1 completed (33%)
              const completedSteps = a.status === "completed" ? totalSteps : Math.max(0, currentStepNum - 1);
              const stepPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
              const totalPaise = (a.projectId?.steps || []).reduce(
                (acc: number, step: { config?: { payoutPaise?: number } }) => {
                  return acc + (Number(step?.config?.payoutPaise) || 0);
                },
                0,
              );
              const payoutINR = totalPaise > 0 ? Math.round(totalPaise / 100) : 100;

              return (
                <div
                  key={a._id}
                  className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[17px] font-bold text-slate-900">{appName}</h4>
                        <p className="text-[12px] font-medium text-slate-400 font-mono mt-0.5">
                          {app?.packageName || "Play Store Closed Testing"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3" />
                        Active
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-[12px] font-semibold">
                        <span className="text-slate-600">
                          Step {currentStepNum} of {totalSteps} · {completedSteps === 0 ? "Not completed" : `${completedSteps}/${totalSteps} Done`}
                        </span>
                        <span className="text-[#4F46E5] font-bold">{stepPercent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#4F46E5] transition-all duration-300"
                          style={{ width: `${stepPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/5 px-3 py-2 border border-emerald-500/15">
                      <span className="text-[12px] font-medium text-emerald-800">Completion Reward</span>
                      <span className="text-[12.5px] font-bold text-emerald-700">₹{payoutINR} UPI Payout</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href={`/tester/tests/${a._id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all"
                    >
                      {currentStepNum === 1 ? "Start Step 1: Web Opt-In" : "Continue Testing"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {queuedAssignments.map((a) => {
              const app = a.projectId?.appDetails;
              const appName = app?.appName || "Android App";

              return (
                <div
                  key={a._id}
                  className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[17px] font-bold text-slate-900">{appName}</h4>
                        <p className="text-[12px] font-medium text-slate-400 font-mono mt-0.5">
                          {app?.packageName}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-[#4F46E5]">
                        <Clock className="size-3" />
                        In Queue
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center">
                      <div className="text-[20px] font-bold text-[#4F46E5]">
                        #{a.queuePosition || 1}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Your position in waiting list
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href="/tester/tests"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      View in My Apps
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptySection
          icon={Radar}
          title="No active tests yet"
          body="New testing opportunities appear in App Testing. Join a test track to test apps on your Android phone and earn UPI rewards."
          action={
            <Link
              href="/tester/opportunities"
              className="inline-flex items-center gap-2 rounded-full bg-[#4F46E5] px-6 py-3 text-[14.5px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]"
            >
              Browse opportunities
              <ArrowRight className="size-4" />
            </Link>
          }
        />
      )}
    </div>
  );
}
