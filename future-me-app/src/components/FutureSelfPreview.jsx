import { motion } from 'framer-motion';
import { getTodayDate } from '../utils/habitHelpers';

export default function FutureSelfPreview({ lifestyleScore, lifeZones, habits = [], achievements = [] }) {
  const getMessage = (score) => {
    if (score >= 80) {
      return "You are trending toward a strong future self.";
    } else if (score >= 60) {
      return "You are making progress but have opportunities for improvement.";
    } else {
      return "Your current habits may be impacting your future self.";
    }
  };

  const getSubtitle = (score) => {
    if (score >= 80) {
      return "Your direction is strong and consistent.";
    } else if (score >= 60) {
      return "You're improving and building momentum.";
    } else {
      return "Your current patterns may be limiting your future potential.";
    }
  };

  const getHabitInsight = () => {
    if (!habits || habits.length === 0) return null;

    const today = getTodayDate();
    const activeHabits = habits.filter(h => h.lastCompletedDate === today);
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    const avgStreak = habits.length > 0 ? Math.round(totalStreaks / habits.length) : 0;
    const strongHabits = habits.filter(h => h.streak >= 7);

    if (strongHabits.length > 0) {
      return `${strongHabits.length} ${strongHabits.length === 1 ? 'habit has' : 'habits have'} been consistent for 7+ days.`;
    } else if (activeHabits.length === habits.length) {
      return `All habits completed today.`;
    } else if (activeHabits.length > 0) {
      return `${activeHabits.length} of ${habits.length} ${activeHabits.length === 1 ? 'habit' : 'habits'} completed today.`;
    } else if (avgStreak >= 3) {
      return `Your habits have an average consistency of ${avgStreak} days.`;
    } else {
      return `Habit consistency contributes to your Life Zone scores over time.`;
    }
  };

  const getZoneTrendMessage = () => {
    if (!lifeZones) return null;
    
    const zoneNames = {
      health: 'Health',
      socialEmotional: 'Social Emotional',
      wealth: 'Wealth',
      faith: 'Faith',
      family: 'Family',
      community: 'Community'
    };
    
    const strongZones = [];
    const developingZones = [];
    
    Object.keys(zoneNames).forEach(key => {
      const zone = lifeZones[key];
      if (zone) {
        if (zone.score >= 75) {
          strongZones.push(zoneNames[key]);
        } else if (zone.score < 50) {
          developingZones.push(zoneNames[key]);
        }
      }
    });
    
    if (strongZones.length > 0) {
      return `Your ${strongZones.join(', ')} ${strongZones.length === 1 ? 'zone is' : 'zones are'} flourishing.`;
    } else if (developingZones.length > 0) {
      return `Focus on strengthening your ${developingZones.join(', ')} ${developingZones.length === 1 ? 'zone' : 'zones'}.`;
    }
    
    return "All zones show balanced progress.";
  };

  const getAchievementInsight = () => {
    if (!achievements || achievements.length === 0) return null;

    const recentAchievement = achievements[0];
    const habitAchievements = achievements.filter(a => a.category === 'habit');
    const zoneAchievements = achievements.filter(a => a.category === 'zone');
    const trackingAchievements = achievements.filter(a => a.category === 'tracking');

    const hasMonthStreak = achievements.some(a => a.id === 'month_streak');
    const hasWeekStreak = achievements.some(a => a.id === 'week_streak');
    const hasBalancedLife = achievements.some(a => a.id === 'balanced_life');
    const hasConsistentLogger = achievements.some(a => a.id === 'consistent_logger');
    const hasExcellence = achievements.some(a => a.id === 'excellence_seeker');

    if (hasMonthStreak) {
      return `30 consecutive days of tracking recorded. This level of consistency provides reliable data for pattern detection.`;
    } else if (hasExcellence) {
      return `Multiple metrics have reached elevated levels. Your data reflects sustained attention across areas.`;
    } else if (hasBalancedLife) {
      return `All 6 zones are above 60. Your data shows activity across each area of focus.`;
    } else if (hasWeekStreak) {
      return `7 consecutive days of tracking recorded. A week of data strengthens pattern reliability.`;
    } else if (hasConsistentLogger) {
      return `7 consecutive days of logging completed. Your data now supports initial trend analysis.`;
    } else if (habitAchievements.length > 0) {
      return `${habitAchievements.length} habit ${habitAchievements.length === 1 ? 'milestone' : 'milestones'} recorded based on consistency.`;
    } else if (zoneAchievements.length > 0) {
      return `${zoneAchievements.length} Life Zone ${zoneAchievements.length === 1 ? 'threshold' : 'thresholds'} reached based on logged data.`;
    } else if (trackingAchievements.length > 0) {
      return `${trackingAchievements.length} tracking ${trackingAchievements.length === 1 ? 'milestone' : 'milestones'} recorded. Consistent tracking supports clearer analysis.`;
    } else if (achievements.length > 0) {
      return `${achievements.length} ${achievements.length === 1 ? 'milestone' : 'milestones'} recorded based on your logged data.`;
    }

    return null;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-indigo-500";
    return "from-orange-500 to-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(lifestyleScore)} flex items-center justify-center shadow-lg`}>
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                <svg 
                  className="w-20 h-20 text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(lifestyleScore)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
              {Math.round(lifestyleScore)}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Future Self Preview
          </h2>
          <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
            <span className="text-sm font-medium text-gray-600">Future Self Score:</span>
            <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(lifestyleScore)} bg-clip-text text-transparent`}>
              {Math.round(lifestyleScore)}
            </span>
            <span className="text-lg text-gray-500">/100</span>
          </div>
          <p className="text-sm text-gray-500 italic mb-2">
            {getSubtitle(lifestyleScore)}
          </p>
          <p className="text-gray-700 text-base mb-2">
            {getMessage(lifestyleScore)}
          </p>
          {lifeZones && (
            <p className="text-sm text-blue-600 font-medium mb-2">
              {getZoneTrendMessage()}
            </p>
          )}
          {getHabitInsight() && (
            <p className="text-sm text-purple-600 font-medium">
              {getHabitInsight()}
            </p>
          )}
          {getAchievementInsight() && (
            <p className="text-sm text-amber-600 font-medium mt-2">
              {getAchievementInsight()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
