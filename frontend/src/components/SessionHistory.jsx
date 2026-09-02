import React from 'react';
import { History, BookOpen, Star, Clock, CheckCircle, Sparkles } from 'lucide-react';

export default function SessionHistory({ sessions = [] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-6 shadow-xl border border-slate-800/90 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-white mb-1">No Focus Blocks Yet Today</h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Start your first 25-minute Pomodoro block to begin logging focus sessions and build your streak.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 shadow-xl border border-slate-800/90 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">Focus Log</h3>
            <p className="text-[11px] text-slate-400">Completed Sessions ({sessions.length})</p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          Today
        </span>
      </div>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {sessions.map((sess, idx) => {
          const timeStr = sess.created_at ? sess.created_at.substring(11, 16) : '';
          return (
            <div
              key={sess.id || idx}
              className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/90 rounded-2xl flex items-center justify-between transition-all duration-200 hover:shadow-md hover:bg-slate-950/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-200 flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                  {sessions.length - idx}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    {sess.topic || 'General Study'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mt-0.5">
                    <span className="text-slate-300 font-semibold">{sess.duration_minutes}m</span>
                    {timeStr && <span>• {timeStr}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                {[...Array(sess.focus_rating || 4)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

