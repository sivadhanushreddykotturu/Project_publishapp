"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { api, ApiClientError } from "@/lib/api";
import { formatINR } from "@/lib/format";

export function WithdrawForm({
  balancePaise,
  minWithdrawalPaise,
  upiSet,
}: {
  balancePaise: number;
  minWithdrawalPaise: number;
  upiSet: boolean;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!upiSet) {
    return (
      <p className="mt-3 text-[14px] text-ink-500">
        Add your UPI handle in{" "}
        <Link href="/tester/profile" className="font-semibold text-orange-500 hover:underline">
          Profile
        </Link>{" "}
        to withdraw.
      </p>
    );
  }

  const amountPaise = Math.round(parseFloat(amount || "0") * 100);
  const canSubmit =
    amountPaise >= minWithdrawalPaise && amountPaise <= balancePaise && !busy;

  async function withdraw() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const token = await getToken();
      await api("/wallet/withdrawals", {
        token,
        method: "POST",
        body: { amountPaise },
      });
      setDone(true);
      setAmount("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex gap-3">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={`Min ${formatINR(minWithdrawalPaise)}`}
          inputMode="numeric"
          className="w-full rounded-2xl border border-black/10 px-4 py-3 text-[15px] outline-none placeholder:text-ink-400 focus:border-ink-950"
        />
        <button
          onClick={withdraw}
          disabled={!canSubmit}
          className="shrink-0 rounded-full bg-ink-950 px-6 py-3 text-[14px] font-semibold text-white transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
        >
          {busy ? "Requesting…" : "Withdraw"}
        </button>
      </div>
      <p className="mt-2 text-[12.5px] text-ink-400">
        Payouts are reviewed and completed within 48 hours.
      </p>
      {done && (
        <p className="mt-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-[13px] text-emerald-700">
          Withdrawal requested — we&apos;ll notify you when it&apos;s paid.
        </p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-orange-500/10 px-4 py-2.5 text-[13px] text-orange-600">
          {error}
        </p>
      )}
    </div>
  );
}
