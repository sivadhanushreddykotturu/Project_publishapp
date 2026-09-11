import { useState } from 'react';
import { 
  Search, Star, MapPin, Award, CheckCircle, 
  Smartphone, UserCheck, ShieldCheck, Heart, Sparkles 
} from 'lucide-react';
import { Tester } from '../types';
import { MOCK_TESTERS } from '../mockData';
import BlurText from './ui/BlurText';

interface SolutionsScreenProps {
  onSelectTester?: (tester: Tester) => void;
  isDarkMode?: boolean;
}

export default function SolutionsScreen({ onSelectTester, isDarkMode = false }: SolutionsScreenProps) {
  const [testers] = useState<Tester[]>(MOCK_TESTERS);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const specialties = [
    { value: 'all', label: 'All Specialties' },
    { value: 'BLE', label: 'BLE & Hardware Sync' },
    { value: 'Performance', label: 'Performance Profiling' },
    { value: 'Security', label: 'Security & Biometrics' },
    { value: 'Foldables', label: 'Foldables & Layouts' },
    { value: 'Localization', label: 'Localization QA' }
  ];

  const countries = [
    { value: 'all', label: 'All Regions' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Germany', label: 'Germany' }
  ];

  const filteredTesters = testers.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || t.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || t.country === selectedCountry;
    return matchesSearch && matchesSpecialty && matchesCountry;
  });

  return (
    <div className={`max-w-7xl mx-auto px-6 py-28 relative z-10 font-sans transition-colors duration-300 ${
      isDarkMode ? 'text-slate-300' : 'text-slate-800'
    }`}>
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] tracking-widest font-bold mb-6 uppercase ${
          isDarkMode 
            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' 
            : 'border-indigo-100 bg-indigo-50 text-indigo-600'
        }`}>
          Elite Human Intelligence
        </div>
        <BlurText
          text="VERIFIED ANDROID TESTERS"
          delay={80}
          animateBy="letters"
          direction="top"
          className={`text-4xl md:text-5xl font-extrabold mb-6 tracking-tight justify-center ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        />
        <p className={`text-base md:text-lg leading-relaxed ${
          isDarkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>
          Unlock crowdsourced testing from professional QA engineers with real physical devices. Run exploratory test sessions, regression analysis, and BLE connectivity validation in every corner of the world.
        </p>
      </div>

      {/* Vetting Process Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className={`border rounded-2xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#0F0F12]/80 border-white/5 hover:border-indigo-500/20' 
            : 'bg-white border-slate-200 shadow-xs hover:border-indigo-300'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
            isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'
          }`}>
            <UserCheck className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <h3 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>1. Background Verification</h3>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
            Every tester is certified by UXOS and undergoes thorough identity verification, technical screening, and NDA execution to protect your IP.
          </p>
        </div>

        <div className={`border rounded-2xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#0F0F12]/80 border-white/5 hover:border-purple-500/20' 
            : 'bg-white border-slate-200 shadow-xs hover:border-purple-300'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
            isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50'
          }`}>
            <Smartphone className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>2. Physical Device Audits</h3>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
            No virtual emulators. We audit and continuously verify testers' physical hardware models, screen resolutions, and OS build signatures.
          </p>
        </div>

        <div className={`border rounded-2xl p-6 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#0F0F12]/80 border-white/5 hover:border-pink-500/20' 
            : 'bg-white border-slate-200 shadow-xs hover:border-pink-300'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
            isDarkMode ? 'bg-pink-500/10' : 'bg-pink-50'
          }`}>
            <ShieldCheck className="w-6 h-6 text-pink-500" />
          </div>
          <h3 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>3. Quality-driven Rewards</h3>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
            Our testers are compensated on a performance-bonus matrix. They find unique corner-case bugs because their reputation and payout scale with report actionability.
          </p>
        </div>
      </div>

      {/* Tester Directory Banner */}
      <div className={`border-t pt-12 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
        <h2 className={`text-2xl font-bold mb-8 text-center md:text-left ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Browse Top QA Experts
        </h2>

        {/* Directory Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
                isDarkMode 
                  ? 'bg-[#0F0F12]/80 border-white/5 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Specialty selector dropdown */}
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
                isDarkMode 
                  ? 'bg-[#0F0F12]/80 border-white/5 text-gray-300' 
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {specialties.map((spec) => (
                <option key={spec.value} value={spec.value} className={isDarkMode ? "bg-[#0F0F12] text-white" : "bg-white text-slate-900"}>
                  {spec.label}
                </option>
              ))}
            </select>
          </div>

          {/* Country region dropdown */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 ${
                isDarkMode 
                  ? 'bg-[#0F0F12]/80 border-white/5 text-gray-300' 
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {countries.map((ctr) => (
                <option key={ctr.value} value={ctr.value} className={isDarkMode ? "bg-[#0F0F12] text-white" : "bg-white text-slate-900"}>
                  {ctr.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTesters.map((tester) => (
            <div 
              key={tester.id}
              className={`border rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                isDarkMode 
                  ? 'bg-[#0F0F12]/60 border-white/5 hover:bg-[#0f0f12]/95 hover:border-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/5' 
                  : 'bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-150/50 hover:border-indigo-200'
              }`}
              data-purpose="tester-card"
            >
              {/* Profile Row */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <img
                    src={tester.avatar}
                    alt={tester.name}
                    className={`w-14 h-14 rounded-full border object-cover ${
                      isDarkMode ? 'border-white/10' : 'border-slate-200'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${
                    isDarkMode ? 'border-[#0F0F12]' : 'border-white'
                  } ${
                    tester.status === 'Testing' ? 'bg-indigo-400' : tester.status === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-base truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{tester.name}</h4>
                  <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {tester.country}
                  </p>
                  <p className={`text-xs font-semibold mt-1.5 inline-flex items-center gap-1 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>
                    <Award className="w-3.5 h-3.5" /> {tester.specialty}
                  </p>
                </div>
              </div>

              {/* Hardware List */}
              <div className="mb-6">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold block mb-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-slate-400'
                }`}>Verified Test Devices</span>
                <div className="flex flex-wrap gap-1.5">
                  {tester.devices.map((device, i) => (
                    <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-mono border ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/5 text-gray-400' 
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      {device}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats Footer Row */}
              <div className={`pt-4 border-t flex items-center justify-between text-xs ${
                isDarkMode ? 'border-white/5' : 'border-slate-200'
              }`}>
                <div>
                  <span className={`block ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Total Bugs Found</span>
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tester.bugsFoundCount} bugs</span>
                </div>
                <div className="text-right">
                  <span className={`block ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Tester Rating</span>
                  <span className={`font-extrabold text-indigo-500 text-sm flex items-center justify-end gap-1 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}>
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {tester.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredTesters.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className={`font-bold text-lg ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>No testers match filters</p>
              <p className="text-sm text-gray-500 mt-1">Try expanding your region or selection criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
