import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import HabitCard from '../components/HabitCard';
import HabitCreationModal from '../components/HabitCreationModal';
import AchievementsSection from '../components/AchievementsSection';

export default function HabitsScreen() {
  const { user } = useAuth();
  const {
    habits,
    achievements,
    refreshHabits,
    handleAchievementsEarned,
  } = useApp();

  const [showHabitModal, setShowHabitModal] = useState(false);

  const handleHabitCreated = () => {
    refreshHabits();
    setShowHabitModal(false);
  };

  const handleHabitCompletion = (zoneId) => {
    console.log('Habit completed for zone:', zoneId);
    refreshHabits();
  };

  const handleHabitDelete = () => {
    refreshHabits();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Habits</h1>
          <p className="text-gray-600">Build consistency and earn achievements</p>
        </div>
        <button
          onClick={() => setShowHabitModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
        >
          + New Habit
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Daily Habits</h2>
          <span className="text-sm text-gray-500">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
          </span>
        </div>
        
        {habits.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
            <p className="mb-4">Start building positive habits to strengthen your Life Zones</p>
            <button
              onClick={() => setShowHabitModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                userId={user.uid}
                onCompletion={handleHabitCompletion}
                onAchievementsEarned={handleAchievementsEarned}
                onDelete={handleHabitDelete}
              />
            ))}
          </div>
        )}
      </motion.div>

      <AchievementsSection achievements={achievements} />

      <HabitCreationModal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        userId={user?.uid}
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
}
