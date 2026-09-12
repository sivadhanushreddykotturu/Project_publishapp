import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string, subtab?: string) => void;
  onStartTesting: () => void;
  showStartTestingAction?: boolean;
  isTesterExperience?: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ 
  currentTab, 
  onTabChange, 
  onStartTesting,
  showStartTestingAction = true,
  isTesterExperience = false,
  isDarkMode,
  onToggleDarkMode
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: { label: string; tab: string; subtab?: string; badge?: string }[] = [
    { label: 'Client Setup', tab: 'client', subtab: 'new-app', badge: '14 Testers' },
    { label: 'Tester Hub', tab: 'tester' },
    { label: 'Admin Console', tab: 'admin' },
    { label: 'Solutions', tab: 'solutions' },
    { label: 'Pricing', tab: 'pricing' }
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b font-sans shadow-xs transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#050505]/90 border-white/5 text-white' 
        : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => { onTabChange('home'); setIsOpen(false); }}
          className="flex items-center gap-2 cursor-pointer group text-left border-0 bg-transparent"
          id="nav-logo-btn"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            <img 
              src="/launchops-logo.png" 
              alt="UXOS Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className={`font-extrabold tracking-widest text-xl uppercase transition-colors ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          } group-hover:text-[#4F37FE]`}>
            UX<span className="text-[#4F37FE]">OS</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className={`hidden lg:flex items-center gap-7 text-sm font-semibold ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            
            return (
              <button
                key={item.label}
                onClick={() => onTabChange(item.tab, item.subtab)}
                className={`flex items-center gap-1.5 hover:text-[#4F37FE] transition-colors cursor-pointer relative py-2 border-0 bg-transparent ${
                  isActive 
                    ? 'text-[#4F37FE] font-bold' 
                    : isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                id={`nav-${item.tab.replace(/\s+/g, '-')}-btn`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-[#4F37FE]/15 text-[#4F37FE] border border-[#4F37FE]/30">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F37FE] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Header Actions */}
        <div className="hidden lg:flex items-center gap-3.5">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10 hover:text-amber-300' 
                : 'bg-slate-50 border-slate-200 text-[#4F37FE] hover:bg-slate-100'
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Tester Portal button */}
          <button
            onClick={() => onTabChange('tester')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              currentTab === 'tester'
                ? 'bg-[#4F37FE]/15 text-[#4F37FE] border-[#4F37FE]'
                : isDarkMode 
                  ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            id="nav-tester-portal-btn"
          >
            Tester Portal
          </button>

          {/* Client Setup CTA */}
          <button 
            onClick={() => onTabChange('client', 'new-app')}
            className="bg-[#4F37FE] hover:bg-[#432ee0] px-5 py-2.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer text-white border-0"
            id="nav-client-setup-btn"
          >
            <span>Client Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-amber-400' 
                : 'bg-slate-50 border-slate-200 text-[#4F37FE]'
            }`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 focus:outline-none focus:ring-1 focus:ring-[#4F37FE] rounded-lg ${
              isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            id="nav-menu-toggle"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={`lg:hidden border-b px-6 pt-4 pb-6 space-y-4 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-[#050505] border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onTabChange(item.tab, item.subtab);
                    setIsOpen(false);
                  }}
                  className={`text-left text-base font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-between ${
                    isActive 
                      ? 'text-[#4F37FE] bg-indigo-50/10 font-bold' 
                      : isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-[#4F37FE]/15 text-[#4F37FE]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onTabChange('client', 'new-app');
                setIsOpen(false);
              }}
              className="w-full bg-[#4F37FE] hover:bg-[#432ee0] py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md cursor-pointer border-0"
            >
              Client Setup (14 Testers)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onTabChange('tester');
                setIsOpen(false);
              }}
              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              Tester Portal
            </button>
          </div>
        </div>
      )}
    </motion.header>
  );
}
