import React, { useState, useEffect } from 'react';
import { User, Clock, Moon, Sun, Sparkles, Check, X, Calendar, Target } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, userId, profile, onSaveProfile, onSwitchUser }) {
  const [currentUserId, setCurrentUserId] = useState(userId || 'prannesh');
  const [name, setName] = useState(profile?.name || 'Prannesh');
  const [wakeTime, setWakeTime] = useState(profile?.wake_time || '07:00');
  const [sleepTime, setSleepTime] = useState(profile?.sleep_time || '23:00');
  const [peakEnergy, setPeakEnergy] = useState(profile?.peak_energy_window || 'evening');
  const [commitments, setCommitments] = useState(profile?.fixed_commitments || 'Classes 9 AM - 1 PM');
  const [targetGoal, setTargetGoal] = useState(profile?.target_exam_or_goal || 'Semester Finals & Deep AI Mastery');
  const [preferredPomo, setPreferredPomo] = useState(profile?.preferred_pomodoro_length || 25);

  useEffect(() => {
    if (profile) {
      setName(profile.name || 'Prannesh');
      setWakeTime(profile.wake_time || '07:00');
      setSleepTime(profile.sleep_time || '23:00');
      setPeakEnergy(profile.peak_energy_window || 'evening');
      setCommitments(profile.fixed_commitments || '');
      setTargetGoal(profile.target_exam_or_goal || '');
      setPreferredPomo(profile.preferred_pomodoro_length || 25);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({
      user_id: currentUserId.trim().toLowerCase() || 'default-student',
      name: name.trim() || 'Student',
      wake_time: wakeTime,
      sleep_time: sleepTime,
      peak_energy_window: peakEnergy,
      fixed_commitments: commitments.trim(),
      target_exam_or_goal: targetGoal.trim(),
      preferred_pomodoro_length: Number(preferredPomo) || 25
    });
    onClose();
  };

  const handleQuickSwitch = (newUid) => {
    setCurrentUserId(newUid);
    onSwitchUser(newUid);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Student Schedule & Circadian Profile</h2>
            <p className="text-xs text-slate-400">Personalized data isolation & psychological intake</p>
          </div>
        </div>

        {/* Quick User Switcher for Multi-User Testing */}
        <div className="mb-5 p-3 rounded-xl bg-[#0c1017] border border-slate-800">
          <label className="text-[11px] font-medium text-slate-400 block mb-2">Switch Student Profile (Multi-User Isolation)</label>
          <div className="flex flex-wrap gap-2">
            {['prannesh', 'alex_researcher', 'sarah_med', 'student_demo'].map((uid) => (
              <button
                key={uid}
                type="button"
                onClick={() => handleQuickSwitch(uid)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentUserId === uid
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {uid}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">User Identifier</label>
              <input
                type="text"
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="e.g. prannesh"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Prannesh"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Wake Up Time
              </label>
              <input
                type="text"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="07:00 AM"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep Time
              </label>
              <input
                type="text"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="11:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Peak Energy Chronotype
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'morning', label: 'Morning 🌅' },
                { id: 'afternoon', label: 'Afternoon ☀️' },
                { id: 'evening', label: 'Evening 🌆' },
                { id: 'night', label: 'Night Owl 🦉' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeakEnergy(opt.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    peakEnergy === opt.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#0c1017] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fixed Classes & Work Commitments
            </label>
            <input
              type="text"
              value={commitments}
              onChange={(e) => setCommitments(e.target.value)}
              className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Lectures 9am-1pm, Lab Tue/Thu"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Primary Exam or Mastery Goal
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full px-3 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Distributed Systems & AI Exam"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Block Size
              </label>
              <select
                value={preferredPomo}
                onChange={(e) => setPreferredPomo(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-[#0c1017] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={20}>20 min</option>
                <option value={25}>25 min (Standard)</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min (Extended)</option>
                <option value={50}>50 min (Ultradian)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Synchronize Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
