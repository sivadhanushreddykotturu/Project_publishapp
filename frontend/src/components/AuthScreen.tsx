import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  isDarkMode: boolean;
  initialRole?: 'tester' | 'client';
  onLoginSuccess: (name: string, role: 'tester' | 'client' | 'admin') => void;
  onBackToHome: () => void;
}

export default function AuthScreen({ isDarkMode, initialRole = 'tester', onLoginSuccess, onBackToHome }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'tester' | 'client' | 'admin'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (isSignUp && !name.trim()) {
      tempErrors.name = 'Full name is required';
    }
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Automatic role overrides based on email
      let finalRole = role;
      if (email.toLowerCase() === 'admin@launchops.com') {
        finalRole = 'admin';
      } else if (email.toLowerCase() === 'client@launchops.com') {
        finalRole = 'client';
      }
      onLoginSuccess(isSignUp ? name : email.split('@')[0], finalRole);
    }
  };

  return (
    <div className={`min-h-[calc(100vh-80px)] mt-20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative ${
      isDarkMode ? 'bg-[#050505]' : 'bg-slate-50'
    }`}>
      {/* Background glow effects */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 blur-[120px] rounded-full pointer-events-none ${
        isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100/50'
      }`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4 transform rotate-12">
            <span className="font-extrabold italic text-lg">LT</span>
          </div>
          <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            {isSignUp ? 'Create your account' : 'Sign in to UXOS'}
          </h2>
          <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isSignUp ? 'Start earning as an Android Tester today' : 'Access your dashboard & pending tasks'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className={`border rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#0C0C0F]/90 border-white/5 shadow-indigo-500/5' 
            : 'bg-white border-slate-100 shadow-slate-200/50'
        }`}>
          {/* Role Selector */}
          <div className="mb-6">
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Select Console Role
            </label>
            <div className={`grid grid-cols-3 gap-2 p-1 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
              {(['tester', 'client', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r === 'admin') setIsSignUp(false);
                  }}
                  className={`py-1.5 text-center text-[10px] font-extrabold uppercase rounded-lg cursor-pointer transition-all ${
                    role === r
                      ? 'bg-[#4F37FE] text-white shadow-sm'
                      : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-950 hover:bg-black/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Sign Up / Login (for Tester and Client) */}
          {(role === 'tester' || role === 'client') && (
            <div className="flex justify-center mb-6">
              <div className={`inline-flex p-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isSignUp ? (isDarkMode ? 'bg-[#4F37FE] text-white' : 'bg-white text-[#4F37FE] shadow-sm') : 'text-slate-500'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${isSignUp ? (isDarkMode ? 'bg-[#4F37FE] text-white' : 'bg-white text-[#4F37FE] shadow-sm') : 'text-slate-500'}`}
                >
                  Register
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-sm">👤</span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={`block w-full pl-10 pr-3 py-3 text-sm rounded-xl border transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 ${
                      isDarkMode 
                        ? `${errors.name ? 'border-red-500 bg-red-500/5' : 'border-white/10'} text-white placeholder-slate-500 focus:border-indigo-500` 
                        : `${errors.name ? 'border-red-500 bg-red-500/5' : 'border-slate-200'} text-slate-900 placeholder-slate-400 focus:border-indigo-500`
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-2 text-xs font-bold text-red-500">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm">✉️</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`block w-full pl-10 pr-3 py-3 text-sm rounded-xl border transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 ${
                    isDarkMode 
                      ? `${errors.email ? 'border-red-500 bg-red-500/5' : 'border-white/10'} text-white placeholder-slate-500 focus:border-indigo-500` 
                      : `${errors.email ? 'border-red-500 bg-red-500/5' : 'border-slate-200'} text-slate-900 placeholder-slate-400 focus:border-indigo-500`
                  }`}
                />
              </div>
              {errors.email && <p className="mt-2 text-xs font-bold text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm">🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`block w-full pl-10 pr-10 py-3 text-sm rounded-xl border transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25 ${
                    isDarkMode 
                      ? `${errors.password ? 'border-red-500 bg-red-500/5' : 'border-white/10'} text-white placeholder-slate-500 focus:border-indigo-500` 
                      : `${errors.password ? 'border-red-500 bg-red-500/5' : 'border-slate-200'} text-slate-900 placeholder-slate-400 focus:border-indigo-500`
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs font-bold text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-extrabold text-white transition-all transform hover:scale-[1.01] ${
                isDarkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isSignUp ? 'Create tester account 🚀' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-slate-205'}`} />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold tracking-widest">
              <span className={`px-2.5 ${isDarkMode ? 'bg-[#0C0C0F] text-slate-500' : 'bg-white text-slate-400'}`}>
                Or
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => {
              // Simulate successful login with Google
              onLoginSuccess(isSignUp ? 'Google Tester' : 'google_user', role);
            }}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition border cursor-pointer ${
              isDarkMode 
                ? 'bg-transparent border-white/10 hover:border-white/20 text-white hover:bg-white/[0.02]' 
                : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
