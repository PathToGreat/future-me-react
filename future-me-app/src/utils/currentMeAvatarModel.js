/**
 * Current Me Avatar Model
 * 
 * Calculates avatar state for "Current Me" based ONLY on:
 * 1. Onboarding assessment baseline (primary source)
 * 2. Slow drift mechanism from long-term consistency (30+ days)
 * 
 * Daily logs do NOT directly affect Current Me.
 * Only voluntary reassessment or sustained behavior (30+ days) can change Current Me.
 */

const SLOW_DRIFT_THRESHOLD_DAYS = 30;
const MAX_SLOW_DRIFT_ADJUSTMENT = 0.5;

/**
 * Calculate consistency score from history data
 * Returns 0-1 indicating how consistent the user has been
 * @param {Array} historyData - Daily log history
 * @param {string} metric - Metric to check (activity, nutrition, sleep, stress)
 * @returns {Object} { isConsistent, averageValue, daysTracked, trend }
 */
const calculateMetricConsistency = (historyData, metric) => {
  if (!historyData || historyData.length < 7) {
    return { isConsistent: false, averageValue: null, daysTracked: 0, trend: 0 };
  }

  const values = historyData
    .filter(d => d[metric] !== undefined && d[metric] !== null)
    .map(d => d[metric]);

  if (values.length < 7) {
    return { isConsistent: false, averageValue: null, daysTracked: values.length, trend: 0 };
  }

  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const isConsistent = stdDev < 1.0;
  
  const recentAvg = values.slice(0, Math.min(7, values.length)).reduce((s, v) => s + v, 0) / Math.min(7, values.length);
  const olderAvg = values.slice(-Math.min(7, values.length)).reduce((s, v) => s + v, 0) / Math.min(7, values.length);
  const trend = recentAvg - olderAvg;

  return {
    isConsistent,
    averageValue: average,
    daysTracked: values.length,
    trend,
    stdDev
  };
};

/**
 * Calculate slow drift adjustment based on long-term consistency
 * Only applies if user has 30+ days of consistent behavior
 * @param {Object} baseline - Original onboarding value
 * @param {Object} consistency - Consistency analysis for this metric
 * @returns {number} Adjustment to apply (small, gradual change)
 */
const calculateSlowDrift = (baselineValue, consistency) => {
  if (!consistency.isConsistent || consistency.daysTracked < SLOW_DRIFT_THRESHOLD_DAYS) {
    return 0;
  }

  const difference = consistency.averageValue - baselineValue;
  
  const consistencyFactor = Math.min(1, (consistency.daysTracked - SLOW_DRIFT_THRESHOLD_DAYS) / 60);
  
  const adjustment = difference * consistencyFactor * MAX_SLOW_DRIFT_ADJUSTMENT;
  
  return Math.max(-MAX_SLOW_DRIFT_ADJUSTMENT, Math.min(MAX_SLOW_DRIFT_ADJUSTMENT, adjustment));
};

/**
 * Calculate Current Me metrics based on baseline + slow drift
 * @param {Object} profile - User profile containing onboarding baseline
 * @param {Array} historyData - Daily log history (for slow drift calculation)
 * @returns {Object} Current Me metrics with slow drift applied
 */
export const calculateCurrentMeMetrics = (profile, historyData = []) => {
  if (!profile) {
    return {
      activity: 3,
      nutrition: 3,
      sleep: 3,
      stress: 3,
      lifestyleScore: 50,
      slowDriftApplied: false,
      source: 'default'
    };
  }

  const baseline = {
    activity: profile.onboardingBaseline?.activity ?? profile.activity ?? 3,
    nutrition: profile.onboardingBaseline?.nutrition ?? profile.nutrition ?? 3,
    sleep: profile.onboardingBaseline?.sleep ?? profile.sleep ?? 3,
    stress: profile.onboardingBaseline?.stress ?? profile.stress ?? 3,
  };

  const activityConsistency = calculateMetricConsistency(historyData, 'activity');
  const nutritionConsistency = calculateMetricConsistency(historyData, 'nutrition');
  const sleepConsistency = calculateMetricConsistency(historyData, 'sleep');
  const stressConsistency = calculateMetricConsistency(historyData, 'stress');

  const activityDrift = calculateSlowDrift(baseline.activity, activityConsistency);
  const nutritionDrift = calculateSlowDrift(baseline.nutrition, nutritionConsistency);
  const sleepDrift = calculateSlowDrift(baseline.sleep, sleepConsistency);
  const stressDrift = calculateSlowDrift(baseline.stress, stressConsistency);

  const slowDriftApplied = activityDrift !== 0 || nutritionDrift !== 0 || sleepDrift !== 0 || stressDrift !== 0;

  const currentMeMetrics = {
    activity: Math.max(1, Math.min(5, baseline.activity + activityDrift)),
    nutrition: Math.max(1, Math.min(5, baseline.nutrition + nutritionDrift)),
    sleep: Math.max(1, Math.min(5, baseline.sleep + sleepDrift)),
    stress: Math.max(1, Math.min(5, baseline.stress + stressDrift)),
  };

  const lifestyleScore = ((currentMeMetrics.activity + currentMeMetrics.nutrition + currentMeMetrics.sleep + (5 - currentMeMetrics.stress)) / 16) * 100;

  const driftDetails = slowDriftApplied ? {
    activity: { baseline: baseline.activity, drift: activityDrift, consistency: activityConsistency },
    nutrition: { baseline: baseline.nutrition, drift: nutritionDrift, consistency: nutritionConsistency },
    sleep: { baseline: baseline.sleep, drift: sleepDrift, consistency: sleepConsistency },
    stress: { baseline: baseline.stress, drift: stressDrift, consistency: stressConsistency },
  } : null;

  return {
    ...currentMeMetrics,
    lifestyleScore: Math.round(lifestyleScore),
    slowDriftApplied,
    driftDetails,
    source: slowDriftApplied ? 'baseline+drift' : 'baseline'
  };
};

/**
 * Calculate Current Me avatar effects
 * Uses onboarding baseline data + slow drift for visual effects
 * @param {Object} profile - User profile
 * @param {Array} historyData - Daily log history
 * @param {Array} habits - User habits
 * @param {string} gender - User gender
 * @returns {Object} Parameters for computeAvatarEffects
 */
export const getCurrentMeAvatarParams = (profile, historyData = [], habits = [], gender = 'male') => {
  const currentMeMetrics = calculateCurrentMeMetrics(profile, historyData);
  
  const habitStreaks = habits.map(h => h.streak || 0);
  const maxStreak = habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;
  const avgStreak = habitStreaks.length > 0 
    ? habitStreaks.reduce((sum, s) => sum + s, 0) / habitStreaks.length 
    : 0;
  const disciplineScore = Math.min(5, 1 + (avgStreak / 10) * 4);
  const consistencyScore = habitStreaks.length > 0 ? Math.min(1, avgStreak / 14) : 0.5;

  const baselineData = {
    baselineState: profile?.baselineState,
    lifestyleRhythm: profile?.lifestyleRhythm,
    emotionalProfile: profile?.emotionalProfile,
    faithPurpose: profile?.faithPurpose
  };

  return {
    activityScore: currentMeMetrics.activity,
    nutritionScore: currentMeMetrics.nutrition,
    sleepScore: currentMeMetrics.sleep,
    stressScore: currentMeMetrics.stress,
    disciplineScore,
    streakDays: maxStreak,
    consistencyScore,
    gender,
    baselineData,
    _currentMeMetrics: currentMeMetrics
  };
};

/**
 * Get description of Current Me state changes
 * @param {Object} currentMeMetrics - Result from calculateCurrentMeMetrics
 * @returns {Object} Description for UI
 */
export const getCurrentMeDescription = (currentMeMetrics) => {
  if (!currentMeMetrics) {
    return {
      primary: "This is your current self based on your lifestyle assessment.",
      secondary: "Complete the assessment to see your baseline.",
      showDriftIndicator: false
    };
  }

  if (currentMeMetrics.slowDriftApplied) {
    return {
      primary: "This is your current self, reflecting gradual changes from consistent habits.",
      secondary: "Your sustained effort over 30+ days is starting to shape your baseline.",
      showDriftIndicator: true,
      driftDetails: currentMeMetrics.driftDetails
    };
  }

  return {
    primary: "This is your current self based on your lifestyle assessment.",
    secondary: "Your avatar reflects your baseline wellness state from onboarding.",
    showDriftIndicator: false
  };
};

export default {
  calculateCurrentMeMetrics,
  getCurrentMeAvatarParams,
  getCurrentMeDescription,
  SLOW_DRIFT_THRESHOLD_DAYS
};
