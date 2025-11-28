const METRIC_NAMES = {
  activity: 'Physical Activity',
  nutrition: 'Nutrition',
  sleep: 'Sleep Quality',
  stress: 'Stress Management'
};

const METRIC_POSITIVE_VERBS = {
  activity: ['moved more', 'stayed active', 'exercised well'],
  nutrition: ['ate well', 'nourished yourself', 'made good food choices'],
  sleep: ['slept better', 'rested well', 'got quality sleep'],
  stress: ['managed stress', 'stayed calm', 'handled pressure well']
};

const METRIC_NEGATIVE_VERBS = {
  activity: ['moved less', 'were more sedentary', 'had lower activity'],
  nutrition: ['could improve eating', 'had less balanced nutrition', 'made poor food choices'],
  sleep: ['had trouble sleeping', 'slept poorly', 'had restless nights'],
  stress: ['felt more stressed', 'experienced higher tension', 'felt overwhelmed']
};

function createInsight(type, title, message, category, priority, metadata = {}) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    category,
    priority,
    createdAt: new Date().toISOString(),
    ...metadata
  };
}

function calculateAverage(logs, metric) {
  if (!logs || logs.length === 0) return null;
  const values = logs.map(l => l[metric]).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDailyInsight(todayLog, baseline, last7DaysLogs) {
  if (!todayLog) return null;

  const insights = [];
  const metrics = ['activity', 'nutrition', 'sleep', 'stress'];
  
  const baselineMetrics = baseline?.onboardingBaseline || baseline || {};
  
  for (const metric of metrics) {
    const todayValue = todayLog[metric];
    const baselineValue = baselineMetrics[metric];
    const avg7Day = calculateAverage(last7DaysLogs, metric);
    
    if (todayValue === null || todayValue === undefined) continue;
    
    const isStressMetric = metric === 'stress';
    const diffFromBaseline = baselineValue ? todayValue - baselineValue : 0;
    const diffFrom7Day = avg7Day !== null ? todayValue - avg7Day : 0;
    
    const baselineImproved = isStressMetric ? diffFromBaseline < -0.5 : diffFromBaseline > 0.5;
    const baselineDeclined = isStressMetric ? diffFromBaseline > 0.5 : diffFromBaseline < -0.5;
    const weekImproved = isStressMetric ? diffFrom7Day < -0.3 : diffFrom7Day > 0.3;
    const weekDeclined = isStressMetric ? diffFrom7Day > 0.3 : diffFrom7Day < -0.3;
    
    if (baselineImproved && weekImproved) {
      insights.push({
        metric,
        type: 'strong_win',
        priority: 1,
        direction: 'up',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} today was excellent - you ${getRandomItem(METRIC_POSITIVE_VERBS[metric])} and this is trending better than last week too.`
      });
    } else if (baselineImproved) {
      insights.push({
        metric,
        type: 'win',
        priority: 2,
        direction: 'up',
        message: `Great job on ${METRIC_NAMES[metric].toLowerCase()} today! You're doing better than your baseline.`
      });
    } else if (weekImproved) {
      insights.push({
        metric,
        type: 'week_win',
        priority: 2,
        direction: 'up',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} is improving compared to last week. Keep it up!`
      });
    } else if (baselineDeclined && weekDeclined) {
      insights.push({
        metric,
        type: 'concern',
        priority: 1,
        direction: 'down',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} has been lower than usual lately. Consider what small changes might help.`
      });
    } else if (baselineDeclined) {
      insights.push({
        metric,
        type: 'note',
        priority: 3,
        direction: 'down',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} today was a bit lower than your baseline. Tomorrow is a fresh start.`
      });
    }
  }
  
  insights.sort((a, b) => a.priority - b.priority);
  
  if (insights.length === 0) {
    return createInsight(
      'daily',
      'Steady Progress',
      'Your metrics today are consistent with your patterns. Consistency is a form of success.',
      'general',
      3
    );
  }
  
  const topInsight = insights[0];
  const isPositive = topInsight.direction === 'up';
  
  return createInsight(
    'daily',
    isPositive ? 'Small Win Today' : 'Area for Growth',
    topInsight.message,
    topInsight.metric,
    topInsight.priority,
    { 
      allInsights: insights,
      isPositive
    }
  );
}

export function generateWeeklyInsights(last7DaysLogs, baseline, last30DaysLogs) {
  if (!last7DaysLogs || last7DaysLogs.length < 3) {
    return null;
  }
  
  const insights = {
    highlight: null,
    opportunity: null,
    actionable: null
  };
  
  const baselineMetrics = baseline?.onboardingBaseline || baseline || {};
  const metrics = ['activity', 'nutrition', 'sleep', 'stress'];
  
  const weeklyAverages = {};
  const previousWeekAverages = {};
  
  const safeHistory = last30DaysLogs || [];
  
  for (const metric of metrics) {
    weeklyAverages[metric] = calculateAverage(last7DaysLogs, metric);
    
    const previousWeekLogs = safeHistory.length > 7 ? safeHistory.slice(7, Math.min(14, safeHistory.length)) : [];
    previousWeekAverages[metric] = previousWeekLogs.length > 0 ? calculateAverage(previousWeekLogs, metric) : null;
  }
  
  let bestMetric = null;
  let bestImprovement = 0;
  let worstMetric = null;
  let worstDecline = 0;
  
  for (const metric of metrics) {
    const weekAvg = weeklyAverages[metric];
    const baseVal = baselineMetrics[metric];
    const prevWeekAvg = previousWeekAverages[metric];
    
    if (weekAvg === null || baseVal === undefined) continue;
    
    const isStress = metric === 'stress';
    const comparisonValue = prevWeekAvg !== null ? prevWeekAvg : baseVal;
    const diff = weekAvg - comparisonValue;
    const improvement = isStress ? -diff : diff;
    
    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestMetric = metric;
    }
    if (improvement < worstDecline) {
      worstDecline = improvement;
      worstMetric = metric;
    }
  }
  
  if (bestMetric && bestImprovement > 0.2) {
    const messages = {
      activity: 'You moved more this week than before. Physical activity builds momentum for everything else.',
      nutrition: 'Your nutrition choices improved this week. Good fuel makes for good days.',
      sleep: 'Your sleep quality was better this week. Rest is the foundation of energy.',
      stress: 'You managed stress more effectively this week. Your calm is growing.'
    };
    
    insights.highlight = createInsight(
      'weekly',
      `Weekly Highlight: ${METRIC_NAMES[bestMetric]}`,
      messages[bestMetric],
      bestMetric,
      1,
      { subtype: 'highlight', improvement: bestImprovement.toFixed(2) }
    );
  }
  
  if (worstMetric && worstDecline < -0.2) {
    const messages = {
      activity: 'Physical activity dipped this week. Even a short walk tomorrow can turn the tide.',
      nutrition: 'Nutrition had a harder week. Consider planning one healthy meal for tomorrow.',
      sleep: 'Sleep quality was lower. A consistent bedtime tonight could help reset your rhythm.',
      stress: 'Stress levels were higher. Consider one calming activity before bed tonight.'
    };
    
    insights.opportunity = createInsight(
      'weekly',
      `Growth Opportunity: ${METRIC_NAMES[worstMetric]}`,
      messages[worstMetric],
      worstMetric,
      2,
      { subtype: 'opportunity', decline: Math.abs(worstDecline).toFixed(2) }
    );
  }
  
  const rhythmProfile = baseline?.lifestyleRhythm || baseline?.onboardingBaseline?.lifestyleRhythm || {};
  const emotionalProfile = baseline?.emotionalProfile || baseline?.onboardingBaseline?.emotionalProfile || {};
  
  let actionableMessage = '';
  let actionableCategory = 'general';
  
  const sleepRhythm = rhythmProfile.sleepRhythm || '';
  const emotionalClimate = emotionalProfile.emotionalClimate || '';
  const movementRhythm = rhythmProfile.movementRhythm || '';
  
  if (sleepRhythm === 'inconsistent' || sleepRhythm === 'irregular') {
    actionableMessage = 'Your rhythm benefits from consistency. Try setting a fixed wake-up time for the next 3 days.';
    actionableCategory = 'rhythm';
  } else if (emotionalClimate === 'overwhelmed') {
    actionableMessage = 'When feeling overwhelmed, small wins matter most. Focus on one thing you can control today.';
    actionableCategory = 'emotional';
  } else if (movementRhythm === 'light') {
    actionableMessage = 'Light movement is a good foundation. Consider adding one 10-minute active break this week.';
    actionableCategory = 'activity';
  } else if (worstMetric) {
    actionableMessage = `Focus on improving your ${METRIC_NAMES[worstMetric].toLowerCase()} this week. Small consistent changes add up.`;
    actionableCategory = worstMetric;
  } else {
    actionableMessage = 'You have good rhythm in your routine. Keep building on that consistency this week.';
    actionableCategory = 'general';
  }
  
  insights.actionable = createInsight(
    'weekly',
    'This Week\'s Focus',
    actionableMessage,
    actionableCategory,
    2,
    { subtype: 'actionable' }
  );
  
  return {
    type: 'weekly',
    weekStart: last7DaysLogs[last7DaysLogs.length - 1]?.date,
    weekEnd: last7DaysLogs[0]?.date,
    insights: Object.values(insights).filter(Boolean),
    summary: {
      daysLogged: last7DaysLogs.length,
      averages: weeklyAverages,
      bestMetric,
      worstMetric
    },
    createdAt: new Date().toISOString()
  };
}

export function generateMonthlyInsights(last30DaysLogs, baseline, habits = [], lifeZones = {}) {
  if (!last30DaysLogs || last30DaysLogs.length < 14) {
    return null;
  }
  
  const baselineMetrics = baseline?.onboardingBaseline || baseline || {};
  const metrics = ['activity', 'nutrition', 'sleep', 'stress'];
  
  const monthlyAverages = {};
  const consistencyScores = {};
  
  for (const metric of metrics) {
    const values = last30DaysLogs
      .map(l => l?.[metric])
      .filter(v => v !== null && v !== undefined && typeof v === 'number');
    monthlyAverages[metric] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    
    if (values.length > 7 && monthlyAverages[metric] !== null) {
      const mean = monthlyAverages[metric];
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      consistencyScores[metric] = Math.max(0, Math.min(100, 100 - (stdDev * 20)));
    } else {
      consistencyScores[metric] = null;
    }
  }
  
  let emergingPattern = null;
  let patternType = 'neutral';
  
  const midpoint = Math.floor(last30DaysLogs.length / 2);
  const first15Days = last30DaysLogs.slice(midpoint);
  const last15Days = last30DaysLogs.slice(0, midpoint);
  
  for (const metric of metrics) {
    const firstHalfAvg = calculateAverage(first15Days, metric);
    const secondHalfAvg = calculateAverage(last15Days, metric);
    
    if (firstHalfAvg === null || secondHalfAvg === null) continue;
    
    const isStress = metric === 'stress';
    const diff = secondHalfAvg - firstHalfAvg;
    const improvement = isStress ? -diff : diff;
    
    if (improvement > 0.5) {
      emergingPattern = {
        metric,
        direction: 'improving',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} has been steadily improving over the past month. This upward trend is significant.`
      };
      patternType = 'positive';
      break;
    } else if (improvement < -0.5) {
      emergingPattern = {
        metric,
        direction: 'declining',
        message: `Your ${METRIC_NAMES[metric].toLowerCase()} has been gradually declining. Consider what changed and how to address it.`
      };
      patternType = 'concern';
      break;
    }
  }
  
  if (!emergingPattern) {
    emergingPattern = {
      metric: 'general',
      direction: 'stable',
      message: 'Your lifestyle metrics have been stable this month. Stability is a sign of sustainable habits.'
    };
  }
  
  const rankedConsistency = Object.entries(consistencyScores)
    .filter(([_, score]) => score !== null)
    .sort((a, b) => b[1] - a[1])
    .map(([metric, score]) => ({
      metric,
      score: Math.round(score),
      label: score > 80 ? 'Excellent' : score > 60 ? 'Good' : score > 40 ? 'Fair' : 'Needs Work'
    }));
  
  let keystoneRecommendation = null;
  
  const lowestConsistency = rankedConsistency[rankedConsistency.length - 1];
  const worstMetric = lowestConsistency?.metric;
  
  const keystoneMessages = {
    sleep: {
      title: 'Focus on Sleep',
      message: 'Sleep is your keystone habit. Improving sleep quality typically cascades into better energy, mood, and activity levels. Aim for consistent sleep and wake times this week.'
    },
    stress: {
      title: 'Manage Your Stress',
      message: 'Stress affects everything else. When stress is high, sleep suffers, nutrition choices worsen, and activity drops. Consider one daily stress-relief practice.'
    },
    activity: {
      title: 'Move More Consistently',
      message: 'Physical activity is your keystone. Regular movement improves sleep, reduces stress, and often leads to better nutrition choices. Start with 10 minutes daily.'
    },
    nutrition: {
      title: 'Nourish Yourself Better',
      message: 'Good nutrition fuels everything. When you eat well, energy increases, sleep improves, and stress becomes more manageable. Plan one healthy meal per day.'
    }
  };
  
  if (worstMetric && keystoneMessages[worstMetric]) {
    keystoneRecommendation = {
      ...keystoneMessages[worstMetric],
      targetMetric: worstMetric,
      currentScore: lowestConsistency.score
    };
  } else {
    keystoneRecommendation = {
      title: 'Maintain Your Balance',
      message: 'Your metrics are well-balanced. Focus on maintaining this consistency while looking for small improvements.',
      targetMetric: 'general',
      currentScore: null
    };
  }
  
  return {
    id: `monthly-${Date.now()}`,
    type: 'monthly',
    period: {
      start: last30DaysLogs[last30DaysLogs.length - 1]?.date,
      end: last30DaysLogs[0]?.date
    },
    emergingPattern: createInsight(
      'monthly',
      'Monthly Pattern',
      emergingPattern.message,
      emergingPattern.metric,
      patternType === 'positive' ? 1 : patternType === 'concern' ? 2 : 3,
      { subtype: 'pattern', direction: emergingPattern.direction }
    ),
    consistencyRanking: rankedConsistency,
    keystoneRecommendation: createInsight(
      'monthly',
      keystoneRecommendation.title,
      keystoneRecommendation.message,
      keystoneRecommendation.targetMetric,
      1,
      { subtype: 'keystone', targetScore: keystoneRecommendation.currentScore }
    ),
    summary: {
      daysLogged: last30DaysLogs.length,
      averages: monthlyAverages,
      consistencyScores
    },
    createdAt: new Date().toISOString()
  };
}

export function prioritizeInsights(insights) {
  if (!insights || insights.length === 0) return [];
  return [...insights].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export function shouldGenerateWeeklyInsight(lastWeeklyInsight, currentDate = new Date()) {
  if (!lastWeeklyInsight) return true;
  
  const lastGenerated = new Date(lastWeeklyInsight.createdAt);
  const daysSince = Math.floor((currentDate - lastGenerated) / (1000 * 60 * 60 * 24));
  
  return daysSince >= 7;
}

export function shouldGenerateMonthlyInsight(lastMonthlyInsight, currentDate = new Date()) {
  if (!lastMonthlyInsight) return true;
  
  const lastGenerated = new Date(lastMonthlyInsight.createdAt);
  const daysSince = Math.floor((currentDate - lastGenerated) / (1000 * 60 * 60 * 24));
  
  return daysSince >= 30;
}

export function getAllInsightsForDashboard(dailyInsight, weeklyBundle, monthlyBundle) {
  const insights = [];
  
  if (dailyInsight) {
    insights.push(dailyInsight);
  }
  
  if (weeklyBundle?.insights) {
    const highlight = weeklyBundle.insights.find(i => i.subtype === 'highlight');
    if (highlight) insights.push(highlight);
  }
  
  return prioritizeInsights(insights);
}
