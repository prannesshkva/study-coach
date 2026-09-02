import React, { useState, useEffect } from 'react';
import { History, BookOpen, Star, Calendar, RefreshCw } from 'lucide-react';

export default function SessionHistory({ sessions = [], currentUserId = 'prannesh', apiBase = '/api' }) {
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'all'
  const [allSessions, setAllSessions] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const fetchAllHistory = async () => {
    setIsLoadingAll(true);
    try {
      const res = await fetch(`${apiBase}/sessions?user_id=${encodeURIComponent(currentUserId)}&all_history=true`);
      if (res.ok) {
        const data = await res.json();
        setAllSessions(data.sessions || []);
      }
    } catch (e) {
      console.error('Failed to fetch historical sessions', e);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllHistory();
    }
  }, [viewMode, currentUserId]);

  const activeList = viewMode === 'today' ? sessions : (allSessions.length > 0 ? allSessions : sessions);

  const formatDateLabel = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Today ' + isoStr.substring(11, 16);
      }
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + isoStr.substring(11, 16);
    } catch (e) {
      return isoStr.substring(0, 10);
    }
  };

  return (
    <div className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm flex flex-col">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Focus History</h3>
            <p className="text-[11px] text-zinc-400">
              {viewMode === 'today' ? `Today's Log (${sessions.length})` : `All Past Sessions (${activeList.length})`}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0e0f12] rounded-lg border border-[#222329]">
          <button
            onClick={() => setViewMode('today')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              viewMode === 'today'
                ? 'bg-[#22232a] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
              viewMode === 'all'
                ? 'bg-[#22232a] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {(!activeList || activeList.length === 0) ? (
        <div className="text-center flex flex-col items-center justify-center min-h-[160px] p-4">
          <div className="w-8 h-8 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-400 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-white mb-0.5">
            {viewMode === 'today' ? 'No Sessions Logged Today' : 'No Past Sessions Found'}
          </h4>
          <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
            {viewMode === 'today'
              ? 'Complete a Pomodoro block to log your first session of the day.'
              : 'All your completed focus sprints across devices will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {activeList.map((sess, idx) => {
            const dateLabel = formatDateLabel(sess.created_at);
            return (
              <div
                key={sess.id || idx}
                className="p-2.5 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center justify-between hover:border-[#2f303a] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#181920] border border-[#262730] text-zinc-300 flex items-center justify-center font-mono text-[10px] font-bold">
                    {activeList.length - idx}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-zinc-400" />
                      {sess.topic || 'General Study'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                      <span className="text-zinc-200 font-bold">{sess.duration_minutes}m</span>
                      {dateLabel && <span>• {dateLabel}</span>}
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
      )}
    </div>
  );
}
