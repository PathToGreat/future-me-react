const PTG_SUGGESTION_TEMPLATES = {
  sleep: {
    belowBaseline: [
      "Sleep duration logged at {current} hours. Baseline is {baseline} hours. That takes self-discipline to keep tracking consistently.",
      "Sleep score below baseline. Awareness of impact takes self-reflection.",
      "Sleep duration slightly improved over the week. Observing this trend takes persistence."
    ],
    variable: [
      "Sleep consistency shows a {variance}-hour variance. Maintaining awareness here takes commitment.",
      "Sleep latency logged accurately. Tracking subtle patterns takes persistence."
    ],
    consistent: [
      "Sleep consistency stable for 5 nights. Sustaining patterns takes discipline.",
      "Sleep quality better than yesterday. Observing patterns takes attention."
    ],
    improving: [
      "Sleep duration slightly improved over the week. Observing this trend takes persistence.",
      "Sleep quality better than yesterday. Observing patterns takes attention."
    ],
    combined: {
      lowActivity: "Low sleep + moderate activity affected morning energy. Observing patterns like this takes self-awareness.",
      highStress: "Sleep was lighter during a higher-stress period. Awareness of these connections takes self-reflection.",
      goodFaith: "Good sleep + consistent faith practice correlated with stronger positive glow. Maintaining these practices takes effort and intention."
    }
  },

  activity: {
    belowBaseline: [
      "Activity logged as {current}. Baseline: {baseline}. That shows focus on movement today.",
      "Activity duration slightly lower than baseline. Observing adjustments reflects attentiveness.",
      "Activity log skipped a planned session. Observing lapses reflects attentiveness."
    ],
    consistent: [
      "Moderate activity today. Keeping routines steady requires commitment.",
      "Activity intensity matched planned level. Keeping consistent demonstrates focus.",
      "Movement rhythm consistent today. Maintaining routines reflects self-discipline."
    ],
    improving: [
      "Activity streak maintained for 3 consecutive days. Sustaining routines like this takes commitment.",
      "Movement today aligned with energy levels. Following through demonstrates discipline."
    ],
    variable: [
      "Movement rhythm today differs from baseline. Adapting routines like this requires self-discipline."
    ],
    combined: {
      lowSleep: "Low sleep + moderate activity affected morning energy. Observing patterns like this takes self-awareness."
    }
  },

  nutrition: {
    belowBaseline: [
      "Nutrition quality: {current}/5. Baseline: {baseline}/5. Staying mindful of intake takes persistence.",
      "Nutrition intake slightly better than yesterday. Noticing incremental improvements takes awareness."
    ],
    consistent: [
      "Nutrition log complete for all meals. Following through on this takes persistence.",
      "Nutrition entries show lower sodium intake. Tracking choices like this demonstrates consistency."
    ],
    improving: [
      "Nutrition intake slightly better than yesterday. Noticing incremental improvements takes awareness.",
      "Nutrition quality was one of the stronger inputs today. Tracking positive patterns takes persistence."
    ],
    combined: {
      goodActivity: "Nutrition intake balanced with activity today. Observing these synergies takes self-reflection."
    }
  },

  stress: {
    elevated: [
      "Stress level today: {current}/5. Baseline: {baseline}/5. Keeping track of stressors demonstrates attentiveness.",
      "Stress today slightly higher than usual. Awareness of stress patterns takes attentiveness.",
      "Stressor logged today. Recognizing triggers takes self-reflection."
    ],
    managed: [
      "Low stress period detected. Maintaining awareness takes self-discipline.",
      "Stress recovery exercises logged. Tracking self-care like this reflects awareness."
    ],
    improving: [
      "Stress level trending lower over past 3 days. Observing changes demonstrates consistency.",
      "Evening stress recovery shows delayed improvement. Noticing this trend takes self-reflection."
    ]
  },

  emotional: {
    neutral: [
      "Emotional climate reported as hopeful. Monitoring mood consistently takes awareness.",
      "Emotional climate neutral. Recognizing patterns over time demonstrates self-reflection.",
      "Emotional support interaction logged. Observing social patterns takes attentiveness."
    ],
    stable: [
      "Motivation rating steady. Tracking internal state demonstrates attentiveness."
    ],
    variable: [
      "Body tension reported lower than baseline. Observing improvement reflects consistency."
    ]
  },

  faith: {
    consistent: [
      "Faith practice logged consistently. Maintaining awareness like this requires discipline.",
      "Faith or purpose practice observed. Tracking engagement demonstrates awareness."
    ],
    combined: {
      goodSleep: "Good sleep + consistent faith practice correlated with stronger positive glow. Maintaining these practices takes effort and intention."
    }
  },

  energy: {
    low: [
      "Morning fatigue noted. Awareness of how it changes over time reflects self-reflection."
    ],
    improving: [
      "Morning energy higher than yesterday. Observing fluctuations takes awareness.",
      "Morning energy aligned with sleep score. Tracking these interactions takes persistence."
    ]
  },

  routine: {
    partial: [
      "Evening wind-down missed. Recognizing this gap takes attentiveness.",
      "Evening routine followed partially. Noticing adjustments reflects attentiveness."
    ],
    completed: [
      "Evening wind-down completed. Following routines reflects persistence."
    ]
  },

  combined: {
    lowEnergySleepIssue: [
      "Low sleep + moderate activity affected morning energy. Observing patterns like this takes self-awareness.",
      "Morning energy aligned with sleep score. Tracking these interactions takes persistence."
    ],
    balancedPositive: [
      "Nutrition and activity aligned today. Observing these synergies takes self-reflection.",
      "Nutrition intake balanced with activity today. Tracking combined patterns takes persistence.",
      "Activity and nutrition both met or exceeded baseline. Consistent logging takes discipline."
    ],
    multipleStressors: [
      "Multiple areas show signs of strain today. Tracking these patterns takes awareness and discipline.",
      "Several metrics are below baseline. Continuing to track despite challenges takes persistence."
    ],
    overallImproving: [
      "Sleep, activity, and nutrition show positive synergy today. Monitoring combined effects takes reflection.",
      "Multiple metrics are improving. Your consistent tracking efforts demonstrate discipline."
    ],
    overallComplete: [
      "Overall tracking completed today. Keeping consistency like this takes effort and discipline."
    ]
  }
};

const SUGGESTION_TEMPLATES = PTG_SUGGESTION_TEMPLATES;

const METRIC_SOURCE_LABELS = {
  sleep: 'Based on your sleep log today',
  activity: 'Based on your activity log today',
  nutrition: 'Based on your nutrition log today',
  stress: 'Based on your stress log today',
  emotional: 'Based on your emotional log today',
  faith: 'Based on your faith practice today',
  energy: 'Based on your energy log today',
  routine: 'Based on your evening routine today',
  combined: 'Based on multiple metrics today'
};

let recentlyShownSuggestions = new Map();
let suggestionHistoryCache = new Map();
const ROTATION_WINDOW_HOURS = 24;

function hashSuggestion(suggestion) {
  if (!suggestion || typeof suggestion !== 'string') return '';
  return suggestion.substring(0, 50).replace(/\d+\.?\d*/g, 'X');
}

function isRecentlyShown(suggestionHash, userId = 'default') {
  const key = `${userId}:${suggestionHash}`;
  const lastShown = recentlyShownSuggestions.get(key);
  if (!lastShown) return false;
  
  const hoursSinceShown = (Date.now() - lastShown) / (1000 * 60 * 60);
  return hoursSinceShown < ROTATION_WINDOW_HOURS;
}

function markAsShown(suggestionHash, userId = 'default') {
  const key = `${userId}:${suggestionHash}`;
  recentlyShownSuggestions.set(key, Date.now());
  
  for (const [mapKey, timestamp] of recentlyShownSuggestions.entries()) {
    const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursSince > ROTATION_WINDOW_HOURS * 2) {
      recentlyShownSuggestions.delete(mapKey);
    }
  }
}

export function loadSuggestionHistory(historyData) {
  if (!historyData || !historyData.shownSuggestions) return;
  
  const now = Date.now();
  const cutoffTime = now - (ROTATION_WINDOW_HOURS * 60 * 60 * 1000);
  
  for (const [hash, timestamp] of Object.entries(historyData.shownSuggestions)) {
    if (timestamp > cutoffTime) {
      recentlyShownSuggestions.set(hash, timestamp);
    }
  }
}

export function getSuggestionHistoryForPersistence(userId) {
  const history = {};
  const now = Date.now();
  const cutoffTime = now - (ROTATION_WINDOW_HOURS * 60 * 60 * 1000);
  
  for (const [key, timestamp] of recentlyShownSuggestions.entries()) {
    if (key.startsWith(`${userId}:`) && timestamp > cutoffTime) {
      history[key] = timestamp;
    }
  }
  
  return {
    shownSuggestions: history,
    lastUpdated: new Date().toISOString(),
    userId
  };
}

function getRotatedTemplate(templates, values, userId = 'default') {
  if (!templates || templates.length === 0) return null;
  
  const availableTemplates = templates.filter(template => {
    const interpolated = interpolateTemplate(template, values);
    const hash = hashSuggestion(interpolated);
    return !isRecentlyShown(hash, userId);
  });
  
  const pool = availableTemplates.length > 0 ? availableTemplates : templates;
  
  const selected = pool[Math.floor(Math.random() * pool.length)];
  const interpolated = interpolateTemplate(selected, values);
  
  markAsShown(hashSuggestion(interpolated), userId);
  
  return interpolated;
}

function getRandomTemplate(templates) {
  if (!templates || templates.length === 0) return null;
  return templates[Math.floor(Math.random() * templates.length)];
}

function interpolateTemplate(template, values) {
  if (!template || typeof template !== 'string') return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (values.hasOwnProperty(key)) {
      const value = values[key];
      if (typeof value === 'number') {
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
      }
      return value;
    }
    return match;
  });
}

function getTemplateWithValues(templates, values, userId = 'default') {
  return getRotatedTemplate(templates, values, userId);
}

function calculateMovingAverage(logs, metric, days = 7) {
  if (!logs || logs.length === 0) return null;
  const recentLogs = logs.slice(0, Math.min(days, logs.length));
  const values = recentLogs
    .map(l => l[metric])
    .filter(v => v !== null && v !== undefined && typeof v === 'number');
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateVariance(logs, metric) {
  if (!logs || logs.length < 3) return null;
  const values = logs
    .map(l => l[metric])
    .filter(v => v !== null && v !== undefined && typeof v === 'number');
  if (values.length < 3) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function compareToBaseline(current, baseline, threshold = 0.5) {
  if (current === null || current === undefined || baseline === null || baseline === undefined) {
    return 'unknown';
  }
  const diff = current - baseline;
  if (diff < -threshold) return 'below';
  if (diff > threshold) return 'above';
  return 'consistent';
}

function compareTo7Day(current, avg7Day, threshold = 0.3) {
  if (current === null || avg7Day === null) return 'unknown';
  const diff = current - avg7Day;
  if (diff < -threshold) return 'below';
  if (diff > threshold) return 'above';
  return 'consistent';
}

function detectCombinedPatterns(currentLog, baseline, avg7Day) {
  const patterns = [];
  
  const sleep = currentLog.sleep;
  const activity = currentLog.activity;
  const nutrition = currentLog.nutrition;
  const stress = currentLog.stress;
  
  const baselineSleep = baseline?.sleep;
  const baselineActivity = baseline?.activity;
  const baselineNutrition = baseline?.nutrition;
  const baselineStress = baseline?.stress;
  
  if (sleep !== undefined && activity !== undefined) {
    if (sleep < (baselineSleep || 3) - 0.5 && activity < (baselineActivity || 3) - 0.5) {
      patterns.push('lowEnergySleepIssue');
    }
  }
  
  if (nutrition !== undefined && activity !== undefined) {
    if (nutrition >= (baselineNutrition || 3) && activity >= (baselineActivity || 3)) {
      patterns.push('balancedPositive');
    }
  }
  
  if (stress !== undefined && sleep !== undefined) {
    if (stress > (baselineStress || 3) + 0.5 && sleep < (baselineSleep || 3) - 0.5) {
      patterns.push('stressSleepInteraction');
    }
  }
  
  let belowBaselineCount = 0;
  const metrics = ['sleep', 'activity', 'nutrition'];
  for (const metric of metrics) {
    const current = currentLog[metric];
    const baseVal = baseline?.[metric];
    if (current !== undefined && baseVal !== undefined && current < baseVal - 0.5) {
      belowBaselineCount++;
    }
  }
  if (belowBaselineCount >= 2) {
    patterns.push('multipleStressors');
  }
  
  let improvingCount = 0;
  for (const metric of metrics) {
    const current = currentLog[metric];
    const avgVal = avg7Day?.[metric];
    if (current !== undefined && avgVal !== undefined && current > avgVal + 0.3) {
      improvingCount++;
    }
  }
  if (improvingCount >= 2) {
    patterns.push('overallImproving');
  }
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    patterns.push('weekendContext');
  }
  
  const loggedMetrics = ['sleep', 'activity', 'nutrition', 'stress'].filter(
    metric => currentLog[metric] !== undefined && currentLog[metric] !== null
  );
  if (loggedMetrics.length >= 3) {
    patterns.push('overallComplete');
  }
  
  return patterns;
}

function generateSingleMetricSuggestion(metric, currentValue, baselineValue, avg7Day, logs7Day, userId = 'default') {
  const isStressMetric = metric === 'stress';
  
  const baselineComparison = compareToBaseline(
    currentValue, 
    baselineValue, 
    0.5
  );
  
  const weekComparison = compareTo7Day(currentValue, avg7Day, 0.3);
  
  const variance = calculateVariance(logs7Day, metric);
  const isVariable = variance !== null && variance > 1.0;
  
  const templates = SUGGESTION_TEMPLATES[metric];
  if (!templates) return null;
  
  const templateValues = {
    current: currentValue,
    baseline: baselineValue,
    average: avg7Day,
    variance: variance ? variance.toFixed(1) : '0'
  };
  
  if (isStressMetric) {
    if (baselineComparison === 'above' || weekComparison === 'above') {
      return getTemplateWithValues(templates.elevated, templateValues, userId);
    }
    if (baselineComparison === 'below' || weekComparison === 'below') {
      return getTemplateWithValues(templates.improving, templateValues, userId);
    }
    return getTemplateWithValues(templates.managed, templateValues, userId);
  }
  
  if (baselineComparison === 'below') {
    return getTemplateWithValues(templates.belowBaseline, templateValues, userId);
  }
  
  if (weekComparison === 'below' && templates.below7Day) {
    return getTemplateWithValues(templates.below7Day, templateValues, userId);
  }
  
  if (metric === 'sleep' && isVariable && templates.variable) {
    return getTemplateWithValues(templates.variable, templateValues, userId);
  }
  
  if (baselineComparison === 'above' || weekComparison === 'above') {
    if (templates.improving) {
      return getTemplateWithValues(templates.improving, templateValues, userId);
    }
  }
  
  if (templates.consistent) {
    return getTemplateWithValues(templates.consistent, templateValues, userId);
  }
  
  return getRandomTemplate(templates.belowBaseline || []);
}

function generateCombinedSuggestion(patterns, currentLog, baseline) {
  if (patterns.length === 0) return null;
  
  const combinedTemplates = SUGGESTION_TEMPLATES.combined;
  if (!combinedTemplates) return null;
  
  if (patterns.includes('lowEnergySleepIssue')) {
    return getRandomTemplate(combinedTemplates.lowEnergySleepIssue);
  }
  
  if (patterns.includes('multipleStressors')) {
    return getRandomTemplate(combinedTemplates.multipleStressors);
  }
  
  if (patterns.includes('overallImproving')) {
    return getRandomTemplate(combinedTemplates.overallImproving);
  }
  
  if (patterns.includes('balancedPositive')) {
    return getRandomTemplate(combinedTemplates.balancedPositive);
  }
  
  if (patterns.includes('overallComplete')) {
    return getRandomTemplate(combinedTemplates.overallComplete);
  }
  
  return null;
}

function generateFaithSuggestion(faithData, baseline, userId = 'default') {
  const templates = SUGGESTION_TEMPLATES.faith;
  if (!templates) return null;
  
  if (!faithData) return null;
  
  const { motivation, purposeClarity, faithEngagement } = faithData;
  const baselineMotivation = baseline?.motivation || 3;
  const templateValues = { current: motivation, baseline: baselineMotivation };
  
  if (faithEngagement || purposeClarity === 'clear') {
    return getTemplateWithValues(templates.consistent, templateValues, userId);
  }
  
  return null;
}

function generateEmotionalSuggestion(emotionalData, baseline, userId = 'default') {
  const templates = SUGGESTION_TEMPLATES.emotional;
  if (!templates) return null;
  
  if (!emotionalData) return null;
  
  const { mood, emotionalClarity, eveningMood, emotionalSupport } = emotionalData;
  const baselineMood = baseline?.mood || 3;
  const moodValue = eveningMood || mood;
  const templateValues = { current: moodValue, baseline: baselineMood };
  
  if (emotionalSupport) {
    return getTemplateWithValues(templates.neutral, templateValues, userId);
  }
  
  if (moodValue !== undefined && moodValue > baselineMood + 0.5) {
    return getTemplateWithValues(templates.stable, templateValues, userId);
  }
  
  if (moodValue !== undefined) {
    return getTemplateWithValues(templates.neutral, templateValues, userId);
  }
  
  return null;
}

function generateEnergySuggestion(energyData, baseline, avg7Day, userId = 'default') {
  const templates = SUGGESTION_TEMPLATES.energy;
  if (!templates) return null;
  
  if (!energyData) return null;
  
  const { morningEnergy, energyLevel } = energyData;
  const energyValue = morningEnergy || energyLevel;
  const baselineEnergy = baseline?.morningEnergy || baseline?.energyLevel || 3;
  const templateValues = { current: energyValue, baseline: baselineEnergy };
  
  if (energyValue === undefined || energyValue === null) return null;
  
  if (energyValue < baselineEnergy - 0.5) {
    return getTemplateWithValues(templates.low, templateValues, userId);
  }
  
  if (energyValue > baselineEnergy + 0.3 || (avg7Day && energyValue > avg7Day + 0.3)) {
    return getTemplateWithValues(templates.improving, templateValues, userId);
  }
  
  return null;
}

function generateRoutineSuggestion(routineData, baseline, userId = 'default') {
  const templates = SUGGESTION_TEMPLATES.routine;
  if (!templates) return null;
  
  if (!routineData) return null;
  
  const { eveningWindDown, routineCompleted, windDownCompleted } = routineData;
  
  if (windDownCompleted || routineCompleted || eveningWindDown === 'completed') {
    return getTemplateWithValues(templates.completed, {}, userId);
  }
  
  if (eveningWindDown === 'partial' || eveningWindDown === 'missed') {
    return getTemplateWithValues(templates.partial, {}, userId);
  }
  
  return null;
}

export function generateMicroSuggestion(currentLog, baseline, last7DaysLogs = [], userId = 'default') {
  if (!currentLog) {
    return {
      primary: null,
      secondary: null,
      combined: null,
      metadata: { error: 'No current log data provided' }
    };
  }
  
  const baselineMetrics = baseline?.onboardingBaseline || baseline || {};
  
  const avg7Day = {
    activity: calculateMovingAverage(last7DaysLogs, 'activity'),
    nutrition: calculateMovingAverage(last7DaysLogs, 'nutrition'),
    sleep: calculateMovingAverage(last7DaysLogs, 'sleep'),
    stress: calculateMovingAverage(last7DaysLogs, 'stress')
  };
  
  const patterns = detectCombinedPatterns(currentLog, baselineMetrics, avg7Day);
  
  const suggestions = {};
  const metrics = ['activity', 'nutrition', 'sleep', 'stress'];
  
  for (const metric of metrics) {
    const currentValue = currentLog[metric];
    const baselineValue = baselineMetrics[metric];
    const avgValue = avg7Day[metric];
    
    if (currentValue !== undefined && currentValue !== null) {
      const suggestionText = generateSingleMetricSuggestion(metric, currentValue, baselineValue, avgValue, last7DaysLogs, userId);
      suggestions[metric] = {
        text: suggestionText,
        source: METRIC_SOURCE_LABELS[metric],
        currentValue,
        baselineValue,
        avg7Day: avgValue,
        comparison: compareToBaseline(currentValue, baselineValue)
      };
    }
  }
  
  let primarySuggestion = null;
  let secondarySuggestion = null;
  
  const priorityOrder = ['sleep', 'stress', 'activity', 'nutrition'];
  
  for (const metric of priorityOrder) {
    const suggestion = suggestions[metric];
    if (suggestion?.text && suggestion.comparison === 'below') {
      if (!primarySuggestion) {
        primarySuggestion = { metric, ...suggestion };
      } else if (!secondarySuggestion) {
        secondarySuggestion = { metric, ...suggestion };
        break;
      }
    }
  }
  
  if (!primarySuggestion) {
    for (const metric of priorityOrder) {
      const suggestion = suggestions[metric];
      if (suggestion?.text && suggestion.comparison === 'above') {
        primarySuggestion = { metric, ...suggestion };
        break;
      }
    }
  }
  
  if (!primarySuggestion) {
    for (const metric of priorityOrder) {
      const suggestion = suggestions[metric];
      if (suggestion?.text) {
        primarySuggestion = { metric, ...suggestion };
        break;
      }
    }
  }
  
  const combinedSuggestion = generateCombinedSuggestion(patterns, currentLog, baselineMetrics);
  
  const faithSuggestion = generateFaithSuggestion(
    currentLog.faith || currentLog,
    baselineMetrics.faith || baselineMetrics,
    userId
  );
  
  const emotionalSuggestion = generateEmotionalSuggestion(
    currentLog.emotional || currentLog,
    baselineMetrics.emotional || baselineMetrics,
    userId
  );
  
  const energySuggestion = generateEnergySuggestion(
    currentLog.energy || currentLog,
    baselineMetrics.energy || baselineMetrics,
    avg7Day.morningEnergy || avg7Day.energyLevel,
    userId
  );
  
  const routineSuggestion = generateRoutineSuggestion(
    currentLog.routine || currentLog,
    baselineMetrics.routine || baselineMetrics,
    userId
  );
  
  return {
    primary: primarySuggestion,
    secondary: secondarySuggestion,
    combined: combinedSuggestion ? { text: combinedSuggestion, source: METRIC_SOURCE_LABELS.combined, patterns } : null,
    faith: faithSuggestion ? { text: faithSuggestion, source: METRIC_SOURCE_LABELS.faith } : null,
    emotional: emotionalSuggestion ? { text: emotionalSuggestion, source: METRIC_SOURCE_LABELS.emotional } : null,
    energy: energySuggestion ? { text: energySuggestion, source: METRIC_SOURCE_LABELS.energy } : null,
    routine: routineSuggestion ? { text: routineSuggestion, source: METRIC_SOURCE_LABELS.routine } : null,
    allSuggestions: suggestions,
    metadata: {
      patternsDetected: patterns,
      avg7Day,
      generatedAt: new Date().toISOString(),
      userId
    }
  };
}

export function formatSuggestionForDisplay(suggestionResult) {
  const defaultMessage = "Your metrics today are consistent with your patterns. Consistency supports long-term progress.";
  
  const defaultResult = {
    summary: defaultMessage,
    source: 'Based on your daily tracking',
    details: [{
      type: 'general',
      text: defaultMessage,
      source: 'Based on your daily tracking',
      comparison: 'consistent'
    }],
    hasMore: false,
    generatedAt: new Date().toISOString()
  };
  
  if (!suggestionResult) {
    return defaultResult;
  }
  
  const { primary, combined, secondary } = suggestionResult;
  
  let mainText = '';
  let expandedDetails = [];
  
  let mainSource = null;
  
  if (combined?.text) {
    mainText = combined.text;
    mainSource = combined.source || METRIC_SOURCE_LABELS.combined;
    expandedDetails.push({
      type: 'combined',
      text: combined.text,
      source: combined.source || METRIC_SOURCE_LABELS.combined,
      patterns: combined.patterns || []
    });
  } else if (primary?.text) {
    mainText = primary.text;
    mainSource = primary.source || METRIC_SOURCE_LABELS[primary.metric] || null;
    expandedDetails.push({
      type: primary.metric || 'general',
      text: primary.text,
      source: primary.source || METRIC_SOURCE_LABELS[primary.metric] || null,
      comparison: primary.comparison || 'consistent'
    });
  }
  
  if (secondary?.text && secondary.text !== mainText) {
    expandedDetails.push({
      type: secondary.metric || 'general',
      text: secondary.text,
      source: secondary.source || METRIC_SOURCE_LABELS[secondary.metric] || null,
      comparison: secondary.comparison || 'consistent'
    });
  }
  
  if (suggestionResult.faith?.text) {
    const faithDetail = {
      type: 'faith',
      text: suggestionResult.faith.text,
      source: suggestionResult.faith.source || METRIC_SOURCE_LABELS.faith
    };
    expandedDetails.push(faithDetail);
    if (!mainText) {
      mainText = suggestionResult.faith.text;
      mainSource = faithDetail.source;
    }
  }
  
  if (suggestionResult.emotional?.text) {
    const emotionalDetail = {
      type: 'emotional',
      text: suggestionResult.emotional.text,
      source: suggestionResult.emotional.source || METRIC_SOURCE_LABELS.emotional
    };
    expandedDetails.push(emotionalDetail);
    if (!mainText) {
      mainText = suggestionResult.emotional.text;
      mainSource = emotionalDetail.source;
    }
  }
  
  if (suggestionResult.energy?.text) {
    const energyDetail = {
      type: 'energy',
      text: suggestionResult.energy.text,
      source: suggestionResult.energy.source || METRIC_SOURCE_LABELS.energy
    };
    expandedDetails.push(energyDetail);
    if (!mainText) {
      mainText = suggestionResult.energy.text;
      mainSource = energyDetail.source;
    }
  }
  
  if (suggestionResult.routine?.text) {
    const routineDetail = {
      type: 'routine',
      text: suggestionResult.routine.text,
      source: suggestionResult.routine.source || METRIC_SOURCE_LABELS.routine
    };
    expandedDetails.push(routineDetail);
    if (!mainText) {
      mainText = suggestionResult.routine.text;
      mainSource = routineDetail.source;
    }
  }
  
  if (!mainText || mainText.trim() === '') {
    mainText = defaultMessage;
    mainSource = 'Based on your daily tracking';
    if (expandedDetails.length === 0) {
      expandedDetails.push({
        type: 'general',
        text: defaultMessage,
        source: 'Based on your daily tracking',
        comparison: 'consistent'
      });
    }
  }
  
  const finalSummary = mainText && mainText.trim() !== '' ? mainText : defaultMessage;
  
  return {
    summary: finalSummary,
    source: mainSource || 'Based on your daily tracking',
    details: expandedDetails.length > 0 ? expandedDetails : [{
      type: 'general',
      text: defaultMessage,
      source: 'Based on your daily tracking',
      comparison: 'consistent'
    }],
    hasMore: expandedDetails.length > 1,
    generatedAt: suggestionResult.metadata?.generatedAt || new Date().toISOString()
  };
}

export function getSuggestionIcon(metricType) {
  const icons = {
    activity: '💪',
    nutrition: '🥗',
    sleep: '💤',
    stress: '⚖️',
    faith: '📖',
    emotional: '❤️',
    energy: '⭐',
    routine: '🎯',
    combined: '📊',
    general: '💡',
    insight: '💡'
  };
  return icons[metricType] || '📈';
}

export function categorizeSuggestionPriority(suggestionResult) {
  if (!suggestionResult?.primary) return 'neutral';
  
  const patterns = suggestionResult.metadata?.patternsDetected || [];
  
  if (patterns.includes('multipleStressors') || patterns.includes('lowEnergySleepIssue')) {
    return 'attention';
  }
  
  if (patterns.includes('overallImproving') || patterns.includes('balancedPositive')) {
    return 'positive';
  }
  
  const primaryComparison = suggestionResult.primary?.comparison;
  if (primaryComparison === 'below') {
    return 'attention';
  }
  if (primaryComparison === 'above') {
    return 'positive';
  }
  
  return 'neutral';
}
