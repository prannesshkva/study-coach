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
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Daily Focus Goal</h3>
            <p className="text-xs text-slate-400">Target & Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold">
          <Flame className="w-4 h-4 fill-current" />
          <span>{streak} Day Streak</span>
        </div>
      </div>

      <div className="my-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-black text-white">
            {completed} <span className="text-xs font-medium text-slate-400">/ {target} mins</span>
          </span>
          <span className={`text-sm font-bold ${goalReached ? 'text-emerald-400' : 'text-rose-400'}`}>
            {percentage}% {goalReached && 'Complete'}
          </span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              goalReached
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5" /> Sessions Done
          </div>
          <span className="text-lg font-bold text-slate-200">{sessionsCount}</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5" /> Remaining Time
          </div>
          <span className="text-lg font-bold text-slate-200">
            {Math.max(0, target - completed)} <span className="text-xs font-normal">mins</span>
          </span>
        </div>
      </div>

      {!isEditingGoal ? (
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
          <span className="text-xs text-slate-400">Quick Adjust Target:</span>
          <div className="flex items-center gap-1.5">
            {presetGoals.map((mins) => (
              <button
                key={mins}
                onClick={() => onSetGoal?.(mins)}
                className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  target === mins
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {mins / 60}h
              </button>
            ))}
            <button
              onClick={() => setIsEditingGoal(true)}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              title="Custom Goal"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGoalSubmit} className="pt-3 border-t border-slate-800/60 flex items-center gap-2">
          <input
            type="number"
            value={customGoalMins}
            onChange={(e) => setCustomGoalMins(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            placeholder="Target in minutes"
            min="10"
            max="720"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingGoal(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
