import { useState } from 'react';
import { motion } from 'framer-motion';
import { completeHabit, isCompletedToday, getUserHabits, deleteHabit } from '../utils/habitHelpers';
import { calculateAchievementData, checkAndAwardAchievements } from '../utils/achievementEngine';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const ZONE_CONFIG = {
  health: { name: 'Health', icon: '💪', color: 'from-green-400 to-emerald-500' },
  socialEmotional: { name: 'Social Emotional', icon: '❤️', color: 'from-pink-400 to-rose-500' },
  wealth: { name: 'Wealth', icon: '💰', color: 'from-yellow-400 to-amber-500' },
  faith: { name: 'Faith', icon: '📖', color: 'from-purple-400 to-violet-500' },
  family: { name: 'Family', icon: '👨‍👩‍👧‍👦', color: 'from-blue-400 to-cyan-500' },
  community: { name: 'Community', icon: '🤝', color: 'from-orange-400 to-red-500' },
  none: { name: 'Personal Habit', icon: '⭐', color: 'from-gray-400 to-gray-500' }
};

export default function HabitCard({ habit, userId, onCompletion, onAchievementsEarned, onDelete }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(
    isCompletedToday(habit.lastCompletedDate)
  );
  const [localStreak, setLocalStreak] = useState(habit.streak);

  const zone = habit.zoneId ? (ZONE_CONFIG[habit.zoneId] || ZONE_CONFIG.health) : ZONE_CONFIG.none;
  const completedToday = localCompleted;

  const handleComplete = async () => {
    if (completedToday || isCompleting) return;

    setIsCompleting(true);

    try {
      const result = await completeHabit(
        userId,
        habit.id,
        localStreak,
        habit.lastCompletedDate
      );

      if (result.alreadyCompleted) {
        setLocalCompleted(true);
        return;
      }

      if (result.success) {
        setLocalCompleted(true);
        setLocalStreak(result.newStreak);
        
        // Check for newly earned achievements
        try {
          const userProfileRef = doc(db, 'users', userId);
          const userProfileSnap = await getDoc(userProfileRef);
          const fullProfile = userProfileSnap.data();
          
          const userHabits = await getUserHabits(userId);
          
          const dailyLogsRef = collection(db, 'users', userId, 'dailyData');
          const dailyLogsQuery = query(dailyLogsRef, orderBy('date', 'desc'));
          const dailyLogsSnap = await getDocs(dailyLogsQuery);
          const dailyLogs = dailyLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const achievementData = await calculateAchievementData(
            userId,
            userHabits,
            dailyLogs,
            fullProfile
          );
          
          const newAchievements = await checkAndAwardAchievements(userId, achievementData);
          
          if (newAchievements.length > 0) {
            console.log('🏆 New achievements earned from habit completion:', newAchievements);
            if (onAchievementsEarned) {
              onAchievementsEarned(newAchievements);
            }
          }
        } catch (error) {
          console.error('Error checking achievements:', error);
        }
        
        // Notify parent to refresh habits and recalculate Life Zones
        if (onCompletion) {
          onCompletion(habit.zoneId);
        }
      }
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${habit.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await deleteHabit(userId, habit.id);
      console.log('✅ Habit deleted successfully');
      
      // Notify parent component to refresh habit list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('❌ Error deleting habit:', error);
      alert('Failed to delete habit. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100 hover:shadow-lg transition-shadow relative"
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
        title="Delete habit"
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      <div className="flex items-start justify-between mb-3 pr-6">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{habit.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{zone.icon}</span>
            <span className="text-xs text-gray-600">{zone.name}</span>
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={completedToday || isCompleting}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            completedToday
              ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white cursor-default'
              : isCompleting
              ? 'bg-gray-300 cursor-wait'
              : 'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
          }`}
        >
          {completedToday ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : isCompleting ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : null}
        </button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-xs text-gray-500">Streak</p>
            <p className="font-bold text-gray-800">{localStreak} {localStreak === 1 ? 'day' : 'days'}</p>
          </div>
        </div>

        {completedToday && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium"
          >
            ✓ Done today
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
