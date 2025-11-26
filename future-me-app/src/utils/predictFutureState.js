/**
 * Enhanced Future State Prediction Engine
 * 
 * Calculates 30/90/180-day projections using normalized weights:
 * - Lifestyle trend: 50% weight
 * - Life Zone scores: 30% weight  
 * - Habit consistency: 20% weight
 * 
 * All components are normalized to 0-100 scale before weighting.
 */

export function predictFutureState(currentScore, trendSlope, options = {}) {
  const {
    lifeZones = null,
    habits = [],
    metricTrends = null,
    historyDays = 0
  } = options;

  if (currentScore == null || typeof currentScore !== 'number') {
    console.log('⚠️ Insufficient data for future growth outlook');
    return null;
  }

  if (trendSlope == null && !lifeZones) {
    console.log('⚠️ Insufficient data for future growth outlook');
    return null;
  }

  const daysToProject = [30, 90, 180];
  const predictions = {};

  const habitFactor = calculateHabitConsistencyFactor(habits);
  const zoneScore = calculateLifeZoneScore(lifeZones);
  const stabilityFactor = calculateStabilityFactor(historyDays);
  const metricMomentum = calculateMetricMomentum(metricTrends);

  console.log('📊 Prediction Factors:');
  console.log(`  - Habit Consistency: ${(habitFactor * 100).toFixed(0)}%`);
  console.log(`  - Life Zone Average: ${zoneScore.toFixed(1)}`);
  console.log(`  - Stability Factor: ${(stabilityFactor * 100).toFixed(0)}%`);
  console.log(`  - Metric Momentum: ${metricMomentum.toFixed(2)}`);

  daysToProject.forEach(days => {
    const normalizedTrendDelta = normalizeTrendDelta(trendSlope, days, currentScore);
    const normalizedZoneDelta = normalizeZoneDelta(zoneScore, currentScore);
    const normalizedHabitDelta = normalizeHabitDelta(habitFactor, days);
    const normalizedMomentum = normalizeMomentumDelta(metricMomentum, days);

    const TREND_WEIGHT = 0.50;
    const ZONE_WEIGHT = 0.30;
    const HABIT_WEIGHT = 0.20;

    const weightedDelta = 
      (normalizedTrendDelta * TREND_WEIGHT) +
      (normalizedZoneDelta * ZONE_WEIGHT) +
      (normalizedHabitDelta * HABIT_WEIGHT) +
      (normalizedMomentum * 0.1);

    const confidenceAdjustedDelta = weightedDelta * stabilityFactor;
    
    const maxDelta = days === 30 ? 15 : days === 90 ? 25 : 35;
    const cappedDelta = Math.max(-maxDelta, Math.min(maxDelta, confidenceAdjustedDelta));
    
    const projectedScore = Math.max(0, Math.min(100, currentScore + cappedDelta));
    
    const status = getProjectionStatus(projectedScore);
    const change = projectedScore - currentScore;
    
    const breakdown = {
      trendContribution: Math.round(normalizedTrendDelta * TREND_WEIGHT * 10) / 10,
      zoneContribution: Math.round(normalizedZoneDelta * ZONE_WEIGHT * 10) / 10,
      habitContribution: Math.round(normalizedHabitDelta * HABIT_WEIGHT * 10) / 10,
      momentumContribution: Math.round(normalizedMomentum * 0.1 * 10) / 10
    };

    predictions[days] = {
      score: Math.round(projectedScore * 10) / 10,
      status,
      statusLabel: getStatusLabel(status),
      statusEmoji: getStatusEmoji(status),
      change: Math.round(change * 10) / 10,
      direction: change > 1 ? 'improving' : change < -1 ? 'declining' : 'stable',
      confidence: calculateConfidence(historyDays, habits.length),
      breakdown
    };

    console.log(`➡️ ${days}-day projection: ${predictions[days].score} (${predictions[days].status})`);
  });

  const trajectory = getTrajectory(predictions);
  
  console.log(`⭐ Overall trajectory: ${trajectory} (180-day score: ${predictions[180].score})`);

  return {
    ...predictions,
    trajectory,
    factors: {
      habitConsistency: Math.round(habitFactor * 100),
      lifeZoneAverage: Math.round(zoneScore),
      dataStability: Math.round(stabilityFactor * 100),
      metricMomentum: Math.round(metricMomentum * 100) / 100
    }
  };
}

function normalizeTrendDelta(trendSlope, days, currentScore) {
  if (trendSlope == null) return 0;
  
  const rawDelta = trendSlope * days;
  const normalizedDelta = Math.max(-30, Math.min(30, rawDelta));
  
  return normalizedDelta;
}

function normalizeZoneDelta(zoneScore, currentScore) {
  const zoneDeviation = zoneScore - 50;
  const scaledDelta = zoneDeviation * 0.3;
  
  return Math.max(-15, Math.min(15, scaledDelta));
}

function normalizeHabitDelta(habitFactor, days) {
  const timeMultiplier = Math.min(days / 30, 3);
  const rawDelta = habitFactor * 10 * timeMultiplier;
  
  return Math.max(0, Math.min(20, rawDelta));
}

function normalizeMomentumDelta(momentum, days) {
  const rawDelta = momentum * (days / 30) * 3;
  
  return Math.max(-10, Math.min(10, rawDelta));
}

function calculateHabitConsistencyFactor(habits) {
  if (!habits || habits.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let totalStreak = 0;
  let activeHabits = 0;
  
  habits.forEach(habit => {
    if (habit.streak > 0) {
      totalStreak += Math.min(habit.streak, 30);
    }
    if (habit.lastCompletedDate === today || habit.lastCompletedDate === yesterday) {
      activeHabits++;
    }
  });
  
  const avgStreak = habits.length > 0 ? totalStreak / habits.length : 0;
  const activeRatio = habits.length > 0 ? activeHabits / habits.length : 0;
  
  return Math.min(1, (avgStreak / 14) * 0.6 + activeRatio * 0.4);
}

function calculateLifeZoneScore(lifeZones) {
  if (!lifeZones) return 50;
  
  const zones = ['health', 'socialEmotional', 'wealth', 'faith', 'family', 'community'];
  let total = 0;
  let count = 0;
  
  zones.forEach(zone => {
    if (lifeZones[zone]?.score !== undefined) {
      total += lifeZones[zone].score;
      count++;
    }
  });
  
  return count > 0 ? total / count : 50;
}

function calculateStabilityFactor(historyDays) {
  if (historyDays < 3) return 0.4;
  if (historyDays < 7) return 0.6;
  if (historyDays < 14) return 0.75;
  if (historyDays < 30) return 0.9;
  return 1;
}

function calculateMetricMomentum(metricTrends) {
  if (!metricTrends) return 0;
  
  let momentum = 0;
  const weights = { activity: 0.3, nutrition: 0.25, sleep: 0.25, stress: 0.2 };
  
  Object.entries(weights).forEach(([metric, weight]) => {
    if (metricTrends[metric]?.change != null) {
      let change = metricTrends[metric].change;
      if (metric === 'stress') change = -change;
      const normalizedChange = Math.max(-1, Math.min(1, change / 2));
      momentum += normalizedChange * weight;
    }
  });
  
  return momentum;
}

function getProjectionStatus(score) {
  if (score >= 80) return 'thriving';
  if (score >= 70) return 'strong';
  if (score >= 60) return 'improving';
  if (score >= 50) return 'stable';
  if (score >= 40) return 'attention';
  return 'critical';
}

function getStatusLabel(status) {
  const labels = {
    thriving: 'Peak Performance',
    strong: 'Strong Progress',
    improving: 'Improving',
    stable: 'Maintaining',
    attention: 'Needs Focus',
    critical: 'Action Required'
  };
  return labels[status] || 'Unknown';
}

function getStatusEmoji(status) {
  const emojis = {
    thriving: '⭐',
    strong: '💪',
    improving: '📈',
    stable: '⚖️',
    attention: '🎯',
    critical: '❗'
  };
  return emojis[status] || '📊';
}

function calculateConfidence(historyDays, habitCount) {
  const historyConfidence = Math.min(historyDays / 30, 1) * 0.6;
  const habitConfidence = Math.min(habitCount / 5, 1) * 0.4;
  return Math.round((historyConfidence + habitConfidence) * 100);
}

function getTrajectory(predictions) {
  const change30 = predictions[30].change;
  const change180 = predictions[180].change;
  
  if (change180 > 10 && change30 > 2) return 'accelerating';
  if (change180 > 5) return 'growing';
  if (change180 > 0) return 'improving';
  if (change180 > -5) return 'stable';
  if (change180 > -10) return 'declining';
  return 'critical';
}

export function getMotivationalMessage(predictions) {
  if (!predictions) {
    return "Keep tracking your habits to unlock future insights!";
  }

  const day180 = predictions[180];
  const trajectory = predictions.trajectory;
  
  if (trajectory === 'accelerating') {
    return "Outstanding momentum! Your dedication is building lasting strength. ⭐";
  }
  
  if (trajectory === 'growing') {
    if (day180.score >= 80) {
      return "Stay consistent — your health is strengthening! 💪";
    }
    return "Excellent progress — you're on the path to peak vitality! 📈";
  }
  
  if (trajectory === 'improving') {
    return "Small steps today, big changes tomorrow — keep building! 🎯";
  }
  
  if (trajectory === 'stable') {
    if (day180.score >= 60) {
      return "Consistency is key — you're maintaining good habits! ⚖️";
    }
    return "Ready for the next level? Try adding one new healthy habit. 🌱";
  }
  
  if (trajectory === 'declining') {
    return "Time to refocus — small changes can reverse this path! 🔄";
  }
  
  return "Every day is a new opportunity to build your future self! 💪";
}

export function getInsightMessage(predictions, factors) {
  if (!predictions || !factors) return [];

  const insights = [];
  
  if (factors.habitConsistency >= 70) {
    insights.push({ type: 'positive', text: 'Your habit streaks are boosting your future projection', emoji: '🔥' });
  } else if (factors.habitConsistency < 30 && factors.habitConsistency > 0) {
    insights.push({ type: 'tip', text: 'Building consistent habits will accelerate your progress', emoji: '💡' });
  }
  
  if (factors.lifeZoneAverage >= 70) {
    insights.push({ type: 'positive', text: 'Your Life Zones are well-balanced', emoji: '⚖️' });
  } else if (factors.lifeZoneAverage < 50) {
    insights.push({ type: 'tip', text: 'Focus on your weaker Life Zones for balanced growth', emoji: '🎯' });
  }
  
  if (factors.dataStability >= 80) {
    insights.push({ type: 'positive', text: 'Your consistent tracking improves prediction accuracy', emoji: '📊' });
  } else if (factors.dataStability < 50) {
    insights.push({ type: 'tip', text: 'More daily logs will improve your future projections', emoji: '📝' });
  }
  
  return insights;
}
