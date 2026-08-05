import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";
import { serverApi, type MeResponse } from "@/lib/server-api";
import { EmptySection, StatCard } from "@/components/dash/EmptySection";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface TesterProfile {
  walletBalance?: number;
  ratingAvg?: number;
  ratingCount?: number;
  devices?: unknown[];
  status?: string;
}

export default async function TesterOverview() {
  let me: MeResponse | null = null;
  try {
    me = await serverApi<MeResponse>("/users/me");
  } catch {
    me = null;
  }

  const name = me?.user.name || "there";
  const profile = (me?.profile ?? {}) as TesterProfile;
  const balance = profile.walletBalance ?? 0;

  return (
    <div className="space-y-8">
      <div className="rounded-[24px] bg-gradient-to-br from-cream-100 to-paper p-8 md:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-orange-500">
          Tester app
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-ink-950">
          Welcome, {name}.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">
          Join a testing opportunity, complete the steps on your Android
          device, and get paid by UPI as each step verifies.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Wallet balance" value={formatINR(balance)} hint="Withdrawable from ₹100" />
        <StatCard
          label="Rating"
          value={profile.ratingCount ? `${(profile.ratingAvg ?? 0).toFixed(1)} ★` : "—"}
          hint={profile.ratingCount ? `${profile.ratingCount} ratings` : "No ratings yet"}
        />
        <StatCard
          label="Devices"
          value={String(profile.devices?.length ?? 0)}
          hint="Registered Android devices"
        />
      </div>

      <EmptySection
        icon={Radar}
        title="No active tests"
        body="New testing opportunities appear here and in Opportunities. Slots fill fast — first come, first served."
        action={
          <Link
            href="/tester/opportunities"
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Browse opportunities
            <ArrowRight className="size-4" />
          </Link>
        }
      />
    </div>
  );
}
