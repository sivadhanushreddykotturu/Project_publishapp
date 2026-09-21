"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle, ArrowRight, Radar, Smartphone } from "lucide-react";
import { api } from "@/lib/api";

export interface OpportunityItem {
  id: string;
  name: string;
  packageName?: string;
  iconBg: string;
  iconColor: string;
  iconText?: string;
  iconSvg?: "crown" | "deloitte" | "blinkit" | "swiggy" | "facebook";
  statusText: string;
  statusType: "active" | "wait" | "filling";
  description: string;
  testersJoined: number;
  totalTesters: number;
  queueCount?: number;
  userState?: "not_joined" | "joined_tester" | "queue_available" | "joined_queue";
  testerRank?: number;
  userQueueRank?: number;
  realProjectId?: string;
  payoutINR?: number;
}

export function AppTestingGrid({
  initialOpportunities,
  activeTestsCount = 0,
}: {
  initialOpportunities?: Array<{
    _id: string;
    packageKey: string;
    requiredTesters: number;
    activeTesterCount: number;
    waitlistCount: number;
    joinState: string;
    appDetails: { appName: string; packageName: string; description?: string };
    payoutINR?: number;
    myAssignment: { status: string; queuePosition?: number } | null;
  }>;
  activeTestsCount?: number;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceAlert, setDeviceAlert] = useState(false);
  const isLimitReached = activeTestsCount >= 3;

  const [items, setItems] = useState<OpportunityItem[]>(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      return initialOpportunities.map((op, idx) => {
        let userState: OpportunityItem["userState"] = "not_joined";
        if (op.myAssignment) {
          userState =
            op.myAssignment.status === "queued" ? "joined_queue" : "joined_tester";
        } else if (op.activeTesterCount >= op.requiredTesters) {
          userState = "queue_available";
        }

        const bgColors = ["bg-[#7F0E1E]", "bg-black", "bg-[#F7D02C]", "bg-[#FC8019]", "bg-[#1877F2]"];
        const lower = op.appDetails.appName.toLowerCase();
        const iconSvg = lower.includes("blinkit")
          ? ("blinkit" as const)
          : lower.includes("swiggy")
          ? ("swiggy" as const)
          : lower.includes("deloitte")
          ? ("deloitte" as const)
          : lower.includes("kanma")
          ? ("crown" as const)
          : undefined;

        return {
          id: op._id,
          name: op.appDetails.appName,
          packageName: op.appDetails.packageName,
          iconBg: bgColors[idx % bgColors.length],
          iconColor: idx % bgColors.length === 2 ? "text-slate-950" : "text-white",
          iconSvg,
          iconText: op.appDetails.appName.slice(0, 2).toUpperCase(),
          statusText: op.joinState === "open" ? "Active Now" : "Filling up fast",
          statusType: op.joinState === "open" ? "active" : "filling",
          description:
            op.appDetails.description ||
            "Participate in the Play Store closed testing program on your registered Android device. Test the app for 14 continuous days and provide feedback.",
          testersJoined: op.activeTesterCount,
          totalTesters: op.requiredTesters,
          queueCount: op.waitlistCount,
          userState,
          testerRank: op.myAssignment?.queuePosition,
          userQueueRank: op.myAssignment?.queuePosition,
          realProjectId: op._id,
          payoutINR: op.payoutINR ?? 100,
        };
      });
    }
    return [];
  });

  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAction(item: OpportunityItem) {
    setBusyId(item.id);
    setErrorMessage(null);
    setDeviceAlert(false);

    // Optimistic UI state transition
    const prevItems = items;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== item.id) return it;
        if (it.userState === "not_joined") {
          return {
            ...it,
            userState: "joined_tester",
            testersJoined: Math.min(it.totalTesters, it.testersJoined + 1),
            testerRank: it.testersJoined + 1,
          };
        } else if (it.userState === "queue_available") {
          return {
            ...it,
            userState: "joined_queue",
            queueCount: (it.queueCount ?? 0) + 1,
            userQueueRank: (it.queueCount ?? 0) + 1,
          };
        }
        return it;
      }),
    );

    try {
      if (item.realProjectId) {
        const token = await getToken();
        await api(`/projects/${item.realProjectId}/join`, { token, method: "POST" });
        router.refresh();
      }
    } catch (err: unknown) {
      // Rollback optimistic state on error
      setItems(prevItems);
      const msg = err instanceof Error ? err.message : "Could not join project.";
      setErrorMessage(msg);
      if (
        msg.toLowerCase().includes("android") ||
        msg.toLowerCase().includes("device") ||
        msg.toLowerCase().includes("platform")
      ) {
        setDeviceAlert(true);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {deviceAlert ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <Smartphone className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-amber-950">
                Android device required to join this test
              </p>
              <p className="text-[13px] text-amber-800 mt-0.5">
                Please register your Android phone model and version in your Profile before joining closed testing tracks.
              </p>
            </div>
          </div>
          <Link
            href="/tester/profile"
            className="shrink-0 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all flex items-center gap-1.5"
          >
            Go to Profile
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13.5px] text-rose-800">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Active Slots Tracker Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-[#4F46E5] font-bold text-[13px]">
            {activeTestsCount}/3
          </div>
          <div>
            <p className="text-[13.5px] font-bold text-slate-900 leading-tight">
              Active Testing Slots: {activeTestsCount} of 3 Used
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {isLimitReached
                ? "Maximum active testing limit reached. Complete an ongoing test to free up slots for new tracks."
                : `You can actively participate in up to ${3 - activeTestsCount} more testing track${3 - activeTestsCount > 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>

        {isLimitReached && (
          <Link
            href="/tester/tests"
            className="shrink-0 rounded-xl bg-[#4F46E5] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#4338CA] transition-all"
          >
            My Active Tests →
          </Link>
        )}
      </div>

      {items.length === 0 && (
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5]">
            <Radar className="size-7" />
          </div>
          <h3 className="mt-4 text-[18px] font-bold text-slate-900">
            No testing opportunities available right now
          </h3>
          <p className="mt-2 text-[14px] text-slate-500 max-w-md mx-auto">
            New Google Play closed testing tracks appear here as developers submit apps. Check back shortly.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isBusy = busyId === item.id;
          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md"
            >
              {/* Card Top: Icon + App Info + Badges */}
              <div>
                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  <div
                    className={`size-14 shrink-0 rounded-2xl flex items-center justify-center font-bold shadow-xs ${item.iconBg} ${item.iconColor}`}
                  >
                    <AppIconGlyph item={item} />
                  </div>

                  {/* App Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight truncate">
                        {item.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        Earn ₹{item.payoutINR ?? 100}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                      Playstore closed Testing
                    </p>

                    {/* Badge Row */}
                    <div className="mt-2 flex items-center gap-3">
                      {/* Avatar stack + 4+ pill */}
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <span className="inline-block size-4.5 rounded-full bg-slate-300 ring-1.5 ring-white" />
                          <span className="inline-block size-4.5 rounded-full bg-slate-400 ring-1.5 ring-white" />
                        </div>
                        <span className="rounded-full bg-[#4F46E5] px-1.5 py-0.2 text-[10px] font-bold text-white leading-tight">
                          4+
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <span
                          className={`size-1.5 rounded-full ${
                            item.statusType === "active" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        <span>{item.statusText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wavy line separator */}
                <WavyDivider />

                {/* Description */}
                <div className="space-y-1 mt-1">
                  <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">
                    Description
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-slate-600 line-clamp-4 min-h-[4.5rem]">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom / Footer matching Figma */}
              <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between">
                {/* State 1: Slots available & Not Joined */}
                {item.userState === "not_joined" && (
                  <>
                    <div>
                      <div className="text-[18px] font-bold text-slate-900 leading-tight">
                        {item.testersJoined}/{item.totalTesters}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Testers Joined
                      </div>
                    </div>
                    {isLimitReached ? (
                      <button
                        type="button"
                        disabled
                        title="Maximum 3 active tests reached. Complete an ongoing test to join new tracks."
                        className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 text-[12.5px] font-semibold text-slate-400 cursor-not-allowed shadow-none"
                      >
                        Limit 3/3 Reached
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAction(item)}
                        className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                      >
                        {isBusy ? "Joining…" : "Join Testing"}
                      </button>
                    )}
                  </>
                )}

                {/* State 2: Joined Tester */}
                {item.userState === "joined_tester" && (
                  <>
                    <div>
                      <div className="text-[18px] font-bold text-[#4F46E5] leading-tight">
                        {item.testerRank ? `${item.testerRank}th` : `${item.testersJoined}th`}{" "}
                        Tester
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        You are tester now
                      </div>
                    </div>
                    <Link
                      href="/tester/tests"
                      className="rounded-xl border-1.5 border-[#4F46E5] bg-white px-5 py-2 text-[13.5px] font-semibold text-[#4F46E5] hover:bg-indigo-50/50 transition-all active:scale-95"
                    >
                      Joined Testing
                    </Link>
                  </>
                )}

                {/* State 3: Queue Available & Not Joined */}
                {item.userState === "queue_available" && (
                  <>
                    <div>
                      <div className="text-[18px] font-bold text-slate-900 leading-tight">
                        QL{" "}
                        <span className="text-[#4F46E5]">
                          {item.queueCount ?? 12}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Testers in queue
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAction(item)}
                      className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isBusy ? "Joining…" : "Join Queue"}
                    </button>
                  </>
                )}

                {/* State 4: Joined Queue */}
                {item.userState === "joined_queue" && (
                  <>
                    <div>
                      <div className="text-[18px] font-bold text-slate-900 leading-tight">
                        UQL{" "}
                        <span className="text-[#4F46E5]">
                          {item.userQueueRank ?? 14}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                        You are in Queue
                      </div>
                    </div>
                    <Link
                      href="/tester/tests"
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-[13.5px] font-semibold text-[#4F46E5] hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Joined Queue
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WavyDivider() {
  return (
    <svg
      className="w-full h-2.5 my-3 text-indigo-200/80"
      viewBox="0 0 300 8"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M0 4C37.5 7 75 1 112.5 4C150 7 187.5 1 225 4C262.5 7 281.25 2.5 300 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppIconGlyph({ item }: { item: OpportunityItem }) {
  if (item.iconSvg === "crown") {
    return (
      <svg className="size-8 fill-current" viewBox="0 0 24 24">
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
      </svg>
    );
  }
  if (item.iconSvg === "deloitte") {
    return (
      <div className="flex items-baseline font-black tracking-tighter text-[22px]">
        <span>D</span>
        <span className="size-2 rounded-full bg-emerald-400 ml-0.5 inline-block" />
      </div>
    );
  }
  if (item.iconSvg === "blinkit") {
    return (
      <div className="text-center leading-none px-1">
        <div className="text-[14px] font-black tracking-tight text-slate-950">blinkit</div>
        <div className="text-[6.5px] font-semibold text-slate-800 tracking-tighter mt-0.5">India&apos;s Last Minute App</div>
      </div>
    );
  }
  if (item.iconSvg === "swiggy") {
    return (
      <svg className="size-7 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    );
  }
  if (item.iconSvg === "facebook") {
    return (
      <span className="text-[30px] font-black font-sans leading-none">
        f
      </span>
    );
  }

  return <span>{item.iconText || item.name.slice(0, 2).toUpperCase()}</span>;
}
