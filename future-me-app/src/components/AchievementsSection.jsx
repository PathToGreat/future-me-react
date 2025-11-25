import { motion } from 'framer-motion';
import AchievementBadge from './AchievementBadge';

const AchievementsSection = ({ achievements = [] }) => {
  const hasAchievements = achievements.length > 0;

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {});

  const categoryNames = {
    general: 'General',
    habit: 'Habit Mastery',
    zone: 'Life Zone Excellence',
    tracking: 'Consistency'
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Your Achievements
          </h2>
          <p className="text-gray-400 text-sm">
            {hasAchievements 
              ? `${achievements.length} milestone${achievements.length === 1 ? '' : 's'} reached`
              : 'Complete milestones to earn badges'}
          </p>
        </div>
        {hasAchievements && (
          <div className="text-3xl">
            🏅
          </div>
        )}
      </div>

      {/* Empty State */}
      {!hasAchievements && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Your Journey Awaits
          </h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            Complete habits, log daily metrics, and grow your Life Zones to unlock achievements. 
            Every step forward is worth celebrating!
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-gray-500">
            <span className="px-3 py-1 bg-gray-800/50 rounded-full">
              📊 Track daily
            </span>
            <span className="px-3 py-1 bg-gray-800/50 rounded-full">
              🔥 Build streaks
            </span>
            <span className="px-3 py-1 bg-gray-800/50 rounded-full">
              🌱 Create habits
            </span>
            <span className="px-3 py-1 bg-gray-800/50 rounded-full">
              ⚖️ Balance zones
            </span>
          </div>
        </motion.div>
      )}

      {/* Achievements Grid */}
      {hasAchievements && (
        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {categoryNames[category] || category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsSection;
