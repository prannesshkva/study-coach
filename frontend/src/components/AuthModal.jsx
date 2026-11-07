import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Key, Mail, Lock, User, CheckCircle2, AlertCircle, Sparkles, LogOut, Shield, ArrowRight } from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logout,
  getDefaultFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseConfigured
} from '../firebase';

export default function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess, currentUserId = 'prannesh' }) {
  const [tab, setTab] = useState('student'); // 'student' | 'cloud' | 'config'
  const [authSubMode, setAuthSubMode] = useState('login'); // 'login' | 'signup'
  const [studentInput, setStudentInput] = useState(currentUserId || 'prannesh');
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
      setStudentInput(currentUserId || 'prannesh');
      setFirebaseConfig(getDefaultFirebaseConfig());
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const handleStudentSignIn = (e) => {
    e?.preventDefault();
    const cleanId = (studentInput || 'prannesh').trim().toLowerCase();
    if (!cleanId) return;

    const pseudoUser = {
      uid: cleanId,
      displayName: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
      email: `${cleanId}@study.local`,
      isStudentId: true
    };

    setSuccessMsg(`Active student set to "${cleanId}"!`);
    onAuthSuccess?.(pseudoUser);
    setTimeout(() => onClose(), 600);
  };

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
      setError(err.message || 'Google sign-in failed. Please verify your Firebase configuration or use Student ID sign-in.');
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
      if (authSubMode === 'signup') {
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
      setError(err.message || 'Authentication failed. Please verify your credentials or use Student ID sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    try {
      let finalConfig = { ...firebaseConfig };
      if (configJson.trim()) {
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
        setTab('cloud');
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

  const sampleStudentIds = ['prannesh', 'student-alex', 'student-beth', 'deep-worker'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#141518] border border-[#27282e] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 focus-ambient-glow"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e1f24] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1e1f24] border border-[#2e3038] text-zinc-200 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">
              {currentUser ? 'Student Account' : 'Sign in to Study Coach'}
            </h3>
            <p className="text-xs text-zinc-400">
              {currentUser ? currentUser.email : 'Personalized sessions, timers, and progress tracking'}
            </p>
          </div>
        </div>

        {/* Current User Logged In Card */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#1a1b20] border border-[#2a2b32] shadow-inner">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm shadow-sm">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">
                    {currentUser.displayName || 'Active Student'}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 border-t border-[#26272e] pt-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All focus blocks, streaks, and LangGraph sessions are isolated for this account.</span>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="flex-1 py-2.5 px-4 bg-[#1f2026] hover:bg-rose-950/40 hover:text-rose-300 border border-[#2e3038] hover:border-rose-900/50 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onAuthSuccess?.(null);
                  setTab('student');
                }}
                className="py-2.5 px-4 bg-[#1a1b20] hover:bg-[#22232a] border border-[#2e3038] rounded-xl text-xs font-semibold text-zinc-300 transition-colors shadow-sm"
                title="Switch Student ID"
              >
                Switch Student
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0e0f12] rounded-xl border border-[#222328] mb-4 relative">
              <button
                onClick={() => { setTab('student'); setError(null); }}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors z-10 flex items-center justify-center gap-1.5 ${
                  tab === 'student' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'student' && (
                  <motion.div
                    layoutId="authModalTab"
                    className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <User className="w-3 h-3" />
                <span>Student ID</span>
              </button>

              <button
                onClick={() => { setTab('cloud'); setError(null); }}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors z-10 flex items-center justify-center gap-1.5 ${
                  tab === 'cloud' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'cloud' && (
                  <motion.div
                    layoutId="authModalTab"
                    className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Cloud Sync</span>
              </button>

              <button
                onClick={() => { setTab('config'); setError(null); }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 z-10 ${
                  tab === 'config' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Firebase Settings"
              >
                {tab === 'config' && (
                  <motion.div
                    layoutId="authModalTab"
                    className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <Key className="w-3 h-3" />
                <span>Setup</span>
              </button>
            </div>

            {/* Notifications */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3.5 p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-200 text-xs flex flex-col gap-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
                {tab === 'cloud' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setTab('student');
                    }}
                    className="self-start text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 pt-1"
                  >
                    <span>Switch to instant Student ID sign-in instead</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* TAB 1: STUDENT ID (Recommended / Instant) */}
            {tab === 'student' && (
              <form onSubmit={handleStudentSignIn} className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-zinc-300 font-semibold block mb-1">
                    Student Username or ID
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="e.g. prannesh"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono transition-colors shadow-inner"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Zero-config instant login. All timers, chat history, and study roadmaps will be isolated under this Student ID.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block mb-1.5">
                    Quick Select
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleStudentIds.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setStudentInput(id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                          studentInput === id
                            ? 'bg-[#22232a] border-[#3e4152] text-white shadow-sm'
                            : 'bg-[#0e0f12] border-[#222328] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Start Studying as "{studentInput || 'Student'}"</span>
                </motion.button>
              </form>
            )}

            {/* TAB 2: CLOUD SYNC (Google & Email via Firebase) */}
            {tab === 'cloud' && (
              <div className="space-y-3.5">
                {/* Google Sign In */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>

                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-[#26272e]" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    or with email
                  </span>
                  <div className="flex-1 h-px bg-[#26272e]" />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs mb-1">
                  <button
                    type="button"
                    onClick={() => setAuthSubMode('login')}
                    className={`font-semibold pb-1 border-b-2 transition-colors ${
                      authSubMode === 'login' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthSubMode('signup')}
                    className={`font-semibold pb-1 border-b-2 transition-colors ${
                      authSubMode === 'signup' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Register New
                  </button>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-2.5">
                  {authSubMode === 'signup' && (
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
                          className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
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
                        className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
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
                        className="w-full pl-9 pr-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {authSubMode === 'signup' ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                    <span>{authSubMode === 'signup' ? 'Create Student Account' : 'Sign In'}</span>
                  </motion.button>
                </form>
              </div>
            )}

            {/* TAB 3: CONFIG / SETUP */}
            {tab === 'config' && (
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  If you have a Google Firebase project for multi-device sync, paste your web app credentials below:
                </p>

                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">
                    Paste Firebase Config Object (JavaScript or JSON)
                  </label>
                  <textarea
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    rows={4}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id"\n}`}
                    className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 shadow-inner"
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
                      className="w-full px-2.5 py-1.5 bg-[#0e0f12] border border-[#282930] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-zinc-400 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-mono block mb-0.5">projectId</label>
                    <input
                      type="text"
                      value={firebaseConfig.projectId || ''}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                      placeholder="studycoach-838ab"
                      className="w-full px-2.5 py-1.5 bg-[#0e0f12] border border-[#282930] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-zinc-400 shadow-inner"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Save Firebase Credentials
                </motion.button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
