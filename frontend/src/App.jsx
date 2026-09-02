import React, { useState, useEffect } from 'react';
import { Sparkles, Database, ShieldCheck, RefreshCw, Trash2, Settings, Link, X, Check, User, Calendar, Brain } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import GoalTracker from './components/GoalTracker';
import AgentChat from './components/AgentChat';
import SessionHistory from './components/SessionHistory';
import UserProfileModal from './components/UserProfileModal';

const PROD_BACKEND_URL = 'https://study-coach-pttm.onrender.com';

const getApiBase = () => {
  const customUrl = localStorage.getItem('STUDY_COACH_API_URL');
  if (customUrl) return customUrl.replace(/\/$/, '') + '/api';
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') + '/api';
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return PROD_BACKEND_URL + '/api';
  }
  return '/api';
};

export default function App() {
  const [userId, setUserId] = useState(localStorage.getItem('STUDY_COACH_USER_ID') || 'prannesh');
  const [userProfile, setUserProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [activePresetMinutes, setActivePresetMinutes] = useState(null);
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [customBackendUrl, setCustomBackendUrl] = useState(localStorage.getItem('STUDY_COACH_API_URL') || '');

  const loadUserProfile = async (uid = userId) => {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/schedule/profile?user_id=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  };

  const loadDashboardData = async (uid = userId) => {
    try {
      const apiBase = getApiBase();
      const sumRes = await fetch(`${apiBase}/summary?user_id=${encodeURIComponent(uid)}`);
      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data);
        setSessions(data.recent_sessions || []);
        if (data.user_profile) {
          setUserProfile(data.user_profile);
        }
      }

      const healthRes = await fetch(`${apiBase}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbStatus(healthData.database || 'Active');
      } else {
        setDbStatus('Offline');
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      setDbStatus('Offline');
      if (window.location.hostname.includes('github.io') && !localStorage.getItem('STUDY_COACH_API_URL')) {
        setShowConfigModal(true);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('STUDY_COACH_USER_ID', userId);
    loadUserProfile(userId);
    loadDashboardData(userId);
    
    // Set initial greeting
    setChatMessages([
      {
        role: 'assistant',
        active_agent: 'Study Router Orchestrator',
        content: `👋 Welcome back! I am your **Study Router Orchestrator** 🍅 (Student: \`${userId}\`).\n\nI utilize **Cognitive Psychology & Circadian Scheduling** to structure your focus intervals, track milestones, and calibrate optimal rest. How can we make progress today?`
      }
    ]);
  }, [userId]);

  const handleSwitchUser = (newUid) => {
    const cleanId = newUid.trim().toLowerCase();
    if (cleanId) {
      setUserId(cleanId);
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/schedule/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
        setSummary(data.summary);
        if (profileData.user_id !== userId) {
          setUserId(profileData.user_id);
        }
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            active_agent: 'Cognitive Architect',
            psychological_framework: 'Circadian Chronobiology & Habit Architecture',
            content: `👤 **Circadian Profile Synchronized**: Updated profile for **${data.profile.name}** (User: \`${data.profile.user_id}\`). Focus sessions and psychological roadmaps are now aligned with your **${data.profile.peak_energy_window}** peak energy window.`
          }
        ]);
      }
    } catch (e) {
      console.error('Error saving schedule profile:', e);
    }
  };

  const handleSaveBackendUrl = (e) => {
    e.preventDefault();
    if (customBackendUrl.trim()) {
      localStorage.setItem('STUDY_COACH_API_URL', customBackendUrl.trim());
    } else {
      localStorage.removeItem('STUDY_COACH_API_URL');
    }
    setShowConfigModal(false);
    loadDashboardData(userId);
  };

  const handleResetData = async () => {
    if (!window.confirm(`Reset all focus sessions and metrics for user '${userId}'?`)) return;
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/reset?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setSessions([]);
        setChatMessages([
          {
            role: 'assistant',
            active_agent: 'Study Router Orchestrator',
            content: `🧹 **Workspace Reset**: All study sessions and daily progress counters for user \`${userId}\` have been cleared. Ready for a clean focus start.`
          }
        ]);
      }
    } catch (e) {
      console.error('Error resetting data:', e);
    }
  };

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: `${userId}-main`,
          user_id: userId
        })
      });

      if (!res.ok) throw new Error('Agent API error');

      const data = await res.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        active_agent: data.active_agent,
        handoffs: data.handoffs || [],
        traces: data.traces || [],
        psychological_framework: data.psychological_framework
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      if (data.daily_summary) {
        setSummary(data.daily_summary);
        setSessions(data.daily_summary.recent_sessions || []);
      } else {
        loadDashboardData(userId);
      }

      if (data.user_profile) {
        setUserProfile(data.user_profile);
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
          active_agent: 'Study Router Orchestrator',
          content: `⚠️ Failed to connect to the backend service. Ensure your server is online, or configure your backend URL in Settings.`
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSessionCompleted = async (durationMins, focusRating, topic) => {
    const prompt = `I just completed a ${durationMins}-minute study session on "${topic}" with a focus rating of ${focusRating}/5. Please log it and suggest my recovery protocol.`;
    await handleSendMessage(prompt);
  };

  const handleBreakCompleted = async (breakType, durationMins) => {
    const breakName = breakType === 'short_break' ? '5-minute short break' : '20-minute restorative long break';
    const prompt = `I just finished my ${breakName}! My focus is restored. What study block should I start next?`;
    await handleSendMessage(prompt);
  };

  const handleSetGoal = async (targetMins) => {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_minutes: targetMins, user_id: userId })
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            active_agent: 'Performance Analyst',
            psychological_framework: 'Implementation Goal Calibration',
            content: `🎯 Daily focus target calibrated to **${targetMins} minutes** (${roundHours(targetMins)}h) for user \`${userId}\`. Let's build momentum!`
          }
        ]);
      }
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  };

  const roundHours = (mins) => Math.round((mins / 60) * 10) / 10;

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-700 selection:text-white">
      {/* Schedule Intake & User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={userId}
        profile={userProfile}
        onSaveProfile={handleSaveProfile}
        onSwitchUser={handleSwitchUser}
      />

      {/* Backend Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151c2c] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center mb-3">
              <Link className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Backend Connection</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your live Render backend URL (e.g. <code className="text-slate-300">https://study-coach-pttm.onrender.com</code>). Leave empty for local development.
            </p>
            <form onSubmit={handleSaveBackendUrl} className="space-y-3">
              <input
                type="url"
                value={customBackendUrl}
                onChange={(e) => setCustomBackendUrl(e.target.value)}
                placeholder="https://your-backend.onrender.com"
                className="w-full px-3.5 py-2 bg-[#0c1017] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-sm sm:text-base text-slate-100 tracking-tight flex items-center gap-2">
                Study Coach
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                  OpenAI Swarm
                </span>
              </h1>
              <span className="text-[11px] text-slate-400 font-medium block">
                Psychological Planning & Neuro-Recovery
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Profile Switcher Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-200 rounded-xl text-xs font-medium transition-all shadow-sm"
              title="Personalize Daily Routine & Circadian Schedule"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">{userProfile?.name || userId}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 capitalize hidden md:inline">
                {userProfile?.peak_energy_window || 'circadian'}
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'Offline' ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span>{dbStatus}</span>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              title="Backend Server Connection Settings"
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => loadDashboardData(userId)}
              title="Refresh Workspace"
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetData}
              title="Reset Study Data for User"
              className="p-1.5 bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
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
              currentUserId={userId}
              onOpenProfile={() => setShowProfileModal(true)}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">Study Coach — Multi-Agent Psychological Orchestrator</p>
        <p className="mt-1 text-[11px] text-slate-500">Ultradian Rhythms • Yerkes-Dodson Arousal Calibration • Spaced Retrieval • Neuro-Rest</p>
      </footer>
    </div>
  );
}

