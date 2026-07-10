/**
 * Life Zone Calculation Engine
 * 
 * Each zone has its own unique inputs and scoring formula.
 * Scores are calculated only from each zone's own daily logs.
 */

import { ZONE_CONFIG } from './zoneConfig';

/**
 * Deeper physical detail fields collected by the periodic Health-zone check-in.
 * bodyTension is inverted (less tension = better).
 */
const HEALTH_DETAIL_FIELDS = [
  { key: 'strength', inverted: false },
  { key: 'mobility', inverted: false },
  { key: 'hydration', inverted: false },
  { key: 'protein', inverted: false },
  { key: 'outdoor', inverted: false },
  { key: 'recovery', inverted: false },
  { key: 'bodyTension', inverted: true }
];

/**
 * Average of whatever deep physical-detail fields are present on a log (0-100).
 * Returns null when the log carries none of them, so legacy 4-field logs are
 * scored exactly as before (no detail contribution).
 */
function calculateHealthDetailScore(log) {
  if (!log) return null;
  let sum = 0;
  let count = 0;
  for (const { key, inverted } of HEALTH_DETAIL_FIELDS) {
    const raw = log[key];
    if (raw == null) continue;
    const v = Number(raw);
    if (isNaN(v)) continue;
    const score = inverted ? ((5 - v) / 4) * 100 : ((v - 1) / 4) * 100;
    sum += score;
    count++;
  }
  return count > 0 ? sum / count : null;
}

/**
 * Calculate Health Zone score
 * Core inputs: activity, nutrition, sleep, stress (from the Daily Quick Log bridge)
 * Optional deeper detail: strength, mobility, hydration, protein, outdoor, recovery, bodyTension
 * Formula: Weighted core average (+ restrained detail blend when present) with trend bonus
 */
function calculateHealthZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('health', habitBonus);
  }

  const latest = zoneHistory[0];

  // The four core lifestyle signals arrive via the Daily Quick Log bridge. A
  // Health-Detail-only day may lack them, so source them from the most recent
  // entry that actually contains them (falling back to latest) — otherwise an
  // engaged user gets punished with all-3 defaults (base 50).
  const coreSource = zoneHistory.find(
    (e) => e && (e.activity != null || e.nutrition != null || e.sleep != null || e.stress != null)
  ) || latest;

  const activity = Number(coreSource.activity) || 3;
  const nutrition = Number(coreSource.nutrition) || 3;
  const sleep = Number(coreSource.sleep) || 3;
  const stress = Number(coreSource.stress) || 3;

  const activityScore = ((activity - 1) / 4) * 100;
  const nutritionScore = ((nutrition - 1) / 4) * 100;
  const sleepScore = ((sleep - 1) / 4) * 100;
  const stressScore = ((5 - stress) / 4) * 100;

  const coreBase = (activityScore * 0.30) + (nutritionScore * 0.25) +
                   (sleepScore * 0.25) + (stressScore * 0.20);

  // Blend the deeper physical detail in at a restrained 20% ONLY when present,
  // so legacy logs (core fields only) score identically to before.
  const detailScore = calculateHealthDetailScore(latest);
  const baseScore = detailScore == null ? coreBase : (coreBase * 0.80) + (detailScore * 0.20);

  const trendBonus = calculateTrendBonus(zoneHistory, ['activity', 'nutrition', 'sleep']);
  const streak = calculateStreak(zoneHistory);
  const streakBonus = Math.min(streak * 1.5, 10);

  const rawScore = baseScore + trendBonus + streakBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  const details = {
    activity,
    nutrition,
    sleep,
    stress,
    baseScore: Math.round(baseScore),
    trendBonus: Math.round(trendBonus),
    streakBonus: Math.round(streakBonus),
    habitBonus: Math.round(habitBonus),
    daysLogged: zoneHistory.length,
    currentStreak: streak,
    interpretation: getInterpretation(score)
  };

  if (detailScore != null) {
    details.detailScore = Math.round(detailScore);
  }

  return {
    score: Math.round(score),
    details
  };
}

/**
 * Calculate Social Emotional Zone score
 * Inputs: mood, stress, reflection, breathingHabit
 * Formula: Weighted with consistency bonus
 */
function calculateSocialEmotionalZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('socialEmotional', habitBonus);
  }

  const latest = zoneHistory[0];
  const mood = Number(latest.mood) || 3;
  const stress = Number(latest.stress) || 3;
  const reflection = Number(latest.reflection) || 3;
  const breathingHabit = Number(latest.breathingHabit) || 3;

  const moodScore = ((mood - 1) / 4) * 100;
  const stressScore = ((5 - stress) / 4) * 100;
  const reflectionScore = ((reflection - 1) / 4) * 100;
  const breathingScore = ((breathingHabit - 1) / 4) * 100;

  const baseScore = (moodScore * 0.35) + (stressScore * 0.25) + 
                    (reflectionScore * 0.20) + (breathingScore * 0.20);

  const daysLogged = zoneHistory.length;
  const consistencyBonus = Math.min(daysLogged * 1.5, 15);
  const stressTrendBonus = calculateInvertedTrendBonus(zoneHistory, 'stress');

  const rawScore = baseScore + consistencyBonus + stressTrendBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score),
    details: {
      mood,
      stress,
      reflection,
      breathingHabit,
      baseScore: Math.round(baseScore),
      consistencyBonus: Math.round(consistencyBonus),
      stressTrendBonus: Math.round(stressTrendBonus),
      habitBonus: Math.round(habitBonus),
      daysLogged,
      interpretation: getInterpretation(score)
    }
  };
}

/**
 * Calculate Family Zone score
 * Inputs: connectionTime, communicationQuality, patience, conflictLevel
 * Formula: Weighted with harmony bonus
 */
function calculateFamilyZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('family', habitBonus);
  }

  const latest = zoneHistory[0];
  const connectionTime = Number(latest.connectionTime) || 3;
  const communicationQuality = Number(latest.communicationQuality) || 3;
  const patience = Number(latest.patience) || 3;
  const conflictLevel = Number(latest.conflictLevel) || 3;

  const connectionScore = ((connectionTime - 1) / 4) * 100;
  const communicationScore = ((communicationQuality - 1) / 4) * 100;
  const patienceScore = ((patience - 1) / 4) * 100;
  const conflictScore = ((5 - conflictLevel) / 4) * 100;

  const baseScore = (connectionScore * 0.30) + (communicationScore * 0.30) + 
                    (patienceScore * 0.20) + (conflictScore * 0.20);

  const daysLogged = zoneHistory.length;
  const consistencyBonus = Math.min(daysLogged * 0.5, 10);
  
  const avgConflict = calculateAverage(zoneHistory, 'conflictLevel');
  const harmonyBonus = avgConflict <= 2 ? 5 : 0;

  const rawScore = baseScore + consistencyBonus + harmonyBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score),
    details: {
      connectionTime,
      communicationQuality,
      patience,
      conflictLevel,
      baseScore: Math.round(baseScore),
      consistencyBonus: Math.round(consistencyBonus),
      harmonyBonus,
      habitBonus: Math.round(habitBonus),
      daysLogged,
      balance: score >= 70 ? 'harmonious' : score >= 50 ? 'balanced' : 'strained',
      interpretation: getInterpretation(score)
    }
  };
}

/**
 * Calculate Community Zone score
 * Inputs: connectionsMade, conversations, supportGiven, communityEvents
 * Formula: Weighted with engagement bonus
 */
function calculateCommunityZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('community', habitBonus);
  }

  const latest = zoneHistory[0];
  const connectionsMade = Number(latest.connectionsMade) || 3;
  const conversations = Number(latest.conversations) || 3;
  const supportGiven = Number(latest.supportGiven) || 3;
  const communityEvents = Number(latest.communityEvents) || 3;

  const connectionsScore = ((connectionsMade - 1) / 4) * 100;
  const conversationsScore = ((conversations - 1) / 4) * 100;
  const supportScore = ((supportGiven - 1) / 4) * 100;
  const eventsScore = ((communityEvents - 1) / 4) * 100;

  const baseScore = (connectionsScore * 0.25) + (conversationsScore * 0.25) + 
                    (supportScore * 0.30) + (eventsScore * 0.20);

  const daysLogged = zoneHistory.length;
  const engagementBonus = Math.min(daysLogged * 1.5, 20);
  
  const avgSupport = calculateAverage(zoneHistory, 'supportGiven');
  const generosityBonus = avgSupport >= 4 ? 5 : 0;

  const rawScore = baseScore + engagementBonus + generosityBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score),
    details: {
      connectionsMade,
      conversations,
      supportGiven,
      communityEvents,
      baseScore: Math.round(baseScore),
      engagementBonus: Math.round(engagementBonus),
      generosityBonus,
      habitBonus: Math.round(habitBonus),
      daysLogged,
      engagement: daysLogged >= 14 ? 'active' : daysLogged >= 7 ? 'growing' : 'starting',
      interpretation: getInterpretation(score)
    }
  };
}

/**
 * Calculate Wealth Zone score
 * Inputs: saving, workProgress, skillsDeveloped, moneyHabits, spending
 * Formula: Weighted with streak bonus
 */
function calculateWealthZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('wealth', habitBonus);
  }

  const latest = zoneHistory[0];
  const saving = Number(latest.saving) || 3;
  const workProgress = Number(latest.workProgress) || 3;
  const skillsDeveloped = Number(latest.skillsDeveloped) || 3;
  const moneyHabits = Number(latest.moneyHabits) || 3;
  const spending = Number(latest.spending) || 3;

  const savingScore = ((saving - 1) / 4) * 100;
  const workScore = ((workProgress - 1) / 4) * 100;
  const skillsScore = ((skillsDeveloped - 1) / 4) * 100;
  const habitsScore = ((moneyHabits - 1) / 4) * 100;
  const spendingScore = ((spending - 1) / 4) * 100;

  const baseScore = (savingScore * 0.25) + (workScore * 0.25) + 
                    (skillsScore * 0.20) + (habitsScore * 0.20) + (spendingScore * 0.10);

  const streak = calculateStreak(zoneHistory);
  const streakBonus = Math.min(streak * 3, 20);
  
  const avgSaving = calculateAverage(zoneHistory, 'saving');
  const saverBonus = avgSaving >= 4 ? 5 : 0;

  const rawScore = baseScore + streakBonus + saverBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score),
    details: {
      saving,
      workProgress,
      skillsDeveloped,
      moneyHabits,
      spending,
      baseScore: Math.round(baseScore),
      streakBonus: Math.round(streakBonus),
      saverBonus,
      habitBonus: Math.round(habitBonus),
      daysLogged: zoneHistory.length,
      currentStreak: streak,
      interpretation: getInterpretation(score)
    }
  };
}

/**
 * Calculate Faith Zone score
 * Inputs: scripturePractice, prayer, gratitude, appliedInsights
 * Formula: Weighted with strong streak bonus
 */
function calculateFaithZone(zoneHistory, habitBonus = 0) {
  if (!zoneHistory || zoneHistory.length === 0) {
    return getDefaultZoneResult('faith', habitBonus);
  }

  const latest = zoneHistory[0];
  const scripturePractice = Number(latest.scripturePractice) || 3;
  const prayer = Number(latest.prayer) || 3;
  const gratitude = Number(latest.gratitude) || 3;
  const appliedInsights = Number(latest.appliedInsights) || 3;

  const scriptureScore = ((scripturePractice - 1) / 4) * 100;
  const prayerScore = ((prayer - 1) / 4) * 100;
  const gratitudeScore = ((gratitude - 1) / 4) * 100;
  const insightsScore = ((appliedInsights - 1) / 4) * 100;

  const baseScore = (scriptureScore * 0.30) + (prayerScore * 0.25) + 
                    (gratitudeScore * 0.20) + (insightsScore * 0.25);

  const streak = calculateStreak(zoneHistory);
  const streakBonus = Math.min(streak * 4, 40);
  
  const avgPractice = calculateAverage(zoneHistory, 'scripturePractice');
  const devotionBonus = avgPractice >= 4 ? 5 : 0;

  const rawScore = baseScore + streakBonus + devotionBonus + habitBonus;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score),
    details: {
      scripturePractice,
      prayer,
      gratitude,
      appliedInsights,
      baseScore: Math.round(baseScore),
      streakBonus: Math.round(streakBonus),
      devotionBonus,
      habitBonus: Math.round(habitBonus),
      daysLogged: zoneHistory.length,
      currentStreak: streak,
      commitment: streak >= 7 ? 'excellent' : streak >= 3 ? 'good' : 'building',
      interpretation: getInterpretation(score)
    }
  };
}

function calculateStreak(historyData) {
  if (!historyData || historyData.length === 0) return 0;

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

function calculateTrendBonus(historyData, metrics) {
  if (!historyData || historyData.length < 3) return 0;

  const sorted = [...historyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  let totalTrend = 0;

  metrics.forEach(metric => {
    const values = sorted.map(d => Number(d[metric]) || 3);
    if (values.length >= 2) {
      const recent = values.slice(-3);
      const older = values.slice(0, Math.min(3, values.length - 3));
      
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
      
      totalTrend += (recentAvg - olderAvg) * 2;
    }
  });

  return Math.max(-10, Math.min(10, totalTrend));
}

function calculateInvertedTrendBonus(historyData, metric) {
  if (!historyData || historyData.length < 3) return 0;

  const sorted = [...historyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const values = sorted.map(d => Number(d[metric]) || 3);

  if (values.length >= 2) {
    const recent = values.slice(-3);
    const older = values.slice(0, Math.min(3, values.length - 3));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    return Math.max(-10, Math.min(10, (olderAvg - recentAvg) * 3));
  }

  return 0;
}

function calculateAverage(historyData, metric) {
  if (!historyData || historyData.length === 0) return 3;

  const values = historyData.map(d => Number(d[metric]) || 3);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function getInterpretation(score) {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'strong';
  if (score >= 50) return 'developing';
  if (score >= 35) return 'needs attention';
  return 'critical';
}

function getDefaultZoneResult(zoneId, habitBonus = 0) {
  const config = ZONE_CONFIG[zoneId];
  const details = {
    baseScore: 50,
    habitBonus: Math.round(habitBonus),
    daysLogged: 0,
    interpretation: 'developing'
  };

  if (config) {
    config.inputs.forEach(input => {
      details[input.key] = 3;
    });
  }

  return {
    score: Math.round(Math.min(100, 50 + habitBonus)),
    details
  };
}

/**
 * Calculate a single zone's score from its own history
 */
export function calculateZoneScore(zoneId, zoneHistory, habitBonus = 0) {
  const calculators = {
    health: calculateHealthZone,
    socialEmotional: calculateSocialEmotionalZone,
    family: calculateFamilyZone,
    community: calculateCommunityZone,
    wealth: calculateWealthZone,
    faith: calculateFaithZone
  };

  const calculator = calculators[zoneId];
  if (!calculator) {
    console.warn(`Unknown zone: ${zoneId}`);
    return getDefaultZoneResult(zoneId, habitBonus);
  }

  return calculator(zoneHistory, habitBonus);
}

/**
 * Calculate all 6 Life Zones using their individual histories
 */
export function calculateAllLifeZones(zoneHistories, habitBonuses = null) {
  console.log('🎯 Life Zone Engine: Calculating all zones with zone-specific data...');

  const bonuses = habitBonuses || {
    health: 0,
    socialEmotional: 0,
    wealth: 0,
    faith: 0,
    family: 0,
    community: 0
  };

  const zones = {
    health: calculateZoneScore('health', zoneHistories?.health || [], bonuses.health),
    socialEmotional: calculateZoneScore('socialEmotional', zoneHistories?.socialEmotional || [], bonuses.socialEmotional),
    wealth: calculateZoneScore('wealth', zoneHistories?.wealth || [], bonuses.wealth),
    faith: calculateZoneScore('faith', zoneHistories?.faith || [], bonuses.faith),
    family: calculateZoneScore('family', zoneHistories?.family || [], bonuses.family),
    community: calculateZoneScore('community', zoneHistories?.community || [], bonuses.community)
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
  const zones = {};
  Object.keys(ZONE_CONFIG).forEach(zoneId => {
    zones[zoneId] = getDefaultZoneResult(zoneId, 0);
  });
  return zones;
}

/**
 * Analyze zone trends for Future Avatar preview
 */
export function analyzeZoneTrends(currentZones, previousZones) {
  if (!previousZones) return null;

  const trends = {
    improving: [],
    declining: [],
    stable: []
  };

  const zoneNames = Object.keys(ZONE_CONFIG);

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
