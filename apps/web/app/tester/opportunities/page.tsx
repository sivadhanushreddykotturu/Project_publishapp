import { Radar } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { JoinButton } from "@/components/tester/JoinButton";

export const dynamic = "force-dynamic";

interface Opportunity {
  _id: string;
  packageKey: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  waitlistCount: number;
  appDetails: { appName: string; packageName: string };
  myAssignment: { status: string; queuePosition?: number } | null;
}

export default async function OpportunitiesPage() {
  let opportunities: Opportunity[] = [];
  try {
    const data = await serverApi<{ opportunities: Opportunity[] }>(
      "/projects/opportunities",
    );
    opportunities = data.opportunities;
  } catch {
    opportunities = [];
  }

  if (opportunities.length === 0) {
    return (
      <EmptySection
        icon={Radar}
        title="No open opportunities right now"
        body="When a client's project goes live, it appears here. Slots are first come, first served — check back often."
      />
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.map((o) => {
        const slotsLeft = o.requiredTesters - o.activeTesterCount;
        const joined = o.myAssignment;
        return (
          <div
            key={o._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-white p-6 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-[17px] font-semibold text-ink-950">
                {o.appDetails.appName}
              </p>
              <p className="mt-1 text-[13px] text-ink-400">
                {o.appDetails.packageName} · {o.packageKey} track
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <StatusPill status={o.joinState} />
                <span className="text-[13px] font-medium text-ink-500">
                  {slotsLeft > 0
                    ? `${slotsLeft} of ${o.requiredTesters} slots left`
                    : `${o.waitlistCount} on the waitlist`}
                </span>
              </div>
            </div>
            <div>
              {joined ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-lime-200 px-4 py-2 text-[13px] font-semibold text-ink-800">
                  {joined.status === "queued"
                    ? `Queued · position ${joined.queuePosition}`
                    : `Joined · ${joined.status}`}
                </span>
              ) : (
                <JoinButton projectId={o._id} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
