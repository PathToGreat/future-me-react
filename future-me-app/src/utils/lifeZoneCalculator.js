/**
 * Life Zone Calculation Engine
 * Calculates scores for all 6 life zones based on user metrics, trends, and daily data
 */

/**
 * Calculate all life zone scores
 * @param {Object} userMetrics - Current user profile with activity, nutrition, sleep, stress, lifestyleScore
 * @param {Object} trends - Trend analysis from analyzeTrends (direction, trendSlope, etc.)
 * @param {Array} dailyData - Array of daily data entries (last 30 days)
 * @returns {Object} All zone scores and details
 */
export function calculateLifeZones(userMetrics, trends, dailyData) {
  if (!userMetrics) {
    return getDefaultZones();
  }

  const consistencyScore = calculateConsistencyScore(dailyData);
  const stressData = analyzeStressPattern(dailyData, userMetrics.stress);
  const sleepData = analyzeSleepPattern(dailyData, userMetrics.sleep);
  const activityData = analyzeActivityPattern(dailyData, userMetrics.activity);

  return {
    health: calculateHealthZone(userMetrics, trends, dailyData),
    wealth: calculateWealthZone(consistencyScore, dailyData),
    faith: calculateFaithZone(consistencyScore, dailyData),
    family: calculateFamilyZone(stressData, sleepData, userMetrics),
    community: calculateCommunityZone(stressData, consistencyScore, userMetrics),
    socialEmotional: calculateSocialEmotionalZone(stressData, consistencyScore, userMetrics),
    
    healthDetails: {
      lifestyleScore: userMetrics.lifestyleScore || 50,
      activity: userMetrics.activity || 3,
      nutrition: userMetrics.nutrition || 3,
      sleep: userMetrics.sleep || 3,
      trend: trends?.direction || 'stable'
    },
    wealthDetails: {
      consistencyScore,
      daysLogged: dailyData?.length || 0
    },
    faithDetails: {
      consistencyScore,
      consecutiveDays: calculateConsecutiveDays(dailyData)
    },
    familyDetails: {
      stressTrend: stressData.trend,
      sleepTrend: sleepData.trend,
      balance: stressData.trend === 'improving' && sleepData.trend === 'improving' ? 'strong' : 'developing'
    },
    communityDetails: {
      consistencyScore,
      stressLevel: userMetrics.stress || 3,
      engagement: consistencyScore > 70 ? 'active' : 'moderate'
    },
    socialEmotionalDetails: {
      stressLevel: userMetrics.stress || 3,
      stressTrend: stressData.trend,
      consistency: consistencyScore
    }
  };
}

/**
 * Health Zone: Wellness score + trend direction
 */
function calculateHealthZone(userMetrics, trends, dailyData) {
  const baseScore = userMetrics.lifestyleScore || 50;
  let bonus = 0;

  // Add bonus for positive trends
  if (trends?.direction === 'improving') {
    bonus += 10;
  } else if (trends?.direction === 'declining') {
    bonus -= 10;
  }

  // Add bonus for high activity/nutrition/sleep
  if (userMetrics.activity >= 4) bonus += 5;
  if (userMetrics.nutrition >= 4) bonus += 5;
  if (userMetrics.sleep >= 4) bonus += 5;

  return clamp(Math.round(baseScore + bonus), 0, 100);
}

/**
 * Social Emotional Wellness: Stress level + consistency + stress trend
 */
function calculateSocialEmotionalZone(stressData, consistencyScore, userMetrics) {
  // Lower stress = higher social emotional score
  const stressScore = ((5 - userMetrics.stress) / 4) * 100;
  
  let score = stressScore * 0.6 + consistencyScore * 0.4;

  // Bonus for improving stress trend
  if (stressData.trend === 'improving') {
    score += 10;
  } else if (stressData.trend === 'declining') {
    score -= 10;
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Wealth Zone: Consistency-based placeholder
 */
function calculateWealthZone(consistencyScore, dailyData) {
  // Simple formula: consistency * 2, capped at 100
  const score = consistencyScore * 2;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Faith Zone: Daily consistency with bonus for consecutive days
 */
function calculateFaithZone(consistencyScore, dailyData) {
  let score = consistencyScore;

  const consecutiveDays = calculateConsecutiveDays(dailyData);
  
  // Bonus for 4+ consecutive days
  if (consecutiveDays >= 4) {
    score += 10;
  }
  
  // Additional bonus for 7+ days
  if (consecutiveDays >= 7) {
    score += 10;
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Family Zone: Stress + sleep trend correlation
 */
function calculateFamilyZone(stressData, sleepData, userMetrics) {
  let score = 50; // Base score

  // Both improving = strong family balance
  if (stressData.trend === 'improving' && sleepData.trend === 'improving') {
    score += 20;
  }
  
  // Both declining = family balance challenged
  if (stressData.trend === 'declining' && sleepData.trend === 'declining') {
    score -= 20;
  }

  // One improving, one stable
  if ((stressData.trend === 'improving' && sleepData.trend === 'stable') ||
      (stressData.trend === 'stable' && sleepData.trend === 'improving')) {
    score += 10;
  }

  // Factor in current stress and sleep levels
  const wellnessBonus = ((5 - userMetrics.stress) + userMetrics.sleep - 6) * 5;
  score += wellnessBonus;

  return clamp(Math.round(score), 0, 100);
}

/**
 * Community Zone: Consistency + stress inverse
 */
function calculateCommunityZone(stressData, consistencyScore, userMetrics) {
  // Lower stress = more community engagement capacity
  const stressScore = ((5 - userMetrics.stress) / 4) * 100;
  
  let score = consistencyScore * 0.5 + stressScore * 0.5;

  // Bonus for consistent logging (shows commitment)
  if (consistencyScore >= 70) {
    score += 10;
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Calculate consistency score based on number of days logged
 */
function calculateConsistencyScore(dailyData) {
  if (!dailyData || dailyData.length === 0) return 0;
  
  const daysLogged = dailyData.length;
  
  // Scale: 0-7 days = 0-50, 8-14 days = 50-75, 15+ days = 75-100
  if (daysLogged <= 7) {
    return (daysLogged / 7) * 50;
  } else if (daysLogged <= 14) {
    return 50 + ((daysLogged - 7) / 7) * 25;
  } else {
    return Math.min(75 + ((daysLogged - 14) / 16) * 25, 100);
  }
}

/**
 * Calculate consecutive days of logging
 */
function calculateConsecutiveDays(dailyData) {
  if (!dailyData || dailyData.length === 0) return 0;

  // Sort by date descending
  const sorted = [...dailyData].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let consecutiveDays = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentDate = new Date(sorted[i].date);
    const nextDate = new Date(sorted[i + 1].date);
    
    currentDate.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.round((currentDate - nextDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays;
}

/**
 * Analyze stress pattern
 */
function analyzeStressPattern(dailyData, currentStress) {
  if (!dailyData || dailyData.length < 2) {
    return { trend: 'stable', average: currentStress };
  }

  const stressValues = dailyData.map(d => d.stress).filter(v => v !== undefined);
  const average = stressValues.reduce((a, b) => a + b, 0) / stressValues.length;
  
  // Calculate trend (lower stress = improving)
  const recent = stressValues.slice(0, Math.min(3, stressValues.length));
  const older = stressValues.slice(-Math.min(3, stressValues.length));
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  let trend = 'stable';
  if (recentAvg < olderAvg - 0.3) {
    trend = 'improving'; // Stress going down
  } else if (recentAvg > olderAvg + 0.3) {
    trend = 'declining'; // Stress going up
  }

  return { trend, average };
}

/**
 * Analyze sleep pattern
 */
function analyzeSleepPattern(dailyData, currentSleep) {
  if (!dailyData || dailyData.length < 2) {
    return { trend: 'stable', average: currentSleep };
  }

  const sleepValues = dailyData.map(d => d.sleep).filter(v => v !== undefined);
  const average = sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length;
  
  const recent = sleepValues.slice(0, Math.min(3, sleepValues.length));
  const older = sleepValues.slice(-Math.min(3, sleepValues.length));
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  let trend = 'stable';
  if (recentAvg > olderAvg + 0.3) {
    trend = 'improving';
  } else if (recentAvg < olderAvg - 0.3) {
    trend = 'declining';
  }

  return { trend, average };
}

/**
 * Analyze activity pattern
 */
function analyzeActivityPattern(dailyData, currentActivity) {
  if (!dailyData || dailyData.length < 2) {
    return { trend: 'stable', average: currentActivity };
  }

  const activityValues = dailyData.map(d => d.activity).filter(v => v !== undefined);
  const average = activityValues.reduce((a, b) => a + b, 0) / activityValues.length;
  
  const recent = activityValues.slice(0, Math.min(3, activityValues.length));
  const older = activityValues.slice(-Math.min(3, activityValues.length));
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  let trend = 'stable';
  if (recentAvg > olderAvg + 0.3) {
    trend = 'improving';
  } else if (recentAvg < olderAvg - 0.3) {
    trend = 'declining';
  }

  return { trend, average };
}

/**
 * Get default zone values
 */
function getDefaultZones() {
  return {
    health: 50,
    wealth: 50,
    faith: 50,
    family: 50,
    community: 50,
    socialEmotional: 50,
    healthDetails: {},
    wealthDetails: {},
    faithDetails: {},
    familyDetails: {},
    communityDetails: {},
    socialEmotionalDetails: {}
  };
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get zone status label based on score
 */
export function getZoneStatus(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'developing';
  return 'needs attention';
}

/**
 * Get zone color based on score
 */
export function getZoneColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  return 'orange';
}
