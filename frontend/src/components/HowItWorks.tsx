import { motion } from 'framer-motion';
import { Upload, Users, Smartphone, Bug, RefreshCw, Rocket } from 'lucide-react';

interface HowItWorksProps {
  isDarkMode?: boolean;
}

export default function HowItWorks({ isDarkMode = false }: HowItWorksProps) {
  const steps = [
    {
      num: '1',
      title: 'Upload Your App',
      desc: 'Upload APK or provide Play Store link',
      icon: <Upload className="w-7 h-7 text-purple-400" />,
      lightIcon: <Upload className="w-7 h-7 text-purple-600" />,
      badgeBg: 'bg-purple-600',
      darkNodeStyle: 'bg-[#120824] border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.35)]',
      lightNodeStyle: 'bg-purple-50 border-purple-200 shadow-md shadow-purple-500/10'
    },
    {
      num: '2',
      title: 'We Assign Testers',
      desc: 'AI matches the right testers for you',
      icon: <Users className="w-7 h-7 text-indigo-400" />,
      lightIcon: <Users className="w-7 h-7 text-indigo-600" />,
      badgeBg: 'bg-indigo-600',
      darkNodeStyle: 'bg-[#0c0d28] border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.35)]',
      lightNodeStyle: 'bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-500/10'
    },
    {
      num: '3',
      title: 'Testing Happens',
      desc: 'Real people test on real devices',
      icon: <Smartphone className="w-7 h-7 text-blue-400" />,
      lightIcon: <Smartphone className="w-7 h-7 text-blue-600" />,
      badgeBg: 'bg-blue-600',
      darkNodeStyle: 'bg-[#071328] border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.35)]',
      lightNodeStyle: 'bg-blue-50 border-blue-200 shadow-md shadow-blue-500/10'
    },
    {
      num: '4',
      title: 'Get Bug Reports',
      desc: 'Detailed reports with steps, screenshots & videos',
      icon: <Bug className="w-7 h-7 text-amber-400" />,
      lightIcon: <Bug className="w-7 h-7 text-amber-600" />,
      badgeBg: 'bg-amber-600',
      darkNodeStyle: 'bg-[#241306] border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.35)]',
      lightNodeStyle: 'bg-amber-50 border-amber-200 shadow-md shadow-amber-500/10'
    },
    {
      num: '5',
      title: 'Fix & Improve',
      desc: 'Resolve issues and make improvements',
      icon: <RefreshCw className="w-7 h-7 text-emerald-400" />,
      lightIcon: <RefreshCw className="w-7 h-7 text-emerald-600" />,
      badgeBg: 'bg-emerald-600',
      darkNodeStyle: 'bg-[#062417] border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.35)]',
      lightNodeStyle: 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-500/10'
    },
    {
      num: '6',
      title: 'Launch Confidently',
      desc: 'Ship a better app to your users',
      icon: <Rocket className="w-7 h-7 text-violet-400" />,
      lightIcon: <Rocket className="w-7 h-7 text-violet-600" />,
      badgeBg: 'bg-violet-600',
      darkNodeStyle: 'bg-[#190a28] border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.35)]',
      lightNodeStyle: 'bg-violet-50 border-violet-200 shadow-md shadow-violet-500/10'
    }
  ];

  return (
    <section 
      className={`py-28 relative overflow-hidden transition-colors duration-500 ${
        isDarkMode ? 'bg-[#020205]' : 'bg-slate-50/60'
      }`} 
      id="how-it-works-section"
    >
      
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[550px] rounded-full blur-[140px] ${
          isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.04),transparent_70%)]'
        }`} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10" id="how-it-works-container">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
          <span className="text-[11px] tracking-[0.25em] uppercase font-extrabold text-indigo-500 dark:text-[#A855F7] block font-mono">
            HOW IT WORKS
          </span>
          <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Simple process. Powerful results.
          </h2>
        </div>

        {/* Dynamic Connected Track Container */}
        <div className="relative">
          
          {/* Horizontal Dotted Connecting Line precisely aligned across centers */}
          <div className="hidden lg:block absolute top-[48px] left-[6%] right-[6%] h-[2px] border-b-2 border-dashed border-indigo-500/35 dark:border-indigo-500/30 z-0" />

          {/* 6-Column Responsive Step Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-16 gap-x-4 relative z-10">
            {steps.map((step, index) => {
              const nodeStyle = isDarkMode ? step.darkNodeStyle : step.lightNodeStyle;

              return (
                <motion.div 
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center text-center group cursor-default"
                >
                  
                  {/* Glowing Node Circle */}
                  <div className="relative mb-6">
                    
                    {/* Node Circle */}
                    <div className={`w-[96px] h-[96px] rounded-full border-2 flex items-center justify-center relative transition-all duration-300 group-hover:scale-110 ${nodeStyle}`}>
                      {/* Icon */}
                      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                        {isDarkMode ? step.icon : step.lightIcon}
                      </div>
                    </div>

                    {/* Step Number Badge */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full ${step.badgeBg} text-white font-mono text-[11px] font-black flex items-center justify-center border-2 border-white dark:border-[#020205] shadow-lg z-20`}>
                      {step.num}
                    </div>

                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="space-y-1.5 max-w-[180px] pt-1">
                    <h3 className={`font-extrabold text-sm md:text-[15px] tracking-tight transition-colors duration-200 ${
                      isDarkMode ? 'text-white group-hover:text-purple-300' : 'text-slate-900 group-hover:text-indigo-600'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-[11px] leading-relaxed font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500'
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
