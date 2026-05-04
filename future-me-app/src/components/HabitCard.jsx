import { useState } from 'react';
import { motion } from 'framer-motion';
import { completeHabit, isCompletedToday, getUserHabits, deleteHabit } from '../utils/habitHelpers';
import { calculateAchievementData, checkAndAwardAchievements } from '../utils/achievementEngine';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const ZONE_CONFIG = {
  health:          { name: 'Health',             chipColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  socialEmotional: { name: 'Social & Emotional', chipColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  wealth:          { name: 'Wealth',             chipColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  faith:           { name: 'Faith',              chipColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  family:          { name: 'Family',             chipColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  community:       { name: 'Community',          chipColor: 'bg-orange-50 text-orange-700 border-orange-200' },
  none:            { name: 'Personal',           chipColor: 'bg-gray-50 text-gray-500 border-gray-200' },
};

function rhythmLabel(streak) {
  if (!streak || streak < 1) return null;
  if (streak >= 14) return `${streak}-day rhythm`;
  if (streak >= 7)  return `${streak}-day rhythm`;
  if (streak >= 3)  return `${streak}-day practice`;
  return `${streak}-day start`;
}

export default function HabitCard({ habit, userId, onCompletion, onAchievementsEarned, onDelete }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [localCompleted, setLocalCompleted] = useState(isCompletedToday(habit.lastCompletedDate));
  const [localStreak,    setLocalStreak]    = useState(habit.streak);

  const zone   = habit.zoneId ? (ZONE_CONFIG[habit.zoneId] || ZONE_CONFIG.health) : ZONE_CONFIG.none;
  const label  = rhythmLabel(localStreak);

  const handleComplete = async () => {
    if (localCompleted || isCompleting) return;
    setIsCompleting(true);
    try {
      const result = await completeHabit(userId, habit.id, localStreak, habit.lastCompletedDate);
      if (result.alreadyCompleted) { setLocalCompleted(true); return; }
      if (result.success) {
        setLocalCompleted(true);
        setLocalStreak(result.newStreak);
        try {
          const userProfileRef = doc(db, 'users', userId);
          const userProfileSnap = await getDoc(userProfileRef);
          const fullProfile = userProfileSnap.data();
          const userHabits = await getUserHabits(userId);
          const dailyLogsRef = collection(db, 'users', userId, 'dailyData');
          const dailyLogsQuery = query(dailyLogsRef, orderBy('date', 'desc'));
          const dailyLogsSnap = await getDocs(dailyLogsQuery);
          const dailyLogs = dailyLogsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const achievementData = await calculateAchievementData(userId, userHabits, dailyLogs, fullProfile);
          const newAchievements = await checkAndAwardAchievements(userId, achievementData);
          if (newAchievements.length > 0 && onAchievementsEarned) {
            onAchievementsEarned(newAchievements);
          }
        } catch { /* achievements are best-effort */ }
        if (onCompletion) onCompletion(habit.zoneId);
      }
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmed = window.confirm(`Remove "${habit.title}" from your custom habits?`);
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteHabit(userId, habit.id);
      if (onDelete) onDelete();
    } catch {
      alert('Could not remove habit. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-white/60 rounded-xl border p-4 transition-colors ${
        localCompleted ? 'border-indigo-200/80 bg-indigo-50/20' : 'border-white/70'
      }`}
    >
      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-400 transition-colors p-0.5"
        title="Remove habit"
      >
        {isDeleting ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      <div className="flex items-start gap-3 pr-5">
        {/* Icon bubble */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${
          localCompleted ? 'bg-indigo-100' : 'bg-gray-50 border border-gray-100'
        }`}>
          🎯
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm leading-snug">{habit.title}</h3>
              <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${zone.chipColor}`}>
                {zone.name}
              </span>
            </div>

            {/* Completion circle */}
            <button
              onClick={handleComplete}
              disabled={localCompleted || isCompleting}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                localCompleted
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : isCompleting
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
              }`}
            >
              {localCompleted ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isCompleting ? (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : null}
            </button>
          </div>

          {label && (
            <div className="mt-2">
              <span className="text-[10px] text-gray-400 font-medium">⭐ {label}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
