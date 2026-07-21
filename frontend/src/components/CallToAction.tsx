import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

interface CallToActionProps {
  onStartTesting: () => void;
  isDarkMode?: boolean;
}

export default function CallToAction({ onStartTesting, isDarkMode = false }: CallToActionProps) {
  return (
    <section className={`py-24 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? 'bg-[#050505]' : 'bg-slate-50'
    }`} id="cta-action-banner">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Main Banner Container */}
        <div className={`border p-6 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 rounded-[32px] transition-colors ${
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
          <motion.div 
            className="max-w-xl text-center lg:text-left relative z-10"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className={`text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to launch your <span className="text-indigo-600">best app</span> yet?
            </h2>
            <p className={`text-sm md:text-base leading-relaxed mb-8 font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Monitor your project progress in real-time, track bug reports, and coordinate with our admin team to publish your app. LaunchOps handles the QA — you focus on building.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={onStartTesting}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm tracking-wide text-white transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border-0 animate-glow-pulse"
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
          </motion.div>

          {/* Right Visual Column (Rocket Launch Asset) */}
          <div className="relative w-full max-w-[560px] h-[360px] lg:h-[460px] shrink-0 flex items-center justify-center">
            {/* Ambient circle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/25 blur-3xl rounded-full pointer-events-none" />
            
            {/* Rocket Launch Image with Slide-in Animation */}
            <motion.img
              src="/cta-rocket.png"
              alt="LaunchOps App Rocket Launch"
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-contain max-h-[450px] scale-110 md:scale-125 relative z-10 drop-shadow-[0_25px_45px_rgba(99,102,241,0.35)]"
            />
          </div>

        </div>

      </div>
    </section>
  );
}
