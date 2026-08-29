import React from 'react';
import { History, BookOpen, Star, Clock } from 'lucide-react';

export default function SessionHistory({ sessions = [] }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-md text-center">
        <div className="flex items-center gap-2 mb-2 text-slate-300 font-semibold text-xs">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Completed Sessions</span>
        </div>
        <p className="text-[11px] text-slate-500 py-6">No study sessions recorded yet today. Complete your first block to start your streak.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111622]/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Completed Sessions ({sessions.length})</span>
        </div>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {sessions.map((sess, idx) => {
          const timeStr = sess.created_at ? sess.created_at.substring(11, 16) : '';
          return (
            <div
              key={sess.id || idx}
              className="p-2.5 bg-[#0c1017] border border-slate-800/70 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 flex items-center justify-center font-mono text-[10px] font-medium">
                  {sessions.length - idx}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-200 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    {sess.topic || 'General Study'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span>{sess.duration_minutes}m</span>
                    {timeStr && <span>• {timeStr}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(sess.focus_rating || 4)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-slate-400 fill-current" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
