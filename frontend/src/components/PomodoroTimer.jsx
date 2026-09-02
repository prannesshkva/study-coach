import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, AlertCircle, X, Zap } from 'lucide-react';

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
    <div className="bg-[#15161a] border border-[#24252c] rounded-2xl p-6 sm:p-8 relative flex flex-col items-center shadow-sm">
      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18191f] border border-[#2e2f38] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative">
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
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-[#22242c] hover:bg-[#2b2d38] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
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
      <div className="flex items-center gap-1 p-1 bg-[#0e0f12] rounded-xl border border-[#222329] mb-6 z-10">
        <button
          onClick={() => setTimerMode('focus', 25)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mode === 'focus'
              ? 'bg-[#22232a] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Focus (25m)
        </button>
        <button
          onClick={() => setTimerMode('short_break', 5)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mode === 'short_break'
              ? 'bg-[#22232a] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          Short Break (5m)
        </button>
        <button
          onClick={() => setTimerMode('long_break', 20)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mode === 'long_break'
              ? 'bg-[#22232a] text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Long Break (20m)
        </button>
      </div>

      {/* Topic Selector & Clean Quick Chips */}
      {mode === 'focus' && (
        <div className="w-full max-w-md mb-4 z-10 flex flex-col items-center">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Focus subject or task..."
            className="w-full px-4 py-2 text-center bg-[#0e0f12] border border-[#24252c] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
          />

          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {QUICK_TOPICS.slice(0, 4).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  topic === t
                    ? 'bg-[#242630] border border-[#383a48] text-white'
                    : 'bg-[#101114] border border-[#1f2026] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Distraction-Free Circular Timer Dial */}
      <div className="relative my-3 flex items-center justify-center">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="text-[#202128]"
            strokeWidth="5"
            stroke="currentColor"
            fill="transparent"
          />

          {/* Active Clean Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r="68"
            className="transition-all duration-300 ease-linear"
            strokeWidth="5"
            strokeDasharray={427}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={
              mode === 'focus'
                ? '#f4f4f5'
                : mode === 'short_break'
                ? '#34d399'
                : '#60a5fa'
            }
            fill="transparent"
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute flex flex-col items-center text-center">
          <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white select-none">
            {formatTime(timeLeft)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-zinc-300 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400">
              {mode === 'focus' ? (isRunning ? 'In Focus Flow' : 'Deep Work Session') : (isRunning ? 'Resting' : 'Break Ready')}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3 mt-4 z-10">
        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-3 bg-[#191a20] hover:bg-[#22242c] text-zinc-400 hover:text-white rounded-xl border border-[#262730] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleTimer}
          className={`px-8 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2.5 transition-all ${
            isRunning
              ? 'bg-[#22242c] hover:bg-[#2b2d38] text-white border border-[#343644]'
              : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm'
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
        </button>

        <button
          onClick={handleLogClick}
          title={mode === 'focus' ? "Complete & Log Session" : "Complete & Log Break"}
          className="p-3 bg-[#191a20] hover:bg-[#22242c] text-zinc-300 hover:text-white rounded-xl border border-[#262730] transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Flow Rating */}
      {mode === 'focus' && (
        <div className="mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0e0f12] border border-[#202127] text-xs text-zinc-400 z-10">
          <span className="font-medium text-zinc-400">Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFocusRating(val)}
                className={`w-5 h-5 rounded text-xs font-semibold transition-colors flex items-center justify-center ${
                  focusRating >= val ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 ml-1">
            {focusRating === 5 ? 'Deep Flow' : focusRating === 4 ? 'High Focus' : focusRating === 3 ? 'Moderate' : 'Distracted'}
          </span>
        </div>
      )}
    </div>
  );
}


