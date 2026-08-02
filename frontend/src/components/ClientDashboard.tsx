import { useState, useEffect } from 'react';
import { 
  Plus, Smartphone, Bug, Check, AlertCircle, ArrowRight, 
  ExternalLink, Clock, Upload, Sparkles, CheckCircle, 
  DollarSign, FileText, ChevronRight, Laptop, ShieldCheck, LogOut,
  ChevronDown, ChevronUp, Activity, Users, Landmark, Bell, Settings, Calendar, BarChart2
} from 'lucide-react';
import { TestApp, BugReport } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className={`h-screen overflow-hidden font-sans transition-colors duration-300 flex ${
      isDarkMode ? 'bg-[#09090B] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>      {/* ================= LEFT SIDEBAR (THEME AWARE LIKE TESTER DASHBOARD) ================= */}
      <aside className={`hidden md:flex w-[260px] border-r shrink-0 flex-col justify-between p-6 sticky top-0 h-screen z-20 ${
        isDarkMode ? 'bg-[#09090B] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-md shadow-indigo-600/30">
              <span className="text-white font-extrabold italic text-sm">LO</span>
            </div>
            <span className="font-black tracking-wider text-lg uppercase font-display">
              Launch<span className="text-indigo-600">Ops</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'apps', label: 'My Applications', icon: <Smartphone className="w-4.5 h-4.5" /> },
              { id: 'new-app', label: 'Request New App', icon: <Plus className="w-4.5 h-4.5" /> },
              { id: 'billing', label: 'Billing & Invoices', icon: <Landmark className="w-4.5 h-4.5" /> },
              { id: 'bugs', label: 'Reported Flaws', icon: <Bug className="w-4.5 h-4.5" /> }
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleTabSelect(link.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border-none cursor-pointer text-left ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-zinc-800/30 bg-transparent'
                        : 'text-slate-650 hover:text-slate-900 hover:bg-indigo-50/30 bg-transparent'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Footer */}
        <div className={`pt-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 font-display">
                C
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <span className={`font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Client Room</span>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> App Developer
                </span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className={`p-2 rounded-xl border-none cursor-pointer bg-transparent transition-colors ${
                isDarkMode ? 'text-slate-400 hover:text-red-450 hover:bg-zinc-800/30' : 'text-slate-500 hover:text-red-600 hover:bg-red-50/50'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className={`px-8 py-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${
          isDarkMode ? 'bg-[#09090B]/90 border-zinc-800/60' : 'bg-white/90 border-slate-200'
        }`}>
          <div>
            <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-905'}`}>
              Console Control Room
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Manage closed testing releases, verify apps, and audit reports.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold ${
              isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-slate-300' : 'bg-slate-550 border-slate-200 text-slate-700'
            }`}>
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Developer Panel</span>
            </div>

            <button 
              onClick={() => handleTabSelect('new-app')}
              className="px-4 py-2 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-md"
              style={{ backgroundColor: '#4F46E5' }}
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
                  <div className={`p-10 border rounded-2xl text-center text-slate-500 text-xs font-semibold ${
                    isDarkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-white border-slate-200'
                  }`}>
                    No applications registered yet.
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
                  <div className={`border rounded-3xl p-8 relative overflow-hidden transition-all duration-350 ${
                    isDarkMode ? 'glass-card-dark shadow-2xl' : 'glass-card-light shadow-md'
                  }`}>
                    {/* Top Accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#4F46E5' }} />

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
                            <div className="text-xs font-semibold text-slate-500">
                              <p className="text-green-500 font-extrabold flex items-center gap-1.5 mb-2">
                                <CheckCircle className="w-4 h-4" /> Opportunity published
                              </p>
                              <p className="text-[11px] leading-relaxed">Eligible active testers have been notified. Enrollment accepts 14 testers and up to 3 waitlisted testers.</p>
                            </div>
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

          {/* TAB 2: REQUEST NEW APP FORM */}
          {activeTab === 'new-app' && (
            <div className="max-w-2xl mx-auto">
              <div className={`border rounded-3xl p-8 relative overflow-hidden ${
                isDarkMode ? 'bg-[#18181B] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Accent Header line */}
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#4F46E5' }} />

                <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Request New App</h3>
                <p className="text-[11px] text-slate-500 mb-6">Submit your app details below. Our admin team will review and set up your testing project.</p>
                
                {newProjectSuccess && (
                  <div className="mb-6 p-4 border border-green-500/20 bg-green-500/5 rounded-2xl flex items-center gap-3 text-xs text-green-550 font-bold">
                    <CheckCircle className="w-5 h-5" /> Your app request has been sent to the admin for review.
                  </div>
                )}

                <form onSubmit={handleCreateProjectSubmit} className="space-y-6">
                  {/* Project & App Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Project Name</label>
                      <input
                        type="text"
                        placeholder="e.g. FitTrack Q2 Test Track"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode 
                            ? `${formErrors.projectName ? 'border-red-500 bg-red-500/5' : 'bg-[#09090B] border-zinc-800'} text-white` 
                            : `${formErrors.projectName ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-800`
                        }`}
                      />
                      {formErrors.projectName && <p className="text-[10px] font-bold text-red-500 mt-1.5">{formErrors.projectName}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">App Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. FitTrack Pro"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode 
                            ? `${formErrors.appName ? 'border-red-500 bg-red-500/5' : 'bg-[#09090B] border-zinc-800'} text-white` 
                            : `${formErrors.appName ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-800`
                        }`}
                      />
                      {formErrors.appName && <p className="text-[10px] font-bold text-red-500 mt-1.5">{formErrors.appName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Required Device Models (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Google Pixel 8 Pro, Samsung Galaxy S24"
                      value={devices.join(', ')}
                      onChange={(e) => setDevices(e.target.value.split(',').map((device) => device.trim()).filter(Boolean))}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                        isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5">Leave blank to notify all active testers. Device names must match a tester's registered device.</p>
                  </div>

                  {/* Package Name & APK Link Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Play Store Package ID</label>
                      <input
                        type="text"
                        placeholder="e.g. com.company.app"
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode 
                            ? `${formErrors.packageName ? 'border-red-500 bg-red-500/5' : 'bg-[#09090B] border-zinc-800'} text-white` 
                            : `${formErrors.packageName ? 'border-red-500 bg-red-500/5' : 'bg-white border-slate-200'} text-slate-800`
                        }`}
                      />
                      {formErrors.packageName && <p className="text-[10px] font-bold text-red-500 mt-1.5">{formErrors.packageName}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Upload APK/AAB or Testing Link</label>
                      <input
                        type="text"
                        placeholder="e.g. https://drive.google.com/apk or play store link"
                        value={apkUrl}
                        onChange={(e) => setApkUrl(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Version Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. v1.0.0"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option>Productivity</option>
                        <option>Finance</option>
                        <option>Health & Fitness</option>
                        <option>Social</option>
                        <option>Games</option>
                      </select>
                    </div>
                  </div>

                  {/* Release Notes & Demo Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Release Notes</label>
                      <textarea
                        rows={2}
                        placeholder="What should testers focus on in this build?"
                        value={releaseNotes}
                        onChange={(e) => setReleaseNotes(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Test Credentials / Demo Account</label>
                      <textarea
                        rows={2}
                        placeholder="Login: testuser@company.com / Pass: 12345"
                        value={demoCredentials}
                        onChange={(e) => setDemoCredentials(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                          isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Testing Instructions Path */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 font-mono">Testing Instructions / Task Flow Path</label>
                    <textarea
                      rows={3}
                      placeholder="Detail step-by-step instructions for whitelisted testers to follow..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 ${
                        isDarkMode ? 'bg-[#09090B] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Plan Cards Selection */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-3 font-mono">Select Testing Package Tier</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'testers_only', title: 'Testers Only', desc: '14 whitelisted users slot allotment.', price: '₹4,999' },
                        { id: 'managed_testing', title: 'Managed Track', desc: '14 whitelists + weekly telemetry.', price: '₹12,499' },
                        { id: 'launch_ready', title: 'Launch Ready', desc: '14 whitelists + continuous logs.', price: '₹24,999' }
                      ].map((tier) => {
                        const isChosen = packageTier === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => {
                              setPackageTier(tier.id as any);
                              setTestersRequired(14);
                            }}
                            className={`p-5 border rounded-2xl text-left transition-all duration-300 cursor-pointer ${
                              isChosen 
                                ? (isDarkMode ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-indigo-50/50 border-indigo-650 shadow-md')
                                : (isDarkMode ? 'bg-black/30 border-white/5 hover:border-zinc-800' : 'bg-white border-slate-200 hover:border-slate-350')
                            }`}
                          >
                            <span className={`block font-black text-xs ${isChosen ? 'text-indigo-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>{tier.title}</span>
                            <span className="text-[9px] text-slate-500 block mt-1.5 leading-relaxed">{tier.desc}</span>
                            <span className="block font-mono text-xs font-black text-indigo-500 mt-3">{tier.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-white text-xs font-black rounded-xl border-0 cursor-pointer shadow-md hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Publish Testing Request
                  </button>
                </form>
              </div>
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

                      <span className="text-[10px] font-semibold text-slate-500">No action is required in LaunchOps.</span>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0C] border-t border-zinc-800/60 flex items-center justify-around z-50">
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
              activeTab === link.id ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-200'
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
