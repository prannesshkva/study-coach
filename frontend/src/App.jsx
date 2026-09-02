import React, { useState, useEffect } from 'react';
import { Sparkles, Database, ShieldCheck, RefreshCw, Trash2, Settings, Link, X, Check, User, Calendar, Brain, LogIn, LogOut, Shield } from 'lucide-react';
import PomodoroTimer from './components/PomodoroTimer';
import GoalTracker from './components/GoalTracker';
import AgentChat from './components/AgentChat';
import SessionHistory from './components/SessionHistory';
import UserProfileModal from './components/UserProfileModal';
import AuthModal from './components/AuthModal';
import { onAuthChange, logout, isFirebaseConfigured } from './firebase';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
        const effectiveId = user.uid || user.email;
        setUserId(effectiveId);
        localStorage.setItem('STUDY_COACH_USER_ID', effectiveId);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

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
        content: `👋 Welcome back! I am your **Study Router Orchestrator** 🍅 (Student: \`${currentUser?.displayName || currentUser?.email || userId}\`).\n\nI utilize **Cognitive Psychology & Circadian Scheduling** to structure your focus intervals, track milestones, and calibrate optimal rest. How can we make progress today?`
      }
    ]);
  }, [userId, currentUser]);

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
        setUserId(profileData.user_id);
        setShowProfileModal(false);
        loadDashboardData(profileData.user_id);
      }
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  };

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const apiBase = getApiBase();
      const sessionId = `${userId}-main`;
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          user_id: userId,
          session_id: sessionId
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        content: data.reply,
        active_agent: data.active_agent || 'Study Router Orchestrator',
        psychological_framework: data.psychological_framework,
        traces: data.traces || [],
        handoffs: data.handoffs || []
      };

      setChatMessages((prev) => [...prev, botMsg]);
      await loadDashboardData(userId);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          active_agent: 'Study Router Orchestrator',
          content: `⚠️ Failed to reach coach server. Please check backend connection in Settings.`
        }
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSessionCompleted = async (durationMinutes, focusRating, topic) => {
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/session/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_minutes: durationMinutes,
          focus_rating: focusRating,
          topic: topic,
          user_id: userId
        })
      });
      
      await loadDashboardData(userId);
      await handleSendMessage(
        `I just finished a ${durationMinutes}-minute focus block on "${topic}" with ${focusRating}/5 flow rating. Record this session and recommend what I should do next.`
      );
    } catch (e) {
      console.error('Error completing session:', e);
    }
  };

  const handleBreakCompleted = async (breakType, durationMinutes) => {
    await handleSendMessage(
      `I finished my ${durationMinutes}-minute ${breakType.replace('_', ' ')}. Evaluate my energy and let's plan the next cognitive sprint.`
    );
  };

  const handleSetGoal = async (minutes) => {
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/goal?goal_minutes=${minutes}&user_id=${encodeURIComponent(userId)}`, {
        method: 'POST'
      });
      await loadDashboardData(userId);
      await handleSendMessage(`I calibrated my daily focus goal to ${minutes} minutes.`);
    } catch (e) {
      console.error('Error setting goal:', e);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm(`Reset all focus history and daily metrics for user "${userId}"?`)) return;
    try {
      const apiBase = getApiBase();
      await fetch(`${apiBase}/reset?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
      await loadDashboardData(userId);
      setChatMessages([
        {
          role: 'assistant',
          active_agent: 'Study Router Orchestrator',
          content: `🧹 Study data for **${userId}** has been reset. Ready for a fresh start!`
        }
      ]);
    } catch (e) {
      console.error('Error resetting data:', e);
    }
  };

  const handleSaveCustomBackend = (e) => {
    e.preventDefault();
    const cleanUrl = customBackendUrl.trim();
    if (cleanUrl) {
      localStorage.setItem('STUDY_COACH_API_URL', cleanUrl);
    } else {
      localStorage.removeItem('STUDY_COACH_API_URL');
    }
    setShowConfigModal(false);
    loadDashboardData(userId);
  };

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#ededef] flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          if (user) {
            setCurrentUser(user);
            const effectiveId = user.uid || user.email;
            setUserId(effectiveId);
            loadUserProfile(effectiveId);
            loadDashboardData(effectiveId);
          } else {
            setCurrentUser(null);
            setUserId('prannesh');
            loadUserProfile('prannesh');
            loadDashboardData('prannesh');
          }
        }}
      />

      {/* User Profile / Circadian Intake Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        onSwitchUser={handleSwitchUser}
        currentUserId={userId}
      />

      {/* Backend Server Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141518] border border-[#27282e] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#1e1f24]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <Settings className="w-5 h-5 text-zinc-300" />
              <h3 className="font-bold text-sm text-white">Backend Connection Settings</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Configure the active FastAPI backend endpoint. Default is Render cloud backend.
            </p>
            <form onSubmit={handleSaveCustomBackend} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Backend Server URL</label>
                <input
                  type="url"
                  value={customBackendUrl}
                  onChange={(e) => setCustomBackendUrl(e.target.value)}
                  placeholder="https://study-coach-pttm.onrender.com"
                  className="w-full px-3.5 py-2 bg-[#0e0f12] border border-[#27282e] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-2 bg-[#1a1b20] text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Executive Distraction-Free Header */}
      <header className="border-b border-[#22232a] bg-[#121317] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1c1d24] border border-[#2b2c36] flex items-center justify-center text-zinc-200">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                Study Coach
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#1e2028] text-zinc-300 border border-[#2d2e38]">
                  Psychological AI
                </span>
              </h1>
              <span className="text-[11px] text-zinc-400 font-medium block">
                Executive Focus & Fatigue Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Firebase Auth Status / Login Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#181920] hover:bg-[#20212a] border border-[#282934] text-zinc-200 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Firebase Authentication & Device Sync"
            >
              {currentUser ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                  </div>
                  <span className="font-medium max-w-[120px] truncate">{currentUser.displayName || currentUser.email}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Sign In / Sync</span>
                </>
              )}
            </button>

            {/* Schedule Intake Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#181920] hover:bg-[#20212a] border border-[#282934] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
              title="Personalize Daily Routine & Circadian Schedule"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Routine</span>
            </button>

            {/* Cloud Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#14151a] border border-[#24252e] rounded-xl text-xs text-zinc-300 font-mono text-[11px]">
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'Offline' ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
              <span>{dbStatus}</span>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              title="Backend Connection Settings"
              className="p-2 bg-[#181920] hover:bg-[#20212a] text-zinc-400 hover:text-white rounded-xl border border-[#282934] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => loadDashboardData(userId)}
              title="Refresh Workspace"
              className="p-2 bg-[#181920] hover:bg-[#20212a] text-zinc-400 hover:text-white rounded-xl border border-[#282934] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetData}
              title="Reset Study Data for User"
              className="p-2 bg-[#181920] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 rounded-xl border border-[#282934] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <GoalTracker
                summary={summary}
                onSetGoal={handleSetGoal}
              />
              <SessionHistory
                sessions={sessions}
                currentUserId={userId}
                apiBase={getApiBase()}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <AgentChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat}
              currentUserId={currentUser?.displayName || currentUser?.email || userId}
              onOpenProfile={() => setShowProfileModal(true)}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[#22232a] py-6 text-center text-xs text-zinc-500 bg-[#101114] mt-6">
        <p className="font-semibold text-zinc-400">Study Coach — Executive Psychological AI Companion</p>
        <p className="mt-1 text-[11px] text-zinc-500">Ultradian Focus • Circadian Routine Intake • Spaced Retrieval • Firebase Multi-Device Persistence</p>
      </footer>
    </div>
  );
}
