import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    quote: "LaunchOps helped us find critical issues we missed internally. Our crash rate dropped by 42% after launch.",
    author: "Rohit Sharma",
    role: "CTO, FitTrack",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80"
  },
  {
    id: 2,
    quote: "The quality of bug reports is incredible. It saves us 10x the manual QA effort.",
    author: "Priya Nair",
    role: "QA Lead, Meesho",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80"
  },
  {
    id: 3,
    quote: "We tested across 40+ real devices in just 3 days. That's power!",
    author: "Arjun Verma",
    role: "Founder, QuickCart",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80"
  },
  {
    id: 4,
    quote: "Ensured our Android 14 release worked flawlessly across various foldables and tablets. Amazing turnaround!",
    author: "Sarah Jenkins",
    role: "Lead Android Dev, HealthUp",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80"
  }
];

interface TestimonialsProps {
  isDarkMode?: boolean;
}

export default function Testimonials({ isDarkMode = false }: TestimonialsProps) {
  const [startIndex, setStartIndex] = useState(0);

  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get active subset (3 on desktop, 2 on tablet, 1 on mobile)
  const getVisibleTestimonials = () => {
    const list = [];
    for (let i = 0; i < 3; i++) {
      list.push(testimonials[(startIndex + i) % testimonials.length]);
    }
    return list;
  };

  return (
    <section className={`py-24 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? 'bg-[#050505]' : 'bg-slate-50'
    }`} id="testimonials-section">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl rounded-full pointer-events-none z-0 ${
        isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-50/50'
      }`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs tracking-widest uppercase font-extrabold text-indigo-600 block mb-3">
            LOVED BY TEAMS WORLDWIDE
          </span>
          <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Trust LaunchOps to ship perfection
          </h2>
        </div>

        {/* Sliding Layout Row */}
        <div className="relative flex items-center">
          
          {/* Left Navigation Arrow (Styled as outline circle) */}
          <button 
            onClick={handlePrev}
            className={`absolute -left-4 lg:-left-6 w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 shadow-xs z-20 cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            aria-label="Previous Testimonials"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Testimonials Grid Container */}
          <div className="w-full overflow-hidden px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500">
              {getVisibleTestimonials().map((t, idx) => (
                <motion.div
                  key={`${t.id}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`border rounded-3xl p-6 lg:p-8 flex flex-col justify-between min-h-[320px] h-full transition-all duration-300 relative ${
                    isDarkMode 
                      ? 'bg-[#0f0f13] border-white/5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100'
                  }`}
                >
                  <div>
                    {/* Giant elegant quote marks */}
                    <div className={`text-5xl font-serif font-black select-none leading-none -mb-2 ${
                      isDarkMode ? 'text-indigo-950' : 'text-indigo-200'
                    }`}>
                      “
                    </div>

                    {/* Quote */}
                    <p className={`text-sm leading-relaxed font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {t.quote}
                    </p>
                  </div>

                  {/* Author Meta */}
                  <div className={`flex items-center gap-3.5 mt-6 border-t pt-4 ${
                    isDarkMode ? 'border-white/5' : 'border-slate-200'
                  }`}>
                    <img 
                      src={t.avatar} 
                      alt={t.author} 
                      className={`w-10 h-10 rounded-full border object-cover shrink-0 ${
                        isDarkMode ? 'border-white/5' : 'border-slate-200'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className={`font-extrabold text-xs ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t.author}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Navigation Arrow (Styled as active indigo circle) */}
          <button 
            onClick={handleNext}
            className="absolute -right-4 lg:-right-6 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-all hover:scale-110 shadow-md shadow-indigo-600/10 z-20 cursor-pointer border-0"
            aria-label="Next Testimonials"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

      </div>
    </section>
  );
}
