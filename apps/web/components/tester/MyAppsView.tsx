"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type TesterAssignment } from "./AssignmentCard";

export interface MyAppItem {
  id: string;
  name: string;
  packageName?: string;
  iconBg: string;
  iconColor: string;
  iconSvg?: "crown" | "deloitte" | "blinkit" | "swiggy" | "facebook";
  statusText: string;
  statusType: "active" | "wait" | "filling";
  description: string;
  actionType:
    | "wait_others"
    | "open_testing"
    | "replaced"
    | "queued"
    | "start_testing";
  queueNumber?: number;
  testPath: string;
  assignmentId?: string;
}

const DEFAULT_MY_APPS: MyAppItem[] = [
  {
    id: "kanma",
    name: "Kanma",
    iconBg: "bg-[#7F0E1E]",
    iconColor: "text-white",
    iconSvg: "crown",
    statusText: "Active - Aug 20",
    statusType: "active",
    description:
      "After the training, you will be our core UX Testing panel, which will be involved in the actual mobile app testing projects we receive.",
    actionType: "wait_others",
    testPath: "/tester/tests/kanma",
  },
  {
    id: "blinkit",
    name: "Blinkit",
    iconBg: "bg-[#F7D02C]",
    iconColor: "text-slate-950",
    iconSvg: "blinkit",
    statusText: "Filling up - Aug 20",
    statusType: "filling",
    description:
      "The people selected for this panel will be expected to remain active, responsive and consistent when testing projects are assigned.",
    actionType: "open_testing",
    testPath: "/tester/tests/blinkit",
  },
  {
    id: "swiggy",
    name: "Swiggy",
    iconBg: "bg-[#FC8019]",
    iconColor: "text-white",
    iconSvg: "swiggy",
    statusText: "Wait in line - Aug 20",
    statusType: "wait",
    description:
      "If you are genuinely interested and ready to commit 2 hours a day for 1 week, complete the payment and send the screenshot here. Once verified, you will receive the group access and further training instructions.",
    actionType: "replaced",
    testPath: "/tester/tests/swiggy",
  },
  {
    id: "facebook",
    name: "Facebook",
    iconBg: "bg-[#1877F2]",
    iconColor: "text-white",
    iconSvg: "facebook",
    statusText: "Wait in line - Aug 20",
    statusType: "wait",
    description:
      "We are starting this as the foundation for a much bigger plan. The goal is to build a reliable UX testing team, work on real client applications, and gradually take this service to a much larger level.",
    actionType: "queued",
    queueNumber: 14,
    testPath: "/tester/tests/facebook",
  },
  {
    id: "deloitte",
    name: "Deloitte",
    iconBg: "bg-black",
    iconColor: "text-white",
    iconSvg: "deloitte",
    statusText: "Wait in line - Aug 20",
    statusType: "wait",
    description:
      "this our business right now so I will say the nature of the business and i WILL tell you the exactly the market that we want to build upon so here we go in this process like this - first I will explain the what business we are and I will tell you the how we want to position it.",
    actionType: "start_testing",
    testPath: "/tester/tests/deloitte",
  },
];

export function MyAppsView({
  assignments,
}: {
  assignments?: TesterAssignment[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "queued">("all");

  const items: MyAppItem[] = (() => {
    if (assignments && assignments.length > 0) {
      const realItems: MyAppItem[] = assignments.map((a, idx) => {
        const p = a.projectId;
        const bgColors = ["bg-[#F7D02C]", "bg-black", "bg-[#7F0E1E]", "bg-[#1877F2]"];
        let actionType: MyAppItem["actionType"] = "open_testing";
        if (a.status === "queued") {
          actionType = "queued";
        } else if (a.status === "removed") {
          actionType = "replaced";
        } else if (p.status !== "active") {
          actionType = "wait_others";
        }

        return {
          id: a._id,
          assignmentId: a._id,
          name: p.appDetails.appName,
          packageName: p.appDetails.packageName,
          iconBg: bgColors[idx % bgColors.length],
          iconColor: idx % bgColors.length === 0 ? "text-slate-950" : "text-white",
          statusText: "Active - Today",
          statusType: "active",
          description:
            "Playstore closed testing assignment. Follow the instructions step by step to complete testing and verification.",
          actionType,
          queueNumber: a.queuePosition,
          testPath: `/tester/tests/${a._id}`,
        };
      });

      const existingNames = new Set(realItems.map((r) => r.name.toLowerCase()));
      return [
        ...realItems,
        ...DEFAULT_MY_APPS.filter((d) => !existingNames.has(d.name.toLowerCase())),
      ];
    }
    return DEFAULT_MY_APPS;
  })();

  const filteredItems = items.filter((it) => {
    if (filter === "active") return it.actionType !== "queued";
    if (filter === "queued") return it.actionType === "queued";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Figma Filter Pills Row matching Screenshot 2 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Back Pill */}
        <button
          type="button"
          onClick={() => router.push("/tester/opportunities")}
          className="rounded-full border border-slate-200 bg-white px-6 py-2 text-[14px] font-semibold text-[#4F46E5] shadow-xs hover:bg-slate-50 transition-all active:scale-95"
        >
          Back
        </button>

        {/* All Pill */}
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-6 py-2 text-[14px] font-semibold transition-all active:scale-95 ${
            filter === "all"
              ? "bg-[#4F46E5] text-white shadow-sm"
              : "border border-slate-200 bg-white text-[#4F46E5] hover:bg-slate-50"
          }`}
        >
          All
        </button>

        {/* Active Testing Pill */}
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`rounded-full px-6 py-2 text-[14px] font-semibold transition-all active:scale-95 ${
            filter === "active"
              ? "bg-[#4F46E5] text-white shadow-sm"
              : "border border-slate-200 bg-white text-[#4F46E5] hover:bg-slate-50"
          }`}
        >
          Active Testing
        </button>

        {/* Queued Pill */}
        <button
          type="button"
          onClick={() => setFilter("queued")}
          className={`rounded-full px-6 py-2 text-[14px] font-semibold transition-all active:scale-95 ${
            filter === "queued"
              ? "bg-[#4F46E5] text-white shadow-sm"
              : "border border-slate-200 bg-white text-[#4F46E5] hover:bg-slate-50"
          }`}
        >
          Queued
        </button>
      </div>

      {/* Cards Grid matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md"
          >
            {/* Card Header & Content */}
            <div>
              <div className="flex items-start gap-4">
                <div
                  className={`size-14 shrink-0 rounded-2xl flex items-center justify-center font-bold shadow-xs ${item.iconBg} ${item.iconColor}`}
                >
                  <AppGlyph item={item} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                    Playstore closed Testing
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <span className="inline-block size-4.5 rounded-full bg-slate-300 ring-1.5 ring-white" />
                        <span className="inline-block size-4.5 rounded-full bg-slate-400 ring-1.5 ring-white" />
                      </div>
                      <span className="rounded-full bg-[#4F46E5] px-1.5 py-0.2 text-[10px] font-bold text-white leading-tight">
                        4+
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <span
                        className={`size-1.5 rounded-full ${
                          item.statusType === "active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span>{item.statusText}</span>
                    </div>
                  </div>
                </div>
              </div>

              <WavyDivider />

              <div className="space-y-1 mt-1">
                <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">
                  Description
                </h4>
                <p className="text-[12.5px] leading-relaxed text-slate-600 line-clamp-4 min-h-[4.5rem]">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Card Footer / Action Button matching Screenshot 2 */}
            <div className="mt-6 pt-4 border-t border-slate-100/80">
              {item.actionType === "wait_others" && (
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all"
                >
                  Wait Other to Join
                </button>
              )}

              {item.actionType === "open_testing" && (
                <Link
                  href={item.testPath}
                  className="block w-full text-center rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all"
                >
                  Open Testing
                </Link>
              )}

              {item.actionType === "start_testing" && (
                <Link
                  href={item.testPath}
                  className="block w-full text-center rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all"
                >
                  Start Testing
                </Link>
              )}

              {item.actionType === "replaced" && (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-[#5C56E8] py-3 text-[14px] font-semibold text-white shadow-sm opacity-90 cursor-not-allowed"
                >
                  Replaced you are inactive
                </button>
              )}

              {item.actionType === "queued" && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-bold text-slate-900 leading-tight">
                      UQL{" "}
                      <span className="text-[#4F46E5]">
                        {item.queueNumber ?? 14}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                      You are in Queue
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-[13.5px] font-semibold text-[#4F46E5] hover:bg-slate-50 transition-all"
                  >
                    Joined Queue
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
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

function AppGlyph({ item }: { item: MyAppItem }) {
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

  return <span>{item.name.slice(0, 2).toUpperCase()}</span>;
}
