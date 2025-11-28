/**
 * Smart Reassessment Suggestion System
 * 
 * Monitors long-term trends in daily logs and recommends an updated assessment
 * only when meaningful change has occurred.
 * 
 * A "meaningful shift" equals:
 * - At least 20% improvement or decline from original baseline
 * - Sustained for 21 out of the last 30 days
 */

const SHIFT_THRESHOLD_PERCENT = 0.20;
const SUSTAINED_DAYS_REQUIRED = 21;
const ANALYSIS_WINDOW_DAYS = 30;
const REASSESSMENT_COOLDOWN_DAYS = 30;
const DISMISS_DURATION_DAYS = 7;

/**
 * Tracked metrics with their baseline sources
 * Maps metric names to their baseline locations in user profile
 */
const TRACKED_METRICS = {
  activity: {
    baselineKey: 'onboardingBaseline.activity',
    fallbackKey: 'activity',
    defaultValue: 3,
    isRhythm: false,
    scale: { min: 1, max: 5 }
  },
  nutrition: {
    baselineKey: 'onboardingBaseline.nutrition',
    fallbackKey: 'nutrition',
    defaultValue: 3,
    isRhythm: false,
    scale: { min: 1, max: 5 }
  },
  sleep: {
    baselineKey: 'onboardingBaseline.sleep',
    fallbackKey: 'sleep',
    defaultValue: 3,
    isRhythm: false,
    scale: { min: 1, max: 5 }
  },
  stress: {
    baselineKey: 'onboardingBaseline.stress',
    fallbackKey: 'stress',
    defaultValue: 3,
    isRhythm: false,
    scale: { min: 1, max: 5 },
    inverted: true
  },
  movementRhythm: {
    baselineKey: 'lifestyleRhythm.movement',
    defaultValue: 'moderate',
    isRhythm: true,
    rhythmValues: { light: 1, moderate: 2, intense: 3 }
  },
  eatingRhythm: {
    baselineKey: 'lifestyleRhythm.eating',
    defaultValue: 'regular',
    isRhythm: true,
    rhythmValues: { regular: 3, irregular: 2, snacking: 1 }
  },
  sleepRhythm: {
    baselineKey: 'lifestyleRhythm.sleep',
    defaultValue: 'consistent',
    isRhythm: true,
    rhythmValues: { consistent: 3, inconsistent: 2, irregular: 1 }
  },
  emotionalClimate: {
    baselineKey: 'emotionalProfile.climate',
    defaultValue: 'neutral',
    isRhythm: true,
    rhythmValues: { hopeful: 3, neutral: 2, overwhelmed: 1 }
  },
  motivation: {
    baselineKey: 'faithPurpose.motivation',
    fallbackKey: null,
    defaultValue: 3,
    isRhythm: false,
    scale: { min: 1, max: 5 }
  }
};

/**
 * Get nested property from object using dot notation
 */
const getNestedValue = (obj, path, defaultValue) => {
  if (!obj || !path) return defaultValue;
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return defaultValue;
    value = value[key];
  }
  return value !== undefined && value !== null ? value : defaultValue;
};

/**
 * Get baseline value for a specific metric from user profile
 */
const getBaselineValue = (profile, metricConfig) => {
  let value = getNestedValue(profile, metricConfig.baselineKey, null);
  
  if (value === null && metricConfig.fallbackKey) {
    value = getNestedValue(profile, metricConfig.fallbackKey, null);
  }
  
  if (value === null) {
    value = metricConfig.defaultValue;
  }
  
  if (metricConfig.isRhythm && typeof value === 'string') {
    return metricConfig.rhythmValues[value] || 2;
  }
  
  return value;
};

/**
 * Calculate the percentage shift between baseline and current value
 * @returns {number} Positive = improvement, Negative = decline
 */
const calculateShiftPercent = (baseline, current, metricConfig) => {
  const range = metricConfig.isRhythm 
    ? 2  
    : (metricConfig.scale?.max - metricConfig.scale?.min) || 4;
  
  let difference = current - baseline;
  
  if (metricConfig.inverted) {
    difference = -difference;
  }
  
  return difference / range;
};

/**
 * Analyze a single metric for meaningful shift
 * @param {Object} profile - User profile with baseline data
 * @param {Array} historyData - Daily log history (last 30 days)
 * @param {string} metricName - Name of the metric to analyze
 * @returns {Object} Analysis result for this metric
 */
const analyzeMetricShift = (profile, historyData, metricName) => {
  const config = TRACKED_METRICS[metricName];
  if (!config) {
    return { metricName, hasShift: false, reason: 'unknown_metric' };
  }

  const baselineValue = getBaselineValue(profile, config);
  
  const relevantLogs = historyData
    .filter(log => log[metricName] !== undefined && log[metricName] !== null)
    .slice(0, ANALYSIS_WINDOW_DAYS);

  if (relevantLogs.length < SUSTAINED_DAYS_REQUIRED) {
    return {
      metricName,
      hasShift: false,
      reason: 'insufficient_data',
      daysAvailable: relevantLogs.length,
      daysRequired: SUSTAINED_DAYS_REQUIRED,
      baselineValue
    };
  }

  let daysWithShift = 0;
  let totalShift = 0;
  let shiftDirection = null;

  relevantLogs.forEach(log => {
    let logValue = log[metricName];
    
    if (config.isRhythm && typeof logValue === 'string') {
      logValue = config.rhythmValues[logValue] || 2;
    }
    
    const shiftPercent = calculateShiftPercent(baselineValue, logValue, config);
    
    if (Math.abs(shiftPercent) >= SHIFT_THRESHOLD_PERCENT) {
      daysWithShift++;
      totalShift += shiftPercent;
      
      if (shiftDirection === null) {
        shiftDirection = shiftPercent > 0 ? 'improvement' : 'decline';
      }
    }
  });

  const hasMeaningfulShift = daysWithShift >= SUSTAINED_DAYS_REQUIRED;
  const averageShiftPercent = daysWithShift > 0 ? totalShift / daysWithShift : 0;

  return {
    metricName,
    hasShift: hasMeaningfulShift,
    baselineValue,
    daysWithShift,
    daysAnalyzed: relevantLogs.length,
    daysRequired: SUSTAINED_DAYS_REQUIRED,
    averageShiftPercent: Math.round(averageShiftPercent * 100),
    shiftDirection: hasMeaningfulShift ? shiftDirection : null,
    thresholdPercent: SHIFT_THRESHOLD_PERCENT * 100
  };
};

/**
 * Get all daily log data combined for analysis
 * Combines health zone logs with other zone data where applicable
 */
const combineLogsForAnalysis = (historyData, zoneHistories = {}) => {
  const healthLogs = zoneHistories?.health || historyData || [];
  
  const combinedLogs = healthLogs.map(healthLog => {
    const date = healthLog.date || healthLog.id;
    
    return {
      ...healthLog,
      date
    };
  });

  return combinedLogs.slice(0, ANALYSIS_WINDOW_DAYS);
};

/**
 * Check if user has already reassessed within the cooldown period
 */
const isWithinCooldownPeriod = (profile) => {
  const lastReassessment = profile?.lastReassessmentDate;
  if (!lastReassessment) return false;
  
  const lastDate = new Date(lastReassessment);
  const now = new Date();
  const daysSinceReassessment = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  
  return daysSinceReassessment < REASSESSMENT_COOLDOWN_DAYS;
};

/**
 * Check if the banner was dismissed and still within dismiss period
 */
const isBannerDismissed = (profile) => {
  const dismissedUntil = profile?.reassessmentDismissedUntil;
  if (!dismissedUntil) return false;
  
  const dismissDate = new Date(dismissedUntil);
  const now = new Date();
  
  return now < dismissDate;
};

/**
 * Main analysis function - checks all metrics for meaningful shifts
 * @param {Object} profile - User profile with baseline data
 * @param {Array} historyData - Daily log history
 * @param {Object} zoneHistories - Optional zone-specific histories
 * @returns {Object} Complete analysis with recommendation
 */
export const analyzeReassessmentNeed = (profile, historyData = [], zoneHistories = {}) => {
  if (!profile) {
    return {
      shouldSuggestReassessment: false,
      reason: 'no_profile',
      metrics: [],
      summary: null
    };
  }

  if (!profile.onboardingCompleted) {
    return {
      shouldSuggestReassessment: false,
      reason: 'onboarding_not_completed',
      metrics: [],
      summary: null
    };
  }

  if (isWithinCooldownPeriod(profile)) {
    const lastDate = new Date(profile.lastReassessmentDate);
    const daysRemaining = REASSESSMENT_COOLDOWN_DAYS - Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    return {
      shouldSuggestReassessment: false,
      reason: 'cooldown_active',
      cooldownDaysRemaining: daysRemaining,
      metrics: [],
      summary: null
    };
  }

  if (isBannerDismissed(profile)) {
    const dismissDate = new Date(profile.reassessmentDismissedUntil);
    const daysRemaining = Math.ceil((dismissDate - new Date()) / (1000 * 60 * 60 * 24));
    return {
      shouldSuggestReassessment: false,
      reason: 'banner_dismissed',
      dismissDaysRemaining: daysRemaining,
      metrics: [],
      summary: null
    };
  }

  const combinedLogs = combineLogsForAnalysis(historyData, zoneHistories);
  
  if (combinedLogs.length < SUSTAINED_DAYS_REQUIRED) {
    return {
      shouldSuggestReassessment: false,
      reason: 'insufficient_history',
      daysLogged: combinedLogs.length,
      daysRequired: SUSTAINED_DAYS_REQUIRED,
      metrics: [],
      summary: null
    };
  }

  const coreMetrics = ['activity', 'nutrition', 'sleep', 'stress'];
  const metricAnalyses = coreMetrics.map(metricName => 
    analyzeMetricShift(profile, combinedLogs, metricName)
  );

  const metricsWithShift = metricAnalyses.filter(m => m.hasShift);
  const hasAnyMeaningfulShift = metricsWithShift.length > 0;

  const improvements = metricsWithShift.filter(m => m.shiftDirection === 'improvement');
  const declines = metricsWithShift.filter(m => m.shiftDirection === 'decline');

  let summaryMessage = null;
  if (hasAnyMeaningfulShift) {
    if (improvements.length > 0 && declines.length === 0) {
      summaryMessage = `Strong improvements detected in ${improvements.map(m => formatMetricName(m.metricName)).join(', ')}.`;
    } else if (declines.length > 0 && improvements.length === 0) {
      summaryMessage = `Changes detected in ${declines.map(m => formatMetricName(m.metricName)).join(', ')} that may need attention.`;
    } else {
      summaryMessage = `Significant lifestyle changes detected across multiple areas.`;
    }
  }

  return {
    shouldSuggestReassessment: hasAnyMeaningfulShift,
    reason: hasAnyMeaningfulShift ? 'meaningful_shift_detected' : 'no_significant_change',
    metrics: metricAnalyses,
    metricsWithShift: metricsWithShift.map(m => m.metricName),
    improvements: improvements.map(m => m.metricName),
    declines: declines.map(m => m.metricName),
    summary: summaryMessage,
    analysisDate: new Date().toISOString(),
    daysAnalyzed: combinedLogs.length
  };
};

/**
 * Format metric name for display
 */
const formatMetricName = (metricName) => {
  const nameMap = {
    activity: 'Physical Activity',
    nutrition: 'Nutrition',
    sleep: 'Sleep Quality',
    stress: 'Stress Management',
    movementRhythm: 'Movement Rhythm',
    eatingRhythm: 'Eating Rhythm',
    sleepRhythm: 'Sleep Rhythm',
    emotionalClimate: 'Emotional Climate',
    motivation: 'Motivation'
  };
  return nameMap[metricName] || metricName;
};

/**
 * Calculate the date when dismiss expires
 */
export const calculateDismissUntilDate = () => {
  const dismissDate = new Date();
  dismissDate.setDate(dismissDate.getDate() + DISMISS_DURATION_DAYS);
  return dismissDate.toISOString();
};

/**
 * Get current reassessment date for storing after completion
 */
export const getCurrentReassessmentDate = () => {
  return new Date().toISOString();
};

export const REASSESSMENT_CONFIG = {
  SHIFT_THRESHOLD_PERCENT,
  SUSTAINED_DAYS_REQUIRED,
  ANALYSIS_WINDOW_DAYS,
  REASSESSMENT_COOLDOWN_DAYS,
  DISMISS_DURATION_DAYS
};

export default {
  analyzeReassessmentNeed,
  calculateDismissUntilDate,
  getCurrentReassessmentDate,
  REASSESSMENT_CONFIG
};
