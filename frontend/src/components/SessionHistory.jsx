import React from 'react';
import { History, BookOpen, Star } from 'lucide-react';

export default function SessionHistory({ sessions = [] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-400 flex items-center justify-center mb-2.5">
          <History className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-xs text-white mb-1">No Focus Sessions Today</h4>
        <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
          Complete your first Pomodoro block to log your session and maintain your streak.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Focus Log</h3>
            <p className="text-[11px] text-zinc-400">Completed Sessions ({sessions.length})</p>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1a1b20] border border-[#282932] text-zinc-300">
          Today
        </span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {sessions.map((sess, idx) => {
          const timeStr = sess.created_at ? sess.created_at.substring(11, 16) : '';
          return (
            <div
              key={sess.id || idx}
              className="p-2.5 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center justify-between hover:border-[#2f303a] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#181920] border border-[#262730] text-zinc-300 flex items-center justify-center font-mono text-[10px] font-bold">
                  {sessions.length - idx}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-zinc-400" />
                    {sess.topic || 'General Study'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                    <span className="text-zinc-300 font-medium">{sess.duration_minutes}m</span>
                    {timeStr && <span>• {timeStr}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
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


