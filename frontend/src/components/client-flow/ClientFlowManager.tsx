"use client";

import React, { useState } from 'react';
import ClientWizardLayout from './ClientWizardLayout';
import ClientAppDashboard from './ClientAppDashboard';
import Step1ServiceSelect, { ServiceType } from './Step1ServiceSelect';
import Step2TechSupport, { TechSupportChoice } from './Step2TechSupport';
import Step3PricingTier, { TierInfo } from './Step3PricingTier';
import Step4AppDetails, { AppDetailsFormData } from './Step4AppDetails';
import Step5TesterEmails from './Step5TesterEmails';
import PlayConsoleSetupFlow from './PlayConsoleSetupFlow';
import ClientContactFlow from './ClientContactFlow';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Headphones, Sparkles, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import type { TestApp } from '../../types';
import type { BackendAssignment, BackendNotification, BackendProjectFile, BackendSupportTicket, LaunchOpsUser } from '../../lib/launchops-api';

interface ClientFlowManagerProps {
  isDarkMode: boolean;
  onBackToHome: () => void;
  initialView?: 'wizard' | 'dashboard';
  onCheckoutTier: (tierIndex: number) => Promise<boolean>;
  projects: TestApp[];
  isLoading?: boolean;
  error?: string;
  onCreateProject: (project: Omit<TestApp, 'id' | 'testersCount' | 'bugsFound' | 'progress' | 'status'>) => Promise<TestApp>;
  onGetVerifiedTesterEmails: (projectId: string) => Promise<{ emails: string[]; count: number }>;
  currentUser: LaunchOpsUser | null;
  notifications: BackendNotification[];
  onLoadProjectDetails: (projectId: string) => Promise<{ assignments: BackendAssignment[]; files: BackendProjectFile[] }>;
  onDownloadProjectFile: (key: string) => Promise<void>;
  onUploadProjectFile: (projectId: string, file: File) => Promise<BackendProjectFile>;
  onSubmitTestingLink: (projectId: string, optInUrl: string) => Promise<void>;
  onConfirmEmailsAdded: (projectId: string) => Promise<void>;
  onSendSupport: (input: { subject: string; message: string; cc: string[] }, projectId?: string) => Promise<void>;
  supportTickets: BackendSupportTicket[];
  onReplyToSupport: (ticketId: string, body: string) => Promise<void>;
}

export default function ClientFlowManager({
  isDarkMode,
  onBackToHome,
  initialView = 'wizard',
  onCheckoutTier,
  projects,
  isLoading,
  error,
  onCreateProject,
  onGetVerifiedTesterEmails,
  currentUser,
  notifications,
  onLoadProjectDetails,
  onDownloadProjectFile,
  onUploadProjectFile,
  onSubmitTestingLink,
  onConfirmEmailsAdded,
  onSendSupport,
  supportTickets,
  onReplyToSupport
}: ClientFlowManagerProps) {
  // Mode: wizard vs dashboard
  const [viewMode, setViewMode] = useState<'wizard' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/client/dashboard')) {
        return 'dashboard';
      }
      if (window.location.pathname.includes('/client/new-app') || window.location.pathname.includes('/client/wizard')) {
        return 'wizard';
      }
      // If returning client has already published an app, auto-redirect to dashboard!
      if (localStorage.getItem('launchops_client_has_published') === 'true') {
        return 'dashboard';
      }
    }
    return initialView;
  });

  // Wizard State
  const [selectedService, setSelectedService] = useState<ServiceType>('playstore');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [techSupport, setTechSupport] = useState<TechSupportChoice>('testers_only');
  const [selectedTier, setSelectedTier] = useState<TierInfo | null>(null);
  const [appDetails, setAppDetails] = useState<AppDetailsFormData>({
    appName: 'UXOS',
    webLink: '',
    appLink: ''
  });
  const [completedProjectSummary, setCompletedProjectSummary] = useState<any>(null);
  const [createdProjectId, setCreatedProjectId] = useState('');

  // Support Drawer state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // Step 1: Service selection completion
  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  // Step 2: Tech support selection for Playstore
  const handleStep2Next = () => {
    if (techSupport === 'console_setup') {
      setCurrentStep(25); // 2.5: Play Console Setup Flow
    } else {
      setCurrentStep(3); // 3: Pricing Tier Slider
    }
  };

  // Step 3: Pricing tier selection
  const handleStep3Next = (tier: TierInfo) => {
    setSelectedTier(tier);
    setCurrentStep(4);
  };

  // Step 4: App details submission
  const handleStep4Next = async (data: AppDetailsFormData) => {
    setAppDetails(data);
    const serviceLabel = 'Play Store Closed Testing';
    const requiredTesters = Number.parseInt(selectedTier?.testers ?? '14', 10) || 14;
    const createdProject = await onCreateProject({
      name: data.appName || 'UXOS',
      version: '1.0.0',
      category: serviceLabel,
      devices: [],
      packageTier: techSupport === 'console_setup' ? 'managed_testing' : 'testers_only',
      serviceType: 'play_store_closed_testing',
      serviceOption: techSupport,
      packageName: data.packageName,
      testersRequired: requiredTesters,
      launchDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-IN'),
      projectName: `${data.appName || 'UXOS'} Testing Track`,
      apkUrl: data.appLink,
      optInUrl: data.webLink,
      instructions: '14-day Play Store closed testing campaign.',
    });
    setCreatedProjectId(createdProject.id);
    setCurrentStep(5);
  };

  // Step 5: Tester emails completion -> REDIRECT DIRECTLY TO CLIENT DASHBOARD
  const handleStep5Completed = async () => {
    const serviceLabel = selectedService === 'ios'
      ? 'iOS App Publishing'
      : selectedService === 'ux'
        ? 'User Experience Testing'
        : 'Play Store Closed Testing';
    const summary = {
      appName: appDetails.appName || 'UXOS',
      category: serviceLabel,
      tier: selectedTier ? `${selectedTier.testers} Onboarding (${selectedTier.price})` : '14 Testers Onboarding (₹2999/-)',
      service: serviceLabel,
    };
    setCompletedProjectSummary(summary);
    if (typeof window !== 'undefined') {
      localStorage.setItem('launchops_client_has_published', 'true');
      window.history.pushState(null, '', '/client/dashboard');
    }
    setViewMode('dashboard');
  };

  // Restart flow
  const handleStartNewApp = () => {
    setCurrentStep(1);
    setSelectedService('playstore');
    setTechSupport('testers_only');
    setSelectedTier(null);
    setAppDetails({ appName: 'UXOS', webLink: '', appLink: '' });
    setCreatedProjectId('');
    setViewMode('wizard');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/client');
    }
  };

  // If in Dashboard mode, render ClientAppDashboard
  if (viewMode === 'dashboard') {
    return (
      <ClientAppDashboard
        isDarkMode={isDarkMode}
        onLogout={onBackToHome}
        onNewAppWizard={handleStartNewApp}
        newRegisteredApp={completedProjectSummary}
        projects={projects}
        isLoading={isLoading}
        error={error}
        currentUser={currentUser}
        notifications={notifications}
        onLoadProjectDetails={onLoadProjectDetails}
        onDownloadProjectFile={onDownloadProjectFile}
        onUploadProjectFile={onUploadProjectFile}
        onSubmitTestingLink={onSubmitTestingLink}
        onConfirmEmailsAdded={onConfirmEmailsAdded}
        onGetVerifiedTesterEmails={onGetVerifiedTesterEmails}
        onSendSupport={onSendSupport}
        supportTickets={supportTickets}
        onReplyToSupport={onReplyToSupport}
      />
    );
  }

  return (
    <ClientWizardLayout
      isDarkMode={isDarkMode}
      onOpenSupport={() => setIsSupportOpen(true)}
    >
      <AnimatePresence mode="wait">
        <div className="w-full">
            {/* ================= STEP 1: SERVICE CATEGORY SELECTION ================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Step1ServiceSelect
                  isDarkMode={isDarkMode}
                  selectedService={selectedService}
                  onSelectService={setSelectedService}
                  onNext={handleStep1Next}
                  onBack={onBackToHome}
                />
              </motion.div>
            )}

            {/* ================= STEP 2: CATEGORY SPECIFIC BRANCHING ================= */}
            {/* 1. PLAYSTORE FLOW */}
            {selectedService === 'playstore' && currentStep === 2 && (
              <motion.div
                key="step2-playstore"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Step2TechSupport
                  isDarkMode={isDarkMode}
                  selectedChoice={techSupport}
                  onSelectChoice={setTechSupport}
                  onNext={handleStep2Next}
                  onBack={() => setCurrentStep(1)}
                />
              </motion.div>
            )}

            {/* Play Console Setup Sub-flow (Step 25) */}
            {selectedService === 'playstore' && currentStep === 25 && (
              <motion.div
                key="step25-playconsole"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <PlayConsoleSetupFlow
                  isDarkMode={isDarkMode}
                  onBack={() => setCurrentStep(2)}
                  onComplete={(details) => {
                    setAppDetails(prev => ({ ...prev, appName: details.appName, packageName: details.packageName }));
                    setCurrentStep(3); // proceed to tier slider
                  }}
                />
              </motion.div>
            )}

            {/* Step 3: Closed Testing Tier Slider */}
            {selectedService === 'playstore' && currentStep === 3 && (
              <motion.div
                key="step3-playstore"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Step3PricingTier
                  isDarkMode={isDarkMode}
                  onNext={handleStep3Next}
                  onBack={() => setCurrentStep(techSupport === 'console_setup' ? 25 : 2)}
                  onPay={(tier) => onCheckoutTier(tier.index)}
                />
              </motion.div>
            )}

            {/* Step 4: App Details Form */}
            {selectedService === 'playstore' && currentStep === 4 && (
              <motion.div
                key="step4-playstore"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Step4AppDetails
                  isDarkMode={isDarkMode}
                  initialData={appDetails}
                  onNext={handleStep4Next}
                  onBack={() => setCurrentStep(3)}
                />
              </motion.div>
            )}

            {/* Step 5: Testers are joining & Copy emails */}
            {selectedService === 'playstore' && currentStep === 5 && (
              <motion.div
                key="step5-playstore"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Step5TesterEmails
                  isDarkMode={isDarkMode}
                  projectId={createdProjectId}
                  requiredTesters={Number.parseInt(selectedTier?.testers ?? '14', 10) || 14}
                  onLoadEmails={onGetVerifiedTesterEmails}
                  onCompleted={handleStep5Completed}
                />
              </motion.div>
            )}

            {/* 2. IOS PUBLISHING CONTACT FLOW */}
            {selectedService === 'ios' && currentStep === 2 && (
              <motion.div
                key="step2-ios"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <ClientContactFlow
                  isDarkMode={isDarkMode}
                  serviceType="ios"
                  onBack={() => setCurrentStep(1)}
                  onFinish={onBackToHome}
                />
              </motion.div>
            )}

            {/* 3. USER EXPERIENCE TESTING CONTACT FLOW */}
            {selectedService === 'ux' && currentStep === 2 && (
              <motion.div
                key="step2-ux"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <ClientContactFlow
                  isDarkMode={isDarkMode}
                  serviceType="ux"
                  onBack={() => setCurrentStep(1)}
                  onFinish={onBackToHome}
                />
              </motion.div>
            )}
          </div>
      </AnimatePresence>

      {/* ================= SLIDE-OVER SUPPORT DRAWER ================= */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div 
            onClick={() => setIsSupportOpen(false)} 
            className="flex-1" 
          />
          <div className={`w-full max-w-md h-full p-8 flex flex-col justify-between shadow-2xl border-l ${
            isDarkMode ? 'bg-[#0E1017] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#4F37FE] text-white flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Client Support Desk</h3>
                    <p className="text-xs text-slate-400">Dedicated UXOS Manager</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSupportOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer bg-transparent border-0"
                >
                  ✕
                </button>
              </div>

              {supportSent ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-emerald-400">Message Received!</h4>
                  <p className="text-xs text-slate-400">
                    A technical lead will review your query within 15 minutes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have questions regarding your Google Play 14-day closed testing track, Google Group setup, or pricing tiers? Drop your message below:
                  </p>

                  <textarea
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={5}
                    placeholder="Type your question or request assistance..."
                    className={`w-full p-4 rounded-2xl border text-sm outline-none resize-none focus:ring-2 focus:ring-[#4F37FE] ${
                      isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />

                  <button
                    onClick={() => {
                      if (supportMessage.trim()) {
                        setSupportSent(true);
                        setTimeout(() => {
                          setSupportSent(false);
                          setSupportMessage('');
                          setIsSupportOpen(false);
                        }, 2500);
                      }
                    }}
                    disabled={!supportMessage.trim()}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                      supportMessage.trim()
                        ? 'bg-[#4F37FE] hover:bg-[#432EE0] text-white shadow-md'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Send to Support Lead
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 text-center pt-4 border-t border-white/10">
              Support Line: +91 40 4567 8900 · Mon - Sun, 9am - 10pm IST
            </div>
          </div>
        </div>
      )}
    </ClientWizardLayout>
  );
}
