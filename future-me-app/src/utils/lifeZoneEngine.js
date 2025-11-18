/**
 * Life Zone Calculation Engine
 * 
 * Calculates scores and details for all 6 life zones based on:
 * - Current lifestyle metrics
 * - Historical trend data
 * - Logging consistency
 * - Daily patterns
 */

/**
 * Calculate Health Zone score
 * Based on: wellness score + sleep, activity, nutrition trend direction
 */
function calculateHealthZone(profile, trendAnalysis) {
  const baseScore = Number(profile.lifestyleScore) || 50;
  
  // Get trend bonuses (only if trends exist)
  let trendBonus = 0;
  if (trendAnalysis) {
    const sleepTrend = Number(trendAnalysis.sleepTrend) || 0;
    const activityTrend = Number(trendAnalysis.activityTrend) || 0;
    const nutritionTrend = Number(trendAnalysis.nutritionTrend) || 0;
    
    // Each positive trend adds up to 5 points
    const bonus = (sleepTrend + activityTrend + nutritionTrend) * 5;
    trendBonus = isNaN(bonus) ? 0 : bonus;
  }
  
  const rawScore = baseScore + trendBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const details = {
    baseWellness: Math.round(baseScore),
    trendBonus: Math.round(trendBonus),
    sleep: Number(profile.sleep) || 3,
    activity: Number(profile.activity) || 3,
    nutrition: Number(profile.nutrition) || 3,
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate Social Emotional Zone score
 * Based on: stress values, logging consistency, stress trend slope
 */
function calculateSocialEmotionalZone(profile, trendAnalysis, historyData) {
  const currentStress = Number(profile.stress) || 3;
  const stressScore = ((5 - currentStress) / 4) * 100; // Inverted: lower stress = higher score
  
  // Logging consistency bonus (only if history exists)
  const daysLogged = historyData ? historyData.length : 0;
  const consistencyBonus = daysLogged === 0 ? 0 : Math.min(daysLogged * 2, 20); // Up to 20 points for consistency
  
  // Stress trend bonus (improving stress = positive score)
  let trendBonus = 0;
  if (trendAnalysis?.stressTrend) {
    const bonus = -Number(trendAnalysis.stressTrend) * 10; // Negative trend = stress decreasing = good
    trendBonus = isNaN(bonus) ? 0 : bonus;
  }
  
  const rawScore = stressScore + consistencyBonus + trendBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const details = {
    currentStress: currentStress,
    stressScore: Math.round(stressScore),
    consistencyDays: daysLogged,
    consistencyBonus: Math.round(consistencyBonus),
    trendBonus: Math.round(trendBonus),
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate Wealth Zone score
 * Based on: logging consistency multiplied by fixed factor, capped at maximum
 */
function calculateWealthZone(profile, historyData) {
  const daysLogged = historyData ? historyData.length : 0;
  const consistencyFactor = 3.5; // Each day logged adds 3.5 points
  
  // Base score from consistency (start at 50 for new users)
  const baseScore = daysLogged === 0 ? 50 : 0;
  const consistencyScore = baseScore + (daysLogged * consistencyFactor);
  
  // Cap at 100
  const score = Math.min(100, consistencyScore);
  
  // Additional metric: consistency streak
  const currentStreak = calculateStreak(historyData);
  
  const details = {
    daysLogged,
    consistencyScore: Math.round(consistencyScore),
    currentStreak,
    formula: 'daysLogged × 3.5',
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate Faith Zone score
 * Based on: daily consistency with bonus for streaks
 */
function calculateFaithZone(profile, historyData) {
  const daysLogged = historyData ? historyData.length : 0;
  const currentStreak = calculateStreak(historyData);
  
  // Base score from total days (start at 50 for new users)
  const consistencyScore = daysLogged === 0 ? 50 : Math.min(daysLogged * 2.5, 60);
  
  // Streak bonus: longer streaks = higher commitment
  const streakBonus = Math.min(currentStreak * 4, 40); // Up to 40 points from streaks
  
  const rawScore = consistencyScore + streakBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const details = {
    daysLogged,
    currentStreak,
    baseScore: Math.round(consistencyScore),
    streakBonus: Math.round(streakBonus),
    commitment: currentStreak >= 7 ? 'excellent' : currentStreak >= 3 ? 'good' : 'building',
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate Family Zone score
 * Based on: combinations of stress and sleep trend directions
 */
function calculateFamilyZone(profile, trendAnalysis, historyData) {
  const currentStress = Number(profile.stress) || 3;
  const currentSleep = Number(profile.sleep) || 3;
  
  // Base score from current metrics (low stress + good sleep = good family balance)
  const stressComponent = ((5 - currentStress) / 4) * 50; // Up to 50 points
  const sleepComponent = (currentSleep / 5) * 50; // Up to 50 points
  
  // Trend bonus (only if trends exist)
  let trendBonus = 0;
  if (trendAnalysis) {
    const sleepTrend = Number(trendAnalysis.sleepTrend) || 0;
    const stressTrend = Number(trendAnalysis.stressTrend) || 0;
    
    // Improving sleep or decreasing stress = positive family impact
    const bonus = (sleepTrend - stressTrend) * 5;
    trendBonus = isNaN(bonus) ? 0 : bonus;
  }
  
  // Consistency bonus (minimal impact for new users)
  const daysLogged = historyData ? historyData.length : 0;
  const consistencyBonus = daysLogged === 0 ? 0 : Math.min(daysLogged * 1, 10); // Up to 10 points
  
  const rawScore = stressComponent + sleepComponent + trendBonus + consistencyBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const details = {
    currentStress,
    currentSleep,
    stressComponent: Math.round(stressComponent),
    sleepComponent: Math.round(sleepComponent),
    trendBonus: Math.round(trendBonus),
    balance: score >= 70 ? 'harmonious' : score >= 50 ? 'balanced' : 'strained',
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate Community Zone score
 * Based on: consistency and average stress values
 */
function calculateCommunityZone(profile, historyData) {
  const daysLogged = historyData ? historyData.length : 0;
  const currentStress = Number(profile.stress) || 3;
  
  // Consistency component (start at 50 for new users, then grow with engagement)
  const baseScore = daysLogged === 0 ? 50 : 0;
  const consistencyScore = baseScore + Math.min(daysLogged * 3, 60); // Up to 60 points
  
  // Average stress component (lower stress = better community engagement)
  let avgStress = currentStress;
  if (historyData && historyData.length > 0) {
    const stressSum = historyData.reduce((sum, day) => {
      const stress = Number(day.stress);
      return sum + (isNaN(stress) ? 3 : stress);
    }, 0);
    avgStress = stressSum / historyData.length;
  }
  
  const stressScore = daysLogged === 0 ? 0 : ((5 - avgStress) / 4) * 40; // Up to 40 points
  
  const rawScore = consistencyScore + stressScore;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const details = {
    daysLogged,
    consistencyScore: Math.round(consistencyScore),
    avgStress: Math.round(avgStress * 10) / 10,
    stressScore: Math.round(stressScore),
    engagement: daysLogged >= 14 ? 'active' : daysLogged >= 7 ? 'growing' : 'starting',
    interpretation: score >= 75 ? 'strong' : score >= 50 ? 'developing' : 'needs attention'
  };
  
  return { score: Math.round(isNaN(score) ? 50 : score), details };
}

/**
 * Calculate current streak of consecutive days logged
 */
function calculateStreak(historyData) {
  if (!historyData || historyData.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...historyData].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);
  
  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((expectedDate - entryDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      expectedDate = entryDate;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate all 6 Life Zones
 * Returns object with scores and details for each zone
 */
export function calculateAllLifeZones(profile, trendAnalysis, historyData) {
  console.log('🎯 Life Zone Engine: Calculating all zones...');
  console.log('  Profile:', profile?.lifestyleScore, 'Trends:', !!trendAnalysis, 'History:', historyData?.length || 0);
  
  const zones = {
    health: calculateHealthZone(profile, trendAnalysis),
    socialEmotional: calculateSocialEmotionalZone(profile, trendAnalysis, historyData),
    wealth: calculateWealthZone(profile, historyData),
    faith: calculateFaithZone(profile, historyData),
    family: calculateFamilyZone(profile, trendAnalysis, historyData),
    community: calculateCommunityZone(profile, historyData)
  };
  
  console.log('✅ Life Zone Scores:', {
    health: zones.health.score,
    socialEmotional: zones.socialEmotional.score,
    wealth: zones.wealth.score,
    faith: zones.faith.score,
    family: zones.family.score,
    community: zones.community.score
  });
  
  return zones;
}

/**
 * Get default Life Zone values for new users
 */
export function getDefaultLifeZones() {
  return {
    health: {
      score: 50,
      details: {
        baseWellness: 50,
        trendBonus: 0,
        sleep: 3,
        activity: 3,
        nutrition: 3,
        interpretation: 'developing'
      }
    },
    socialEmotional: {
      score: 50,
      details: {
        currentStress: 3,
        stressScore: 50,
        consistencyDays: 0,
        consistencyBonus: 0,
        trendBonus: 0,
        interpretation: 'developing'
      }
    },
    wealth: {
      score: 50,
      details: {
        daysLogged: 0,
        consistencyScore: 0,
        currentStreak: 0,
        formula: 'daysLogged × 3.5',
        interpretation: 'developing'
      }
    },
    faith: {
      score: 50,
      details: {
        daysLogged: 0,
        currentStreak: 0,
        baseScore: 0,
        streakBonus: 0,
        commitment: 'building',
        interpretation: 'developing'
      }
    },
    family: {
      score: 50,
      details: {
        currentStress: 3,
        currentSleep: 3,
        stressComponent: 25,
        sleepComponent: 30,
        trendBonus: 0,
        balance: 'balanced',
        interpretation: 'developing'
      }
    },
    community: {
      score: 50,
      details: {
        daysLogged: 0,
        consistencyScore: 0,
        avgStress: 3,
        stressScore: 25,
        engagement: 'starting',
        interpretation: 'developing'
      }
    }
  };
}

/**
 * Analyze zone trends for Future Avatar preview
 * Returns description of which zones are improving/declining
 */
export function analyzeZoneTrends(currentZones, previousZones) {
  if (!previousZones) return null;
  
  const trends = {
    improving: [],
    declining: [],
    stable: []
  };
  
  const zoneNames = ['health', 'socialEmotional', 'wealth', 'faith', 'family', 'community'];
  
  zoneNames.forEach(zone => {
    const current = currentZones[zone]?.score || 50;
    const previous = previousZones[zone]?.score || 50;
    const diff = current - previous;
    
    if (diff > 3) {
      trends.improving.push({ zone, diff });
    } else if (diff < -3) {
      trends.declining.push({ zone, diff });
    } else {
      trends.stable.push(zone);
    }
  });
  
  return trends;
}
