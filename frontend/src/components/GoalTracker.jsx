import React, { useState } from 'react';
import { Target, Flame, Clock, Award, Plus } from 'lucide-react';

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
    onSetGoal?.(Number(customGoalMins));
    setIsEditingGoal(false);
  };

  const presetGoals = [60, 120, 180, 240];

  return (
    <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-200">Daily Target</h3>
            <p className="text-[11px] text-slate-500">Progress Pacing</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs font-medium">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>{streak}d Streak</span>
        </div>
      </div>

      <div className="my-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xl font-semibold text-white tracking-tight">
            {completed} <span className="text-xs font-normal text-slate-500">/ {target}m</span>
          </span>
          <span className={`text-xs font-medium ${goalReached ? 'text-emerald-400' : 'text-slate-400'}`}>
            {percentage}% {goalReached && '✓'}
          </span>
        </div>

        <div className="w-full h-2 bg-[#0c1017] rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              goalReached
                ? 'bg-emerald-400'
                : 'bg-slate-300'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-2.5 bg-[#0c1017] border border-slate-800/80 rounded-xl">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
            <Clock className="w-3 h-3" /> Sessions
          </div>
          <span className="text-sm font-semibold text-slate-200">{sessionsCount}</span>
        </div>

        <div className="p-2.5 bg-[#0c1017] border border-slate-800/80 rounded-xl">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
            <Award className="w-3 h-3" /> Remaining
          </div>
          <span className="text-sm font-semibold text-slate-200">
            {Math.max(0, target - completed)} <span className="text-[10px] font-normal text-slate-500">m</span>
          </span>
        </div>
      </div>

      {!isEditingGoal ? (
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/70">
          <span className="text-[11px] text-slate-500">Preset Target:</span>
          <div className="flex items-center gap-1">
            {presetGoals.map((mins) => (
              <button
                key={mins}
                onClick={() => onSetGoal?.(mins)}
                className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                  target === mins
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins / 60}h
              </button>
            ))}
            <button
              onClick={() => setIsEditingGoal(true)}
              className="p-1 bg-slate-900 text-slate-400 hover:text-slate-200 rounded-md text-xs"
              title="Custom Goal"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGoalSubmit} className="pt-3 border-t border-slate-800/70 flex items-center gap-2">
          <input
            type="number"
            value={customGoalMins}
            onChange={(e) => setCustomGoalMins(e.target.value)}
            className="flex-1 px-2.5 py-1 bg-[#0c1017] border border-slate-700 rounded-lg text-xs text-white"
            placeholder="Minutes"
            min="10"
            max="720"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-slate-100 text-slate-950 hover:bg-white rounded-lg text-xs font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingGoal(false)}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
