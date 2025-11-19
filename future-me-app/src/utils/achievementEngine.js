import { collection, doc, setDoc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Achievement Data Schema:
 * - id: string (unique achievement type like "week_streak")
 * - name: string (display name)
 * - description: string (what user did to earn it)
 * - category: string (habit/zone/tracking/general)
 * - earnedAt: timestamp
 * - iconEmoji: string (emoji for visual display)
 */

/**
 * All available achievements/milestones
 */
export const ACHIEVEMENTS = {
  // Habit-related achievements
  HABIT_STARTER: {
    id: 'habit_starter',
    name: 'Habit Starter',
    description: 'Created your first habit',
    category: 'habit',
    iconEmoji: '🌱',
    checkCondition: (data) => {
      return data.habitCount >= 1;
    }
  },
  WEEK_STREAK: {
    id: 'week_streak',
    name: 'Week Strong',
    description: 'Maintained a 7-day habit streak',
    category: 'habit',
    iconEmoji: '🔥',
    checkCondition: (data) => {
      return data.maxHabitStreak >= 7;
    }
  },
  MONTH_STREAK: {
    id: 'month_streak',
    name: 'Month Master',
    description: 'Maintained a 30-day habit streak',
    category: 'habit',
    iconEmoji: '💎',
    checkCondition: (data) => {
      return data.maxHabitStreak >= 30;
    }
  },
  TRIPLE_THREAT: {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Maintain 3 active habits simultaneously',
    category: 'habit',
    iconEmoji: '⚡',
    checkCondition: (data) => {
      return data.habitCount >= 3;
    }
  },
  STREAK_LEGEND: {
    id: 'streak_legend',
    name: 'Streak Legend',
    description: 'Achieved a 50-day habit streak',
    category: 'habit',
    iconEmoji: '👑',
    checkCondition: (data) => {
      return data.maxHabitStreak >= 50;
    }
  },

  // Life Zone achievements
  BALANCED_LIFE: {
    id: 'balanced_life',
    name: 'Balanced Life',
    description: 'All 6 Life Zones above 60',
    category: 'zone',
    iconEmoji: '⚖️',
    checkCondition: (data) => {
      const zones = data.lifeZones || {};
      const allAbove60 = Object.values(zones).every(score => score >= 60);
      return allAbove60 && Object.keys(zones).length === 6;
    }
  },
  ZONE_CHAMPION: {
    id: 'zone_champion',
    name: 'Zone Champion',
    description: 'Reached 80+ in any Life Zone',
    category: 'zone',
    iconEmoji: '🏆',
    checkCondition: (data) => {
      const zones = data.lifeZones || {};
      return Object.values(zones).some(score => score >= 80);
    }
  },
  EXCELLENCE_SEEKER: {
    id: 'excellence_seeker',
    name: 'Excellence Seeker',
    description: 'Reached 90+ in any Life Zone',
    category: 'zone',
    iconEmoji: '⭐',
    checkCondition: (data) => {
      const zones = data.lifeZones || {};
      return Object.values(zones).some(score => score >= 90);
    }
  },

  // Daily tracking achievements
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Completed your first daily log',
    category: 'tracking',
    iconEmoji: '👣',
    checkCondition: (data) => {
      return data.totalDaysLogged >= 1;
    }
  },
  CONSISTENT_LOGGER: {
    id: 'consistent_logger',
    name: 'Consistent Logger',
    description: '7 consecutive days of daily tracking',
    category: 'tracking',
    iconEmoji: '📊',
    checkCondition: (data) => {
      return data.consecutiveDaysLogged >= 7;
    }
  },
  DEDICATED_LOGGER: {
    id: 'dedicated_logger',
    name: 'Dedicated Logger',
    description: '30 consecutive days of daily tracking',
    category: 'tracking',
    iconEmoji: '📈',
    checkCondition: (data) => {
      return data.consecutiveDaysLogged >= 30;
    }
  },
  MILESTONE_TRACKER: {
    id: 'milestone_tracker',
    name: 'Milestone Tracker',
    description: 'Logged daily metrics for 100 total days',
    category: 'tracking',
    iconEmoji: '💯',
    checkCondition: (data) => {
      return data.totalDaysLogged >= 100;
    }
  },

  // General achievements
  JOURNEY_BEGINS: {
    id: 'journey_begins',
    name: 'Journey Begins',
    description: 'Completed onboarding and started your wellness journey',
    category: 'general',
    iconEmoji: '🚀',
    checkCondition: (data) => {
      return data.onboardingComplete === true;
    }
  },
  WELLNESS_WARRIOR: {
    id: 'wellness_warrior',
    name: 'Wellness Warrior',
    description: 'Wellness score above 75',
    category: 'general',
    iconEmoji: '🛡️',
    checkCondition: (data) => {
      return data.wellnessScore >= 75;
    }
  }
};

/**
 * Award an achievement to a user
 */
export const awardAchievement = async (userId, achievementId) => {
  const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
  if (!achievement) return null;

  const achievementRef = doc(db, 'users', userId, 'achievements', achievementId);
  
  // Check if already earned
  const existingDoc = await getDoc(achievementRef);
  if (existingDoc.exists()) {
    return { alreadyEarned: true };
  }

  const achievementData = {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    category: achievement.category,
    iconEmoji: achievement.iconEmoji,
    earnedAt: new Date().toISOString()
  };

  await setDoc(achievementRef, achievementData);

  return {
    newlyEarned: true,
    achievement: achievementData
  };
};

/**
 * Check and award new achievements based on current user data
 * Returns array of newly earned achievements
 */
export const checkAndAwardAchievements = async (userId, userData) => {
  const newlyEarned = [];

  // Check each achievement
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    if (achievement.checkCondition(userData)) {
      const result = await awardAchievement(userId, achievement.id);
      if (result?.newlyEarned) {
        newlyEarned.push(result.achievement);
      }
    }
  }

  return newlyEarned;
};

/**
 * Get all achievements for a user
 */
export const getUserAchievements = async (userId) => {
  const achievementsRef = collection(db, 'users', userId, 'achievements');
  const q = query(achievementsRef, orderBy('earnedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Calculate user data for achievement checking
 * This aggregates data from profile, habits, and daily logs
 */
export const calculateAchievementData = async (userId, habits = [], dailyLogs = [], userProfile = {}) => {
  // Habit metrics
  const habitCount = habits.length;
  const maxHabitStreak = habits.length > 0 
    ? Math.max(...habits.map(h => h.streak || 0))
    : 0;

  // Daily tracking metrics
  const totalDaysLogged = dailyLogs.length;
  
  // Calculate consecutive days
  let consecutiveDaysLogged = 0;
  if (dailyLogs.length > 0) {
    const sortedDates = dailyLogs
      .map(log => log.id) // id is the date
      .sort()
      .reverse(); // Most recent first
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);
    
    for (const dateStr of sortedDates) {
      const logDate = dateStr;
      const expectedDate = checkDate.toISOString().split('T')[0];
      
      if (logDate === expectedDate) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    consecutiveDaysLogged = streak;
  }

  // Life Zone scores
  const lifeZones = userProfile.lifeZones || {};

  // Wellness score
  const wellnessScore = userProfile.wellnessScore || 0;

  // Onboarding status
  const onboardingComplete = userProfile.onboardingComplete || false;

  return {
    habitCount,
    maxHabitStreak,
    totalDaysLogged,
    consecutiveDaysLogged,
    lifeZones,
    wellnessScore,
    onboardingComplete
  };
};
