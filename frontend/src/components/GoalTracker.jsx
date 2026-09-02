import React, { useState } from 'react';
import { Target, Flame, Clock, Award, Plus, Check } from 'lucide-react';

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
    <div className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-300">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Daily Focus Target</h3>
            <p className="text-[11px] text-zinc-400">Implementation Calibration</p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1b20] border border-[#282932] rounded-lg text-zinc-200 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>{streak}d Streak</span>
        </div>
      </div>

      {/* Progress Stats & Bar */}
      <div className="my-4 p-3.5 rounded-xl bg-[#0e0f12] border border-[#202127]">
        <div className="flex justify-between items-baseline mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white tracking-tight font-mono">
              {completed}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              / {target} mins
            </span>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              goalReached
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                : 'bg-[#1b1c22] text-zinc-300 border border-[#282932]'
            }`}
          >
            {percentage}% {goalReached ? '✓ Reached' : ''}
          </span>
        </div>

        <div className="w-full h-2 bg-[#1b1c22] rounded-full overflow-hidden border border-[#252630]">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              goalReached
                ? 'bg-emerald-400'
                : 'bg-zinc-200'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-3 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#18191f] text-zinc-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Completed</span>
            <span className="text-xs font-bold text-white">{sessionsCount} Sessions</span>
          </div>
        </div>

        <div className="p-3 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#18191f] text-zinc-400 flex items-center justify-center">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Remaining</span>
            <span className="text-xs font-bold text-white">
              {Math.max(0, target - completed)} <span className="text-[10px] text-zinc-400 font-normal">mins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Presets & Custom Target Input */}
      {!isEditingGoal ? (
        <div className="flex items-center justify-between pt-3 border-t border-[#22232a]">
          <span className="text-[11px] text-zinc-400">Preset:</span>
          <div className="flex items-center gap-1">
            {presetGoals.map((mins) => (
              <button
                key={mins}
                onClick={() => onSetGoal?.(mins)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  target === mins
                    ? 'bg-[#262832] text-white border border-[#3a3c4a]'
                    : 'bg-[#0e0f12] text-zinc-400 hover:text-white border border-[#202127]'
                }`}
              >
                {mins / 60}h
              </button>
            ))}
            <button
              onClick={() => setIsEditingGoal(true)}
              className="p-1 bg-[#0e0f12] hover:bg-[#1a1b20] text-zinc-400 hover:text-white rounded-lg border border-[#202127] text-xs"
              title="Custom Goal"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGoalSubmit} className="pt-3 border-t border-[#22232a] flex items-center gap-2">
          <input
            type="number"
            value={customGoalMins}
            onChange={(e) => setCustomGoalMins(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0e0f12] border border-[#282932] rounded-lg text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
            placeholder="Minutes"
            min="10"
            max="720"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-bold"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditingGoal(false)}
            className="px-2.5 py-1.5 bg-[#1a1b20] text-zinc-400 hover:text-white rounded-lg text-xs"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}


