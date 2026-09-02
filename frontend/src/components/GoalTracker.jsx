import React, { useState } from 'react';
import { Target, Flame, Clock, Award, Plus, Check, ChevronRight, Zap } from 'lucide-react';

export default function GoalTracker({ summary, onSetGoal }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [customGoalMins, setCustomGoalMins] = useState(summary?.target_minutes || 120);

  const completed = summary?.completed_minutes || 0;
  const target = summary?.target_minutes || 120;
  const percentage = summary?.completion_percentage || 0;
  const streak = summary?.streak_days || 0;
  const sessionsCount = summary?.sessions_count || 0;
  const goalReached = summary?.goal_reached || false;

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (customGoalMins > 0) {
      onSetGoal?.(Number(customGoalMins));
      setIsEditingGoal(false);
    }
  };

  const presetGoals = [60, 120, 180, 240];

  return (
    <div className="glass-card rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800/90 group">
      {/* Subtle Card Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">Daily Focus Target</h3>
            <p className="text-[11px] text-slate-400">Implementation Calibration</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 fill-current animate-bounce" />
          <span>{streak}d Streak</span>
        </div>
      </div>

      {/* Progress Stats & Bar */}
      <div className="my-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
        <div className="flex justify-between items-baseline mb-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {completed}
            </span>
            <span className="text-xs font-medium text-slate-400">
              / {target} mins
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              goalReached
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            }`}
          >
            {percentage}% {goalReached ? '✓ Goal Achieved' : ''}
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              goalReached
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 shadow-md shadow-emerald-500/50'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/50'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Completed</span>
            <span className="text-sm font-bold text-white">{sessionsCount} Sessions</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Remaining</span>
            <span className="text-sm font-bold text-white">
              {Math.max(0, target - completed)} <span className="text-[10px] text-slate-400 font-normal">mins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Presets & Custom Target Input */}
      {!isEditingGoal ? (
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/80">
          <span className="text-[11px] font-medium text-slate-400">Quick Calibrate:</span>
          <div className="flex items-center gap-1.5">
            {presetGoals.map((mins) => (
              <button
                key={mins}
                onClick={() => onSetGoal?.(mins)}
                className={`px-3 py-1 text-xs rounded-xl font-bold transition-all ${
                  target === mins
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {mins / 60}h
              </button>
            ))}
            <button
              onClick={() => setIsEditingGoal(true)}
              className="p-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800/80 text-xs transition-colors"
              title="Custom Goal"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGoalSubmit} className="pt-3.5 border-t border-slate-800/80 flex items-center gap-2">
          <input
            type="number"
            value={customGoalMins}
            onChange={(e) => setCustomGoalMins(e.target.value)}
            className="flex-1 px-3.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            placeholder="Minutes (e.g. 150)"
            min="10"
            max="720"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingGoal(false)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

