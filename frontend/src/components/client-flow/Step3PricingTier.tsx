"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { canSkipOnboardingPayment } from '../../lib/local-checkout';

export interface TierInfo {
  index: number;
  testers: string;
  onboardingLabel: string;
  price: string;
  originalPrice?: string;
  handleLabel: string;
}

const TIERS: TierInfo[] = [
  {
    index: 0,
    testers: '14 Testers',
    onboardingLabel: 'Onboarding',
    price: '₹2999/-',
    originalPrice: '₹3499/-',
    handleLabel: 'Increase'
  },
  {
    index: 1,
    testers: '20 Testers',
    onboardingLabel: 'Onboarding',
    price: '₹3999/-',
    originalPrice: '₹4999/-',
    handleLabel: 'Increase'
  },
  {
    index: 2,
    testers: '25 Testers',
    onboardingLabel: 'Onboarding',
    price: '₹4999/-',
    originalPrice: '₹6999/-',
    handleLabel: 'Increase'
  },
  {
    index: 3,
    testers: "Let's Talk",
    onboardingLabel: '',
    price: 'Custom Plan',
    handleLabel: 'Custom'
  }
];

interface Step3PricingTierProps {
  isDarkMode: boolean;
  onNext: (tier: TierInfo) => void;
  onBack: () => void;
  onPay?: (tier: TierInfo) => Promise<boolean>;
}

export default function Step3PricingTier({
  isDarkMode,
  onNext,
  onBack,
  onPay
}: Step3PricingTierProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const currentTier = TIERS[selectedTierIndex];
  const [paidTierIndex, setPaidTierIndex] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [skipPayment, setSkipPayment] = useState(false);
  const isPaid = paidTierIndex === selectedTierIndex;

  useEffect(() => { setSkipPayment(canSkipOnboardingPayment()); }, []);

  const handlePay = async () => {
    setPaymentError('');
    if (selectedTierIndex === 3) return;
    if (canSkipOnboardingPayment()) {
      onNext(currentTier);
      return;
    }
    setIsPaying(true);
    try {
      if (onPay && await onPay(currentTier)) {
        setPaidTierIndex(selectedTierIndex);
        onNext(currentTier);
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to start payment.');
    } finally {
      setIsPaying(false);
    }
  };

  const features = [
    { title: '14+ Real Testers' },
    { title: '14-Day Closed Testing' },
    { title: 'Tester Recruitment & Coordination' },
    { title: 'App Installation & Basic Testing' },
    { title: 'Testing Participation Tracking' },
    { title: 'Test Feedback Collection' },
    { title: 'Basic Bug Reporting' },
    { title: 'Play Store Production Support' }
  ];

  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1 className={`text-[34px] md:text-[40px] font-black tracking-tight ${
          isDarkMode ? 'text-white' : 'text-[#0E1015]'
        }`}>
          Play Store Closed Testing
        </h1>
      </div>

      {/* Main Pricing Box */}
      <div className={`rounded-3xl border p-8 md:p-10 shadow-sm relative overflow-hidden ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* ================= LEFT: PRICING CARD ================= */}
          <div className="lg:col-span-5 rounded-3xl bg-[#4F37FE] text-white p-6 relative overflow-hidden shadow-lg shadow-[#4F37FE]/20 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-[17px] font-black leading-tight">
                    Playstore Closed Testing
                  </h3>
                  <p className="text-[12px] text-white/80 font-medium">
                    14 - days testing cycle
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[#4F37FE] text-[11px] font-bold shrink-0">
                  Most Popular Opt
                </span>
              </div>

              {/* Price & Billing */}
              <div className="my-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-[38px] font-black tracking-tight">
                    {currentTier.price}
                  </span>
                  {currentTier.originalPrice && (
                    <span className="text-[18px] text-white/60 line-through font-semibold">
                      {currentTier.originalPrice}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-white/80 font-medium mt-1">
                  Billed one time for one app, to launch in playstore.
                </p>
              </div>
            </div>

            {/* Illustration / Graphic inside card (matching media_1789055504578.png) */}
            <div className="relative h-48 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
              <img
                src="/playstoretesting.png"
                alt="Playstore testing visual"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4F37FE]/40 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* ================= RIGHT: FEATURES & SLIDER ================= */}
          <div className="lg:col-span-7 space-y-8 pl-0 lg:pl-4">
            {/* Features Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F37FE] shrink-0"></span>
                  <span className={`text-[14px] font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {f.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Huge Dynamic Counter */}
            <div className="pt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-[52px] md:text-[64px] font-black tracking-tight text-[#4F37FE] leading-none">
                  {currentTier.testers}
                </span>
                {currentTier.onboardingLabel && (
                  <span className="text-[24px] font-bold text-[#4F37FE]/80">
                    {currentTier.onboardingLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-2 pt-2">
              <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center">
                {/* Active progress fill */}
                <div 
                  className="h-full bg-[#4F37FE] rounded-full transition-all duration-300"
                  style={{ width: `${(selectedTierIndex / (TIERS.length - 1)) * 100}%` }}
                />

                {/* Stepper Dots */}
                {TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`absolute -translate-x-1/2 w-4 h-4 rounded-full transition-all cursor-pointer ${
                      idx <= selectedTierIndex ? 'bg-[#4F37FE]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{ left: `${(idx / (TIERS.length - 1)) * 100}%` }}
                    title={tier.testers}
                  />
                ))}

                {/* Handle / Thumb Badge */}
                <div
                  className="absolute -translate-x-1/2 -top-3.5 px-3 py-1 bg-white dark:bg-[#181926] border border-slate-300 dark:border-white/10 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm pointer-events-none select-none transition-all duration-300"
                  style={{ left: `${(selectedTierIndex / (TIERS.length - 1)) * 100}%` }}
                >
                  {currentTier.handleLabel}
                </div>
              </div>

              {/* Step Labels */}
              <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-3">
                <span>14 Testers</span>
                <span>20 Testers</span>
                <span>25 Testers</span>
                <span>Custom</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onBack}
          className={`px-12 py-3.5 rounded-2xl text-[15px] font-bold border transition-colors cursor-pointer ${
            isDarkMode 
              ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          Back
        </button>

        <button
          onClick={handlePay}
          disabled={isPaying || isPaid || selectedTierIndex === 3}
          className="px-12 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white text-[15px] font-bold rounded-2xl shadow-md transition-all cursor-pointer"
        >
          {isPaying ? 'Opening Razorpay…' : selectedTierIndex === 3 ? 'Contact Sales' : skipPayment ? 'Continue Without Payment' : isPaid ? 'Payment Confirmed' : 'Pay Now'}
        </button>

        {!skipPayment && <button
          onClick={() => onNext(currentTier)}
          disabled={!isPaid}
          className="px-16 py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer"
        >
          Start Testing
        </button>}
      </div>
      {skipPayment && <p className="text-center text-sm text-slate-500">Local testing: payment is skipped. No charge or payment confirmation will be created.</p>}
      {paymentError && <p className="text-center text-sm font-semibold text-red-500">{paymentError}</p>}
    </div>
  );
}
