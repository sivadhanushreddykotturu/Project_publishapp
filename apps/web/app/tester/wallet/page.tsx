import { serverApi } from "@/lib/server-api";
import { StatusPill } from "@/components/dash/StatusPill";
import { WithdrawForm } from "@/components/tester/WithdrawForm";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface WalletData {
  balancePaise: number;
  minWithdrawalPaise: number;
  upiSet: boolean;
  transactions: Array<{
    _id: string;
    type: string;
    amountPaise: number;
    status: string;
    note?: string;
    upiRef?: string;
    createdAt: string;
  }>;
}

export default async function TesterWalletPage() {
  let wallet: WalletData | null = null;
  try {
    wallet = await serverApi<WalletData>("/wallet/me");
  } catch {
    wallet = null;
  }

  const balance = wallet?.balancePaise ?? 0;
  const transactions = wallet?.transactions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[24px] bg-navy-900 p-8 text-white">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-lime-300">
            Wallet balance
          </p>
          <p className="mt-3 text-[44px] font-semibold tracking-tight">
            {formatINR(balance)}
          </p>
          <p className="mt-2 text-[13px] text-white/50">
            Credits land when admins verify your steps.
          </p>
        </div>
        <div className="rounded-[24px] border border-black/5 bg-white p-8 shadow-sm">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Withdraw to UPI
          </p>
          <WithdrawForm
            balancePaise={balance}
            minWithdrawalPaise={wallet?.minWithdrawalPaise ?? 10_000}
            upiSet={wallet?.upiSet ?? false}
          />
        </div>
      </div>

      <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
        <h3 className="mb-4 text-[16px] font-semibold text-ink-950">Ledger</h3>
        {transactions.length === 0 ? (
          <p className="text-[14px] text-ink-500">
            No transactions yet. Verify a step to earn your first credit.
          </p>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper px-5 py-3.5"
              >
                <div>
                  <p className="text-[14px] font-medium capitalize text-ink-950">
                    {tx.type}
                    {tx.note && (
                      <span className="ml-2 font-normal text-ink-500">{tx.note}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {new Date(tx.createdAt).toLocaleString("en-IN")}
                    {tx.upiRef ? ` · ref ${tx.upiRef}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[15px] font-semibold ${
                      tx.type === "earning" ? "text-emerald-600" : "text-ink-950"
                    }`}
                  >
                    {tx.type === "earning" ? "+" : "−"}
                    {formatINR(tx.amountPaise)}
                  </span>
                  <StatusPill status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
