import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { serverApi, type MeResponse } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";

export const dynamic = "force-dynamic";

export default async function ClientOverview() {
  let me: MeResponse | null = null;
  try {
    me = await serverApi<MeResponse>("/users/me");
  } catch {
    me = null;
  }

  const name = me?.user.name || "there";

  return (
    <div className="space-y-8">
      <div className="rounded-[24px] bg-gradient-to-br from-cream-100 to-paper p-8 md:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-orange-500">
          Client portal
        </p>
        <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-ink-950">
          Welcome, {name}.
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">
          Buy a package, tell us about your app, and we take it from there —
          testers, engagement, bug reports, completion report.
        </p>
      </div>

      <EmptySection
        icon={Rocket}
        title="No projects yet"
        body="Your first closed test starts with a package. Fourteen testers, fourteen days, zero spreadsheets."
        action={
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Pick a package
            <ArrowRight className="size-4" />
          </Link>
        }
      />
    </div>
  );
}
