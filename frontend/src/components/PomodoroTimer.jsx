import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, CheckCircle2, Coffee, Flame, AlertCircle, X } from 'lucide-react';

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
      const modeName = mode === 'focus' ? 'Focus Study Session' : mode === 'short_break' ? 'Short Break' : 'Long Break';
      setConfirmDialog({
        type: 'pause',
        title: `Pause ${modeName}?`,
        message: `Are you sure you want to pause your ${modeName.toLowerCase()}? You can resume anytime.`,
        confirmText: 'Yes, Pause',
        confirmColor: 'bg-amber-500 hover:bg-amber-600',
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
        ? `Are you sure you want to complete and log this ${elapsedMins}-minute focus session on "${topic}" with ${focusRating}/5 focus?`
        : `Are you sure you want to finish this ${modeName.toLowerCase()} and ask your coach for the next study block?`,
      confirmText: 'Yes, Log Now',
      confirmColor: 'bg-emerald-500 hover:bg-emerald-600',
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center">
      <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${
        mode === 'focus' ? 'bg-rose-500' : mode === 'short_break' ? 'bg-emerald-500' : 'bg-cyan-500'
      }`} />

      {confirmDialog && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative">
            <button
              onClick={() => setConfirmDialog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-lg ${confirmDialog.confirmColor}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6 z-10">
        <button
          onClick={() => setTimerMode('focus', 25)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            mode === 'focus'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" /> Focus (25m)
        </button>
        <button
          onClick={() => setTimerMode('short_break', 5)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            mode === 'short_break'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" /> Short Break (5m)
        </button>
        <button
          onClick={() => setTimerMode('long_break', 20)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            mode === 'long_break'
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Long Break (20m)
        </button>
      </div>

      {mode === 'focus' && (
        <div className="w-full max-w-sm mb-4 z-10">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 text-center">
            Current Focus Task / Subject:
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Operating Systems / AI"
            className="w-full px-4 py-2 text-center bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>
      )}

      <div className="relative my-4 flex items-center justify-center">
        <svg className="w-64 h-64 -rotate-90 transform" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            className="text-slate-800/80"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            className={`transition-all duration-500 ease-linear ${
              mode === 'focus' ? 'text-rose-500' : mode === 'short_break' ? 'text-emerald-400' : 'text-cyan-400'
            }`}
            strokeWidth="8"
            strokeDasharray={440}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-5xl font-bold tracking-tight text-white drop-shadow-md">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
            {mode === 'focus' ? (isRunning ? 'In The Flow' : 'Ready') : (isRunning ? 'Recharging' : 'Break Ready')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 z-10">
        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleToggleTimer}
          className={`px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl flex items-center gap-2 transition-all transform active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              : mode === 'focus'
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> {mode === 'focus' ? 'Start Session' : 'Start Break'}
            </>
          )}
        </button>

        <button
          onClick={handleLogClick}
          title={mode === 'focus' ? "Finish & Log Session" : "Complete & Log Break"}
          className={`p-3 rounded-2xl transition-colors ${
            mode === 'focus'
              ? 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400'
              : 'bg-slate-800/80 hover:bg-slate-700 text-cyan-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>

      {mode === 'focus' && (
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 z-10">
          <span>Focus Rating:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => setFocusRating(val)}
                className={`w-6 h-6 rounded-md font-mono text-xs font-semibold ${
                  focusRating >= val ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
