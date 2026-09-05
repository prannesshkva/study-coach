import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#141518] border border-[#27282e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 text-slate-100 focus-ambient-glow"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e1f24] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1e1f24] border border-[#2e3038] text-zinc-300 flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Circadian Routine & Student Intake</h2>
            <p className="text-xs text-zinc-400">Psychological planning & chronobiology calibration</p>
          </div>
        </div>

        {/* Quick User Switcher for Multi-User Testing */}
        <div className="mb-5 p-3 rounded-xl bg-[#0e0f12] border border-[#222328] shadow-inner">
          <label className="text-[11px] font-semibold text-zinc-400 block mb-2">
            Switch Profile ID (Multi-Tenant Isolation)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['prannesh', 'alex_researcher', 'sarah_med', 'student_demo'].map((uid) => (
              <motion.button
                key={uid}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickSwitch(uid)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentUserId === uid
                    ? 'bg-[#22232a] text-white shadow-sm border border-[#343644]'
                    : 'bg-[#141518] text-zinc-400 hover:text-white border border-[#222328]'
                }`}
              >
                {uid}
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 font-semibold block mb-1">User Identifier</label>
              <input
                type="text"
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono transition-colors shadow-inner"
                placeholder="e.g. prannesh"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 font-semibold block mb-1">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-colors shadow-inner"
                placeholder="e.g. Prannesh"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Wake Up Time
              </label>
              <input
                type="text"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-colors shadow-inner"
                placeholder="07:00 AM"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1">
                <Moon className="w-3.5 h-3.5 text-blue-400" /> Sleep Time
              </label>
              <input
                type="text"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-colors shadow-inner"
                placeholder="11:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Peak Energy Chronotype
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'morning', label: 'Morning 🌅' },
                { id: 'afternoon', label: 'Midday ☀️' },
                { id: 'evening', label: 'Evening 🌆' },
                { id: 'night', label: 'Night Owl 🦉' }
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPeakEnergy(opt.id)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border text-center transition-all ${
                    peakEnergy === opt.id
                      ? 'bg-[#22232a] border-[#3e4152] text-white shadow-sm'
                      : 'bg-[#0e0f12] border-[#222328] text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Fixed Classes & Commitments
            </label>
            <input
              type="text"
              value={commitments}
              onChange={(e) => setCommitments(e.target.value)}
              className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-colors shadow-inner"
              placeholder="e.g. Lectures 9am-1pm, Lab Tue/Thu"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-zinc-400" /> Primary Exam or Mastery Goal
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-medium transition-colors shadow-inner"
                placeholder="e.g. Distributed Systems & AI Mastery"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Block Size
              </label>
              <select
                value={preferredPomo}
                onChange={(e) => setPreferredPomo(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-[#0e0f12] border border-[#282930] rounded-xl text-xs text-white focus:outline-none focus:border-zinc-400 font-medium shadow-inner"
              >
                <option value={20}>20 min</option>
                <option value={25}>25 min (Standard)</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min (Extended)</option>
                <option value={50}>50 min (Ultradian)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3.5 border-t border-[#222328]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1a1b20] hover:bg-[#22242c] text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="px-5 py-2 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Routine
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
