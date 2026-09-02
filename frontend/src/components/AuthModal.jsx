import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Key, Mail, Lock, User, CheckCircle2, AlertCircle, Sparkles, LogOut, Shield } from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logout,
  getDefaultFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured
} from '../firebase';

export default function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Firebase Config State
  const [configJson, setConfigJson] = useState('');
  const [firebaseConfig, setFirebaseConfig] = useState(getDefaultFirebaseConfig());

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setFirebaseConfig(getDefaultFirebaseConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      onAuthSuccess?.(user);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in failed. Please verify your Firebase configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let user;
      if (tab === 'signup') {
        user = await registerWithEmail(email, password, displayName);
        setSuccessMsg('Account created successfully!');
      } else {
        user = await loginWithEmail(email, password);
        setSuccessMsg(`Welcome back, ${user.displayName || user.email}!`);
      }
      onAuthSuccess?.(user);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    try {
      let finalConfig = { ...firebaseConfig };
      if (configJson.trim()) {
        // Try parsing JSON or JS Object
        const clean = configJson
          .replace(/const\s+\w+\s*=\s*/, '')
          .replace(/;\s*$/, '')
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(clean);
        finalConfig = { ...finalConfig, ...parsed };
      }
      saveFirebaseConfig(finalConfig);
      setFirebaseConfig(finalConfig);
      setSuccessMsg('Firebase configuration saved successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        setTab('login');
      }, 1000);
    } catch (err) {
      setError('Failed to parse Firebase config. Please verify the JSON format.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    onAuthSuccess?.(null);
    onClose();
  };

  const configured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#141518] border border-[#27282e] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e1f24] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1e1f24] border border-[#2e3038] text-zinc-200 flex items-center justify-center">
            <Shield className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">
              {currentUser ? 'Student Account' : 'Sign in to Study Coach'}
            </h3>
            <p className="text-xs text-zinc-400">
              {currentUser ? currentUser.email : 'Cross-device multi-session persistence'}
            </p>
          </div>
        </div>

        {/* Current User Logged In Card */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#2a2b32]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">
                    {currentUser.displayName || 'Authenticated Student'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 border-t border-[#26272e] pt-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All focus sessions, streaks, and schedules sync automatically.</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 px-4 bg-[#1f2026] hover:bg-rose-950/40 hover:text-rose-300 border border-[#2e3038] hover:border-rose-900/50 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
              <button
                onClick={() => setTab('config')}
                className="py-2.5 px-4 bg-[#1a1b20] hover:bg-[#22232a] border border-[#2e3038] rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                title="Firebase Settings"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0e0f12] rounded-xl border border-[#222328] mb-4">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'login'
                    ? 'bg-[#22232a] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'signup'
                    ? 'bg-[#22232a] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tab === 'config'
                    ? 'bg-[#22232a] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Key className="w-3 h-3" />
                Firebase Setup
              </button>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {tab !== 'config' ? (
              <div className="space-y-3.5">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#1a1b20] hover:bg-[#20222a] border border-[#2c2d36] rounded-xl text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4 0-.9.2-1.7.4-2.4L1.6 7C.6 9 0 10.4 0 12.3s.6 3.3 1.6 5.3l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-[#26272e]" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">or with email</span>
                  <div className="flex-1 h-px bg-[#26272e]" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-2.5">
                  {tab === 'signup' && (
                    <div>
                      <label className="text-[11px] text-zinc-400 font-medium block mb-1">Your Name</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Prannesh"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 font-medium block mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 bg-zinc-200 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {tab === 'signup' ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                    <span>{tab === 'signup' ? 'Create Student Account' : 'Sign In'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Firebase Configuration Form */
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Paste Firebase Config Object (JavaScript or JSON)
                  </label>
                  <textarea
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    rows={4}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id"\n}`}
                    className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-mono block mb-0.5">apiKey</label>
                    <input
                      type="text"
                      value={firebaseConfig.apiKey || ''}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full px-2.5 py-1.5 bg-[#0e0f12] border border-[#282930] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-mono block mb-0.5">projectId</label>
                    <input
                      type="text"
                      value={firebaseConfig.projectId || ''}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                      placeholder="study-coach-app"
                      className="w-full px-2.5 py-1.5 bg-[#0e0f12] border border-[#282930] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-zinc-200 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Save Firebase Credentials
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
