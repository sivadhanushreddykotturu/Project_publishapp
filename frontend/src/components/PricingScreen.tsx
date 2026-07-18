import { useState } from 'react';
import { Check, Info, ArrowRight, Sparkles } from 'lucide-react';
import BlurText from './ui/BlurText';

interface PricingScreenProps {
  isDarkMode?: boolean;
}

export default function PricingScreen({ isDarkMode = false }: PricingScreenProps) {
  // Calculator state
  const [testerCount, setTesterCount] = useState<number>(20);
  const [deviceCount, setDeviceCount] = useState<number>(10);
  const [hasSLA, setHasSLA] = useState<boolean>(false);
  const [isAutomated, setIsAutomated] = useState<boolean>(true);

  // Calculate dynamic quote
  const baseRate = 7999;
  const testerRate = testerCount * 650;
  const deviceRate = deviceCount * 1000;
  const slaCost = hasSLA ? 20000 : 0;
  const automationCost = isAutomated ? 6000 : 0;
  const totalMonthlyCost = baseRate + testerRate + deviceRate + slaCost + automationCost;

  // Format number with Indian comma grouping (e.g. 1,23,456)
  const formatINR = (n: number) => n.toLocaleString('en-IN');

  const plans = [
    {
      name: 'Starter Tier',
      price: '₹11,999',
      desc: 'Perfect for indie developers testing lightweight utility apps.',
      features: [
        '15 Verified exploratory testers',
        '8 Target Android devices',
        'Actionable logs & standard stack trace',
        'Self-guided bug retesting cycles',
        'Email & Discord developer support'
      ],
      popular: false,
      btnText: 'Launch Starter Test'
    },
    {
      name: 'Growth Suite',
      price: '₹39,999',
      desc: 'Ideal for scaling startups and active product teams.',
      features: [
        '50 Elite exploratory testers',
        '25 Target physical devices',
        'Simultaneous Android 9 to 14 OS matrix',
        'BLE & Bluetooth sensor testing protocols',
        'Automatic logcat extraction & video walkthroughs',
        'Priority 12-hour developer support'
      ],
      popular: true,
      btnText: 'Launch Growth Test'
    },
    {
      name: 'Enterprise Scale',
      price: 'Custom',
      desc: 'Fully managed QA solutions for large corporate applications.',
      features: [
        '200+ Verified expert global testers',
        'Unlimited target device profiles',
        'Biometric, secure token, and network isolation QA',
        'Dedicated QA lead manager assignment',
        'Custom CI/CD integrations & Jira sync',
        '1-Hour Response SLA support'
      ],
      popular: false,
      btnText: 'Book Private Consultation'
    }
  ];

  return (
    <div className={`max-w-7xl mx-auto px-6 py-28 relative z-10 font-sans transition-colors duration-300 ${
      isDarkMode ? 'text-slate-300' : 'text-slate-800'
    }`}>
      {/* Intro Casing */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] tracking-widest font-bold mb-6 uppercase ${
          isDarkMode 
            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' 
            : 'border-indigo-100 bg-indigo-50 text-indigo-600'
        }`}>
          Predictable, Flexible Pricing
        </div>
        <BlurText
          text="CHOOSE YOUR TESTING PLAN"
          delay={80}
          animateBy="letters"
          direction="top"
          className={`text-4xl md:text-5xl font-extrabold mb-6 tracking-tight justify-center ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        />
        <p className={`text-base md:text-lg ${
          isDarkMode ? 'text-gray-400' : 'text-slate-500'
        }`}>
          No credit card required to build drafts. Pay only when you schedule active testing cycles with verified human testers.
        </p>
      </div>

      {/* Main Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-24">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
              plan.popular
                ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-100 lg:scale-[1.03] z-10 bg-indigo-950/20'
                : isDarkMode
                  ? 'bg-[#0F0F12]/80 border-white/5 hover:border-white/10'
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-100'
            }`}
            data-purpose="pricing-card"
          >
            {plan.popular && (
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 btn-gradient text-white text-[10px] tracking-widest font-extrabold px-4 py-1 rounded-full uppercase shadow-md shadow-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular
              </div>
            )}

            <div>
              <span className={`font-bold text-sm block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{plan.name}</span>
              <div className="flex items-baseline gap-1 mb-4">
                <span className={`text-4xl md:text-5xl font-black ${
                  plan.popular ? 'text-white' : isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{plan.price}</span>
                {plan.price !== 'Custom' && <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>/month</span>}
              </div>
              <p className={`text-xs mb-8 leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>{plan.desc}</p>

              <div className={`w-full h-px mb-8 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/10">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                plan.popular
                  ? 'btn-gradient text-white shadow-lg shadow-indigo-500/10 border-0 hover:opacity-90'
                  : isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              {plan.btnText}
            </button>
          </div>
        ))}
      </div>

      {/* Interactive Custom Calculator Section */}
      <div className={`border rounded-3xl p-8 md:p-12 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'bg-[#0F0F12]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm shadow-slate-100'
      }`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 blur-3xl rounded-full z-0 pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Sliders Column */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dynamic Plan Architect</h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                Need a hyper-specific balance? Move sliders to formulate a bespoke package tailored directly to your engineering sprints.
              </p>
            </div>

            {/* Slider 1: Testers */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}>Verified Exploratory Testers</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{testerCount} Experts</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={testerCount}
                onChange={(e) => setTesterCount(Number(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-100'
                }`}
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                <span>5 testers</span>
                <span>150 testers</span>
              </div>
            </div>

            {/* Slider 2: Devices */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}>Target Device Pool Size</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{deviceCount} Physical Models</span>
              </div>
              <input
                type="range"
                min={2}
                max={60}
                step={2}
                value={deviceCount}
                onChange={(e) => setDeviceCount(Number(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 ${
                  isDarkMode ? 'bg-white/5' : 'bg-slate-100'
                }`}
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDarkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                <span>2 models</span>
                <span>60 models</span>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              {/* Toggle 1 */}
              <div className={`flex items-center justify-between p-4 rounded-xl transition-colors duration-300 border ${
                isDarkMode ? 'bg-[#050505]/40 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Logcat & Logs extraction</span>
                  <span className={`text-[10px] block ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Automatic video and traces</span>
                </div>
                <button
                  onClick={() => setIsAutomated(!isAutomated)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    isAutomated ? 'bg-indigo-600' : isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isAutomated ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className={`flex items-center justify-between p-4 rounded-xl transition-colors duration-300 border ${
                isDarkMode ? 'bg-[#050505]/40 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Dedicated QA Architect SLA</span>
                  <span className={`text-[10px] block ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Custom Slack channel support</span>
                </div>
                <button
                  onClick={() => setHasSLA(!hasSLA)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    hasSLA ? 'bg-indigo-600' : isDarkMode ? 'bg-white/10' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    hasSLA ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Quote Panel Column */}
          <div className={`border rounded-2xl p-8 text-center flex flex-col justify-between h-full min-h-[300px] transition-colors duration-300 ${
            isDarkMode ? 'bg-[#050505]/40 border-white/5' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] tracking-widest uppercase font-extrabold block mb-2 ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
              }`}>Bespoke Estimate</span>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className={`text-5xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>₹{formatINR(totalMonthlyCost)}</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>/month</span>
              </div>

              {/* Summary line */}
              <div className="space-y-3 text-xs text-left mb-8">
                <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>Base Platform Subscription</span>
                  <span className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatINR(baseRate)}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>{testerCount} Verified Testers (@ ₹650)</span>
                  <span className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatINR(testerRate)}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>{deviceCount} Hardware Targets (@ ₹1,000)</span>
                  <span className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatINR(deviceRate)}</span>
                </div>
                {isAutomated && (
                  <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>Automated Logcat Extractor pack</span>
                    <span className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatINR(automationCost)}</span>
                  </div>
                )}
                {hasSLA && (
                  <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-gray-500' : 'text-slate-500'}>Dedicated QA Architect SLA</span>
                    <span className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatINR(slaCost)}</span>
                  </div>
                )}
              </div>
            </div>

            <button className="w-full btn-gradient py-3.5 rounded-xl font-bold text-sm text-white border-0 shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              Deploy Custom Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
