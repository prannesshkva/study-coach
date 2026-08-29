import React, { useState, useEffect } from 'react';
import { Bot, Flame, Database, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
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
      content: "👋 Welcome! I am your **Pomodoro Study Coach**.\n\nI can start focused study sessions, log completed blocks, track your daily target, and actively decide when you need rest breaks to prevent burnout. How should we begin today?"
    }
  ]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [activePresetMinutes, setActivePresetMinutes] = useState(null);
  const [dbStatus, setDbStatus] = useState('Sync Active');

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
        setDbStatus(healthData.database || 'Sync Active');
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      setDbStatus('Sync Active');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to reset all focus sessions and start with a clean slate?")) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setSessions([]);
        setChatMessages([
          {
            role: 'assistant',
            content: "🧹 **Study History Reset**: All focus sessions and metrics have been cleared to 0. Ready for a clean study start!"
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
          content: `⚠️ Failed to connect to the agent backend. Please verify that the backend server is running.`
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
            content: `🎯 Daily study goal updated to **${targetMins} minutes** (${roundHours(targetMins)}h). Let's stay focused and achieve it!`
          }
        ]);
      }
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  };

  const roundHours = (mins) => Math.round((mins / 60) * 10) / 10;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-rose-500/20">
              🍅
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Study Coach
              </h1>
              <span className="text-[11px] font-semibold text-rose-400 tracking-wide block">
                Your Coach, for you
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dbStatus}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autonomous Agent</span>
            </div>

            <button
              onClick={loadDashboardData}
              title="Refresh Analytics"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetData}
              title="Reset Today's Study Data & Counters"
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
        <p className="font-medium text-slate-300">Study Coach — Your Coach, for you</p>
        <p className="mt-1 text-[11px] text-slate-500">Empowering focused study habits and mindful rest</p>
      </footer>
    </div>
  );
}
