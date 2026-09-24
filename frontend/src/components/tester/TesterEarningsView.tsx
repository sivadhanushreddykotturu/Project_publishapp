"use client";

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  Landmark,
  ShieldCheck,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TesterEarningsViewProps {
  isDarkMode: boolean;
  walletBalance?: number;
  onRequestCashout?: (amount: number, upiId: string) => Promise<boolean>;
}

export default function TesterEarningsView({ isDarkMode, walletBalance = 0, onRequestCashout }: TesterEarningsViewProps) {
  const [balance, setBalance] = useState(walletBalance);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Re-sync balance when parent updates the prop
  useEffect(() => {
    setBalance(walletBalance);
  }, [walletBalance]);

  const [history, setHistory] = useState<Array<{
    id: string;
    title: string;
    amount: number;
    type: string;
    date: string;
    status: string;
  }>>([]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 100) {
      setError('Minimum withdrawal amount is ₹100.');
      return;
    }
    if (amt > balance) {
      setError('Insufficient balance for this withdrawal amount.');
      return;
    }
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. yourname@oksbi).');
      return;
    }

    setLoading(true);
    try {
      // Call the actual API hook if provided
      if (onRequestCashout) {
        const success = await onRequestCashout(amt, upiId);
        if (!success) {
          setError('Withdrawal request failed. Please try again.');
          return;
        }
      }
      setBalance(prev => prev - amt);
      setHistory(prev => [
        {
          id: `tx-${Date.now()}`,
          title: `UPI Cashout to ${upiId}`,
          amount: amt,
          type: 'debit',
          date: 'Just now',
          status: 'Processing (48h SLA)'
        },
        ...prev
      ]);
      setSubmitted(true);
      setAmount('');
    } catch {
      setError('Withdrawal request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt: number, type: string) =>
    `${type === 'credit' ? '+' : '−'}₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner: Balance Card & UPI Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-6 rounded-3xl p-8 border relative overflow-hidden flex flex-col justify-between min-h-[300px] ${
            isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          {/* Glow blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">
                Withdrawable Balance
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className={`text-[44px] font-black tracking-tight text-blue-500`}>
              ₹{balance.toLocaleString('en-IN')}.00
            </div>
            <p className="text-[13px] text-slate-400 font-medium mt-2">
              Guaranteed payout for verified 14-day Play Store tests and bug contributions.
            </p>
          </div>

          <div className={`space-y-2.5 pt-5 border-t mt-6 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Direct Bank / UPI Transfer · 48-Hour SLA</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400">
              <Landmark className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Zero transaction fees on UPI cashouts</span>
            </div>
          </div>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`lg:col-span-6 rounded-3xl p-8 border space-y-5 ${
            isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div>
            <h3 className={`text-[20px] font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Request UPI Withdrawal
            </h3>
            <p className="text-[12px] text-slate-400 font-medium mt-1">
              Minimum ₹100 · Funds credited within 48 business hours
            </p>
          </div>

          {submitted && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Withdrawal request submitted! Admin will verify and transfer within 48h.</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] font-bold flex items-center gap-2">
              <span>⚠ {error}</span>
            </div>
          )}

          {balance === 0 && (
            <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[13px] font-semibold">
              Your wallet balance is ₹0. Complete a testing campaign to earn rewards.
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-1.5">
                Amount in INR (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={balance === 0}
                className={`w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-1.5">
                UPI ID (Virtual Payment Address)
              </label>
              <input
                type="text"
                placeholder="e.g. username@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={balance === 0}
                className={`w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={balance === 0 || loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-bold rounded-2xl shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Withdraw Now'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Transaction History */}
      <div className={`rounded-3xl border p-8 ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-[18px] font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Transaction History
          </h3>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>{history.filter(h => h.type === 'credit').reduce((s, h) => s + h.amount, 0).toLocaleString('en-IN')} earned</span>
          </div>
        </div>

        <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
          {history.map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  item.type === 'credit'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.type === 'credit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className={`text-[14px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {item.date} · {item.status}
                  </div>
                </div>
              </div>

              <div className={`text-[15px] font-black whitespace-nowrap ${
                item.type === 'credit' ? 'text-emerald-500' : isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {formatAmount(item.amount, item.type)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

