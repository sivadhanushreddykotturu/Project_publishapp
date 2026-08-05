import { Wallet } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { WithdrawalRow, type AdminWithdrawal } from "@/components/admin/WithdrawalRow";

export const dynamic = "force-dynamic";

export default async function AdminWalletsPage() {
  let withdrawals: AdminWithdrawal[] = [];
  try {
    const data = await serverApi<{ withdrawals: AdminWithdrawal[] }>(
      "/wallet/withdrawals",
    );
    withdrawals = data.withdrawals;
  } catch {
    withdrawals = [];
  }

  const pending = withdrawals.filter((w) => w.status === "pending");
  const history = withdrawals.filter((w) => w.status !== "pending");

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-[17px] font-semibold text-ink-950">
          Pending payouts ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <EmptySection
            icon={Wallet}
            title="Nothing pending"
            body="Withdrawal requests appear here. Complete them within 48 hours with the UPI reference."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((w) => (
              <WithdrawalRow key={w._id} w={w} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h3 className="mb-4 text-[17px] font-semibold text-ink-950">History</h3>
          <div className="space-y-3 opacity-75">
            {history.map((w) => (
              <WithdrawalRow key={w._id} w={w} readOnly />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
