import React, { useState, useEffect } from 'react';
import { Sparkles, Database, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import GoalTracker from './components/GoalTracker';
import AgentChat from './components/AgentChat';
import SessionHistory from './components/SessionHistory';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

export default function App() {
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Welcome to your **Study Coach** workspace.\n\nI run structured focus sessions, track your daily target, and actively analyze session pacing to recommend optimal rest intervals. How shall we begin today?"
    }
  ]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [activePresetMinutes, setActivePresetMinutes] = useState(null);
  const [dbStatus, setDbStatus] = useState('Active');

  const loadDashboardData = async () => {
    try {
      const sumRes = await fetch(`${API_BASE}/summary`);
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data);
        setSessions(data.recent_sessions || []);
      }

      const healthRes = await fetch(`${API_BASE}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbStatus(healthData.database || 'Active');
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      setDbStatus('Local Sync');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Reset all focus sessions and metrics to start with a fresh slate?")) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setSessions([]);
        setChatMessages([
          {
            role: 'assistant',
            content: "🧹 **Workspace Reset**: All study sessions and daily progress counters have been cleared. Ready for your first focus block."
          }
        ]);
      }
    } catch (e) {
      console.error('Error resetting data:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: 'student-main' })
      });

      if (!res.ok) throw new Error('Agent API error');

      const data = await res.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        traces: data.traces || []
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      if (data.daily_summary) {
        setSummary(data.daily_summary);
        setSessions(data.daily_summary.recent_sessions || []);
      } else {
        loadDashboardData();
      }

      if (data.active_timer_minutes) {
        setActivePresetMinutes(data.active_timer_minutes);
      }
    } catch (e) {
      console.error('Agent chat failed:', e);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to connect to the backend service. Ensure the server is online and reachable.`
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSessionCompleted = async (durationMins, focusRating, topic) => {
    const prompt = `I just finished a ${durationMins}-minute study session on "${topic}" with a focus rating of ${focusRating}/5. Please log it and tell me what I should do next.`;
    await handleSendMessage(prompt);
  };

  const handleBreakCompleted = async (breakType, durationMins) => {
    const breakName = breakType === 'short_break' ? '5-minute short break' : '20-minute restorative long break';
    const prompt = `I just finished my ${breakName}! I feel refreshed and ready. What study session should I start next?`;
    await handleSendMessage(prompt);
  };

  const handleSetGoal = async (targetMins) => {
    try {
      const res = await fetch(`${API_BASE}/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_minutes: targetMins })
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `🎯 Daily focus target updated to **${targetMins} minutes** (${roundHours(targetMins)}h). Let's stay locked in.`
          }
        ]);
      }
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  };

  const roundHours = (mins) => Math.round((mins / 60) * 10) / 10;

  return (
    <div className="min-h-screen flex flex-col selection:bg-slate-700 selection:text-white">
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 shadow-sm">
              <span className="font-mono text-sm font-semibold tracking-tighter">⚡</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm sm:text-base text-slate-100 tracking-tight flex items-center gap-2">
                Study Coach
              </h1>
              <span className="text-[11px] text-slate-400 font-medium block">
                Your Coach, for you
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{dbStatus}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autonomous Agent</span>
            </div>

            <button
              onClick={loadDashboardData}
              title="Refresh Workspace"
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetData}
              title="Reset Study Data"
              className="p-1.5 bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <PomodoroTimer
              onSessionCompleted={handleSessionCompleted}
              onBreakCompleted={handleBreakCompleted}
              onStartSession={(mins, topic) => {
                handleSendMessage(`Let's start a ${mins}-minute focus block on "${topic}".`);
              }}
              activePresetMinutes={activePresetMinutes}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GoalTracker
                summary={summary}
                onSetGoal={handleSetGoal}
              />
              <SessionHistory sessions={sessions} />
            </div>
          </div>

          <div className="lg:col-span-5">
            <AgentChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">Study Coach — Your Coach, for you</p>
        <p className="mt-1 text-[11px] text-slate-600">Precision focus sessions and adaptive rest</p>
      </footer>
    </div>
  );
}
