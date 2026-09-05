import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm focus-ambient-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-300 shadow-sm">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Daily Focus Target</h3>
            <p className="text-[11px] text-zinc-400">Implementation Calibration</p>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1b20] border border-[#282932] rounded-lg text-zinc-200 text-xs font-semibold shadow-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
          </motion.div>
          <span>{streak}d Streak</span>
        </motion.div>
      </div>

      {/* Progress Stats & Bar */}
      <div className="my-4 p-3.5 rounded-xl bg-[#0e0f12] border border-[#202127] shadow-inner">
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
            className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${
              goalReached
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                : 'bg-[#1b1c22] text-zinc-300 border border-[#282932]'
            }`}
          >
            {percentage}% {goalReached ? '✓ Reached' : ''}
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#1b1c22] rounded-full overflow-hidden border border-[#252630] relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all relative ${
              goalReached
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-zinc-400 to-zinc-200'
            }`}
          >
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/40 blur-xs rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <motion.div
          whileHover={{ y: -1 }}
          className="p-3 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-[#18191f] text-zinc-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Completed</span>
            <span className="text-xs font-bold text-white">{sessionsCount} Sessions</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -1 }}
          className="p-3 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-[#18191f] text-zinc-400 flex items-center justify-center">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Remaining</span>
            <span className="text-xs font-bold text-white">
              {Math.max(0, target - completed)} <span className="text-[10px] text-zinc-400 font-normal">mins</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* Presets & Custom Target Input */}
      {!isEditingGoal ? (
        <div className="flex items-center justify-between pt-3 border-t border-[#22232a]">
          <span className="text-[11px] text-zinc-400 font-medium">Calibrate:</span>
          <div className="flex items-center gap-1.5">
            {presetGoals.map((mins) => (
              <motion.button
                key={mins}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onSetGoal?.(mins)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                  target === mins
                    ? 'bg-[#262832] text-white border border-[#3e4050] shadow-sm'
                    : 'bg-[#0e0f12] text-zinc-400 hover:text-white border border-[#202127]'
                }`}
              >
                {mins / 60}h
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditingGoal(true)}
              className="p-1 bg-[#0e0f12] hover:bg-[#1a1b20] text-zinc-400 hover:text-white rounded-lg border border-[#202127] text-xs shadow-sm"
              title="Custom Goal"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGoalSubmit} className="pt-3 border-t border-[#22232a] flex items-center gap-2">
          <input
            type="number"
            value={customGoalMins}
            onChange={(e) => setCustomGoalMins(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0e0f12] border border-[#282932] rounded-lg text-xs text-white focus:outline-none focus:border-zinc-400 font-mono shadow-inner"
            placeholder="Minutes"
            min="10"
            max="720"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-950 rounded-lg text-xs font-bold shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
          </motion.button>
          <button
            type="button"
            onClick={() => setIsEditingGoal(false)}
            className="px-2.5 py-1.5 bg-[#1a1b20] text-zinc-400 hover:text-white rounded-lg text-xs"
          >
            Cancel
          </button>
        </form>
      )}
    </motion.div>
  );
}
