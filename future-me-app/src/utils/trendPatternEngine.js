const PATTERN_TYPES = {
  STRESS_STABILITY: 'stress_stability',
  SLEEP_RECOVERY: 'sleep_recovery',
  MOVEMENT_BUFFER: 'movement_buffer',
  CONSISTENCY_DECAY: 'consistency_decay',
  NUTRITION_IMPACT: 'nutrition_impact',
  FOCUS_STABILITY: 'focus_stability',
  STRESS_LAG: 'stress_lag',
  RECOVERY_SLOPE: 'recovery_slope',
  MULTI_METRIC_CORRELATION: 'multi_metric_correlation',
  EARLY_SIGNAL: 'early_signal',
  PLATEAU_DETECTION: 'plateau_detection',
  FOCUS_DRIFT: 'focus_drift',
  PEAK_EFFECT: 'peak_effect',
  CROSS_IMPACT: 'cross_impact',
  MOMENTUM: 'momentum'
};

const PATTERN_MESSAGES = {
  [PATTERN_TYPES.STRESS_STABILITY]: "Your stress stabilizes only after sleep improves consistently for several days.",
  [PATTERN_TYPES.SLEEP_RECOVERY]: "Your sleep quality shows improvement following consistent rest or lighter movement days.",
  [PATTERN_TYPES.MOVEMENT_BUFFER]: "Movement appears to buffer poor sleep and stress more effectively than nutrition alone.",
  [PATTERN_TYPES.CONSISTENCY_DECAY]: "Consistency drops after two consecutive days without stable logging or routine activity.",
  [PATTERN_TYPES.NUTRITION_IMPACT]: "Changes in your nutrition habits are associated with subtle shifts in energy and focus.",
  [PATTERN_TYPES.FOCUS_STABILITY]: "Progress accelerates when your focus zone remains stable for several consecutive days.",
  [PATTERN_TYPES.STRESS_LAG]: "Stress spikes appear to precede small declines in other daily metrics.",
  [PATTERN_TYPES.RECOVERY_SLOPE]: "Your recent improvements occurred more quickly following a period of stability.",
  [PATTERN_TYPES.MULTI_METRIC_CORRELATION]: "Your sleep and stress levels consistently move together over the last month.",
  [PATTERN_TYPES.EARLY_SIGNAL]: "You've started to show your first measurable change in this area.",
  [PATTERN_TYPES.PLATEAU_DETECTION]: "Your metrics have remained consistent over the past week, indicating a stable trend.",
  [PATTERN_TYPES.FOCUS_DRIFT]: "Frequent changes in your focus zone correspond with more variable metric results.",
  [PATTERN_TYPES.PEAK_EFFECT]: "Your peak performance aligns with consistent habits earlier in the week.",
  [PATTERN_TYPES.CROSS_IMPACT]: "Improvements in one area appear linked to small declines in another.",
  [PATTERN_TYPES.MOMENTUM]: "Multiple metrics are improving together over the past week, showing a clear momentum trend."
};

const MIN_DATA_DAYS = 7;
const CONFIDENCE_THRESHOLD = 0.7;

function calculateRollingAverage(data, metric, days) {
  if (!data || data.length < days) return null;
  const recent = data.slice(-days);
  const values = recent.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  if (values.length < days * 0.7) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getMetricTrend(data, metric, days = 7) {
  if (!data || data.length < days) return null;
  const recent = data.slice(-days);
  const values = recent.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  if (values.length < 3) return null;
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const percentChange = firstAvg !== 0 ? (change / firstAvg) * 100 : 0;
  
  return {
    direction: change > 0.1 ? 'improving' : change < -0.1 ? 'declining' : 'stable',
    change,
    percentChange,
    firstAvg,
    secondAvg
  };
}

function calculateCorrelation(arr1, arr2) {
  if (arr1.length !== arr2.length || arr1.length < 3) return 0;
  
  const n = arr1.length;
  const mean1 = arr1.reduce((s, v) => s + v, 0) / n;
  const mean2 = arr2.reduce((s, v) => s + v, 0) / n;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(denom1 * denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function detectStressStabilityPattern(data) {
  if (data.length < 7) return null;
  
  const sleepTrend = getMetricTrend(data, 'sleep', 5);
  const stressTrend = getMetricTrend(data, 'stress', 5);
  
  if (!sleepTrend || !stressTrend) return null;
  
  if (sleepTrend.direction === 'improving' && stressTrend.direction !== 'declining') {
    const recentStress = data.slice(-3).map(d => d.stress).filter(v => v !== undefined);
    const variance = recentStress.length > 1 
      ? recentStress.reduce((s, v, i, a) => s + Math.pow(v - a.reduce((x, y) => x + y, 0) / a.length, 2), 0) / recentStress.length
      : 1;
    
    if (variance < 0.5) {
      return {
        type: PATTERN_TYPES.STRESS_STABILITY,
        confidence: 0.75,
        message: PATTERN_MESSAGES[PATTERN_TYPES.STRESS_STABILITY],
        data: { sleepImprovement: sleepTrend.percentChange, stressVariance: variance }
      };
    }
  }
  return null;
}

function detectSleepRecoveryPattern(data) {
  if (data.length < 7) return null;
  
  const activityTrend = getMetricTrend(data, 'activity', 5);
  const sleepTrend = getMetricTrend(data, 'sleep', 5);
  
  if (!activityTrend || !sleepTrend) return null;
  
  if (activityTrend.direction === 'declining' && sleepTrend.direction === 'improving') {
    return {
      type: PATTERN_TYPES.SLEEP_RECOVERY,
      confidence: 0.72,
      message: PATTERN_MESSAGES[PATTERN_TYPES.SLEEP_RECOVERY],
      data: { activityChange: activityTrend.percentChange, sleepImprovement: sleepTrend.percentChange }
    };
  }
  return null;
}

function detectMovementBufferPattern(data) {
  if (data.length < 10) return null;
  
  const highActivityDays = data.filter(d => d.activity >= 4);
  const lowActivityDays = data.filter(d => d.activity <= 2);
  
  if (highActivityDays.length < 3 || lowActivityDays.length < 3) return null;
  
  const highActivityStress = highActivityDays.map(d => d.stress).filter(v => v !== undefined);
  const lowActivityStress = lowActivityDays.map(d => d.stress).filter(v => v !== undefined);
  
  if (highActivityStress.length < 2 || lowActivityStress.length < 2) return null;
  
  const avgHighStress = highActivityStress.reduce((s, v) => s + v, 0) / highActivityStress.length;
  const avgLowStress = lowActivityStress.reduce((s, v) => s + v, 0) / lowActivityStress.length;
  
  if (avgHighStress < avgLowStress - 0.3) {
    return {
      type: PATTERN_TYPES.MOVEMENT_BUFFER,
      confidence: 0.78,
      message: PATTERN_MESSAGES[PATTERN_TYPES.MOVEMENT_BUFFER],
      data: { stressDifference: avgLowStress - avgHighStress }
    };
  }
  return null;
}

function detectConsistencyDecayPattern(data) {
  if (data.length < 7) return null;
  
  let consecutiveMissing = 0;
  let decayDetected = false;
  
  for (let i = 1; i < data.length; i++) {
    const prevDate = new Date(data[i - 1].date);
    const currDate = new Date(data[i].date);
    const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (dayDiff > 1) {
      consecutiveMissing++;
      if (consecutiveMissing >= 2) {
        const afterGap = data.slice(i, i + 3);
        if (afterGap.length >= 2) {
          const avgScore = afterGap.reduce((s, d) => s + (d.lifestyleScore || 0), 0) / afterGap.length;
          const beforeGap = data.slice(Math.max(0, i - 3), i);
          const beforeAvg = beforeGap.reduce((s, d) => s + (d.lifestyleScore || 0), 0) / beforeGap.length;
          
          if (avgScore < beforeAvg - 5) {
            decayDetected = true;
          }
        }
      }
    } else {
      consecutiveMissing = 0;
    }
  }
  
  if (decayDetected) {
    return {
      type: PATTERN_TYPES.CONSISTENCY_DECAY,
      confidence: 0.71,
      message: PATTERN_MESSAGES[PATTERN_TYPES.CONSISTENCY_DECAY],
      data: { gapDays: consecutiveMissing }
    };
  }
  return null;
}

function detectNutritionImpactPattern(data) {
  if (data.length < 7) return null;
  
  const nutritionTrend = getMetricTrend(data, 'nutrition', 7);
  if (!nutritionTrend || Math.abs(nutritionTrend.percentChange) < 10) return null;
  
  const scoreTrend = getMetricTrend(data, 'lifestyleScore', 7);
  if (!scoreTrend) return null;
  
  if ((nutritionTrend.direction === 'improving' && scoreTrend.direction === 'improving') ||
      (nutritionTrend.direction === 'declining' && scoreTrend.direction === 'declining')) {
    return {
      type: PATTERN_TYPES.NUTRITION_IMPACT,
      confidence: 0.70,
      message: PATTERN_MESSAGES[PATTERN_TYPES.NUTRITION_IMPACT],
      data: { nutritionChange: nutritionTrend.percentChange }
    };
  }
  return null;
}

function detectFocusStabilityPattern(data, lifeZones) {
  if (data.length < 5 || !lifeZones) return null;
  
  const focusZoneHistory = data.slice(-7).map(d => d.focusZone).filter(f => f);
  if (focusZoneHistory.length < 5) return null;
  
  const uniqueZones = [...new Set(focusZoneHistory)];
  if (uniqueZones.length === 1) {
    const scoreTrend = getMetricTrend(data, 'lifestyleScore', 5);
    if (scoreTrend && scoreTrend.direction === 'improving') {
      return {
        type: PATTERN_TYPES.FOCUS_STABILITY,
        confidence: 0.80,
        message: PATTERN_MESSAGES[PATTERN_TYPES.FOCUS_STABILITY],
        data: { stableDays: focusZoneHistory.length, focusZone: uniqueZones[0] }
      };
    }
  }
  return null;
}

function detectStressLagPattern(data) {
  if (data.length < 7) return null;
  
  for (let i = 2; i < data.length; i++) {
    const stressSpike = data[i - 2].stress >= 4;
    if (stressSpike) {
      const prevScore = data[i - 2].lifestyleScore || 0;
      const currScore = data[i].lifestyleScore || 0;
      
      if (currScore < prevScore - 5) {
        return {
          type: PATTERN_TYPES.STRESS_LAG,
          confidence: 0.73,
          message: PATTERN_MESSAGES[PATTERN_TYPES.STRESS_LAG],
          data: { lagDays: 2, scoreDrop: prevScore - currScore }
        };
      }
    }
  }
  return null;
}

function detectRecoverySlopePattern(data) {
  if (data.length < 14) return null;
  
  const firstWeek = data.slice(-14, -7);
  const secondWeek = data.slice(-7);
  
  const firstWeekScores = firstWeek.map(d => d.lifestyleScore).filter(v => v !== undefined);
  const secondWeekScores = secondWeek.map(d => d.lifestyleScore).filter(v => v !== undefined);
  
  if (firstWeekScores.length < 3 || secondWeekScores.length < 3) return null;
  
  const firstVariance = firstWeekScores.reduce((s, v, i, a) => 
    s + Math.pow(v - a.reduce((x, y) => x + y, 0) / a.length, 2), 0) / firstWeekScores.length;
  
  const secondTrend = getMetricTrend(secondWeek, 'lifestyleScore', 7);
  
  if (firstVariance < 5 && secondTrend && secondTrend.direction === 'improving' && secondTrend.percentChange > 5) {
    return {
      type: PATTERN_TYPES.RECOVERY_SLOPE,
      confidence: 0.76,
      message: PATTERN_MESSAGES[PATTERN_TYPES.RECOVERY_SLOPE],
      data: { plateauVariance: firstVariance, recoveryRate: secondTrend.percentChange }
    };
  }
  return null;
}

function detectMultiMetricCorrelationPattern(data) {
  if (data.length < 14) return null;
  
  const sleepValues = data.map(d => d.sleep).filter(v => v !== undefined);
  const stressValues = data.map(d => d.stress).filter(v => v !== undefined);
  
  if (sleepValues.length < 10 || stressValues.length < 10) return null;
  
  const minLen = Math.min(sleepValues.length, stressValues.length);
  const correlation = calculateCorrelation(
    sleepValues.slice(-minLen),
    stressValues.slice(-minLen).map(s => 5 - s)
  );
  
  if (Math.abs(correlation) > 0.5) {
    return {
      type: PATTERN_TYPES.MULTI_METRIC_CORRELATION,
      confidence: 0.75 + Math.abs(correlation) * 0.1,
      message: PATTERN_MESSAGES[PATTERN_TYPES.MULTI_METRIC_CORRELATION],
      data: { correlation, metrics: ['sleep', 'stress'] }
    };
  }
  return null;
}

function detectEarlySignalPattern(data) {
  if (data.length < 3 || data.length > 10) return null;
  
  const metrics = ['sleep', 'stress', 'activity', 'nutrition'];
  
  for (const metric of metrics) {
    const trend = getMetricTrend(data, metric, Math.min(data.length, 7));
    if (trend && Math.abs(trend.percentChange) > 15) {
      return {
        type: PATTERN_TYPES.EARLY_SIGNAL,
        confidence: 0.70,
        message: PATTERN_MESSAGES[PATTERN_TYPES.EARLY_SIGNAL],
        data: { metric, change: trend.percentChange }
      };
    }
  }
  return null;
}

function detectPlateauPattern(data) {
  if (data.length < 7) return null;
  
  const recentScores = data.slice(-7).map(d => d.lifestyleScore).filter(v => v !== undefined);
  if (recentScores.length < 5) return null;
  
  const avg = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
  const variance = recentScores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / recentScores.length;
  
  if (variance < 3) {
    return {
      type: PATTERN_TYPES.PLATEAU_DETECTION,
      confidence: 0.72,
      message: PATTERN_MESSAGES[PATTERN_TYPES.PLATEAU_DETECTION],
      data: { variance, avgScore: avg }
    };
  }
  return null;
}

function detectFocusDriftPattern(data) {
  if (data.length < 7) return null;
  
  const focusZones = data.slice(-7).map(d => d.focusZone).filter(f => f);
  if (focusZones.length < 5) return null;
  
  const uniqueZones = [...new Set(focusZones)];
  if (uniqueZones.length >= 3) {
    const scoreTrend = getMetricTrend(data.slice(-7), 'lifestyleScore', 7);
    if (scoreTrend && (scoreTrend.direction === 'declining' || Math.abs(scoreTrend.percentChange) > 10)) {
      return {
        type: PATTERN_TYPES.FOCUS_DRIFT,
        confidence: 0.74,
        message: PATTERN_MESSAGES[PATTERN_TYPES.FOCUS_DRIFT],
        data: { zoneChanges: uniqueZones.length, scoreVariability: scoreTrend.percentChange }
      };
    }
  }
  return null;
}

function detectPeakEffectPattern(data) {
  if (data.length < 7) return null;
  
  const weekData = data.slice(-7);
  const scores = weekData.map(d => d.lifestyleScore).filter(v => v !== undefined);
  if (scores.length < 5) return null;
  
  const maxScore = Math.max(...scores);
  const maxIndex = scores.indexOf(maxScore);
  
  if (maxIndex >= 2) {
    const priorDays = weekData.slice(0, maxIndex);
    const avgPriorActivity = priorDays.map(d => d.activity).filter(v => v !== undefined);
    const avgPriorSleep = priorDays.map(d => d.sleep).filter(v => v !== undefined);
    
    if (avgPriorActivity.length > 0 && avgPriorSleep.length > 0) {
      const activityAvg = avgPriorActivity.reduce((s, v) => s + v, 0) / avgPriorActivity.length;
      const sleepAvg = avgPriorSleep.reduce((s, v) => s + v, 0) / avgPriorSleep.length;
      
      if (activityAvg >= 3.5 && sleepAvg >= 3.5) {
        return {
          type: PATTERN_TYPES.PEAK_EFFECT,
          confidence: 0.73,
          message: PATTERN_MESSAGES[PATTERN_TYPES.PEAK_EFFECT],
          data: { peakScore: maxScore, priorActivity: activityAvg, priorSleep: sleepAvg }
        };
      }
    }
  }
  return null;
}

function detectCrossImpactPattern(data) {
  if (data.length < 7) return null;
  
  const activityTrend = getMetricTrend(data, 'activity', 7);
  const sleepTrend = getMetricTrend(data, 'sleep', 7);
  
  if (!activityTrend || !sleepTrend) return null;
  
  if ((activityTrend.direction === 'improving' && sleepTrend.direction === 'declining') ||
      (activityTrend.direction === 'declining' && sleepTrend.direction === 'improving')) {
    return {
      type: PATTERN_TYPES.CROSS_IMPACT,
      confidence: 0.71,
      message: PATTERN_MESSAGES[PATTERN_TYPES.CROSS_IMPACT],
      data: { 
        activityChange: activityTrend.percentChange, 
        sleepChange: sleepTrend.percentChange 
      }
    };
  }
  return null;
}

function detectMomentumPattern(data) {
  if (data.length < 7) return null;
  
  const metrics = ['sleep', 'stress', 'activity', 'nutrition'];
  let improvingCount = 0;
  
  for (const metric of metrics) {
    const trend = getMetricTrend(data, metric, 7);
    if (trend) {
      if (metric === 'stress') {
        if (trend.direction === 'declining') improvingCount++;
      } else {
        if (trend.direction === 'improving') improvingCount++;
      }
    }
  }
  
  if (improvingCount >= 3) {
    return {
      type: PATTERN_TYPES.MOMENTUM,
      confidence: 0.80,
      message: PATTERN_MESSAGES[PATTERN_TYPES.MOMENTUM],
      data: { improvingMetrics: improvingCount }
    };
  }
  return null;
}

export function detectPatterns(dailyData, lifeZones = null) {
  if (!dailyData || dailyData.length < MIN_DATA_DAYS) {
    return [];
  }

  const sortedData = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));

  const detectors = [
    () => detectMomentumPattern(sortedData),
    () => detectFocusStabilityPattern(sortedData, lifeZones),
    () => detectMovementBufferPattern(sortedData),
    () => detectStressStabilityPattern(sortedData),
    () => detectRecoverySlopePattern(sortedData),
    () => detectMultiMetricCorrelationPattern(sortedData),
    () => detectSleepRecoveryPattern(sortedData),
    () => detectPeakEffectPattern(sortedData),
    () => detectStressLagPattern(sortedData),
    () => detectPlateauPattern(sortedData),
    () => detectFocusDriftPattern(sortedData),
    () => detectNutritionImpactPattern(sortedData),
    () => detectCrossImpactPattern(sortedData),
    () => detectConsistencyDecayPattern(sortedData),
    () => detectEarlySignalPattern(sortedData)
  ];

  const patterns = [];
  
  for (const detector of detectors) {
    try {
      const pattern = detector();
      if (pattern && pattern.confidence >= CONFIDENCE_THRESHOLD) {
        patterns.push(pattern);
      }
    } catch (error) {
      console.error('Pattern detection error:', error);
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

export function selectPatternForDisplay(patterns, lastShownPatterns = [], maxPerWeek = 2) {
  if (!patterns || patterns.length === 0) return null;

  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

  const recentlyShown = lastShownPatterns.filter(p => p.timestamp > oneWeekAgo);
  
  if (recentlyShown.length >= maxPerWeek) {
    return null;
  }

  const recentTypes = new Set(recentlyShown.map(p => p.type));
  const availablePatterns = patterns.filter(p => !recentTypes.has(p.type));

  if (availablePatterns.length === 0) return null;

  return availablePatterns[0];
}

export { PATTERN_TYPES, PATTERN_MESSAGES };
