export function predictFutureState(currentScore, trendSlope) {
  if (!currentScore || trendSlope === undefined || trendSlope === null) {
    console.log('⚠️ Insufficient data for predictions');
    return null;
  }

  const daysToProject = [30, 90, 180];
  const predictions = {};

  daysToProject.forEach(days => {
    const rawProjection = currentScore + (trendSlope * days);
    const cappedScore = Math.max(0, Math.min(100, rawProjection));
    
    const status = cappedScore >= 75 
      ? 'thriving' 
      : cappedScore >= 60 
      ? 'improving' 
      : cappedScore >= 50
      ? 'stable'
      : 'needs attention';

    const change = cappedScore - currentScore;
    
    predictions[days] = {
      score: Math.round(cappedScore * 10) / 10,
      status,
      change: Math.round(change * 10) / 10,
      direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
    };

    console.log(`🔮 ${days}-day projection: ${predictions[days].score} (${predictions[days].status})`);
  });

  const overallTrend = predictions[180].direction;
  console.log(`🌅 Overall trajectory: ${overallTrend} (180-day score: ${predictions[180].score})`);

  return predictions;
}

export function getMotivationalMessage(predictions) {
  if (!predictions) {
    return "Keep tracking your habits to unlock future insights!";
  }

  const day180 = predictions[180];
  
  if (day180.direction === 'improving') {
    if (day180.score >= 80) {
      return "Stay consistent — your glow is strengthening! 🌟";
    } else if (day180.score >= 70) {
      return "Excellent progress — you're on the path to peak vitality! 💪";
    } else {
      return "Small steps today, big changes tomorrow — keep it up! 🚀";
    }
  } else if (day180.direction === 'declining') {
    if (day180.score < 50) {
      return "Time to refocus — small changes can reverse this trend! 🔄";
    } else {
      return "Let's adjust your habits to brighten your future path! 💡";
    }
  } else {
    return "Consistency is key — maintain your current habits! ⚖️";
  }
}
