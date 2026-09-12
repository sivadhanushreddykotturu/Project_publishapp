"use client";

import React, { useState } from 'react';
import TesterNavLayout, { TesterNavTab } from './TesterNavLayout';
import AppTestingExplore from './AppTestingExplore';
import MyAppTestingList from './MyAppTestingList';
import TestingStepInstructions from './TestingStepInstructions';
import TesterSupportView from './TesterSupportView';
import TesterDashboardOverview from './TesterDashboardOverview';
import TesterEarningsView from './TesterEarningsView';

interface TesterExperienceManagerProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export default function TesterExperienceManager({
  isDarkMode,
  onToggleDarkMode,
  onLogout
}: TesterExperienceManagerProps) {
  const [navTab, setNavTab] = useState<TesterNavTab>('app-testing');
  
  // Sub-view states inside "App Testing"
  // 'explore': App testig page 1.png
  // 'my-apps': App testig page 2, 3, 4.png
  // 'step-workflow': App testig page 5 to 10.png
  const [appTestingView, setAppTestingView] = useState<'explore' | 'my-apps' | 'step-workflow'>('explore');
  const [selectedAppId, setSelectedAppId] = useState<string>('blinkit');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // App Name mapping
  const appNames: Record<string, { name: string; subtitle: string }> = {
    blinkit: { name: 'Blinkit', subtitle: 'Playstore closed Testing' },
    deloitte: { name: 'Deloitte', subtitle: 'Playstore closed Testing' },
    kanma: { name: 'Kanma', subtitle: 'Playstore closed Testing' },
    swiggy: { name: 'Swiggy', subtitle: 'Playstore closed Testing' },
    facebook: { name: 'Facebook', subtitle: 'Playstore closed Testing' }
  };

  const handleOpenTesting = (appId: string, step: number = 1) => {
    setSelectedAppId(appId);
    setActiveStep(step as 1 | 2 | 3);
    setAppTestingView('step-workflow');
  };

  return (
    <TesterNavLayout
      currentTab={navTab}
      onSelectTab={(tab) => {
        setNavTab(tab);
        if (tab === 'app-testing') {
          // Keep current subview or reset to explore if needed
        }
      }}
      isDarkMode={isDarkMode}
      onToggleDarkMode={onToggleDarkMode}
      onLogout={onLogout}
      deviceName="OPPO TX100"
      deviceOS="Android"
      userName="Arjun Mehta"
      userAvatar="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=150&auto=format&fit=crop&q=80"
    >
      {/* ================= TAB 1: DASHBOARD ================= */}
      {navTab === 'dashboard' && (
        <TesterDashboardOverview
          isDarkMode={isDarkMode}
          onNavigateToTesting={() => {
            setNavTab('app-testing');
            setAppTestingView('explore');
          }}
          onNavigateToEarnings={() => setNavTab('earnings')}
        />
      )}

      {/* ================= TAB 2: APP TESTING ================= */}
      {navTab === 'app-testing' && (
        <>
          {/* Sub-view 1: Explore Catalog (App testig page 1.png) */}
          {appTestingView === 'explore' && (
            <AppTestingExplore
              isDarkMode={isDarkMode}
              onOpenMyApps={() => setAppTestingView('my-apps')}
              onSelectApp={(id) => handleOpenTesting(id, 1)}
              onJoinTesting={(id) => {
                alert(`Successfully joined ${id.toUpperCase()} testing pool! Check "My Apps" to begin testing.`);
              }}
              onJoinQueue={(id) => {
                alert(`Added to queue for ${id.toUpperCase()}. You will be notified when a slot opens.`);
              }}
            />
          )}

          {/* Sub-view 2: My Apps Management (App testig page 2, 3, 4.png) */}
          {appTestingView === 'my-apps' && (
            <MyAppTestingList
              isDarkMode={isDarkMode}
              onBack={() => setAppTestingView('explore')}
              onOpenAppTesting={(id, step) => handleOpenTesting(id, step || 1)}
            />
          )}

          {/* Sub-view 3: Step 1, 2, 3 Instructions & Upload (App testig page 5 to 10.png) */}
          {appTestingView === 'step-workflow' && (
            <TestingStepInstructions
              isDarkMode={isDarkMode}
              appName={appNames[selectedAppId]?.name || 'Blinkit'}
              appSubtitle={appNames[selectedAppId]?.subtitle || 'Playstore closed Testing'}
              initialStep={activeStep}
              onBack={() => setAppTestingView('my-apps')}
              onOpenSupport={() => setNavTab('support')}
              onCompleteStep={(step) => {
                console.log(`Step ${step} completed.`);
              }}
            />
          )}
        </>
      )}

      {/* ================= TAB 3: EARNINGS ================= */}
      {navTab === 'earnings' && (
        <TesterEarningsView isDarkMode={isDarkMode} />
      )}

      {/* ================= TAB 4: SUPPORT ================= */}
      {navTab === 'support' && (
        <TesterSupportView isDarkMode={isDarkMode} />
      )}
    </TesterNavLayout>
  );
}
