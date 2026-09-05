import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, AlertCircle, X, Zap, Sparkles } from 'lucide-react';

const QUICK_TOPICS = [
  'Operating Systems',
  'Distributed Systems',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Computer Networks',
  'Mathematics'
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
        confirmColor: 'bg-zinc-800 hover:bg-zinc-700 text-white',
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
      confirmColor: 'bg-white hover:bg-zinc-200 text-zinc-950 font-bold',
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
  const strokeDashoffset = 427 - (427 * progressPercent) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`bg-[#15161a] border border-[#24252c] rounded-2xl p-6 sm:p-8 relative flex flex-col items-center shadow-sm transition-all duration-500 ${
        isRunning ? (mode === 'focus' ? 'timer-glow-running border-red-500/20' : 'timer-glow-break border-emerald-500/20') : 'focus-ambient-glow'
      }`}
    >
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#18191f] border border-[#2e2f38] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative"
            >
              <button
                onClick={() => setConfirmDialog(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-[#22242c] text-zinc-300 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{confirmDialog.title}</h3>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-2.5 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 bg-[#22242c] hover:bg-[#2b2d38] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmDialog.onConfirm}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${confirmDialog.confirmColor}`}
                >
                  {confirmDialog.confirmText}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Switcher Animated Pill Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0e0f12] rounded-xl border border-[#222329] mb-6 z-10 relative">
        <button
          onClick={() => setTimerMode('focus', 25)}
          className={`relative px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
            mode === 'focus' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {mode === 'focus' && (
            <motion.div
              layoutId="activeTimerTab"
              className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <Zap className="w-3.5 h-3.5" />
          Focus (25m)
        </button>

        <button
          onClick={() => setTimerMode('short_break', 5)}
          className={`relative px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
            mode === 'short_break' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {mode === 'short_break' && (
            <motion.div
              layoutId="activeTimerTab"
              className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <Coffee className="w-3.5 h-3.5 text-emerald-400" />
          Short Break (5m)
        </button>

        <button
          onClick={() => setTimerMode('long_break', 20)}
          className={`relative px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors z-10 ${
            mode === 'long_break' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {mode === 'long_break' && (
            <motion.div
              layoutId="activeTimerTab"
              className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded-lg shadow-sm -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Long Break (20m)
        </button>
      </div>

      {/* Topic Selector & Clean Quick Chips */}
      {mode === 'focus' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mb-4 z-10 flex flex-col items-center"
        >
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Focus subject or task..."
            className="w-full px-4 py-2 text-center bg-[#0e0f12] border border-[#24252c] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-all shadow-inner"
          />

          <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
            {QUICK_TOPICS.slice(0, 4).map((t) => (
              <motion.button
                key={t}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTopic(t)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  topic === t
                    ? 'bg-[#252834] border border-[#3e4152] text-white shadow-sm'
                    : 'bg-[#101114] border border-[#1f2026] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Distraction-Free Circular Timer Dial */}
      <div className="relative my-3 flex items-center justify-center">
        {/* Breathing ambient ring on run */}
        {isRunning && (
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className={`absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full blur-xl pointer-events-none ${
              mode === 'focus' ? 'bg-red-500/20' : 'bg-emerald-500/20'
            }`}
          />
        )}

        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="text-[#1c1d24]"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
          />

          {/* Active Clean Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="transition-all duration-500 ease-linear"
            strokeWidth="5"
            strokeDasharray={427}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={
              mode === 'focus'
                ? '#fafafa'
                : mode === 'short_break'
                ? '#10b981'
                : '#3b82f6'
            }
            fill="transparent"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute flex flex-col items-center text-center">
          <motion.span
            key={timeLeft}
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 1 }}
            className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white select-none drop-shadow-sm"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-block w-2 h-2 rounded-full transition-all ${
                isRunning ? (mode === 'focus' ? 'bg-red-400 animate-pulse' : 'bg-emerald-400 animate-pulse') : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
              {mode === 'focus' ? (isRunning ? 'In Focus Flow' : 'Deep Work Session') : (isRunning ? 'Active Rest' : 'Break Ready')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3 mt-4 z-10">
        <motion.button
          whileHover={{ scale: 1.08, rotate: -30 }}
          whileTap={{ scale: 0.92 }}
          onClick={resetTimer}
          title="Reset timer"
          className="p-3 bg-[#191a20] hover:bg-[#22242c] text-zinc-400 hover:text-white rounded-xl border border-[#262730] transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleToggleTimer}
          className={`px-8 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-md transition-all ${
            isRunning
              ? 'bg-[#22242c] hover:bg-[#2b2d38] text-white border border-[#343644]'
              : 'bg-white hover:bg-zinc-100 text-zinc-950 font-bold'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> {mode === 'focus' ? 'Start Focus' : 'Start Break'}
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleLogClick}
          title={mode === 'focus' ? "Complete & Log Session" : "Complete & Log Break"}
          className="p-3 bg-[#191a20] hover:bg-[#22242c] text-zinc-300 hover:text-white rounded-xl border border-[#262730] transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Flow Rating */}
      {mode === 'focus' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0e0f12] border border-[#202127] text-xs text-zinc-400 z-10 shadow-inner"
        >
          <span className="font-medium text-zinc-400">Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <motion.button
                key={val}
                type="button"
                whileHover={{ scale: 1.3, rotate: 10 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setFocusRating(val)}
                className={`w-5 h-5 rounded text-xs font-semibold transition-colors flex items-center justify-center ${
                  focusRating >= val ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                ★
              </motion.button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 ml-1">
            {focusRating === 5 ? 'Deep Flow' : focusRating === 4 ? 'High Focus' : focusRating === 3 ? 'Moderate' : 'Distracted'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
