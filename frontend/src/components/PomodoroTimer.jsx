import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Sparkles, AlertCircle, X, Flame, Zap, Compass, BookOpen } from 'lucide-react';

const QUICK_TOPICS = [
  'Operating Systems',
  'Distributed Systems',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Computer Networks',
  'Mathematics & Calculus'
];

export default function PomodoroTimer({ onSessionCompleted, onBreakCompleted, onStartSession, activePresetMinutes }) {
  const [mode, setMode] = useState('focus');
  const [topic, setTopic] = useState('Operating Systems');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusRating, setFocusRating] = useState(5);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (activePresetMinutes) {
      setMode('focus');
      const seconds = activePresetMinutes * 60;
      setTotalDuration(seconds);
      setTimeLeft(seconds);
      setIsRunning(true);
    }
  }, [activePresetMinutes]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      executeComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const setTimerMode = (newMode, minutes) => {
    setMode(newMode);
    setIsRunning(false);
    const secs = minutes * 60;
    setTotalDuration(secs);
    setTimeLeft(secs);
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      const modeName = mode === 'focus' ? 'Focus Session' : mode === 'short_break' ? 'Short Break' : 'Long Break';
      setConfirmDialog({
        type: 'pause',
        title: `Pause ${modeName}?`,
        message: `Pause your countdown? You can resume your focus flow anytime.`,
        confirmText: 'Pause Timer',
        confirmColor: 'bg-slate-700 hover:bg-slate-600 text-white shadow-md',
        onConfirm: () => {
          setIsRunning(false);
          setConfirmDialog(null);
        }
      });
    } else {
      if (timeLeft === totalDuration && mode === 'focus') {
        onStartSession?.(Math.round(totalDuration / 60), topic);
      }
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
  };

  const handleLogClick = () => {
    const modeName = mode === 'focus' ? 'Study Session' : mode === 'short_break' ? 'Short Break' : 'Long Break';
    const elapsedMins = Math.max(1, Math.round((totalDuration - timeLeft) / 60));
    
    setConfirmDialog({
      type: 'log',
      title: `Finish & Log ${modeName}?`,
      message: mode === 'focus'
        ? `Complete and record this ${elapsedMins}-minute session on "${topic}" with ${focusRating}/5 focus?`
        : `Complete this ${modeName.toLowerCase()} and receive your next cognitive study recommendation?`,
      confirmText: 'Confirm & Log',
      confirmColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 font-semibold',
      onConfirm: () => {
        executeComplete();
        setConfirmDialog(null);
      }
    });
  };

  const executeComplete = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const elapsedMins = Math.max(1, Math.round((totalDuration - timeLeft) / 60));
      onSessionCompleted?.(elapsedMins, focusRating, topic);
    } else {
      const breakMins = Math.round(totalDuration / 60);
      onBreakCompleted?.(mode, breakMins);
      setTimerMode('focus', 25);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center border border-slate-800/90 group">
      {/* Dynamic Ambient Background Glow */}
      <div
        className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          mode === 'focus'
            ? isRunning ? 'bg-indigo-600/20 animate-pulse-glow' : 'bg-indigo-600/10'
            : mode === 'short_break'
            ? 'bg-emerald-500/15'
            : 'bg-purple-600/15'
        }`}
      />
      <div
        className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          mode === 'focus'
            ? isRunning ? 'bg-purple-600/20 animate-pulse-glow' : 'bg-purple-600/10'
            : 'bg-teal-500/15'
        }`}
      />

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative ring-1 ring-white/10">
            <button
              onClick={() => setConfirmDialog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${confirmDialog.confirmColor}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/90 mb-6 z-10 shadow-inner">
        <button
          onClick={() => setTimerMode('focus', 25)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            mode === 'focus'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Focus (25m)
        </button>
        <button
          onClick={() => setTimerMode('short_break', 5)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            mode === 'short_break'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          Short Break (5m)
        </button>
        <button
          onClick={() => setTimerMode('long_break', 20)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            mode === 'long_break'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25 border border-purple-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Long Break (20m)
        </button>
      </div>

      {/* Topic Selector & Quick Chips */}
      {mode === 'focus' && (
        <div className="w-full max-w-md mb-3 z-10 flex flex-col items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What are you studying or mastering right now?"
              className="w-full px-4 py-2 text-center bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {QUICK_TOPICS.slice(0, 4).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  topic === t
                    ? 'bg-indigo-600/30 border border-indigo-500/60 text-indigo-200'
                    : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cyber-Dial Timer SVG */}
      <div className="relative my-3 flex items-center justify-center">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90 transform" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="shortBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="text-slate-800/50"
            strokeWidth="7"
            stroke="currentColor"
            fill="transparent"
          />

          {/* Active Animated Progress Arc with Glow */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="transition-all duration-500 ease-linear"
            strokeWidth="7"
            strokeDasharray={427}
            strokeDashoffset={427 - (427 * progressPercent) / 100}
            strokeLinecap="round"
            stroke={
              mode === 'focus'
                ? 'url(#focusGradient)'
                : mode === 'short_break'
                ? 'url(#shortBreakGradient)'
                : 'url(#longBreakGradient)'
            }
            filter={isRunning ? "url(#glowFilter)" : undefined}
            fill="transparent"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute flex flex-col items-center text-center">
          <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tighter text-white drop-shadow-sm select-none">
            {formatTime(timeLeft)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isRunning
                  ? mode === 'focus'
                    ? 'bg-indigo-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-[11px] uppercase font-bold tracking-widest text-slate-400">
              {mode === 'focus' ? (isRunning ? 'Ultradian Sprint' : 'Deep Work Primed') : (isRunning ? 'Active Rest' : 'Ready to Rest')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3.5 mt-4 z-10">
        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleTimer}
          className={`px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all active:scale-[0.97] shadow-xl ${
            isRunning
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 shadow-slate-950/50'
              : mode === 'focus'
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:via-purple-400 hover:to-indigo-500 text-white shadow-indigo-500/30 border border-indigo-400/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 border border-emerald-400/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> {mode === 'focus' ? 'Start Focus' : 'Start Rest'}
            </>
          )}
        </button>

        <button
          onClick={handleLogClick}
          title={mode === 'focus' ? "Complete & Log Session" : "Complete & Log Break"}
          className="p-3 bg-slate-900/80 hover:bg-emerald-950/50 text-slate-400 hover:text-emerald-300 rounded-2xl border border-slate-800 hover:border-emerald-800/60 transition-all shadow-md active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Quality Rating Stars */}
      {mode === 'focus' && (
        <div className="mt-5 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 z-10 shadow-inner">
          <span className="font-medium text-slate-400">Flow Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFocusRating(val)}
                className={`w-6 h-6 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                  focusRating >= val
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-600 hover:text-slate-400'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-amber-300/90 ml-1">
            {focusRating === 5 ? 'Deep Flow 🌊' : focusRating === 4 ? 'High Focus ⚡' : focusRating === 3 ? 'Moderate 🎯' : 'Distracted 🌀'}
          </span>
        </div>
      )}
    </div>
  );
}

