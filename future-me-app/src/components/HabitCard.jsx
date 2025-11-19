import { motion } from 'framer-motion';
import { getTodayCompletionStatus, ZONE_OPTIONS } from '../utils/habitUtils';

const zoneColors = {
  health: 'from-green-500 to-emerald-600',
  socialEmotional: 'from-pink-500 to-rose-600',
  wealth: 'from-yellow-500 to-amber-600',
  faith: 'from-purple-500 to-violet-600',
  family: 'from-blue-500 to-indigo-600',
  community: 'from-orange-500 to-red-600'
};

export default function HabitCard({ habit, onComplete, isCompleting }) {
  const isCompletedToday = getTodayCompletionStatus(habit);
  const zoneLabel = ZONE_OPTIONS.find(z => z.value === habit.linkedZone)?.label || habit.linkedZone;
  const zoneColor = zoneColors[habit.linkedZone] || 'from-gray-500 to-gray-600';

  const handleComplete = async () => {
    if (!isCompletedToday && !isCompleting) {
      await onComplete(habit.id, habit);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-md p-4 border-2 transition-all ${
        isCompletedToday 
          ? 'border-green-400 bg-green-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg mb-1 truncate ${
            isCompletedToday ? 'text-green-900' : 'text-gray-800'
          }`}>
            {habit.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${zoneColor} text-white font-medium`}>
              {zoneLabel}
            </span>
            
            {habit.streak > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium flex items-center gap-1">
                🔥 {habit.streak} day{habit.streak !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isCompletedToday && (
            <p className="text-sm text-green-700 font-medium">
              ✓ Completed today
            </p>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={isCompletedToday || isCompleting}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
            isCompletedToday
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isCompletedToday ? '✓' : '○'}
        </button>
      </div>

      {!isCompletedToday && (
        <p className="text-xs text-gray-500 mt-2">
          Complete to boost your {zoneLabel} zone +3 points
        </p>
      )}
    </motion.div>
  );
}
