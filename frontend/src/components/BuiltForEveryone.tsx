import { motion } from 'framer-motion';
import { 
  Store, Users, Check, ArrowRight, Upload, Play, Bug, CheckCircle2, 
  Trophy, Gift, Coins, Sparkles, Smartphone 
 } from 'lucide-react';
import testerImage from '../assets/images/regenerated_image_1784283464926.png';
import ownerImage from '../assets/images/regenerated_image_1784291466161.png';

interface BuiltForEveryoneProps {
  isDarkMode?: boolean;
}

export default function BuiltForEveryone({ isDarkMode = false }: BuiltForEveryoneProps) {

  return (
    <section 
      className={`py-24 transition-colors duration-500 ${
        isDarkMode ? 'bg-[#050505] text-slate-300' : 'bg-white text-slate-800'
      }`} 
      id="solutions-features-block"
    >
      {/* Decorative Background Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
        <div className={`absolute -top-40 left-1/4 w-[800px] h-[800px] rounded-full blur-[160px] ${
          isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_75%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent_75%)]'
        }`} />
        <div className={`absolute -bottom-40 right-1/4 w-[800px] h-[800px] rounded-full blur-[160px] ${
          isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04),transparent_75%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.02),transparent_75%)]'
        }`} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10" id="solutions-features-container">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-[11px] tracking-[0.25em] uppercase font-black text-indigo-600 dark:text-indigo-400 block">
            BUILT FOR EVERYONE
          </span>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Two powerful ways to <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">test, improve & launch</span> with confidence.
          </h2>
          <p className={`text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Whether you own an app or love testing new ones, UXOS <br className="hidden md:inline" />
            gives you the tools, people, and platform to succeed.
          </p>
        </div>

        {/* Two-Column Roles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: For App Owners */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-3xl border p-6 md:p-10 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#09090f]/90 border-indigo-500/10 hover:border-indigo-500/20 shadow-[0_15px_50px_rgba(99,102,241,0.04)]' 
                : 'bg-white border-indigo-500/10 hover:border-indigo-500/20 shadow-[0_15px_50px_rgba(99,102,241,0.02)]'
            }`}
          >
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] pointer-events-none -z-10 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.02]" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left Column of Card 1: Text & Features */}
              <div className="md:col-span-6 space-y-6">
                
                {/* Header Icon Block */}
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20 group-hover:scale-105' 
                      : 'bg-indigo-50/80 text-indigo-600 border-indigo-100 group-hover:scale-105 shadow-sm'
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      For App Owners
                    </h3>
                    <p className={`text-xs md:text-sm font-medium leading-relaxed mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Monitor your testing progress, review detailed bug reports, and contact our admin team to publish new apps. Full project visibility from day one.
                    </p>
                  </div>
                </div>

                {/* Features Bullet List */}
                <ul className="space-y-3.5 pt-2">
                  {[
                    'Request app publication via admin',
                    'Choose Test Types & Devices',
                    'Get Real User Feedback',
                    'Detailed Bug Reports',
                    'Track Progress in Real-time'
                  ].map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs md:text-sm font-semibold">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isDarkMode 
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Action Button */}
                <div className="pt-4">
                  <button className={`px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
                    isDarkMode 
                      ? 'bg-transparent border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/5 hover:border-indigo-500/40' 
                      : 'bg-transparent border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-300'
                  }`}>
                    Get Started as Owner <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>

              </div>

              {/* Right Column of Card 1: Beautiful Enlarged Mockup Image */}
              <div className="md:col-span-6 relative flex flex-col justify-center items-center pt-8 md:pt-0">
                <motion.img 
                  src={ownerImage.src} 
                  alt="Upload Dashboard"
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl w-[220px] sm:w-[260px] md:w-[280px] lg:w-[320px] h-auto object-contain scale-110 md:scale-125 transform transition-transform duration-500 group-hover:scale-130 drop-shadow-2xl brightness-[0.98] dark:brightness-[0.9]"
                />
              </div>

            </div>
          </motion.div>

          {/* Card 2: For Testers */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-3xl border p-6 md:p-10 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#050b07]/90 border-emerald-500/10 hover:border-emerald-500/20 shadow-[0_15px_50px_rgba(16,185,129,0.04)]' 
                : 'bg-white border-emerald-500/10 hover:border-emerald-500/20 shadow-[0_15px_50px_rgba(16,185,129,0.02)]'
            }`}
          >
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] pointer-events-none -z-10 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left Column of Card 2: Text & Features */}
              <div className="md:col-span-6 space-y-6">
                
                {/* Header Icon Block */}
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
                    isDarkMode 
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 group-hover:scale-105' 
                      : 'bg-emerald-50/80 text-emerald-600 border-emerald-100 group-hover:scale-105 shadow-sm'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      For Testers
                    </h3>
                    <p className={`text-xs md:text-sm font-medium leading-relaxed mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Test exciting apps, find bugs, earn rewards, and level up your testing journey.
                    </p>
                  </div>
                </div>

                {/* Features Bullet List */}
                <ul className="space-y-3.5 pt-2">
                  {[
                    'Browse New & Ongoing Tests',
                    'Test on Real Android Devices',
                    'Submit Bugs with Screenshots & Recordings',
                    'Earn Points & Rewards',
                    'Climb Leaderboards & Get Badges'
                  ].map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs md:text-sm font-semibold">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isDarkMode 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Action Button */}
                <div className="pt-4">
                  <button className={`px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
                    isDarkMode 
                      ? 'bg-transparent border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 hover:border-emerald-500/40' 
                      : 'bg-transparent border-emerald-200 text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-300'
                  }`}>
                    Join as Tester <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>

              </div>

              {/* Right Column of Card 2: Beautiful Enlarged Mockup Image */}
              <div className="md:col-span-6 relative flex flex-col justify-center items-center pt-8 md:pt-0">
                <motion.img 
                  src={testerImage.src} 
                  alt="Discover Apps"
                  referrerPolicy="no-referrer"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl w-[220px] sm:w-[260px] md:w-[280px] lg:w-[320px] h-auto object-contain scale-110 md:scale-125 transform transition-transform duration-500 group-hover:scale-130 drop-shadow-2xl brightness-[0.98] dark:brightness-[0.9]"
                />
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
