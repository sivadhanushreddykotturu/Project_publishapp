import { ShieldCheck } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { ReviewCard, type ReviewItem } from "@/components/admin/ReviewCard";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  let items: ReviewItem[] = [];
  try {
    const data = await serverApi<{ items: ReviewItem[] }>("/verification");
    items = data.items;
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return (
      <EmptySection
        icon={ShieldCheck}
        title="Queue is clear"
        body="When testers submit step proofs, they land here for review. Approve to credit payouts; reject with a reason to reopen the step."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-ink-500">
        {items.length} submission{items.length === 1 ? "" : "s"} waiting for review.
      </p>
      {items.map((item) => (
        <ReviewCard key={String(item.proofId)} item={item} />
      ))}
    </div>
  );
}
