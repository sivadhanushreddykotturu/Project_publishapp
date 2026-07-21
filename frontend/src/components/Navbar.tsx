import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onStartTesting: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ 
  currentTab, 
  onTabChange, 
  onStartTesting,
  isDarkMode,
  onToggleDarkMode
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Tester Hub', hasDropdown: false },
    { label: 'Solutions', hasDropdown: true },
    { label: 'Resources', hasDropdown: true },
    { label: 'Pricing', hasDropdown: false },
    { label: 'Company', hasDropdown: true }
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
          className="flex items-center gap-2 cursor-pointer group text-left"
          id="nav-logo-btn"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold italic text-sm">LT</span>
          </div>
          <span className={`font-extrabold tracking-widest text-xl uppercase transition-colors ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          } group-hover:text-indigo-600`}>
            Launch<span className="text-indigo-600">Ops</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className={`hidden lg:flex items-center gap-8 text-sm font-semibold ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {navItems.map((item) => {
            const mappedTab = item.label === 'Tester Hub' ? 'tester' : item.label === 'Client Room' ? 'client' : item.label === 'Ops Bridge' ? 'admin' : item.label.toLowerCase();
            const isActive = currentTab === mappedTab;
            
            return (
              <button
                key={item.label}
                onClick={() => onTabChange(mappedTab)}
                className={`flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer relative py-2 ${
                  isActive 
                    ? 'text-indigo-600 font-bold' 
                    : isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                id={`nav-${mappedTab.replace(/\s+/g, '-')}-btn`}
              >
                {item.label}
                {item.hasDropdown && (
                  <ChevronDown className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Header Actions */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10 hover:text-amber-300' 
                : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100 hover:text-indigo-700'
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>


          <button 
            onClick={onStartTesting}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer text-white border-0"
            id="nav-start-testing-btn"
          >
            Start Testing 
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-3">
          {/* Theme Toggle Button Mobile */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-amber-400' 
                : 'bg-slate-50 border-slate-200 text-indigo-600'
            }`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>


          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg ${
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
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const mappedTab = item.label === 'Tester Hub' ? 'tester' : item.label.toLowerCase();
              const isActive = currentTab === mappedTab;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onTabChange(mappedTab);
                    setIsOpen(false);
                  }}
                  className={`text-left text-base font-semibold py-2 px-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.hasDropdown && <ChevronDown className="w-4 h-4 opacity-70" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
            <button
              onClick={() => {
                onStartTesting();
                setIsOpen(false);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white shadow-md shadow-indigo-500/10"
            >
              Start Testing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.header>
  );
}
