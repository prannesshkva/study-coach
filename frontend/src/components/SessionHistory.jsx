import React from 'react';
import { History, BookOpen, Star, Clock } from 'lucide-react';

export default function SessionHistory({ sessions = [] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl text-center">
        <div className="flex items-center gap-2 mb-3 text-slate-300 font-bold text-sm">
          <History className="w-4 h-4 text-rose-400" />
          <span>Today's Completed Sessions</span>
        </div>
        <p className="text-xs text-slate-500 py-4">No focus sessions logged yet today. Complete your first block to start your streak!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <History className="w-4 h-4 text-rose-400" />
          <span>Today's Completed Sessions ({sessions.length})</span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {sessions.map((sess, idx) => {
          const timeStr = sess.created_at ? sess.created_at.substring(11, 16) : '';
          return (
            <div
              key={sess.id || idx}
              className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono text-xs font-bold">
                  #{sessions.length - idx}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    {sess.topic || 'General Study'}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {sess.duration_minutes} mins
                    </span>
                    {timeStr && <span>• {timeStr}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(sess.focus_rating || 4)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
