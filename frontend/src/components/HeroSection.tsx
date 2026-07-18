import { ArrowRight, Play, Users, AlertCircle, Smartphone, Star, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import BlurText from './ui/BlurText';
import heroImage from '../assets/images/regenerated_image_1784006175020.png';

const heroImageSrc = (typeof heroImage === 'object' && heroImage && 'src' in heroImage) 
  ? (heroImage as { src: string }).src 
  : heroImage as unknown as string;

interface HeroSectionProps {
  onStartTesting: () => void;
  onWatchVideo: () => void;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
}

export default function HeroSection({ onStartTesting, onWatchVideo, onTabChange, isDarkMode }: HeroSectionProps) {
  const avatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAd4DobtQhtBLqI2y6OKlewxLeYjt-2dWb4zwElRSw3AkyelrVX03GtqcPvaHfiHqBmJ0Vx1zl7HAPThzZFmtQMgzZtTneML_NYjSYU4vG6RBX4fSntKJVcLe6LynQ6fA_uX-2DwS17Tmhy_HeV9OTXke2fR_wxp0Hd8o2jQ8o_JyxlSk8JWlPZB0xIZZFOIlL_M7TFexHbiDgLji027458If5kijP8M31CdMtcgRKCfBSIWIi36ck6kA',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCeMnJ14jr0V7SzwZ3U_jeyckwZi76p7GcAEq3ZycZ-ceuZRsxMwM907WEBtixD_b2Ouq4NkJZhu5rHOc96167FPyHwUD9EXlTjbcYiPA1S9XV-6kl3A54M3kzVuOc0O-YnD876Jn5fZiRXN1lH0aXpzBhaJ93hGE_LJJoM4JUXlsDAiDrRtfGCIS24veeL4w0ehNMEwgkh2eO1QEhrR0MlzzJ7eF-cPzcAr-UPZ1LIh-U91qjaidXjKg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAe2gqVj6Cm8l07QY0UB0DIaN1ipVzuQW60mmtcmEMTsOr-prVMjYr-E5XubYlohHBWuuY7ACpvPG4w02I-oBg7RTGeGrQK2t0t4UUKkf8P4wQnsTfy-iz2O3p4d29aDJbK1GmzLbKLmcvcNGuKo4Wf-BrzOyXv3BBna7qwT8Y6nvlWtdDpfVrHxqFez7Fdzh6MPd1Xugqcb98Rz-vI9X6G9aBQiCGhEfzOEr_MxjER3e4IS2fxZoMowg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD4VwLPP9fkaK84YVDuydf78JyfwEHQYVv1WbWoCkuXWmtlHgBx_76NMIcGN376PxFq88ToaidXvP9qVOe3Txcq7quPj06ZYymhPFg3uaXyeR9oAYGrWnqitPVirdAly8HoPXvX5og8UeXfZ9KtM3PVc8sv6MN19v0mEUR0ya2hjNhShp2Z2VDjmo7MPHOdtMYxjfWm-SXyGQ9D41HJsTmqxr39aX8UNrSFR0S4QZugHNjNA8xQ9IFwzg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAzYzmWaOjBwarGF2oxlxZSlJd2KelkO0MiG6T_zgcCateBv-tLBlSpL7veLd22nTAbvLK5nD6UbarhdHOGS5BjtZH3H6jV_WjAgTH95HEaXPtNPeVWJDhHuSGwqPOnOaSnMBtMAsl-FpmrV_rg1DU5y2n_lLcEnX-Ehk5zs-Tgh_bd0ftQqdO4l9s_8L9aql6TYdhSqZTLTyPuuZyKMbQ0o_zzDajCdu7eegHdFSyjWgxLQG2AdwiONQ'
  ];

  const stats = [
    {
      icon: <Users className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />,
      value: '15,000+',
      label: 'Verified Testers',
      desc: 'Expert global QA testers'
    },
    {
      icon: <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />,
      value: '250,000+',
      label: 'Bugs Reported',
      desc: 'With actionable logs & steps'
    },
    {
      icon: <Smartphone className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />,
      value: '7,500+',
      label: 'Apps Tested',
      desc: 'Android apps fully validated'
    },
    {
      icon: <Star className="w-6 h-6 text-amber-500 fill-amber-500" />,
      value: '98.6%',
      label: 'Client Satisfaction',
      desc: 'Industry-leading rating'
    },
    {
      icon: <ShieldCheck className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />,
      value: '150+',
      label: 'Devices & OS Covered',
      desc: 'From Android 9 to 15+'
    }
  ];

  return (
    <div className={`relative min-h-screen pt-32 pb-20 px-6 flex flex-col justify-center overflow-hidden font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505] text-white' : 'bg-white text-slate-900'
    }`}>
      {/* Soft ambient background glows */}
      <div className={`absolute top-1/4 right-1/4 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none z-0 ${
        isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-100/50'
      }`} />
      <div className={`absolute bottom-10 left-1/4 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none z-0 ${
        isDarkMode ? 'bg-purple-500/5' : 'bg-purple-100/50'
      }`} />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content Panel (Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            data-purpose="hero-text-block"
          >
            {/* Top Indicator Pill */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] tracking-widest font-black mb-8 uppercase shadow-xs ${
              isDarkMode 
                ? 'border-white/10 bg-white/5 text-indigo-400' 
                : 'border-indigo-100 bg-indigo-50 text-indigo-600'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              #1 Android App Testing Platform
            </div>

            {/* Headline Title */}
            <div className="mb-8 space-y-2">
              <BlurText
                text="Better Testing."
                delay={35}
                animateBy="letters"
                direction="top"
                className={`text-4xl md:text-5xl xl:text-6xl font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              />
              <BlurText
                text="Better Apps."
                delay={35}
                animateBy="letters"
                direction="top"
                className={`text-4xl md:text-5xl xl:text-6xl font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              />
              <BlurText
                text="Confident Launches."
                delay={35}
                animateBy="letters"
                direction="bottom"
                className={`text-4xl md:text-5xl xl:text-6xl font-black tracking-tight ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              />
            </div>

            {/* Description Subtitle */}
            <p className={`text-base md:text-lg max-w-lg mb-10 leading-relaxed font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Real people. Real devices. Real insights. Find bugs, improve quality, and launch Android apps users love.
            </p>

            {/* Calls to Action */}
            <div className="flex flex-wrap items-center gap-6 mb-12">
              <button 
                onClick={onStartTesting}
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer text-white border-0 text-sm md:text-base"
                id="hero-primary-cta"
              >
                Start Your First Test 
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                onClick={onWatchVideo}
                className="flex items-center gap-3 group cursor-pointer text-left bg-transparent border-0 outline-none"
                id="hero-secondary-cta"
              >
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:border-indigo-400 group-hover:scale-110 ${
                  isDarkMode 
                    ? 'border-white/10 bg-white/5 group-hover:bg-white/10' 
                    : 'border-slate-200 bg-slate-50 group-hover:bg-slate-100'
                }`}>
                  <Play className={`w-5 h-5 transition-colors ${
                    isDarkMode 
                      ? 'text-slate-300 fill-slate-300 group-hover:text-indigo-400 group-hover:fill-indigo-400' 
                      : 'text-slate-700 fill-slate-700 group-hover:text-indigo-600 group-hover:fill-indigo-600'
                  }`} />
                </div>
                <span className={`font-bold text-xs tracking-widest uppercase transition-colors ${
                  isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-indigo-600'
                }`}>
                  Watch how it works
                </span>
              </button>
            </div>

            {/* Social Proof Avatars */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {avatars.map((url, i) => (
                  <img
                    key={i}
                    alt={`Verified QA Tester ${i+1}`}
                    className={`w-10 h-10 rounded-full border-2 object-cover hover:translate-y-[-4px] transition-transform duration-200 cursor-pointer ${
                      isDarkMode ? 'border-[#050505]' : 'border-white'
                    }`}
                    src={url}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-extrabold shadow-xs ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                }`}>
                  5K+
                </span>
                <span className={`text-xs sm:text-sm font-medium ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Trusted by 5,000+ product engineering teams worldwide
                </span>
              </div>
            </div>

            {/* Grayscale Client Logos Row with Infinite Motion Marquee */}
            <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-4 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>Trusted by</span>
              
              <div className="relative w-full overflow-hidden opacity-50 hover:opacity-80 transition-opacity">
                {/* Smooth left/right fade masks */}
                <div className={`absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${isDarkMode ? 'from-[#050505]' : 'from-white'} to-transparent z-10 pointer-events-none`} />
                <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-l ${isDarkMode ? 'from-[#050505]' : 'from-white'} to-transparent z-10 pointer-events-none`} />

                <motion.div 
                  className="flex gap-16 whitespace-nowrap items-center w-max"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    ease: "linear",
                    duration: 18,
                    repeat: Infinity,
                  }}
                >
                  {/* First set of brands */}
                  {[
                    { name: 'SWIGGY', className: 'text-lg font-black tracking-tight font-sans' },
                    { name: 'zepto', className: 'text-lg font-bold tracking-tight font-sans' },
                    { name: 'policybazaar', className: 'text-base font-bold tracking-tight uppercase tracking-wider' },
                    { name: 'meesho', className: 'text-base font-bold tracking-tight' },
                    { name: 'Razorpay', className: 'text-lg font-black italic tracking-tight' },
                    { name: 'slice', className: 'text-lg font-extrabold tracking-tight font-sans text-indigo-600' },
                    { name: 'CRED', className: 'text-base font-bold tracking-widest uppercase' },
                  ].map((co, idx) => (
                    <span 
                      key={`co-1-${idx}`} 
                      className={`${co.className} ${isDarkMode ? 'text-white' : 'text-slate-800'} inline-block`}
                    >
                      {co.name}
                    </span>
                  ))}
                  
                  {/* Second set of brands for seamless looping */}
                  {[
                    { name: 'SWIGGY', className: 'text-lg font-black tracking-tight font-sans' },
                    { name: 'zepto', className: 'text-lg font-bold tracking-tight font-sans' },
                    { name: 'policybazaar', className: 'text-base font-bold tracking-tight uppercase tracking-wider' },
                    { name: 'meesho', className: 'text-base font-bold tracking-tight' },
                    { name: 'Razorpay', className: 'text-lg font-black italic tracking-tight' },
                    { name: 'slice', className: 'text-lg font-extrabold tracking-tight font-sans text-indigo-600' },
                    { name: 'CRED', className: 'text-base font-bold tracking-widest uppercase' },
                  ].map((co, idx) => (
                    <span 
                      key={`co-2-${idx}`} 
                      className={`${co.className} ${isDarkMode ? 'text-white' : 'text-slate-800'} inline-block`}
                    >
                      {co.name}
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Graphic Showcase (Right) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center items-center"
            data-purpose="hero-visual-composition"
          >
            {/* Visual Phone Model Overlay */}
            <div className="relative z-20 w-full max-w-[580px] drop-shadow-[0_20px_50px_rgba(99,102,241,0.08)] hover:scale-[1.01] transition-transform duration-500">
              <img
                alt="LaunchTest Interactive Android Performance Dashboard Graphic"
                className="w-full h-auto rounded-2xl"
                style={{
                  WebkitMaskImage: 'radial-gradient(ellipse, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(ellipse, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)'
                }}
                src={heroImageSrc}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats Footer Block */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`w-full mt-24 border rounded-3xl p-8 md:p-10 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#0F0F12]/80 border-white/5 shadow-none' 
              : 'bg-white border-slate-100 shadow-xl shadow-slate-100'
          }`}
          id="hero-stats-footer"
        >
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 items-stretch justify-center divide-y lg:divide-y-0 lg:divide-x ${
            isDarkMode ? 'divide-white/5' : 'divide-slate-100'
          }`}>
            {stats.map((item, index) => {
              const isClickable = index === 0 || index === 4;
              const handleStatClick = () => {
                if (index === 0) onTabChange('tester');
                else if (index === 4) onTabChange('resources');
              };

              return (
                <div 
                  key={index} 
                  onClick={handleStatClick}
                  className={`flex flex-col items-start text-left pt-6 sm:pt-4 lg:pt-0 lg:px-6 first:pt-0 first:pl-0 last:pr-0 group rounded-xl transition-all duration-200 ${
                    isClickable ? 'cursor-pointer' : ''
                  } ${
                    isClickable
                      ? isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'
                      : ''
                  }`}
                  data-purpose="stat-item"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-lg transition-all ${
                      isClickable ? 'group-hover:scale-110' : ''
                    } ${
                      isDarkMode ? 'bg-white/5' : 'bg-slate-50'
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`text-2xl md:text-3xl font-extrabold tracking-tight transition-colors ${
                      isDarkMode 
                        ? `text-white ${isClickable ? 'group-hover:text-indigo-400' : ''}` 
                        : `text-slate-900 ${isClickable ? 'group-hover:text-indigo-600' : ''}`
                    }`}>
                      {item.value}
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ml-1 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-xs mt-1 ml-1 transition-colors ${
                    isDarkMode 
                      ? `text-slate-400 ${isClickable ? 'group-hover:text-slate-200' : ''}` 
                      : `text-slate-500 ${isClickable ? 'group-hover:text-slate-700' : ''}`
                  }`}>
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
