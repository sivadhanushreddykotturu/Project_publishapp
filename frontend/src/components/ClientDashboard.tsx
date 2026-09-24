import { useState, useEffect } from 'react';
import { 
  Plus, Smartphone, Bug, Check, AlertCircle, ArrowRight, 
  ExternalLink, Clock, Upload, Sparkles, CheckCircle, 
  DollarSign, FileText, ChevronRight, Laptop, ShieldCheck, LogOut,
  ChevronDown, ChevronUp, Activity, Users, Landmark, Bell, Settings, Calendar, BarChart2
} from 'lucide-react';
import { TestApp, BugReport } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ClientOnboardingWizard from './client-flow/ClientOnboardingWizard';
import UXOSBrandLogo from './ui/UXOSBrandLogo';

interface ClientDashboardProps {
  isDarkMode: boolean;
  projects: TestApp[];
  bugs: BugReport[];
  onCreateProject: (projectData: Omit<TestApp, 'id' | 'testersCount' | 'bugsFound' | 'progress' | 'status'>) => void;
  onSubmitVerification: (projectId: string, proofUrl: string) => void;
  onPayInvoice: (projectId: string) => void;
  onLogout: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function ClientDashboard({
  isDarkMode,
  projects,
  bugs,
  onCreateProject,
  onSubmitVerification,
  onPayInvoice,
  onLogout,
  initialTab,
  onTabChange
}: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'new-app' | 'billing' | 'bugs'>(() => {
    if (initialTab && ['apps', 'new-app', 'billing', 'bugs'].includes(initialTab)) {
      return initialTab as any;
    }
    return 'apps';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // New App Form States
  const [projectName, setProjectName] = useState('');
  const [appName, setAppName] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [category, setCategory] = useState('Productivity');
  const [devices, setDevices] = useState<string[]>([]);
  const [packageTier, setPackageTier] = useState<'testers_only' | 'managed_testing' | 'launch_ready' | 'custom'>('testers_only');
  const [testersRequired, setTestersRequired] = useState(14);
  const [packageName, setPackageName] = useState('');
  
  // Asset uploads states
  const [apkUrl, setApkUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [demoCredentials, setDemoCredentials] = useState('');
  const [instructions, setInstructions] = useState('');

  const [newProjectSuccess, setNewProjectSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ projectName?: string; appName?: string; packageName?: string; version?: string }>({});

  // Verification Screen Input
  const [consoleProofUrl, setConsoleProofUrl] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // Dropdown states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialTab && ['apps', 'new-app', 'billing', 'bugs'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleTabSelect = (tab: 'apps' | 'new-app' | 'billing' | 'bugs') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setNewProjectSuccess(false);

    const errors: { projectName?: string; appName?: string; packageName?: string; version?: string } = {};
    if (!projectName.trim()) {
      errors.projectName = 'Project Name is required.';
    }
    if (!appName.trim()) {
      errors.appName = 'App Display Name is required.';
    }
    if (!packageName.trim()) {
      errors.packageName = 'Google Play Package ID is required.';
    } else if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(packageName.trim())) {
      errors.packageName = 'Please enter a valid Android package identifier (e.g. com.company.app).';
    }
    if (!version.trim()) {
      errors.version = 'Version tag is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onCreateProject({
      name: appName.trim(),
      version: version.trim(),
      category,
      devices,
      packageTier,
      testersRequired,
      launchDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      projectName: projectName.trim(),
      apkUrl: apkUrl.trim() || 'https://play.google.com/store/apps/details?id=' + packageName.trim(),
      releaseNotes: releaseNotes.trim(),
      demoCredentials: demoCredentials.trim(),
      instructions: instructions.trim(),
      playIntegration: {
        serviceAccountSet: false,
        packageName: packageName.trim()
      }
    });

    setProjectName('');
    setAppName('');
    setVersion('v1.0.0');
    setPackageName('');
    setApkUrl('');
    setReleaseNotes('');
    setDemoCredentials('');
    setInstructions('');
    setDevices([]);
    setNewProjectSuccess(true);
  };

  const handleWizardFinish = (campaignData: any) => {
    onCreateProject({
      name: campaignData.appDetails?.appName || 'UXOS',
      version: 'v1.0.0',
      category: 'Productivity',
      devices: ['Google Pixel 8 Pro', 'Samsung Galaxy S24 Ultra'],
      packageTier: 'testers_only',
      testersRequired: parseInt(campaignData.tier?.testers) || 14,
      launchDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      projectName: `${campaignData.appDetails?.appName || 'UXOS'} Testing Track`,
      apkUrl: campaignData.appDetails?.appLink || 'https://play.google.com/store/apps',
      optInUrl: campaignData.appDetails?.webLink || 'https://play.google.com/apps/testing',
      releaseNotes: '14-day Play Store closed testing campaign initiated.',
      instructions: 'Please follow Google Play closed testing steps and check in daily.'
    });
    setActiveTab('apps');
  };

  const handleVerificationSubmit = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    setVerificationError('');
    if (!consoleProofUrl.trim()) {
      setVerificationError('Play Console screenshot reference link is required.');
      return;
    }
    if (!consoleProofUrl.trim().startsWith('http://') && !consoleProofUrl.trim().startsWith('https://')) {
      setVerificationError('Please enter a valid screenshot URL (starting with http:// or https://).');
      return;
    }

    onSubmitVerification(projectId, consoleProofUrl.trim());
    setConsoleProofUrl('');
  };

  // Find the currently selected project (default to first active if none chosen)
  const clientProjects = projects;
  const selectedProject = clientProjects.find(p => p.id === selectedProjectId) || clientProjects[0];

  const getTierPrice = (tier: string) => {
    switch(tier) {
      case 'testers_only': return '₹4,999';
      case 'managed_testing': return '₹12,499';
      case 'launch_ready': return '₹24,999';
      case 'custom': return 'Custom Pricing';
      default: return '₹0';
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`min-h-screen md:h-screen md:overflow-hidden font-sans transition-colors duration-300 flex ${
      isDarkMode ? 'bg-[#090A0F] text-slate-100' : 'bg-[#F4F5F8] text-slate-900'
    }`}>
      {/* ================= LEFT SIDEBAR (COLLAPSIBLE, MATCHES TESTER/ADMIN) ================= */}
      <aside className={`hidden md:flex shrink-0 flex-col justify-between py-7 border-r transition-all duration-300 ${
        isCollapsed ? 'w-20 px-3 items-center' : 'w-64 px-4'
      } ${
        isDarkMode ? 'bg-[#0F1017] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="w-full">
          {/* Platform Logo & Collapse Toggle */}
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center mb-8 cursor-pointer select-none ${isCollapsed ? 'justify-center' : 'px-2 justify-between'}`}
            title="Click to collapse/expand sidebar"
          >
            <div className="flex items-center gap-3">
              <img src="/launchops-logo.png" alt="UXOS Logo" className="w-8 h-8 object-contain shrink-0" />
              {!isCollapsed && (
                <span className={`text-[22px] font-black tracking-tight font-sans ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  UXOS
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2.5 w-full">
            {[
              {
                id: 'apps',
                label: 'My Applications',
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M4 3h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-5v2h2c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1h2v-2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm2 4v6h12V7H6z" />
                  </svg>
                )
              },
              {
                id: 'new-app',
                label: 'Request New App',
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                )
              },
              {
                id: 'billing',
                label: 'Billing & Invoices',
                icon: (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20 7H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-2 6h-3c-.55 0-1-.45-1-1s.45-1 1-1h3v2zM4 4h14c.55 0 1 .45 1 1s-.45 1-1 1H4C3.45 6 3 5.55 3 5s.45-1 1-1z" />
                  </svg>
                )
              },
              {
                id: 'bugs',
                label: 'Reported Flaws',
                icon: <Bug className="w-5 h-5" />
              }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id as any)}
                  className={`relative w-full flex items-center ${isCollapsed ? 'justify-center py-3.5 px-0' : 'gap-3.5 px-4 py-3.5'} rounded-2xl text-[15px] font-bold transition-all duration-150 cursor-pointer border-0 ${
                    isActive
                      ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-white/5 bg-transparent'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="clientSidebarActiveIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full"
                    />
                  )}
                  <span className="shrink-0">{link.icon}</span>
                  {!isCollapsed && <span>{link.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className={`pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'} w-full`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 shrink-0 text-[14px]">
                C
              </div>
              {!isCollapsed && (
                <div className="text-left text-xs leading-none">
                  <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Client Room</span>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> App Developer
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl border-none cursor-pointer bg-transparent transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-white/5' : 'text-slate-500 hover:text-red-600 hover:bg-red-50/50'
                }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:h-screen overflow-y-auto pb-20 md:pb-0">
        
        {/* Top Header Bar */}
        <header className={`px-4 md:px-8 py-4 md:py-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
          isDarkMode ? 'bg-[#09090B]/90 border-zinc-800/60' : 'bg-white/90 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 md:hidden mb-1">
              <UXOSBrandLogo isDarkMode={isDarkMode} onClick={onLogout} />
            </div>
            <h1 className={`text-lg md:text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Console Control Room
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Manage closed testing releases, verify apps, and audit reports.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabSelect('new-app')}
              className="px-4 py-2 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-md bg-blue-600 hover:bg-blue-700 active:scale-[0.97] transition-all"
            >
              + Request App
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 space-y-8">

          {/* TAB 1: APPLICATIONS LIST */}
          {activeTab === 'apps' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Apps Cards */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-mono">Select Application</span>
                {clientProjects.length === 0 ? (
                  <div className={`p-10 border rounded-3xl text-center ${
                    isDarkMode ? 'bg-white/3 border-white/5' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className={`w-14 h-14 rounded-3xl mx-auto mb-4 flex items-center justify-center ${
                      isDarkMode ? 'bg-white/5' : 'bg-blue-50'
                    }`}>
                      <Smartphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className={`font-bold text-[15px] mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      No applications yet
                    </p>
                    <p className="text-[12px] text-slate-400 font-medium mb-5">
                      Register your first app to start closed testing
                    </p>
                    <button
                      onClick={() => handleTabSelect('new-app')}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-2xl border-0 cursor-pointer shadow-md shadow-blue-600/20 active:scale-[0.97] transition-all"
                    >
                      + Request New App
                    </button>
                  </div>
                ) : (
                  clientProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full p-5 border rounded-2xl text-left transition-all duration-300 cursor-pointer relative ${
                        selectedProject?.id === proj.id 
                          ? (isDarkMode ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-indigo-50/50 border-indigo-600 shadow-md')
                          : (isDarkMode ? 'bg-[#18181B] border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-350 shadow-xs')
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-extrabold tracking-widest font-mono text-indigo-500 uppercase">{proj.category}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                          proj.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                          proj.status === 'Testing' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                      <h3 className={`font-black text-base mb-1 transition-colors ${
                        selectedProject?.id === proj.id ? 'text-indigo-500' : (isDarkMode ? 'text-white' : 'text-slate-800')
                      }`}>{proj.name}</h3>
                      <p className="text-xs text-slate-400 font-mono tracking-tight font-medium">com.launchops.{proj.name.toLowerCase().replace(/\s+/g, '')}</p>
                      
                      {/* Tiny Progress bar */}
                      <div className="mt-5 pt-3 border-t border-slate-200/20">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-bold">
                          <span>Pacing status</span>
                          <span>{proj.progress}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <div className="h-full transition-all duration-700" style={{ width: `${proj.progress}%`, backgroundColor: '#4F46E5' }} />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Right Columns: Detail Panel */}
              <div className="lg:col-span-2">
                {selectedProject ? (
                  <div className={`border rounded-3xl p-8 relative overflow-hidden transition-all duration-300 ${
                    isDarkMode ? 'bg-[#0F1017] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-md'
                  }`}>
                    {/* Top Accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-3xl" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8 border-slate-200/25">
                      <div>
                        <h3 className={`text-3xl font-black mb-1.5 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {selectedProject.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Tier Package: <span className="capitalize font-extrabold text-indigo-500">{selectedProject.packageTier?.replace('_', ' ')}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider border-green-500/20 bg-green-500/10 text-green-500">
                          Published to testers
                        </span>
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider border-slate-500/20 bg-slate-500/10 text-slate-500">
                          Commercial process external
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Specs */}
                      <div className="space-y-6">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-mono mb-2">Technical Specification</span>
                          <div className={`p-4 border rounded-2xl space-y-3 font-semibold text-xs text-slate-655 dark:text-slate-300 ${
                            isDarkMode ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex justify-between">
                              <span className="text-slate-550">Package Version:</span>
                              <span className="font-mono">{selectedProject.version}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-555">Target Devices:</span>
                              <span>{selectedProject.devices.length} Devices</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-550">Testing Progress:</span>
                              <span className="font-mono text-indigo-500">{selectedProject.progress.toFixed(1)}%</span>
                            </div>
                            
                            {selectedProject.projectName && (
                              <div className="flex justify-between border-t pt-2 mt-2 border-slate-200/20">
                                <span className="text-slate-500">Project Name:</span>
                                <span className="font-medium">{selectedProject.projectName}</span>
                              </div>
                            )}
                            {selectedProject.apkUrl && (
                              <div className="flex justify-between border-t pt-2 border-slate-200/20">
                                <span className="text-slate-500">APK/AAB Link:</span>
                                <a href={selectedProject.apkUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono text-[10px]">
                                  Download/Link <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {selectedProject.demoCredentials && (
                              <div className="border-t pt-2 border-slate-200/20">
                                <span className="text-slate-555 block mb-1">Demo Credentials:</span>
                                <span className="font-mono text-[10px] text-slate-400 block bg-black/10 p-2 rounded-lg">{selectedProject.demoCredentials}</span>
                              </div>
                            )}
                            {selectedProject.releaseNotes && (
                              <div className="border-t pt-2 border-slate-200/20">
                                <span className="text-slate-555 block mb-1">Release Notes:</span>
                                <span className="text-[10.5px] text-slate-400 block">{selectedProject.releaseNotes}</span>
                              </div>
                            )}
                            {selectedProject.instructions && (
                              <div className="border-t pt-2 border-slate-200/20">
                                <span className="text-slate-555 block mb-1">Testing Flow Instructions:</span>
                                <span className="text-[10.5px] text-slate-400 block bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10 whitespace-pre-wrap">{selectedProject.instructions}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Publication status */}
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-mono mb-2">Tester enrollment</span>
                          <div className={`p-4 border rounded-2xl space-y-3 ${
                            isDarkMode ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                          }`}>
                            {selectedProject.verificationStatus === 'none' && (
                              <div className="text-xs font-semibold text-slate-500">
                                <p className="text-amber-500 font-extrabold flex items-center gap-1.5 mb-2">
                                  <AlertCircle className="w-4 h-4" /> Vetting Required
                                </p>
                                <p className="text-[11px] leading-relaxed mb-3">Upload verification console screenshot proof to activate whitelists.</p>
                                <form onSubmit={(e) => handleVerificationSubmit(e, selectedProject.id)} className="space-y-3">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter proof screenshot link (e.g. imgur.com/ref)"
                                    value={consoleProofUrl}
                                    onChange={(e) => setConsoleProofUrl(e.target.value)}
                                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                                      isDarkMode 
                                        ? `${verificationError ? 'border-red-500 bg-red-500/5' : 'bg-[#09090B] border-zinc-800'} text-white` 
                                        : `${verificationError ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-800`
                                    }`}
                                  />
                                  {verificationError && <p className="text-[10px] font-bold text-red-500">{verificationError}</p>}
                                  <button 
                                    type="submit" 
                                    className="px-4 py-2 text-white text-xs font-black rounded-xl border-0 cursor-pointer"
                                    style={{ backgroundColor: '#4F46E5' }}
                                  >
                                    Submit Screenshot Proof
                                  </button>
                                </form>
                              </div>
                            )}

                            {selectedProject.verificationStatus === 'pending' && (
                              <div className="text-xs font-semibold text-slate-500">
                                <p className="text-amber-500 font-extrabold flex items-center gap-1.5 mb-2">
                                  <Clock className="w-4 h-4" /> Awaiting Vetting
                                </p>
                                <p className="text-[11px] leading-relaxed">Admin is currently validating your screenshot proof.whitelisting begins immediately upon validation.</p>
                              </div>
                            )}

                            {selectedProject.verificationStatus === 'approved' && (
                              <div className="text-xs font-semibold text-slate-500 space-y-2">
                                <p className="text-green-500 font-extrabold flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4" /> Verified Dashboard
                                </p>
                                <p className="text-[11px]">Play Store closed testing sync whitelisting link is active.</p>
                                <a 
                                  href={selectedProject.optInUrl || 'https://play.google.com/apps/testing/com.launchops.app'} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 text-indigo-500 hover:underline"
                                >
                                  Join Play Store Track <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Panel: Stepper milestones */}
                      <div className="space-y-6">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block font-mono">14-Day closed testing milestones</span>
                        <div className="space-y-4 font-semibold text-xs">
                          {[
                            { label: 'Verify Dashboard Ownership', desc: 'Active screenshot validation.', step: 1 },
                            { label: 'Google Group Email Review', desc: 'Opt-in email whitelisting sync.', step: 2 },
                            { label: 'Install Proof Verifications', desc: 'QA specialists download the package.', step: 3 },
                            { label: '14-Day continuous check-in', desc: 'Daily check-in logs active.', step: 4 },
                            { label: 'Whitelisting Completed', desc: 'Track successfully validated.', step: 5 }
                          ].map((stepItem) => {
                            const currentProgressStep = Math.round((selectedProject.progress || 0) / 20);
                            const isDone = currentProgressStep >= stepItem.step;
                            return (
                              <div key={stepItem.step} className="flex gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-black ${
                                  isDone 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/35' 
                                    : 'bg-slate-500/10 text-slate-450 border border-slate-500/10'
                                }`}>
                                  {stepItem.step}
                                </div>
                                <div>
                                  <span className={`block font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{stepItem.label}</span>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">{stepItem.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-550 text-xs font-semibold">Select an app to view campaigns.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REQUEST NEW APP ONBOARDING WIZARD */}
          {activeTab === 'new-app' && (
            <div className="w-full -mt-6">
              <ClientOnboardingWizard
                isDarkMode={isDarkMode}
                onFinish={handleWizardFinish}
                onCancel={() => setActiveTab('apps')}
              />
            </div>
          )}

          {/* TAB 3: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Commercial Processing</h2>
                <p className="text-[11px] text-slate-500 mt-1">Invoices, payment, and commercial activation are managed externally.</p>
              </div>

              {clientProjects.length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  No billing history available.
                </div>
              ) : (
                <div className="space-y-4">
                  {clientProjects.map((p) => (
                    <div 
                      key={p.id}
                      className={`p-6 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                        isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-805'}`}>
                            {getTierPrice(p.packageTier || 'testers_only')}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-slate-500/10 text-slate-500">
                            Managed externally
                          </span>
                        </div>
                        <div className="text-xs space-y-1 font-semibold text-slate-500">
                          <p>App Campaign: <span className="text-slate-450">{p.name}</span></p>
                          <p>Package Tier: <span className="capitalize">{p.packageTier?.replace('_', ' ')}</span></p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500">No action is required in UXOS.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPORTED BUGS */}
          {activeTab === 'bugs' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-905'}`}>App Testing Reports</h2>
                <p className="text-[11px] text-slate-500 mt-1">Review verified bugs verified by admins and published directly from testers’ tracks.</p>
              </div>

              {bugs.filter(b => b.isPublished).length === 0 ? (
                <div className={`p-10 border rounded-2xl text-center text-slate-550 text-xs font-semibold ${
                  isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  No verified bugs published for your apps yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bugs
                    .filter(b => b.isPublished)
                    .map((b) => (
                      <div 
                        key={b.id}
                        className={`p-6 border rounded-2xl space-y-4 ${
                          isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                            b.severity === 'Critical' ? 'bg-red-500/10 text-red-500' :
                            b.severity === 'High' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
                          }`}>{b.severity}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">{b.status}</span>
                        </div>

                        <div>
                          <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-805'}`}>{b.title}</h4>
                          <span className="text-[10px] text-slate-500 block mt-1 font-semibold">{b.appName} · Tester OS: {b.osVersion}</span>
                        </div>

                        <div className="text-xs space-y-1.5 font-semibold text-slate-500 pt-3 border-t border-slate-500/5">
                          <p>Reproduction Steps:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            {b.reproductionSteps.map((step, idx) => (
                              <li key={idx} className="font-medium text-[11px] text-slate-550">{step}</li>
                            ))}
                          </ol>
                        </div>

                        {b.adminNotes && (
                          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs font-semibold text-slate-500 mt-2">
                            <span className="text-indigo-500 font-extrabold block text-[10px] uppercase font-mono mb-1">Developer Admin Notes</span>
                            {b.adminNotes}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around z-50 ${
        isDarkMode ? 'bg-[#0F1017] border-white/10' : 'bg-white border-slate-200'
      }`}>
        {[
          { id: 'apps', label: 'Apps', icon: <Smartphone className="w-5 h-5" /> },
          { id: 'new-app', label: 'New', icon: <Plus className="w-5 h-5" /> },
          { id: 'billing', label: 'Billing', icon: <Landmark className="w-5 h-5" /> },
          { id: 'bugs', label: 'Bugs', icon: <Bug className="w-5 h-5" /> }
        ].map(link => (
          <button
            key={link.id}
            onClick={() => handleTabSelect(link.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 border-0 bg-transparent cursor-pointer ${
              activeTab === link.id
                ? 'text-blue-500 font-bold'
                : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {link.icon}
            <span className="text-[10px] font-bold">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
