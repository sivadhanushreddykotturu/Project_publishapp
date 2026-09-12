"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

export interface ClientContactFormData {
  appName: string;
  appDescription: string;
  phoneNumber: string;
  whatsappNumber: string;
  appLink: string;
}

interface ClientContactFlowProps {
  isDarkMode: boolean;
  serviceType: 'ios' | 'ux';
  onBack: () => void;
  onFinish: () => void;
}

export default function ClientContactFlow({
  isDarkMode,
  serviceType,
  onBack,
  onFinish
}: ClientContactFlowProps) {
  const isIOS = serviceType === 'ios';

  const [formData, setFormData] = useState<ClientContactFormData>({
    appName: '',
    appDescription: '',
    phoneNumber: '',
    whatsappNumber: '',
    appLink: ''
  });

  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pricing & service metadata
  const serviceTitle = isIOS ? "iOS App Publishing" : "User Experience Testing";
  const priceDisplay = isIOS ? "₹2999/-" : "₹4499/-";
  const startsFromText = isIOS ? "Starts from ₹2999" : "Starts from ₹4499";
  const priceSubtitle = isIOS 
    ? "Billed one time for one app, to launch in app store."
    : "Billed one time for one app, test with real users.";

  // 8 Features with purple dots
  const features = isIOS ? [
    '14+ Real Testers',
    '14-Day Testing Cycle',
    'Tester Recruitment & Coordination',
    'App Installation & Basic Testing',
    'Testing Participation Tracking',
    'Test Feedback Collection',
    'Basic Bug Reporting',
    'App Store Production Support'
  ] : [
    '14+ Real Device Testers',
    '14-Day UX Testing Cycle',
    'Target Demographic Matching',
    'App Installation & Usability Testing',
    'Testing Participation Tracking',
    'Test Feedback Collection',
    'Basic Bug Reporting',
    'UX Audit & Review Support'
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      phoneNumber: val,
      whatsappNumber: sameAsPhone ? val : prev.whatsappNumber
    }));
    if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
  };

  const handleToggleSameAsPhone = (checked: boolean) => {
    setSameAsPhone(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phoneNumber }));
      if (errors.whatsappNumber) setErrors(prev => ({ ...prev, whatsappNumber: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.appName.trim()) newErrors.appName = 'Required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Required';
    if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = 'Required';
    if (!formData.appLink.trim()) newErrors.appLink = 'Required';
    if (!formData.appDescription.trim()) newErrors.appDescription = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShowPopup(true);
  };

  const handleCloseAndExit = () => {
    setShowPopup(false);
    onFinish();
  };

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Title */}
      <div className="text-center">
        <h1 className={`text-[32px] md:text-[38px] font-black tracking-tight ${
          isDarkMode ? 'text-white' : 'text-[#0E1015]'
        }`}>
          {serviceTitle}
        </h1>
      </div>

      {/* Main Container Card: Left = Form, Right = 'Let's talk' & Starts from ₹2999 */}
      <div className={`rounded-[32px] border p-8 md:p-10 shadow-sm relative overflow-hidden ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ================= LEFT SIDE: THE FORM ================= */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: App Name & App Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    <span>App Name</span>
                    {errors.appName && <span className="text-red-500 text-[11px] font-semibold">Required</span>}
                  </div>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => {
                      setFormData({ ...formData, appName: e.target.value });
                      if (errors.appName) setErrors({ ...errors, appName: '' });
                    }}
                    placeholder="e.g. FitTrack"
                    className={`w-full px-4 py-3 rounded-2xl border text-[14px] font-medium outline-none transition-all ${
                      errors.appName
                        ? 'border-red-400 bg-red-500/5'
                        : isDarkMode
                          ? 'bg-[#14151F] border-white/10 text-white focus:border-[#4F37FE]'
                          : 'bg-[#F8F9FD] border-slate-200 text-slate-900 focus:border-[#4F37FE] focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    <span>App Link / URL</span>
                    {errors.appLink && <span className="text-red-500 text-[11px] font-semibold">Required</span>}
                  </div>
                  <input
                    type="text"
                    value={formData.appLink}
                    onChange={(e) => {
                      setFormData({ ...formData, appLink: e.target.value });
                      if (errors.appLink) setErrors({ ...errors, appLink: '' });
                    }}
                    placeholder={isIOS ? "TestFlight or Website URL" : "Prototype or Website URL"}
                    className={`w-full px-4 py-3 rounded-2xl border text-[14px] font-medium outline-none transition-all ${
                      errors.appLink
                        ? 'border-red-400 bg-red-500/5'
                        : isDarkMode
                          ? 'bg-[#14151F] border-white/10 text-white focus:border-[#4F37FE]'
                          : 'bg-[#F8F9FD] border-slate-200 text-slate-900 focus:border-[#4F37FE] focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Phone Number & WhatsApp Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    <span>Phone Number</span>
                    {errors.phoneNumber && <span className="text-red-500 text-[11px] font-semibold">Required</span>}
                  </div>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3 rounded-2xl border text-[14px] font-medium outline-none transition-all ${
                      errors.phoneNumber
                        ? 'border-red-400 bg-red-500/5'
                        : isDarkMode
                          ? 'bg-[#14151F] border-white/10 text-white focus:border-[#4F37FE]'
                          : 'bg-[#F8F9FD] border-slate-200 text-slate-900 focus:border-[#4F37FE] focus:bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px] font-bold text-slate-800 dark:text-slate-200">
                    <span>WhatsApp Number</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-normal text-slate-500 dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-[#4F37FE] cursor-pointer"
                      />
                      <span>Same as Phone</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    disabled={sameAsPhone}
                    value={formData.whatsappNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, whatsappNumber: e.target.value });
                      if (errors.whatsappNumber) setErrors({ ...errors, whatsappNumber: '' });
                    }}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3 rounded-2xl border text-[14px] font-medium outline-none transition-all ${
                      sameAsPhone ? 'opacity-70 cursor-not-allowed' : ''
                    } ${
                      errors.whatsappNumber
                        ? 'border-red-400 bg-red-500/5'
                        : isDarkMode
                          ? 'bg-[#14151F] border-white/10 text-white focus:border-[#4F37FE]'
                          : 'bg-[#F8F9FD] border-slate-200 text-slate-900 focus:border-[#4F37FE] focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: App Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-bold text-slate-800 dark:text-slate-200">
                  <span>App Description</span>
                  {errors.appDescription && <span className="text-red-500 text-[11px] font-semibold">Required</span>}
                </div>
                <textarea
                  rows={3}
                  value={formData.appDescription}
                  onChange={(e) => {
                    setFormData({ ...formData, appDescription: e.target.value });
                    if (errors.appDescription) setErrors({ ...errors, appDescription: '' });
                  }}
                  placeholder="Describe your app and any specific requirements..."
                  className={`w-full px-4 py-3 rounded-2xl border text-[14px] font-medium outline-none resize-none transition-all ${
                    errors.appDescription
                      ? 'border-red-400 bg-red-500/5'
                      : isDarkMode
                        ? 'bg-[#14151F] border-white/10 text-white focus:border-[#4F37FE]'
                        : 'bg-[#F8F9FD] border-slate-200 text-slate-900 focus:border-[#4F37FE] focus:bg-white'
                  }`}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#4F37FE] hover:bg-[#432EE0] text-white text-[15px] font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 transition-all cursor-pointer text-center"
                >
                  Submit Details
                </button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT SIDE: 'LET'S TALK' & STARTS FROM ₹2999 ================= */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-slate-100 dark:lg:border-white/10 lg:pl-10">
            {/* 'Let's talk' Headline */}
            <div className="space-y-2">
              <h2 className="text-[44px] md:text-[54px] font-black tracking-tight leading-none select-none">
                <span className="text-[#4F37FE]">Let’s</span>{' '}
                <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>talk</span>
              </h2>

              {/* Price Callout: Starts from ₹2999 */}
              <div className="pt-2">
                <div className="text-[34px] md:text-[40px] font-black text-[#4F37FE] tracking-tight leading-none">
                  {priceDisplay}
                </div>
                <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {startsFromText}
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                  {priceSubtitle}
                </p>
              </div>
            </div>

            {/* 8 Feature Bullets with solid purple circular dots */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/10">
              {features.map((title, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F37FE] shrink-0" />
                  <span>{title}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              We directly review your submission and contact back through WhatsApp or whatever details you provide.
            </p>
          </div>

        </div>
      </div>

      {/* Navigation: Centered Back Button */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className={`px-12 py-3 rounded-full text-[14px] font-bold border transition-colors cursor-pointer ${
            isDarkMode 
              ? 'bg-[#0F1017] border-white/10 text-white hover:bg-white/5' 
              : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50'
          }`}
        >
          Back
        </button>
      </div>

      {/* ================= EXACT POP-UP MODAL ================= */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-md rounded-3xl border p-7 shadow-2xl text-center relative ${
                isDarkMode ? 'bg-[#0F1017] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseAndExit}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Clean Checkmark */}
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              {/* Exact message mandated by user */}
              <h3 className="text-[18px] md:text-[19px] font-black tracking-tight leading-snug">
                Thank you for your response, we'll contact back through WhatsApp or whatever the details they provide.
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                We have registered your details for <strong className="text-[#4F37FE]">{formData.appName}</strong>.
              </p>

              {/* Done button returning to home */}
              <div className="pt-6">
                <button
                  onClick={handleCloseAndExit}
                  className="w-full py-3.5 rounded-2xl bg-[#4F37FE] hover:bg-[#432EE0] text-white font-bold text-sm shadow-md shadow-[#4F37FE]/25 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
