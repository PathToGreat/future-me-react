export function generateAttributionExplanation(historyData, metric, change, baseline) {
  if (!historyData || historyData.length < 5) {
    return null;
  }

  const last7Days = historyData.slice(0, 7);
  const previous7Days = historyData.slice(7, 14);

  if (previous7Days.length < 3) {
    return null;
  }

  const explanations = [];

  if (metric === 'sleep' || !metric) {
    const sleepConsistency = calculateConsistency(last7Days, 'sleep');
    if (sleepConsistency > 0.7) {
      explanations.push({
        metric: 'sleep',
        text: `This shift appears connected to ${Math.round(sleepConsistency * 7)} days of consistent sleep timing.`,
        confidence: sleepConsistency
      });
    }
  }

  if (metric === 'stress' || !metric) {
    const loggingStreak = countConsecutiveLogs(last7Days);
    const avgStress = average(last7Days, 'stress');
    const prevAvgStress = average(previous7Days, 'stress');
    
    if (avgStress < prevAvgStress && loggingStreak >= 4) {
      explanations.push({
        metric: 'stress',
        text: `Stress stabilized during a week with ${loggingStreak} consecutive days of awareness tracking.`,
        confidence: 0.7
      });
    }
  }

  if (metric === 'activity' || !metric) {
    const activityTrend = calculateTrend(last7Days, 'activity');
    if (activityTrend > 0.3) {
      explanations.push({
        metric: 'activity',
        text: 'Activity increased gradually over the past week of tracking.',
        confidence: 0.6
      });
    }
  }

  if (metric === 'nutrition' || !metric) {
    const nutritionConsistency = calculateConsistency(last7Days, 'nutrition');
    if (nutritionConsistency > 0.6) {
      explanations.push({
        metric: 'nutrition',
        text: 'Nutrition patterns show more consistency in recent logs.',
        confidence: nutritionConsistency
      });
    }
  }

  const logDiff = last7Days.length - previous7Days.length;
  if (logDiff > 2) {
    explanations.push({
      metric: 'logging',
      text: 'You logged more frequently this week than the previous week.',
      confidence: 0.8
    });
  }

  explanations.sort((a, b) => b.confidence - a.confidence);
  
  return explanations.length > 0 ? explanations[0] : null;
}

function calculateConsistency(data, metric) {
  if (!data || data.length < 2) return 0;
  
  const values = data.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const consistency = Math.max(0, 1 - (stdDev / 2));
  return consistency;
}

function calculateTrend(data, metric) {
  if (!data || data.length < 3) return 0;
  
  const values = data.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  if (values.length < 3) return 0;
  
  const firstHalf = values.slice(Math.floor(values.length / 2));
  const secondHalf = values.slice(0, Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  return secondAvg - firstAvg;
}

function average(data, metric) {
  if (!data || data.length === 0) return 0;
  const values = data.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function countConsecutiveLogs(data) {
  if (!data || data.length === 0) return 0;
  
  const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedData.length; i++) {
    const logDate = new Date(sortedData[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    const diffDays = Math.abs(Math.floor((logDate - expectedDate) / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function getFocusZoneAttribution(focusArea, historyData, baseline) {
  if (!historyData || historyData.length < 5) {
    return null;
  }

  const attributions = {
    sleep: [
      'Sleep was identified as a foundation based on recent patterns.',
      'Improving sleep first often supports other areas like energy and stress.'
    ],
    stress: [
      'Stress management was flagged due to elevated readings this week.',
      'Addressing stress can help stabilize sleep and decision-making.'
    ],
    activity: [
      'Activity was selected based on room for growth in recent logs.',
      'Increasing movement often supports mood and energy levels.'
    ],
    nutrition: [
      'Nutrition showed the most variability in recent tracking.',
      'Consistent nutrition can support sustained energy throughout the day.'
    ]
  };

  const options = attributions[focusArea] || [];
  if (options.length === 0) return null;

  const randomIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % options.length;
  return options[randomIndex];
}
