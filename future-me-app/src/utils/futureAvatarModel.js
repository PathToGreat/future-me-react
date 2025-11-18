import { calculateBodyComposition, getAvatarBodyWidth } from './bodyCompositionModel';
import { getMetricTrend } from './analyzeTrends';

/**
 * Future Avatar Model
 * 
 * Projects avatar properties based on current trends and predictions.
 * Uses existing trend data to estimate future lifestyle metrics.
 */

export function projectFutureMetrics(currentProfile, historyData, predictions, timeframe = 90) {
  if (!predictions || !predictions[timeframe]) {
    console.log('⚠️ No predictions available for future avatar');
    return null;
  }

  // Get individual metric trends
  const activityTrend = getMetricTrend(historyData, 'activity');
  const nutritionTrend = getMetricTrend(historyData, 'nutrition');
  const sleepTrend = getMetricTrend(historyData, 'sleep');
  const stressTrend = getMetricTrend(historyData, 'stress');

  // Project each metric forward based on trend
  // Clamp values between 1-5
  const projectedActivity = Math.max(1, Math.min(5, currentProfile.activity + activityTrend.change));
  const projectedNutrition = Math.max(1, Math.min(5, currentProfile.nutrition + nutritionTrend.change));
  const projectedSleep = Math.max(1, Math.min(5, currentProfile.sleep + sleepTrend.change));
  const projectedStress = Math.max(1, Math.min(5, currentProfile.stress + stressTrend.change));

  // Calculate future body composition score
  const futureBodyCompositionScore = calculateBodyComposition(
    projectedActivity,
    projectedNutrition,
    projectedSleep,
    projectedStress
  );

  // Calculate future avatar properties
  const futureAvatarWidth = getAvatarBodyWidth(futureBodyCompositionScore);
  const futureLifestyleScore = predictions[timeframe].score;

  console.log('🔮 Future Avatar Metrics Projected:');
  console.log(`  - Timeframe: ${timeframe} days`);
  console.log(`  - Activity: ${currentProfile.activity} → ${projectedActivity.toFixed(1)}`);
  console.log(`  - Nutrition: ${currentProfile.nutrition} → ${projectedNutrition.toFixed(1)}`);
  console.log(`  - Sleep: ${currentProfile.sleep} → ${projectedSleep.toFixed(1)}`);
  console.log(`  - Stress: ${currentProfile.stress} → ${projectedStress.toFixed(1)}`);
  console.log(`  - Body Composition: ${futureBodyCompositionScore}`);
  console.log(`  - Avatar Width: ${futureAvatarWidth}px`);
  console.log(`  - Lifestyle Score: ${futureLifestyleScore}`);

  return {
    activity: projectedActivity,
    nutrition: projectedNutrition,
    sleep: projectedSleep,
    stress: projectedStress,
    bodyCompositionScore: futureBodyCompositionScore,
    avatarWidth: futureAvatarWidth,
    lifestyleScore: futureLifestyleScore,
    trends: {
      activity: activityTrend,
      nutrition: nutritionTrend,
      sleep: sleepTrend,
      stress: stressTrend
    }
  };
}

/**
 * Get dynamic description for future avatar based on trajectory and life zones
 */
export function getFutureAvatarDescription(currentScore, futureScore, lifeZones = null) {
  const scoreDiff = futureScore - currentScore;
  
  // Base description
  let primary = "This is your predicted physical trajectory based on your current patterns.";
  let secondary = "";
  let tone = "neutral";
  
  // Determine base trajectory
  if (scoreDiff > 5) {
    secondary = "You are on track for a stronger, healthier future self.";
    tone = "positive";
  } else if (scoreDiff < -5) {
    secondary = "Your current patterns may reduce your future potential.";
    tone = "warning";
  } else {
    secondary = "Your future self will reflect your consistency.";
    tone = "neutral";
  }
  
  // Enhance with life zone insights if available
  if (lifeZones) {
    const zoneInsights = [];
    
    // Health zone insight
    if (lifeZones.health >= 80) {
      zoneInsights.push("Your health trajectory is improving.");
    } else if (lifeZones.health < 60) {
      zoneInsights.push("Consider strengthening your health habits.");
    }
    
    // Social emotional insight
    if (lifeZones.socialEmotional < 60) {
      zoneInsights.push("Your emotional stress trend is holding you back.");
    } else if (lifeZones.socialEmotional >= 80) {
      zoneInsights.push("Your emotional wellness supports your growth.");
    }
    
    // Faith zone insight (consistency-driven)
    if (lifeZones.faithDetails?.consecutiveDays >= 7) {
      zoneInsights.push("Your consistency builds a strong foundation.");
    }
    
    // Family zone insight
    if (lifeZones.familyDetails?.balance === 'strong') {
      zoneInsights.push("Your work-life balance strengthens your future.");
    }
    
    // Add zone insights to secondary message if any exist
    if (zoneInsights.length > 0) {
      secondary += " " + zoneInsights[0]; // Add most relevant insight
    }
  }
  
  return { primary, secondary, tone };
}

/**
 * Get future avatar glow color based on projected lifestyle score
 */
export function getFutureAvatarGlow(futureScore) {
  if (futureScore >= 75) {
    return { body: '#10b981', glow: '#34d399', intensity: 'high' };
  } else if (futureScore >= 50) {
    return { body: '#f59e0b', glow: '#fbbf24', intensity: 'medium' };
  } else {
    return { body: '#ef4444', glow: '#f87171', intensity: 'low' };
  }
}

/**
 * Get future avatar posture based on projected activity
 */
export function getFuturePosture(projectedActivity) {
  if (projectedActivity >= 4) {
    return 'translateY(-10px)'; // Upright, energetic
  } else if (projectedActivity >= 2) {
    return 'translateY(0px)'; // Neutral
  } else {
    return 'translateY(10px)'; // Slouched
  }
}

/**
 * Get future facial expression intensity based on stress and sleep projections
 */
export function getFutureFaceExpression(projectedStress, projectedSleep) {
  // Lower stress + better sleep = happier expression
  // Higher stress + poor sleep = stressed expression
  const wellnessIndicator = (5 - projectedStress) + projectedSleep;
  
  if (wellnessIndicator >= 7) {
    return 'happy'; // Low stress, good sleep
  } else if (wellnessIndicator >= 5) {
    return 'neutral'; // Moderate
  } else {
    return 'stressed'; // High stress or poor sleep
  }
}
