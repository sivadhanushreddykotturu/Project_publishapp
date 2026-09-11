"use client";

import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Landmark,
  ShieldCheck,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TesterEarningsViewProps {
  isDarkMode: boolean;
}

export default function TesterEarningsView({ isDarkMode }: TesterEarningsViewProps) {
  const [balance, setBalance] = useState(2400);
  const [upiId, setUpiId] = useState('tester@okaxis');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState([
    {
      id: 'tx-1',
      title: 'FitTrack Pro - Closed Testing Reward',
      amount: '+₹1,200',
      type: 'credit',
      date: 'Aug 19, 2026',
      status: 'Completed'
    },
    {
      id: 'tx-2',
      title: 'Deloitte UX Testing Bonus',
      amount: '+₹1,200',
      type: 'credit',
      date: 'Aug 15, 2026',
      status: 'Completed'
    },
    {
      id: 'tx-3',
      title: 'UPI Cashout to tester@okaxis',
      amount: '-₹800',
      type: 'debit',
      date: 'Aug 10, 2026',
      status: 'Completed'
    }
  ]);

  const handleWithdraw = (e: React.FormEvent) => {
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

    setBalance(prev => prev - amt);
    setHistory(prev => [
      {
        id: `tx-${Date.now()}`,
        title: `UPI Cashout to ${upiId}`,
        amount: `-₹${amt}`,
        type: 'debit',
        date: 'Just now',
        status: 'Processing (48h SLA)'
      },
      ...prev
    ]);
    setSubmitted(true);
    setAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner: Balance Card & UPI Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Balance Card */}
        <div className={`lg:col-span-6 rounded-3xl p-8 border shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[320px] ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
                Withdrawable Wallet
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#4F37FE]/10 flex items-center justify-center text-[#4F37FE]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="text-[42px] font-black tracking-tight text-[#4F37FE]">
              ₹{balance.toLocaleString('en-IN')}.00
            </div>
            <p className="text-[13px] text-slate-500 font-medium mt-1">
              Guaranteed payout for verified 14-day Play Store tests and bug contributions.
            </p>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Direct Bank / UPI Transfer • 48-Hour SLA</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Landmark className="w-4 h-4 text-indigo-500" />
              <span>Zero transaction fees on UPI cashouts</span>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className={`lg:col-span-6 rounded-3xl p-8 border shadow-xs space-y-5 ${
          isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <h3 className={`text-[20px] font-extrabold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              Request UPI Withdrawal
            </h3>
            <p className="text-[12px] text-slate-400 font-medium mt-1">
              Minimum ₹100 • Funds credited within 48 business hours
            </p>
          </div>

          {submitted && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Withdrawal request submitted! Admin will verify and transfer within 48h.</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[13px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">
                Amount in INR (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]' 
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
                }`}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1.5">
                UPI ID (Virtual Payment Address)
              </label>
              <input
                type="text"
                placeholder="e.g. username@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border text-[14px] outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-[#181926] border-white/10 text-white placeholder:text-slate-500 focus:border-[#4F37FE]' 
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#4F37FE]'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
            >
              Withdraw Now
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className={`rounded-3xl border shadow-xs p-8 ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80'
      }`}>
        <h3 className={`text-[19px] font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
          Transaction History
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {history.map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between">
              <div>
                <div className={`text-[15px] font-bold ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
                  {item.title}
                </div>
                <div className="text-[12px] text-slate-400 font-medium mt-0.5">
                  {item.date} • {item.status}
                </div>
              </div>

              <div className={`text-[16px] font-black ${
                item.type === 'credit' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'
              }`}>
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
