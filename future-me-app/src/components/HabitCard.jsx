import { useState } from 'react';
import { motion } from 'framer-motion';
import { completeHabit, isCompletedToday } from '../utils/habitHelpers';

const ZONE_CONFIG = {
  health: { name: 'Health', icon: '💪', color: 'from-green-400 to-emerald-500' },
  socialEmotional: { name: 'Social Emotional', icon: '❤️', color: 'from-pink-400 to-rose-500' },
  wealth: { name: 'Wealth', icon: '💰', color: 'from-yellow-400 to-amber-500' },
  faith: { name: 'Faith', icon: '✨', color: 'from-purple-400 to-violet-500' },
  family: { name: 'Family', icon: '👨‍👩‍👧‍👦', color: 'from-blue-400 to-cyan-500' },
  community: { name: 'Community', icon: '🤝', color: 'from-orange-400 to-red-500' }
};

export default function HabitCard({ habit, userId, onCompletion }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(
    isCompletedToday(habit.lastCompletedDate)
  );
  const [localStreak, setLocalStreak] = useState(habit.streak);

  const zone = ZONE_CONFIG[habit.zoneId] || ZONE_CONFIG.health;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
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
