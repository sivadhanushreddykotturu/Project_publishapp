import { serverApi } from "@/lib/server-api";
import { StatusPill } from "@/components/dash/StatusPill";
import { WithdrawForm } from "@/components/tester/WithdrawForm";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

// Real backend shape from GET /wallet/me
interface BackendWalletSummary {
  balance: number; // paise
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  history: Array<{
    _id: string;
    type: "earning" | "withdrawal";
    amount: number; // paise
    status: string;
    note?: string;
    transactionId?: string;
    createdAt: string;
  }>;
}

// Backend tester profile — we need this to check if UPI is set.
interface BackendTesterProfile {
  upi?: { vpa?: string; qrImageUrl?: string };
}

export default async function TesterWalletPage() {
  let wallet: BackendWalletSummary | null = null;
  let upiSet = false;
  try {
    [wallet] = await Promise.all([
      serverApi<BackendWalletSummary>("/wallet/me"),
    ]);
    // Try to fetch tester profile to check upi status
    try {
      const data = await serverApi<{ tester?: BackendTesterProfile }>("/testers/me");
      const profile = data && "tester" in data && data.tester ? data.tester : (data as unknown as BackendTesterProfile);
      upiSet = Boolean(profile?.upi?.vpa);
    } catch {
      upiSet = false;
    }
  } catch {
    wallet = null;
  }

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.history ?? [];


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
            minWithdrawalPaise={10_000}
            upiSet={upiSet}
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
                    {tx.transactionId ? ` · ref ${tx.transactionId}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[15px] font-semibold ${
                      tx.type === "earning" ? "text-emerald-600" : "text-ink-950"
                    }`}
                  >
                    {tx.type === "earning" ? "+" : "−"}
                    {formatINR(tx.amount)}
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
