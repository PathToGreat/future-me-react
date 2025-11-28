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
      lowSleep: "Low sleep + moderate activity affected morning energy. Observing patterns like this takes self-awareness.",
      goodHydration: "Hydration and activity aligned with energy levels. Tracking interactions takes attentiveness."
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
      "Nutrition synergy with hydration noted. Tracking positive interactions takes persistence."
    ],
    combined: {
      goodHydration: "High nutrition + proper hydration created positive synergy today. That reflects thoughtful consistency.",
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

  hydration: {
    belowBaseline: [
      "Hydration slightly below baseline. Tracking this pattern shows attentiveness."
    ],
    consistent: [
      "Hydration tracked accurately. Consistently logging water intake takes focus."
    ],
    good: [
      "Hydration and activity aligned with energy levels. Tracking interactions takes attentiveness."
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
      "High nutrition + proper hydration created positive synergy today. That reflects thoughtful consistency.",
      "Nutrition intake balanced with activity today. Observing these synergies takes self-reflection.",
      "Hydration and activity aligned with energy levels. Tracking interactions takes attentiveness."
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

function getTemplateWithValues(templates, values) {
  const template = getRandomTemplate(templates);
  if (!template) return null;
  return interpolateTemplate(template, values);
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
  const hydration = currentLog.hydration;
  
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
  
  const loggedMetrics = ['sleep', 'activity', 'nutrition', 'stress', 'hydration'].filter(
    metric => currentLog[metric] !== undefined && currentLog[metric] !== null
  );
  if (loggedMetrics.length >= 4) {
    patterns.push('overallComplete');
  }
  
  if (nutrition !== undefined && hydration !== undefined) {
    if (nutrition >= (baselineNutrition || 3) && hydration >= (baseline?.hydration || 3)) {
      patterns.push('nutritionHydrationSynergy');
    }
  }
  
  return patterns;
}

function generateSingleMetricSuggestion(metric, currentValue, baselineValue, avg7Day, logs7Day) {
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
      return getTemplateWithValues(templates.elevated, templateValues);
    }
    if (baselineComparison === 'below' || weekComparison === 'below') {
      return getTemplateWithValues(templates.improving, templateValues);
    }
    return getTemplateWithValues(templates.managed, templateValues);
  }
  
  if (baselineComparison === 'below') {
    return getTemplateWithValues(templates.belowBaseline, templateValues);
  }
  
  if (weekComparison === 'below' && templates.below7Day) {
    return getTemplateWithValues(templates.below7Day, templateValues);
  }
  
  if (metric === 'sleep' && isVariable && templates.variable) {
    return getTemplateWithValues(templates.variable, templateValues);
  }
  
  if (baselineComparison === 'above' || weekComparison === 'above') {
    if (templates.improving) {
      return getTemplateWithValues(templates.improving, templateValues);
    }
  }
  
  if (templates.consistent) {
    return getTemplateWithValues(templates.consistent, templateValues);
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
  
  if (patterns.includes('balancedPositive') || patterns.includes('nutritionHydrationSynergy')) {
    return getRandomTemplate(combinedTemplates.balancedPositive);
  }
  
  if (patterns.includes('overallComplete')) {
    return getRandomTemplate(combinedTemplates.overallComplete);
  }
  
  return null;
}

function generateHydrationSuggestion(hydrationValue, baselineHydration) {
  const templates = SUGGESTION_TEMPLATES.hydration;
  if (!templates) return null;
  
  if (hydrationValue === undefined || hydrationValue === null) return null;
  
  const baseline = baselineHydration || 3;
  const templateValues = { current: hydrationValue, baseline };
  
  if (hydrationValue < baseline - 0.5) {
    return getTemplateWithValues(templates.belowBaseline, templateValues);
  }
  if (hydrationValue >= baseline) {
    return getTemplateWithValues(templates.good, templateValues);
  }
  return getTemplateWithValues(templates.consistent, templateValues);
}

function generateFaithSuggestion(faithData, baseline) {
  const templates = SUGGESTION_TEMPLATES.faith;
  if (!templates) return null;
  
  if (!faithData) return null;
  
  const { motivation, purposeClarity, faithEngagement } = faithData;
  const baselineMotivation = baseline?.motivation || 3;
  const templateValues = { current: motivation, baseline: baselineMotivation };
  
  if (faithEngagement || purposeClarity === 'clear') {
    return getTemplateWithValues(templates.consistent, templateValues);
  }
  
  return null;
}

function generateEmotionalSuggestion(emotionalData, baseline) {
  const templates = SUGGESTION_TEMPLATES.emotional;
  if (!templates) return null;
  
  if (!emotionalData) return null;
  
  const { mood, emotionalClarity, eveningMood, emotionalSupport } = emotionalData;
  const baselineMood = baseline?.mood || 3;
  const moodValue = eveningMood || mood;
  const templateValues = { current: moodValue, baseline: baselineMood };
  
  if (emotionalSupport) {
    return getTemplateWithValues(templates.neutral, templateValues);
  }
  
  if (moodValue !== undefined && moodValue > baselineMood + 0.5) {
    return getTemplateWithValues(templates.stable, templateValues);
  }
  
  if (moodValue !== undefined) {
    return getTemplateWithValues(templates.neutral, templateValues);
  }
  
  return null;
}

function generateEnergySuggestion(energyData, baseline, avg7Day) {
  const templates = SUGGESTION_TEMPLATES.energy;
  if (!templates) return null;
  
  if (!energyData) return null;
  
  const { morningEnergy, energyLevel } = energyData;
  const energyValue = morningEnergy || energyLevel;
  const baselineEnergy = baseline?.morningEnergy || baseline?.energyLevel || 3;
  const templateValues = { current: energyValue, baseline: baselineEnergy };
  
  if (energyValue === undefined || energyValue === null) return null;
  
  if (energyValue < baselineEnergy - 0.5) {
    return getTemplateWithValues(templates.low, templateValues);
  }
  
  if (energyValue > baselineEnergy + 0.3 || (avg7Day && energyValue > avg7Day + 0.3)) {
    return getTemplateWithValues(templates.improving, templateValues);
  }
  
  return null;
}

function generateRoutineSuggestion(routineData, baseline) {
  const templates = SUGGESTION_TEMPLATES.routine;
  if (!templates) return null;
  
  if (!routineData) return null;
  
  const { eveningWindDown, routineCompleted, windDownCompleted } = routineData;
  
  if (windDownCompleted || routineCompleted || eveningWindDown === 'completed') {
    return getTemplateWithValues(templates.completed, {});
  }
  
  if (eveningWindDown === 'partial' || eveningWindDown === 'missed') {
    return getTemplateWithValues(templates.partial, {});
  }
  
  return null;
}

export function generateMicroSuggestion(currentLog, baseline, last7DaysLogs = []) {
  if (!currentLog) {
    return {
      primary: null,
      secondary: null,
      combined: null,
      hydration: null,
      metadata: { error: 'No current log data provided' }
    };
  }
  
  const baselineMetrics = baseline?.onboardingBaseline || baseline || {};
  
  const avg7Day = {
    activity: calculateMovingAverage(last7DaysLogs, 'activity'),
    nutrition: calculateMovingAverage(last7DaysLogs, 'nutrition'),
    sleep: calculateMovingAverage(last7DaysLogs, 'sleep'),
    stress: calculateMovingAverage(last7DaysLogs, 'stress'),
    hydration: calculateMovingAverage(last7DaysLogs, 'hydration')
  };
  
  const patterns = detectCombinedPatterns(currentLog, baselineMetrics, avg7Day);
  
  const suggestions = {};
  const metrics = ['activity', 'nutrition', 'sleep', 'stress'];
  
  for (const metric of metrics) {
    const currentValue = currentLog[metric];
    const baselineValue = baselineMetrics[metric];
    const avgValue = avg7Day[metric];
    
    if (currentValue !== undefined && currentValue !== null) {
      suggestions[metric] = {
        text: generateSingleMetricSuggestion(metric, currentValue, baselineValue, avgValue, last7DaysLogs),
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
  
  const hydrationSuggestion = generateHydrationSuggestion(
    currentLog.hydration, 
    baselineMetrics.hydration
  );
  
  const faithSuggestion = generateFaithSuggestion(
    currentLog.faith || currentLog,
    baselineMetrics.faith || baselineMetrics
  );
  
  const emotionalSuggestion = generateEmotionalSuggestion(
    currentLog.emotional || currentLog,
    baselineMetrics.emotional || baselineMetrics
  );
  
  const energySuggestion = generateEnergySuggestion(
    currentLog.energy || currentLog,
    baselineMetrics.energy || baselineMetrics,
    avg7Day.morningEnergy || avg7Day.energyLevel
  );
  
  const routineSuggestion = generateRoutineSuggestion(
    currentLog.routine || currentLog,
    baselineMetrics.routine || baselineMetrics
  );
  
  return {
    primary: primarySuggestion,
    secondary: secondarySuggestion,
    combined: combinedSuggestion ? { text: combinedSuggestion, patterns } : null,
    hydration: hydrationSuggestion ? { text: hydrationSuggestion } : null,
    faith: faithSuggestion ? { text: faithSuggestion } : null,
    emotional: emotionalSuggestion ? { text: emotionalSuggestion } : null,
    energy: energySuggestion ? { text: energySuggestion } : null,
    routine: routineSuggestion ? { text: routineSuggestion } : null,
    allSuggestions: suggestions,
    metadata: {
      patternsDetected: patterns,
      avg7Day,
      generatedAt: new Date().toISOString()
    }
  };
}

export function formatSuggestionForDisplay(suggestionResult) {
  const defaultMessage = "Your metrics today are consistent with your patterns. Consistency supports long-term progress.";
  
  const defaultResult = {
    summary: defaultMessage,
    details: [{
      type: 'general',
      text: defaultMessage,
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
  
  if (combined?.text) {
    mainText = combined.text;
    expandedDetails.push({
      type: 'combined',
      text: combined.text,
      patterns: combined.patterns || []
    });
  } else if (primary?.text) {
    mainText = primary.text;
    expandedDetails.push({
      type: primary.metric || 'general',
      text: primary.text,
      comparison: primary.comparison || 'consistent'
    });
  }
  
  if (secondary?.text && secondary.text !== mainText) {
    expandedDetails.push({
      type: secondary.metric || 'general',
      text: secondary.text,
      comparison: secondary.comparison || 'consistent'
    });
  }
  
  if (suggestionResult.hydration?.text) {
    const hydrationDetail = {
      type: 'hydration',
      text: suggestionResult.hydration.text
    };
    expandedDetails.push(hydrationDetail);
    if (!mainText) {
      mainText = suggestionResult.hydration.text;
    }
  }
  
  if (suggestionResult.faith?.text) {
    const faithDetail = {
      type: 'faith',
      text: suggestionResult.faith.text
    };
    expandedDetails.push(faithDetail);
    if (!mainText) {
      mainText = suggestionResult.faith.text;
    }
  }
  
  if (suggestionResult.emotional?.text) {
    const emotionalDetail = {
      type: 'emotional',
      text: suggestionResult.emotional.text
    };
    expandedDetails.push(emotionalDetail);
    if (!mainText) {
      mainText = suggestionResult.emotional.text;
    }
  }
  
  if (suggestionResult.energy?.text) {
    const energyDetail = {
      type: 'energy',
      text: suggestionResult.energy.text
    };
    expandedDetails.push(energyDetail);
    if (!mainText) {
      mainText = suggestionResult.energy.text;
    }
  }
  
  if (suggestionResult.routine?.text) {
    const routineDetail = {
      type: 'routine',
      text: suggestionResult.routine.text
    };
    expandedDetails.push(routineDetail);
    if (!mainText) {
      mainText = suggestionResult.routine.text;
    }
  }
  
  if (!mainText || mainText.trim() === '') {
    mainText = defaultMessage;
    if (expandedDetails.length === 0) {
      expandedDetails.push({
        type: 'general',
        text: defaultMessage,
        comparison: 'consistent'
      });
    }
  }
  
  const finalSummary = mainText && mainText.trim() !== '' ? mainText : defaultMessage;
  
  return {
    summary: finalSummary,
    details: expandedDetails.length > 0 ? expandedDetails : [{
      type: 'general',
      text: defaultMessage,
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
    hydration: '💧',
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
