import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

interface CallToActionProps {
  onStartTesting: () => void;
  isDarkMode?: boolean;
}

export default function CallToAction({ onStartTesting, isDarkMode = false }: CallToActionProps) {
  return (
    <section className={`py-16 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505]' : 'bg-white'
    }`} id="cta-action-banner">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Main Banner Container */}
        <div className={`border p-8 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 rounded-[32px] transition-colors ${
          isDarkMode 
            ? 'bg-[#0f0f13] border-white/5 shadow-2xl shadow-indigo-500/5' 
            : 'bg-gradient-to-r from-indigo-50/60 to-purple-50/50 border-indigo-100/80 shadow-xl'
        }`}>
          
          {/* Indigo/Purple Glowing backdrops */}
          <div className={`absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none ${
            isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-200/20'
          }`} />
          <div className={`absolute bottom-0 right-0 w-96 h-96 blur-[90px] rounded-full pointer-events-none ${
            isDarkMode ? 'bg-purple-500/5' : 'bg-purple-200/20'
          }`} />

          {/* Left Text and Action Column */}
          <div className="max-w-xl text-center lg:text-left relative z-10">
            <h2 className={`text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to launch your <span className="text-indigo-600">best app</span> yet?
            </h2>
            <p className={`text-sm md:text-base leading-relaxed mb-8 font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Join thousands of teams who trust LaunchTest for premium physical Android app testing. Find errors, ensure compatibility, and release with total certainty.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={onStartTesting}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm tracking-wide text-white transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                Start Testing Now <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={onStartTesting}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl border font-bold text-sm transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isDarkMode 
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Talk to Sales
              </button>
            </div>
          </div>

          {/* Right Visual Column (Floating Smart Device) */}
          <div className="relative w-full max-w-[420px] h-[280px] lg:h-[320px] shrink-0 pointer-events-none">
            {/* Ambient circle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 blur-3xl rounded-full" />
            
            {/* Sleek Floating Smart Device */}
            <motion.div
              animate={{ 
                y: [0, -12, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Outer chassis */}
              <div className={`w-[180px] h-[300px] rounded-[36px] border-4 p-2.5 relative shadow-2xl overflow-hidden flex flex-col justify-between transition-colors ${
                isDarkMode ? 'bg-[#0f0f13] border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400/40" />
                </div>
                
                {/* Simulated Screen Content */}
                <div className={`flex-1 rounded-[24px] p-4 pt-6 flex flex-col justify-between relative overflow-hidden border ${
                  isDarkMode ? 'bg-[#14141a] border-white/5' : 'bg-gradient-to-b from-indigo-50/50 to-white border-slate-200'
                }`}>
                  <div className="space-y-2">
                    <div className="h-1.5 w-1/3 bg-indigo-600/30 rounded-full" />
                    <div className={`h-5 w-5/6 border rounded-lg flex items-center px-1.5 justify-between shadow-xs ${
                      isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
                    }`}>
                      <div className="h-1 w-1/2 bg-slate-300 rounded-full" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  {/* Tiny simulated chart */}
                  <div className="space-y-1">
                    <div className="flex items-end justify-between gap-1 h-14">
                      {[30, 55, 45, 75, 60, 90, 80].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className={`flex items-center justify-between text-[6px] font-bold ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <span>Mon</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Glowing rocket plume overlay or accent */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
          </div>

        </div>

      </div>
    </section>
  );
}
