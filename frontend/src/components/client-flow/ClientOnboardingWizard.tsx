"use client";

import React, { useState } from 'react';
import ClientWizardLayout from './ClientWizardLayout';
import Step1ServiceSelect, { ServiceType } from './Step1ServiceSelect';
import Step2TechSupport, { TechSupportChoice } from './Step2TechSupport';
import Step3PricingTier, { TierInfo } from './Step3PricingTier';
import Step4AppDetails, { AppDetailsFormData } from './Step4AppDetails';
import Step5TesterEmails from './Step5TesterEmails';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface ClientOnboardingWizardProps {
  isDarkMode: boolean;
  onFinish?: (campaignData: any) => void;
  onCancel?: () => void;
}

export default function ClientOnboardingWizard({
  isDarkMode,
  onFinish,
  onCancel
}: ClientOnboardingWizardProps) {
  // Steps: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections state
  const [selectedService, setSelectedService] = useState<ServiceType>('playstore');
  const [selectedSupportChoice, setSelectedSupportChoice] = useState<TechSupportChoice>('testers_only');
  const [selectedTier, setSelectedTier] = useState<TierInfo>({
    index: 0,
    testers: '14 Testers',
    onboardingLabel: 'Onboarding',
    price: '₹2999/-',
    originalPrice: '₹3499/-',
    handleLabel: 'Increase'
  });
  const [appDetails, setAppDetails] = useState<AppDetailsFormData>({
    appName: 'UXOS',
    webLink: '',
    appLink: ''
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleStep3Next = (tier: TierInfo) => {
    setSelectedTier(tier);
    setCurrentStep(4);
  };

  const handleStep4Next = (details: AppDetailsFormData) => {
    setAppDetails(details);
    setCurrentStep(5);
  };

  const handleStep5Completed = () => {
    setIsCompleted(true);
    if (onFinish) {
      onFinish({
        service: selectedService,
        supportChoice: selectedSupportChoice,
        tier: selectedTier,
        appDetails
      });
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  if (isCompleted) {
    return (
      <ClientWizardLayout isDarkMode={isDarkMode}>
        <div className={`p-10 rounded-3xl border text-center max-w-lg space-y-6 shadow-xl ${
          isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200/90'
        }`}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className={`text-[28px] font-black ${isDarkMode ? 'text-white' : 'text-[#0E1015]'}`}>
              Campaign Activated!
            </h2>
            <p className="text-[14px] text-slate-500 font-medium">
              Your closed testing campaign for <span className="font-bold text-[#4F37FE]">{appDetails.appName}</span> has been launched. The 14 assigned testers are now verifying their Google accounts.
            </p>
          </div>

          <button
            onClick={() => {
              if (onCancel) onCancel();
              else window.location.reload();
            }}
            className="w-full py-4 bg-[#4F37FE] hover:bg-[#432EE0] text-white font-bold rounded-2xl shadow-md shadow-[#4F37FE]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Campaign Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ClientWizardLayout>
    );
  }

  return (
    <ClientWizardLayout isDarkMode={isDarkMode}>
      <AnimatePresence mode="wait">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Step1ServiceSelect
              isDarkMode={isDarkMode}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              onNext={handleStep1Next}
              onBack={handleStepBack}
            />
          </motion.div>
        )}

        {/* Step 2: Technical Support Choice */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Step2TechSupport
              isDarkMode={isDarkMode}
              selectedChoice={selectedSupportChoice}
              onSelectChoice={setSelectedSupportChoice}
              onNext={handleStep2Next}
              onBack={handleStepBack}
            />
          </motion.div>
        )}

        {/* Step 3: Play Store Closed Testing Pricing & Tester Slider */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Step3PricingTier
              isDarkMode={isDarkMode}
              onNext={handleStep3Next}
              onBack={handleStepBack}
            />
          </motion.div>
        )}

        {/* Step 4: App Details Form */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Step4AppDetails
              isDarkMode={isDarkMode}
              initialData={appDetails}
              onNext={handleStep4Next}
              onBack={handleStepBack}
            />
          </motion.div>
        )}

        {/* Step 5: Tester Emails & Confirmation */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Step5TesterEmails
              isDarkMode={isDarkMode}
              onCompleted={handleStep5Completed}
              onBack={handleStepBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ClientWizardLayout>
  );
}
