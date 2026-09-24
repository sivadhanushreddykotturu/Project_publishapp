import { useState, useEffect } from 'react';
import { 
  X, CheckCircle, Smartphone, Terminal, Users, Sparkles, Play, ChevronRight 
} from 'lucide-react';

interface WatchWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function WatchWorksModal({ isOpen, onClose, isDarkMode = false }: WatchWorksModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const steps = [
    {
      title: 'Upload App Build',
      desc: 'Submit your compiled APK file or provide a Play Store internal testing track credential securely.',
      icon: <Terminal className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />,
      subtext: 'Uploading FitTrackPro_v2.4.0.apk... 100%'
    },
    {
      title: 'Hardware Matchmaking',
      desc: 'Our engine routes your application directly to testers who possess the specific Android device hardware models and OS builds you selected.',
      icon: <Smartphone className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />,
      subtext: 'Matching Google Pixel 8 & Galaxy S24 Ultra nodes... Found 34 active testers.'
    },
    {
      title: 'Exploratory & Log Sync',
      desc: 'Certified testers verify critical user journeys, BLE sync, background workers, and submit annotated bugs with device logs in real-time.',
      icon: <Users className={`w-6 h-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />,
      subtext: 'Extracting logcat logs... Identified Critical NullPointerException. Bug #12 reported.'
    }
  ];

  // Auto progression of steps in simulation
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((step) => {
            if (step >= steps.length - 1) {
              return 0; // Loop simulation
            }
            return step + 1;
          });
          return 0;
        }
        return prev + 10;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, currentStep]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto backdrop-blur-md flex items-center justify-center p-6 font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-[#050505]/90' : 'bg-slate-900/40'
    }`}>
      <div 
        className={`relative border rounded-3xl w-full max-w-4xl p-8 overflow-hidden shadow-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#0F0F12] border-white/5 shadow-indigo-500/5 text-white' 
            : 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900'
        }`}
        id="watch-works-modal-container"
      >
        {/* Glow ambient background inside modal */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none z-0" />

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 animate-pulse ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h3 className={`font-extrabold text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              UXOS IN ACTION
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            id="watch-works-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Flow simulation progress */}
          <div className="lg:col-span-5 space-y-6">
            <h4 className={`text-sm font-extrabold uppercase tracking-wider ${
              isDarkMode ? 'text-gray-500' : 'text-slate-500'
            }`}>
              Verification Pipeline
            </h4>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    setCurrentStep(index);
                    setSimulationProgress(0);
                    setIsRunning(false); // Stop auto loops when clicking manual
                  }}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    currentStep === index 
                      ? isDarkMode 
                        ? 'bg-indigo-600/10 border-indigo-500/30' 
                        : 'bg-indigo-50 border-indigo-200'
                      : isDarkMode 
                        ? 'bg-white/5 border-transparent hover:bg-white/[0.08]' 
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white border border-slate-200 shadow-xs'}`}>
                      {step.icon}
                    </div>
                    <span className={`text-sm font-bold ${
                      currentStep === index 
                        ? isDarkMode ? 'text-white' : 'text-slate-900' 
                        : isDarkMode ? 'text-gray-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mb-3 ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                    {step.desc}
                  </p>

                  {/* Progress bar representing current step */}
                  {currentStep === index && (
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[10px] font-mono ${isDarkMode ? 'text-gray-600' : 'text-slate-500'}`}>
                        <span>Status: Processing</span>
                        <span>{simulationProgress}%</span>
                      </div>
                      <div className={`w-full h-1 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                          style={{ width: `${simulationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Console/Result visualization */}
          <div className="lg:col-span-7 bg-[#050505] border border-white/5 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between font-mono text-xs">
            
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-[10px] text-gray-500 ml-2">Pipeline Terminal Session</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400">
                Live Console
              </span>
            </div>

            {/* Simulated Step Output Screen */}
            <div className="flex-1 flex flex-col justify-center space-y-4 text-center p-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                {steps[currentStep].icon}
              </div>

              <div className="space-y-1">
                <h5 className="font-bold text-sm text-white">{steps[currentStep].title}</h5>
                <p className="text-gray-400 leading-relaxed max-w-sm mx-auto text-xs">
                  {steps[currentStep].subtext}
                </p>
              </div>

              {/* Dynamic feedback visual */}
              {currentStep === 0 && (
                <div className="p-3 rounded-lg bg-indigo-950/20 text-indigo-400 border border-indigo-500/10 max-w-xs mx-auto animate-pulse">
                  APK successfully deconstructed and checksum matched.
                </div>
              )}
              {currentStep === 1 && (
                <div className="flex items-center justify-center gap-4">
                  <div className="px-3 py-2 rounded bg-white/5 text-gray-400">Pixel 8 Pro</div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <div className="px-3 py-2 rounded bg-indigo-600 text-white font-bold">Galaxy S24</div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 max-w-xs mx-auto">
                  CRITICAL: Application freeze logged on line 142.
                </div>
              )}
            </div>

            {/* Console Footer */}
            <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-gray-500 text-[10px]">
              <span>Simulation mode: {isRunning ? 'Automatic loop' : 'Manual click'}</span>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                {isRunning ? 'Pause simulation' : 'Play simulation'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
