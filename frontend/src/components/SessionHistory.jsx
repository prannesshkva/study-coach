import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="bg-[#15161a] border border-[#24252c] rounded-2xl p-5 shadow-sm flex flex-col focus-ambient-glow"
    >
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-300 shadow-sm">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Focus History</h3>
            <p className="text-[11px] text-zinc-400">
              {viewMode === 'today' ? `Today's Log (${sessions.length})` : `All Past Sessions (${activeList.length})`}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Pill with Framer Motion slide */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0e0f12] rounded-lg border border-[#222329] relative">
          <button
            onClick={() => setViewMode('today')}
            className={`relative px-2.5 py-0.5 rounded text-[10px] font-semibold transition-colors z-10 ${
              viewMode === 'today' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {viewMode === 'today' && (
              <motion.div
                layoutId="sessionModeTab"
                className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded shadow-sm -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              />
            )}
            Today
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`relative px-2.5 py-0.5 rounded text-[10px] font-semibold transition-colors z-10 ${
              viewMode === 'all' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {viewMode === 'all' && (
              <motion.div
                layoutId="sessionModeTab"
                className="absolute inset-0 bg-[#22232a] border border-[#32343f] rounded shadow-sm -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              />
            )}
            All Time
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {(!activeList || activeList.length === 0) ? (
        <div className="text-center flex flex-col items-center justify-center min-h-[160px] p-4">
          <div className="w-8 h-8 rounded-xl bg-[#1e1f25] border border-[#292a33] text-zinc-400 flex items-center justify-center mb-2 shadow-sm">
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
          <AnimatePresence>
            {activeList.map((sess, idx) => {
              const dateLabel = formatDateLabel(sess.created_at);
              return (
                <motion.div
                  key={sess.id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  whileHover={{ scale: 1.01, borderColor: '#343644' }}
                  className="p-2.5 bg-[#0e0f12] border border-[#202127] rounded-xl flex items-center justify-between transition-colors shadow-sm"
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
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-current drop-shadow-xs" />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
