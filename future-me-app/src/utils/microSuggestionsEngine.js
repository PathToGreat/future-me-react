const SUGGESTION_TEMPLATES = {
  activity: {
    belowBaseline: [
      "Movement today was moderate. Consider a light stretch before bed to support recovery.",
      "Activity level is lower than your baseline. A brief walk after meals can help rebuild momentum.",
      "Steps were limited today. Adding 10 minutes of movement tomorrow can restore balance."
    ],
    below7Day: [
      "Activity is below your recent average. A short walk during a break can help.",
      "Movement has been lighter lately. Consider scheduling a brief active session tomorrow."
    ],
    consistent: [
      "Steps are consistent this week. Adding a brief walk after lunch can support daily rhythm.",
      "Activity levels are steady. Maintaining this consistency supports long-term progress."
    ],
    improving: [
      "Movement is trending upward. This momentum supports energy and recovery.",
      "Activity levels have increased recently. Your body is adapting to more movement."
    ],
    combined: {
      lowSleep: "Activity is moderate while rest was limited. Prioritizing sleep tonight may improve tomorrow's energy for movement.",
      highStress: "Movement was light during a higher-stress day. A gentle walk can support both body and mind.",
      lowNutrition: "Activity was limited and nutrition was lighter. Balancing both can improve energy levels."
    }
  },
  
  nutrition: {
    belowBaseline: [
      "Nutrition balance is lower than your baseline. Adding a protein source to breakfast may support energy.",
      "Nutrient intake today was lighter. Planning one balanced meal tomorrow can restore equilibrium."
    ],
    below7Day: [
      "Nutrition has been variable this week. Focusing on one consistent meal can establish rhythm.",
      "Food choices were lighter than recent days. Preparing a nourishing meal tomorrow may help."
    ],
    consistent: [
      "Vegetable intake is steady. Adding variety to your meals can enhance nutritional balance.",
      "Nutrition patterns are consistent. This stability supports steady energy throughout the day."
    ],
    improving: [
      "Nutrition choices have improved recently. Your body responds well to balanced fuel.",
      "Food quality is trending upward. This supports overall wellness and energy."
    ],
    hydration: {
      low: "Hydration levels are lower than baseline. Drinking water before meals can support focus and recovery.",
      moderate: "Water intake is moderate. Increasing by one glass during afternoon hours may improve energy.",
      good: "Hydration is well-maintained. This supports digestion, energy, and mental clarity."
    },
    combined: {
      lowSleep: "Nutrition was lighter and sleep was short. Prioritizing a balanced breakfast tomorrow may help both.",
      lowActivity: "Nutrition and movement were both lighter today. A nourishing meal paired with a short walk can restore balance."
    }
  },
  
  sleep: {
    belowBaseline: [
      "Sleep duration is shorter than your baseline. Maintaining a consistent bedtime for 3 nights can stabilize energy.",
      "Rest was shorter than baseline. A brief pre-sleep routine may improve sleep onset."
    ],
    below7Day: [
      "Sleep has been variable this week. A consistent wind-down routine can support better rest.",
      "Rest quality has fluctuated recently. Reducing screen time before bed may help stabilize patterns."
    ],
    consistent: [
      "Sleep patterns are steady. This consistency supports energy and mental clarity throughout the day.",
      "Rest duration is stable. Maintaining this rhythm reinforces your body's natural recovery cycle."
    ],
    improving: [
      "Sleep quality is improving. Your body is responding well to your rest patterns.",
      "Rest duration has increased recently. This supports recovery and daytime energy."
    ],
    variable: [
      "Sleep duration has been variable. Maintaining a consistent bedtime for the next 3 nights can stabilize energy.",
      "Rest timing has varied. Setting a consistent wake-up time can anchor your sleep rhythm."
    ],
    combined: {
      highStress: "Sleep was lighter during a higher-stress period. A calming routine before bed may support deeper rest.",
      lowActivity: "Rest was limited and movement was light. Gentle activity during the day can improve sleep quality.",
      highActivity: "Activity was high and sleep was short. Your body may benefit from earlier rest tonight."
    }
  },
  
  stress: {
    elevated: [
      "Stress indicators increased today. A 5-minute breathing exercise can support clarity and calm.",
      "Tension levels are higher than baseline. A brief moment of stillness may provide perspective."
    ],
    elevated7Day: [
      "Stress has been elevated this week. Identifying one source of pressure may help address it.",
      "Tension levels have been higher recently. Consider one small action that brings calm."
    ],
    managed: [
      "Stress levels are within your baseline range. This stability supports clear thinking.",
      "Tension management is consistent. Maintaining your current approaches is working."
    ],
    improving: [
      "Stress levels are lower than recent days. Your coping strategies appear to be working.",
      "Tension has decreased recently. Notice what contributed to this improvement."
    ],
    combined: {
      lowSleep: "Stress was higher while rest was limited. Prioritizing sleep tonight may improve emotional balance.",
      lowActivity: "Tension was elevated and movement was light. Physical activity can help process stress.",
      lowNutrition: "Stress was higher and nutrition was lighter. Balanced meals can support emotional regulation."
    }
  },
  
  emotional: {
    lowMood: [
      "Evening mood trends slightly low. Journaling for reflection may provide perspective.",
      "Emotional energy was lower today. Connecting with a supportive person may help."
    ],
    variable: [
      "Emotional patterns have varied this week. Tracking triggers can reveal helpful insights.",
      "Mood has fluctuated recently. Identifying patterns may support emotional balance."
    ],
    stable: [
      "Emotional state is steady. This stability supports decision-making and relationships.",
      "Mood patterns are consistent. Maintaining your current routines supports this balance."
    ],
    improving: [
      "Emotional wellness is improving. Notice what activities contribute to this positive trend.",
      "Mood has been more stable recently. Your current approach is supporting well-being."
    ]
  },
  
  faith: {
    searching: [
      "Purpose alignment is marked as searching. Reflecting on one meaningful goal today can guide next steps.",
      "Motivation direction is being explored. Writing down one intention may provide clarity."
    ],
    lowMotivation: [
      "Motivation score is lower than baseline. Setting one clear intention for tomorrow may strengthen follow-through.",
      "Purpose engagement was lighter today. A brief moment of reflection can reconnect you to your goals."
    ],
    consistent: [
      "Motivation score is steady. Setting one clear intention for tomorrow may strengthen follow-through.",
      "Purpose alignment is consistent. This stability supports sustained effort toward goals."
    ],
    strong: [
      "Purpose engagement is strong. This clarity supports focused action and decision-making.",
      "Motivation levels are high. Channel this energy into your most meaningful priorities."
    ]
  },
  
  combined: {
    lowEnergySleepIssue: [
      "Energy is low and sleep was inconsistent. Prioritizing an earlier bedtime could improve alertness tomorrow.",
      "Fatigue is present and rest was limited. A consistent sleep schedule may restore energy over the coming days."
    ],
    balancedPositive: [
      "Balanced nutrition and movement are trending well. Consider a brief meditation to support emotional clarity.",
      "Activity and nutrition are well-balanced. This foundation supports overall wellness."
    ],
    multipleStressors: [
      "Multiple areas show signs of strain today. Focus on improving one metric to create positive momentum.",
      "Several metrics are below baseline. Addressing sleep first often improves other areas."
    ],
    overallImproving: [
      "Multiple metrics are improving. Your consistent efforts are creating positive momentum.",
      "Several areas show improvement. This upward trend reflects your daily choices."
    ],
    weekendPattern: [
      "Weekend patterns differ from weekdays. Maintaining some consistency can help smooth the transition.",
      "Schedule changes on weekends affect your metrics. Consider anchoring one habit to stay consistent."
    ]
  }
};

function getRandomTemplate(templates) {
  if (!templates || templates.length === 0) return null;
  return templates[Math.floor(Math.random() * templates.length)];
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
  
  if (isStressMetric) {
    if (baselineComparison === 'above' || weekComparison === 'above') {
      if (baselineComparison === 'above') {
        return getRandomTemplate(templates.elevated);
      }
      return getRandomTemplate(templates.elevated7Day);
    }
    if (baselineComparison === 'below' || weekComparison === 'below') {
      return getRandomTemplate(templates.improving);
    }
    return getRandomTemplate(templates.managed);
  }
  
  if (baselineComparison === 'below') {
    return getRandomTemplate(templates.belowBaseline);
  }
  
  if (weekComparison === 'below') {
    return getRandomTemplate(templates.below7Day);
  }
  
  if (metric === 'sleep' && isVariable) {
    return getRandomTemplate(templates.variable);
  }
  
  if (baselineComparison === 'above' || weekComparison === 'above') {
    return getRandomTemplate(templates.improving);
  }
  
  return getRandomTemplate(templates.consistent);
}

function generateCombinedSuggestion(patterns, currentLog, baseline) {
  if (patterns.length === 0) return null;
  
  const combinedTemplates = SUGGESTION_TEMPLATES.combined;
  
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
  
  return null;
}

function generateHydrationSuggestion(hydrationValue, baselineHydration) {
  const templates = SUGGESTION_TEMPLATES.nutrition.hydration;
  
  if (hydrationValue === undefined || hydrationValue === null) return null;
  
  const baseline = baselineHydration || 3;
  
  if (hydrationValue < baseline - 0.5) {
    return templates.low;
  }
  if (hydrationValue < baseline + 0.3) {
    return templates.moderate;
  }
  return templates.good;
}

function generateFaithSuggestion(faithData, baseline) {
  const templates = SUGGESTION_TEMPLATES.faith;
  
  if (!faithData) return null;
  
  const { motivation, purposeClarity, faithEngagement } = faithData;
  const baselineMotivation = baseline?.motivation || 3;
  
  if (purposeClarity === 'searching' || purposeClarity === 'unclear') {
    return getRandomTemplate(templates.searching);
  }
  
  if (motivation !== undefined && motivation < baselineMotivation - 0.5) {
    return getRandomTemplate(templates.lowMotivation);
  }
  
  if (motivation !== undefined && motivation > baselineMotivation + 0.5) {
    return getRandomTemplate(templates.strong);
  }
  
  return getRandomTemplate(templates.consistent);
}

function generateEmotionalSuggestion(emotionalData, baseline) {
  const templates = SUGGESTION_TEMPLATES.emotional;
  
  if (!emotionalData) return null;
  
  const { mood, emotionalClarity, eveningMood } = emotionalData;
  const baselineMood = baseline?.mood || 3;
  
  const moodValue = eveningMood || mood;
  
  if (moodValue !== undefined && moodValue < baselineMood - 0.5) {
    return getRandomTemplate(templates.lowMood);
  }
  
  if (moodValue !== undefined && moodValue > baselineMood + 0.5) {
    return getRandomTemplate(templates.improving);
  }
  
  return getRandomTemplate(templates.stable);
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
  
  return {
    primary: primarySuggestion,
    secondary: secondarySuggestion,
    combined: combinedSuggestion ? { text: combinedSuggestion, patterns } : null,
    hydration: hydrationSuggestion ? { text: hydrationSuggestion } : null,
    faith: faithSuggestion ? { text: faithSuggestion } : null,
    emotional: emotionalSuggestion ? { text: emotionalSuggestion } : null,
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
