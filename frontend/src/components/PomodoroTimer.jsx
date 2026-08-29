import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Sparkles, AlertCircle, X } from 'lucide-react';

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
        message: `Pause your timer? You can resume whenever you are ready.`,
        confirmText: 'Pause Timer',
        confirmColor: 'bg-slate-700 hover:bg-slate-600 text-white',
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
        : `Complete this ${modeName.toLowerCase()} and receive your next study recommendation?`,
      confirmText: 'Confirm & Log',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
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
    <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-sm backdrop-blur-md relative overflow-hidden flex flex-col items-center">
      {confirmDialog && (
        <div className="absolute inset-0 bg-[#0c1017]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151c2c] border border-slate-700/80 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center relative">
            <button
              onClick={() => setConfirmDialog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${confirmDialog.confirmColor}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 p-1 bg-[#0c1017] rounded-xl border border-slate-800 mb-6 z-10">
        <button
          onClick={() => setTimerMode('focus', 25)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'focus'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => setTimerMode('short_break', 5)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'short_break'
              ? 'bg-emerald-950/60 text-emerald-300 shadow-sm border border-emerald-800/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Short Break (5m)
        </button>
        <button
          onClick={() => setTimerMode('long_break', 20)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'long_break'
              ? 'bg-indigo-950/60 text-indigo-300 shadow-sm border border-indigo-800/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Long Break (20m)
        </button>
      </div>

      {mode === 'focus' && (
        <div className="w-full max-w-xs mb-4 z-10">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Focus subject or task..."
            className="w-full px-3.5 py-1.5 text-center bg-[#0c1017] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-600 transition-colors font-medium"
          />
        </div>
      )}

      <div className="relative my-2 flex items-center justify-center">
        <svg className="w-60 h-60 -rotate-90 transform" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            className="text-slate-800/60"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            className={`transition-all duration-500 ease-linear ${
              mode === 'focus'
                ? 'text-slate-200'
                : mode === 'short_break'
                ? 'text-emerald-400'
                : 'text-indigo-400'
            }`}
            strokeWidth="6"
            strokeDasharray={440}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-500 mt-2">
            {mode === 'focus' ? (isRunning ? 'In Progress' : 'Ready') : (isRunning ? 'Recharging' : 'Break Ready')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 z-10">
        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-2.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={handleToggleTimer}
          className={`px-7 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-[0.98] ${
            isRunning
              ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              : mode === 'focus'
              ? 'bg-slate-100 text-slate-950 hover:bg-white'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> {mode === 'focus' ? 'Start Session' : 'Start Break'}
            </>
          )}
        </button>

        <button
          onClick={handleLogClick}
          title={mode === 'focus' ? "Finish & Log Session" : "Complete & Log Break"}
          className="p-2.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700/50 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {mode === 'focus' && (
        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 z-10">
          <span>Focus:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => setFocusRating(val)}
                className={`w-5 h-5 rounded text-[11px] font-medium transition-colors ${
                  focusRating >= val ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-600'
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
