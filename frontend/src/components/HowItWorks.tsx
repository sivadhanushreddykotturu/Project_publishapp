import { motion } from 'framer-motion';
import { Upload, Users, Smartphone, Bug, Rocket, ChevronRight } from 'lucide-react';

interface HowItWorksProps {
  isDarkMode?: boolean;
}

export default function HowItWorks({ isDarkMode = false }: HowItWorksProps) {
  const steps = [
    {
      num: '1',
      title: 'Upload Your App',
      desc: 'Upload APK or provide Play Store link',
      icon: <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      // Light Theme Colors
      lightBg: 'bg-indigo-50/50',
      lightBorder: 'border-indigo-100',
      lightBadge: 'bg-indigo-600',
      lightShadow: 'rgba(99,102,241,0.08)',
      lightGlow: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
      // Dark Theme Colors
      darkBg: 'bg-indigo-950/20',
      darkBorder: 'border-indigo-500/20',
      darkBadge: 'bg-indigo-600',
      darkShadow: 'rgba(99,102,241,0.15)',
      darkGlow: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.02) 70%)'
    },
    {
      num: '2',
      title: 'We Assign Testers',
      desc: 'AI matches the right testers for you',
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      // Light Theme Colors
      lightBg: 'bg-blue-50/50',
      lightBorder: 'border-blue-100',
      lightBadge: 'bg-blue-600',
      lightShadow: 'rgba(59,130,246,0.08)',
      lightGlow: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)',
      // Dark Theme Colors
      darkBg: 'bg-blue-950/20',
      darkBorder: 'border-blue-500/20',
      darkBadge: 'bg-blue-600',
      darkShadow: 'rgba(59,130,246,0.15)',
      darkGlow: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.02) 70%)'
    },
    {
      num: '3',
      title: 'Testing Happens',
      desc: 'Real people test on real devices',
      icon: <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      // Light Theme Colors
      lightBg: 'bg-emerald-50/50',
      lightBorder: 'border-emerald-100',
      lightBadge: 'bg-emerald-600',
      lightShadow: 'rgba(16,185,129,0.08)',
      lightGlow: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 70%)',
      // Dark Theme Colors
      darkBg: 'bg-emerald-950/20',
      darkBorder: 'border-emerald-500/20',
      darkBadge: 'bg-emerald-600',
      darkShadow: 'rgba(16,185,129,0.15)',
      darkGlow: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.02) 70%)'
    },
    {
      num: '4',
      title: 'Get Bug Reports',
      desc: 'Detailed reports with steps, screenshots & videos',
      icon: <Bug className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      // Light Theme Colors
      lightBg: 'bg-amber-50/50',
      lightBorder: 'border-amber-100',
      lightBadge: 'bg-amber-600',
      lightShadow: 'rgba(245,158,11,0.08)',
      lightGlow: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0) 70%)',
      // Dark Theme Colors
      darkBg: 'bg-amber-950/20',
      darkBorder: 'border-amber-500/20',
      darkBadge: 'bg-amber-600',
      darkShadow: 'rgba(245,158,11,0.15)',
      darkGlow: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.02) 70%)'
    },
    {
      num: '5',
      title: 'Fix & Launch',
      desc: 'Resolve issues and launch with confidence',
      icon: <Rocket className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
      // Light Theme Colors
      lightBg: 'bg-violet-50/50',
      lightBorder: 'border-violet-100',
      lightBadge: 'bg-violet-600',
      lightShadow: 'rgba(139,92,246,0.08)',
      lightGlow: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 70%)',
      // Dark Theme Colors
      darkBg: 'bg-violet-950/20',
      darkBorder: 'border-violet-500/20',
      darkBadge: 'bg-violet-600',
      darkShadow: 'rgba(139,92,246,0.15)',
      darkGlow: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.02) 70%)'
    }
  ];

  return (
    <section 
      className={`py-28 relative overflow-hidden transition-colors duration-500 ${
        isDarkMode ? 'bg-[#030305]' : 'bg-[#fafafc]'
      }`} 
      id="how-it-works-section"
    >
      
      {/* Subtle Background Radial Overlays matching the clean visual design */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[550px] rounded-full blur-[100px] ${
          isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_70%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent_70%)]'
        }`} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10" id="how-it-works-container">
        
        {/* Exact typography and uppercase tracking from reference image */}
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
          <span className="text-[11px] tracking-[0.25em] uppercase font-black text-indigo-600 dark:text-indigo-400 block">
            HOW IT WORKS
          </span>
          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            A simple process. Powerful results.
          </h2>
        </div>

        {/* Dynamic Connected Horizontal Track matching reference image exactly */}
        <div className="relative">
          
          {/* Connector Arrows Overlay for Large Screen Widths */}
          <div className="hidden lg:flex absolute top-[44px] left-[10%] right-[10%] justify-between items-center z-0 pointer-events-none">
            {steps.slice(0, -1).map((_, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-center flex-1 mx-4"
              >
                {/* Clean soft dotted link connectors with small chevron arrowheads */}
                <div className="w-full flex items-center justify-center gap-1 opacity-70">
                  <span className={`tracking-[0.25em] font-mono font-bold text-xs ${
                    isDarkMode ? 'text-neutral-800' : 'text-slate-200'
                  }`}>
                    ····················
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 -ml-1 ${
                    isDarkMode ? 'text-neutral-700' : 'text-slate-300'
                  }`} />
                </div>
              </div>
            ))}
          </div>

          {/* 5-Column Responsive Step Flex Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-16 gap-x-8 relative z-10">
            {steps.map((step, index) => {
              const bgClass = isDarkMode ? step.darkBg : step.lightBg;
              const borderClass = isDarkMode ? step.darkBorder : step.lightBorder;
              const badgeClass = isDarkMode ? step.darkBadge : step.lightBadge;
              const shadowVal = isDarkMode ? step.darkShadow : step.lightShadow;
              const glowVal = isDarkMode ? step.darkGlow : step.lightGlow;

              return (
                <motion.div 
                  key={step.num}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center group"
                >
                  
                  {/* Premium Glass Orb Container matching reference image bubbles */}
                  <div className="relative mb-6">
                    
                    {/* Outer bubble wrapper with custom radial color glow */}
                    <div 
                      className={`w-[100px] h-[100px] rounded-full border flex items-center justify-center relative transition-all duration-300 shadow-md group-hover:scale-105 ${bgClass} ${borderClass}`}
                      style={{ 
                        boxShadow: `0 8px 30px ${shadowVal}`,
                      }}
                    >
                      
                      {/* Soft Radial Backing Core */}
                      <div 
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ background: glowVal }}
                      />

                      {/* Realistic 3D glass sheen reflection effect */}
                      <div className="absolute top-1 left-2 w-7 h-7 bg-gradient-to-b from-white/45 to-transparent rounded-full blur-[1px] pointer-events-none opacity-80" />
                      <div className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-t from-white/10 to-transparent rounded-full blur-[2px] pointer-events-none opacity-30" />

                      {/* Inner core circle with icon */}
                      <div className="relative z-10 p-1 transition-transform duration-300 group-hover:scale-110">
                        {step.icon}
                      </div>

                    </div>

                    {/* Tiny primary color circle badge positioned directly below the glass orb */}
                    <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full ${badgeClass} text-white font-mono text-[10px] font-black flex items-center justify-center border border-white dark:border-[#030305] shadow-md`}>
                      {step.num}
                    </div>

                  </div>

                  {/* Subtitle & Description exact matching */}
                  <div className="space-y-1.5 max-w-[190px] pt-1">
                    <h3 className={`font-extrabold text-[15px] tracking-tight transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs leading-relaxed font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-500'
                    }`}>
                      {step.desc}
                    </p>
                  </div>

                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
