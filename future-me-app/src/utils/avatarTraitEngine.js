/**
 * Avatar Trait Map Engine
 * 
 * Converts user metrics, habits, Life Zone scores, streaks, achievements, and wellness scores
 * into avatar visual traits. Each trait has a numeric score and descriptive label.
 * 
 * This engine does NOT modify avatar graphics - it only provides the data structure
 * that avatar rendering components can use to adjust visual appearance.
 */

/**
 * Normalizes a value to a 0-100 scale with optional bounds
 * @param {number} value - Raw input value
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @param {boolean} invert - Whether to invert the scale (higher input = lower output)
 * @returns {number} Normalized score (0-100)
 */
const normalizeScore = (value, min = 0, max = 5, invert = false) => {
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
};

/**
 * Calculates the average of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Average value
 */
const average = (values) => {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculates how balanced Life Zones are (lower variance = more balanced)
 * @param {Object} lifeZones - Object containing zone scores
 * @returns {number} Balance score (0-100, higher = more balanced)
 */
const calculateLifeZoneBalance = (lifeZones) => {
  if (!lifeZones) return 50;
  
  const scores = Object.values(lifeZones);
  if (scores.length === 0) return 50;
  
  const avg = average(scores);
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = more balanced (convert to 0-100 scale)
  // Assume max std dev of 30 for worst case
  const balanceScore = Math.max(0, 100 - (stdDev / 30) * 100);
  return balanceScore;
};

/**
 * Gets descriptive label for a numeric score
 * @param {number} score - Numeric score (0-100)
 * @param {Object} labels - Object with thresholds and labels
 * @returns {string} Descriptive label
 */
const getTraitLabel = (score, labels) => {
  if (score >= 80) return labels.veryHigh || labels.high;
  if (score >= 60) return labels.high;
  if (score >= 40) return labels.medium;
  if (score >= 20) return labels.low;
  return labels.veryLow || labels.low;
};

/**
 * POSTURE TRAIT
 * Affected by: activity, sleep, stress
 * Higher activity + better sleep + lower stress = upright posture
 */
const calculatePosture = (dailyMetrics, habitStreaks) => {
  const activity = dailyMetrics?.activity || 0;
  const sleep = dailyMetrics?.sleep || 0;
  const stress = dailyMetrics?.stress || 0;
  
  // Activity and sleep boost posture, stress reduces it
  const activityScore = normalizeScore(activity, 0, 5);
  const sleepScore = normalizeScore(sleep, 0, 5);
  const stressScore = normalizeScore(stress, 0, 5, true); // Inverted
  
  // Habit streaks provide bonus (up to +15 points)
  const totalStreaks = habitStreaks?.reduce((sum, streak) => sum + streak, 0) || 0;
  const streakBonus = Math.min(15, totalStreaks * 0.5);
  
  // Weighted average: 40% activity, 30% sleep, 30% stress
  const baseScore = (activityScore * 0.4) + (sleepScore * 0.3) + (stressScore * 0.3);
  const finalScore = Math.min(100, baseScore + streakBonus);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'upright and confident',
    high: 'upright posture',
    medium: 'moderate posture',
    low: 'slightly slouched',
    veryLow: 'slouched posture'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { activity, sleep, stress: 5 - stress, streakBonus }
  };
};

/**
 * BODY SHAPE TRAIT
 * Affected by: wellness score, nutrition, activity
 * Higher wellness + better nutrition + more activity = fit body shape
 */
const calculateBodyShape = (wellnessScore, dailyMetrics) => {
  const nutrition = dailyMetrics?.nutrition || 0;
  const activity = dailyMetrics?.activity || 0;
  
  // Wellness score is already 0-100
  const wellnessComponent = wellnessScore || 50;
  
  // Nutrition and activity on 0-100 scale
  const nutritionScore = normalizeScore(nutrition, 0, 5);
  const activityScore = normalizeScore(activity, 0, 5);
  
  // Weighted: 50% wellness, 25% nutrition, 25% activity
  const finalScore = (wellnessComponent * 0.5) + (nutritionScore * 0.25) + (activityScore * 0.25);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'very fit',
    high: 'fit and healthy',
    medium: 'moderate fitness',
    low: 'developing fitness',
    veryLow: 'low fitness'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { wellness: wellnessComponent, nutrition, activity }
  };
};

/**
 * FACIAL EXPRESSION TRAIT
 * Affected by: stress, emotional wellness (Social Emotional zone), achievements
 * Lower stress + higher emotional wellness = happy/calm expression
 */
const calculateFacialExpression = (dailyMetrics, lifeZones, achievements) => {
  const stress = dailyMetrics?.stress || 0;
  const emotionalWellness = lifeZones?.socialEmotional || 50;
  
  // Stress reduces expression score (inverted)
  const stressScore = normalizeScore(stress, 0, 5, true);
  
  // Emotional wellness is already 0-100
  const emotionalScore = emotionalWellness;
  
  // Achievements provide bonus (each achievement adds 1 point, max +10)
  const achievementCount = achievements?.length || 0;
  const achievementBonus = Math.min(10, achievementCount);
  
  // Weighted: 50% emotional wellness, 50% stress
  const baseScore = (emotionalScore * 0.5) + (stressScore * 0.5);
  const finalScore = Math.min(100, baseScore + achievementBonus);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'joyful and peaceful',
    high: 'calm and happy',
    medium: 'neutral expression',
    low: 'slightly tense',
    veryLow: 'stressed expression'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { stress: 5 - stress, emotionalWellness, achievementBonus }
  };
};

/**
 * GLOW/ENERGY TRAIT
 * Affected by: wellness score, habits, Life Zones average
 * Higher wellness + active habits + good Life Zones = high energy glow
 */
const calculateGlowEnergy = (wellnessScore, habitStreaks, lifeZones) => {
  const wellnessComponent = wellnessScore || 50;
  
  // Life Zones average
  const zoneScores = lifeZones ? Object.values(lifeZones) : [50];
  const zoneAverage = average(zoneScores);
  
  // Habit streaks bonus (each streak day adds 0.3 points, max +20)
  const totalStreaks = habitStreaks?.reduce((sum, streak) => sum + streak, 0) || 0;
  const streakBonus = Math.min(20, totalStreaks * 0.3);
  
  // Weighted: 40% wellness, 40% Life Zones, 20% from streaks
  const baseScore = (wellnessComponent * 0.4) + (zoneAverage * 0.4);
  const finalScore = Math.min(100, baseScore + streakBonus);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'radiant energy',
    high: 'strong vitality',
    medium: 'moderate energy',
    low: 'low energy',
    veryLow: 'depleted energy'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { wellness: wellnessComponent, lifeZoneAverage: zoneAverage, streakBonus }
  };
};

/**
 * MOVEMENT/ANIMATION LEVEL TRAIT
 * Affected by: activity level, habit streaks
 * Higher activity + longer streaks = more dynamic movement
 */
const calculateMovementLevel = (dailyMetrics, habitStreaks) => {
  const activity = dailyMetrics?.activity || 0;
  const activityScore = normalizeScore(activity, 0, 5);
  
  // Streak momentum: active streaks increase animation
  const totalStreaks = habitStreaks?.reduce((sum, streak) => sum + streak, 0) || 0;
  const streakScore = Math.min(40, totalStreaks * 1.5); // Max +40 from streaks
  
  // Weighted: 60% activity, 40% from streaks
  const finalScore = Math.min(100, (activityScore * 0.6) + streakScore);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'very dynamic',
    high: 'active movement',
    medium: 'moderate movement',
    low: 'minimal movement',
    veryLow: 'static pose'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { activity, totalStreaks, streakBonus: streakScore }
  };
};

/**
 * AURA/PRESENCE TRAIT
 * Affected by: Life Zone balance, achievements, overall wellness
 * Balanced Life Zones + achievements + high wellness = strong presence
 */
const calculateAuraPresence = (lifeZones, achievements, wellnessScore) => {
  const balanceScore = calculateLifeZoneBalance(lifeZones);
  const wellnessComponent = wellnessScore || 50;
  
  // Achievements add to presence (each adds 2 points, max +25)
  const achievementCount = achievements?.length || 0;
  const achievementBonus = Math.min(25, achievementCount * 2);
  
  // Weighted: 40% balance, 30% wellness, 30% achievements
  const baseScore = (balanceScore * 0.4) + (wellnessComponent * 0.3);
  const finalScore = Math.min(100, baseScore + achievementBonus);
  
  const label = getTraitLabel(finalScore, {
    veryHigh: 'powerful presence',
    high: 'strong presence',
    medium: 'balanced presence',
    low: 'developing presence',
    veryLow: 'weak presence'
  });
  
  return {
    score: Math.round(finalScore),
    label,
    influences: { lifeZoneBalance: balanceScore, wellness: wellnessComponent, achievementBonus }
  };
};

/**
 * Main Avatar Trait Engine
 * 
 * Takes all user data and returns a complete trait map for avatar rendering.
 * 
 * @param {Object} userData - Complete user data object
 * @param {Object} userData.dailyMetrics - { sleep, activity, nutrition, stress } (1-5 scale)
 * @param {number} userData.wellnessScore - Overall wellness score (0-100)
 * @param {Object} userData.lifeZones - { health, socialEmotional, wealth, faith, family, community } (0-100 each)
 * @param {number[]} userData.habitStreaks - Array of current streak lengths
 * @param {Array} userData.achievements - Array of earned achievement objects
 * 
 * @returns {Object} Complete avatar trait map
 */
export const calculateAvatarTraits = (userData = {}) => {
  const {
    dailyMetrics = {},
    wellnessScore = 50,
    lifeZones = {},
    habitStreaks = [],
    achievements = []
  } = userData;
  
  // Calculate all traits
  const posture = calculatePosture(dailyMetrics, habitStreaks);
  const bodyShape = calculateBodyShape(wellnessScore, dailyMetrics);
  const facialExpression = calculateFacialExpression(dailyMetrics, lifeZones, achievements);
  const glowEnergy = calculateGlowEnergy(wellnessScore, habitStreaks, lifeZones);
  const movementLevel = calculateMovementLevel(dailyMetrics, habitStreaks);
  const auraPresence = calculateAuraPresence(lifeZones, achievements, wellnessScore);
  
  // Return structured trait map
  return {
    posture,
    bodyShape,
    facialExpression,
    glowEnergy,
    movementLevel,
    auraPresence,
    
    // Metadata
    timestamp: new Date().toISOString(),
    summary: {
      overallScore: Math.round(average([
        posture.score,
        bodyShape.score,
        facialExpression.score,
        glowEnergy.score,
        movementLevel.score,
        auraPresence.score
      ])),
      dominantTraits: getDominantTraits({
        posture,
        bodyShape,
        facialExpression,
        glowEnergy,
        movementLevel,
        auraPresence
      })
    }
  };
};

/**
 * Helper: Identifies the top 3 strongest traits
 * @param {Object} traits - All trait objects
 * @returns {Array} Top 3 traits by score
 */
const getDominantTraits = (traits) => {
  const traitArray = Object.entries(traits).map(([name, data]) => ({
    name,
    score: data.score,
    label: data.label
  }));
  
  return traitArray
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(t => ({ trait: t.name, label: t.label, score: t.score }));
};

/**
 * Example usage and testing helper
 */
export const getExampleTraits = () => {
  // Example 1: High performer
  const highPerformer = calculateAvatarTraits({
    dailyMetrics: { sleep: 4, activity: 5, nutrition: 4, stress: 2 },
    wellnessScore: 85,
    lifeZones: { health: 80, socialEmotional: 75, wealth: 70, faith: 80, family: 75, community: 70 },
    habitStreaks: [15, 22, 8],
    achievements: Array(10).fill({})
  });
  
  // Example 2: Struggling individual
  const struggling = calculateAvatarTraits({
    dailyMetrics: { sleep: 2, activity: 1, nutrition: 2, stress: 5 },
    wellnessScore: 35,
    lifeZones: { health: 30, socialEmotional: 25, wealth: 40, faith: 35, family: 30, community: 20 },
    habitStreaks: [0, 2, 0],
    achievements: Array(2).fill({})
  });
  
  // Example 3: Balanced beginner
  const beginner = calculateAvatarTraits({
    dailyMetrics: { sleep: 3, activity: 3, nutrition: 3, stress: 3 },
    wellnessScore: 50,
    lifeZones: { health: 50, socialEmotional: 50, wealth: 50, faith: 50, family: 50, community: 50 },
    habitStreaks: [5, 5, 0],
    achievements: Array(4).fill({})
  });
  
  return { highPerformer, struggling, beginner };
};

export default calculateAvatarTraits;
