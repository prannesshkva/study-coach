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
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl max-w-lg w-full p-7 shadow-2xl relative my-8 ring-1 ring-white/10 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Circadian Schedule & Intake Profile</h2>
            <p className="text-xs text-slate-400 font-medium">Multi-tenant data isolation & chronobiological calibration</p>
          </div>
        </div>

        {/* Quick User Switcher for Multi-User Testing */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Switch Student Account (Multi-Tenant Segregation)
          </label>
          <div className="flex flex-wrap gap-2">
            {['prannesh', 'alex_researcher', 'sarah_med', 'student_demo'].map((uid) => (
              <button
                key={uid}
                type="button"
                onClick={() => handleQuickSwitch(uid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentUserId === uid
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-400/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {uid}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">User ID</label>
              <input
                type="text"
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                placeholder="e.g. prannesh"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
                placeholder="e.g. Prannesh"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Wake Up Time
              </label>
              <input
                type="text"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
                placeholder="07:00 AM"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Sleep Time
              </label>
              <input
                type="text"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
                placeholder="11:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Peak Energy Chronotype
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'morning', label: 'Morning 🌅' },
                { id: 'afternoon', label: 'Midday ☀️' },
                { id: 'evening', label: 'Evening 🌆' },
                { id: 'night', label: 'Night Owl 🦉' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeakEnergy(opt.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                    peakEnergy === opt.id
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fixed Classes & Commitments
            </label>
            <input
              type="text"
              value={commitments}
              onChange={(e) => setCommitments(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
              placeholder="e.g. Lectures 9am-1pm, Lab Tue/Thu"
            />
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="col-span-2">
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" /> Primary Exam or Mastery Goal
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
                placeholder="e.g. Distributed Systems & AI Mastery"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Block Size
              </label>
              <select
                value={preferredPomo}
                onChange={(e) => setPreferredPomo(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value={20}>20 min</option>
                <option value={25}>25 min (Standard)</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min (Extended)</option>
                <option value={50}>50 min (Ultradian)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              Save & Synchronize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
