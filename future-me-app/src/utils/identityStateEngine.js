import { getTraitIds, createEmptyTraitState } from './identityTraits';
import { getMappingsForTrait } from './traitMappingTable';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function resolveSourceValue(sourceKey, resolvedSources) {
  return resolvedSources[sourceKey] ?? null;
}

function normalizeMetric(value, scale = 5) {
  if (value == null || isNaN(value)) return 50;
  return clamp((value / scale) * 100, 0, 100);
}

function normalizeStressMetric(value, scale = 5) {
  if (value == null || isNaN(value)) return 50;
  return clamp(((scale - value) / scale) * 100, 0, 100);
}

function buildSourceMap(rawMetrics, historyData, baselineData) {
  const sources = {};

  const activity = rawMetrics?.activity ?? rawMetrics?.activityScore ?? 3;
  const nutrition = rawMetrics?.nutrition ?? rawMetrics?.nutritionScore ?? 3;
  const sleep = rawMetrics?.sleep ?? rawMetrics?.sleepScore ?? 3;
  const stress = rawMetrics?.stress ?? rawMetrics?.stressScore ?? 3;

  sources['health.activity'] = normalizeMetric(activity);
  sources['health.nutrition'] = normalizeMetric(nutrition);
  sources['health.sleep'] = normalizeMetric(sleep);
  sources['health.stress'] = normalizeMetric(stress);

  const zones = rawMetrics?.lifeZones || rawMetrics?.lifeZoneScores || {};
  const zoneKeys = ['health', 'socialEmotional', 'wealth', 'faith', 'family', 'community'];
  for (const key of zoneKeys) {
    const zoneData = zones[key];
    const score = typeof zoneData === 'object' ? (zoneData?.score ?? 50) : (zoneData ?? 50);
    sources[`zone.${key}`] = clamp(score, 0, 100);
  }

  const loggingConsistency = computeLoggingConsistency(historyData);
  sources['consistency.logging'] = loggingConsistency;

  const habitCompletion = computeHabitCompletion(rawMetrics);
  sources['consistency.habitCompletion'] = habitCompletion;

  return sources;
}

function computeLoggingConsistency(historyData) {
  if (!historyData || historyData.length === 0) return 30;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let daysLogged = 0;
  for (const entry of historyData) {
    const entryDate = new Date(entry.date);
    if (entryDate >= thirtyDaysAgo) daysLogged++;
  }

  return clamp((daysLogged / 30) * 100, 0, 100);
}

function computeHabitCompletion(rawMetrics) {
  const habits = rawMetrics?.habits;
  if (!habits || habits.length === 0) return 40;

  const streaks = habits.map(h => h.streak || 0);
  const avgStreak = streaks.reduce((s, v) => s + v, 0) / streaks.length;
  return clamp((avgStreak / 14) * 100, 0, 100);
}

function computeTraitCurrentScore(traitId, sources) {
  const mappings = getMappingsForTrait(traitId);
  if (mappings.length === 0) return 50;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const mapping of mappings) {
    let value = resolveSourceValue(mapping.source, sources);
    if (value === null) continue;

    if (mapping.polarity === -1) {
      value = 100 - value;
    }

    weightedSum += value * mapping.weight;
    totalWeight += mapping.weight;
  }

  if (totalWeight === 0) return 50;
  return clamp(weightedSum / totalWeight, 0, 100);
}

function computeHistoricalAverage(traitId, historyData, sources, days) {
  if (!historyData || historyData.length === 0) return null;

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  const relevantEntries = historyData.filter(entry => {
    const d = new Date(entry.date);
    return d >= cutoff;
  });

  if (relevantEntries.length === 0) return null;

  const scores = relevantEntries.map(entry => {
    const entrySources = buildSourceMapFromEntry(entry, sources);
    return computeTraitCurrentScore(traitId, entrySources);
  });

  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function buildSourceMapFromEntry(entry, fallbackSources) {
  const sources = { ...fallbackSources };

  if (entry.activity != null) sources['health.activity'] = normalizeMetric(entry.activity);
  if (entry.nutrition != null) sources['health.nutrition'] = normalizeMetric(entry.nutrition);
  if (entry.sleep != null) sources['health.sleep'] = normalizeMetric(entry.sleep);
  if (entry.stress != null) sources['health.stress'] = normalizeMetric(entry.stress);

  return sources;
}

function computeVelocity(sevenDayAvg, thirtyDayAvg, baselineScore, earlyStage) {
  if (sevenDayAvg === null || thirtyDayAvg === null) {
    if (earlyStage && sevenDayAvg !== null) {
      const baselineDelta = sevenDayAvg - baselineScore;
      const rawVelocity = baselineDelta * 0.55;
      const smoothed = clamp(rawVelocity * 0.6, -15, 15);
      const absVelocity = Math.abs(smoothed);
      return {
        raw: Math.round(smoothed * 100) / 100,
        direction: smoothed > 1.0 ? 'positive' : smoothed < -1.0 ? 'negative' : 'neutral',
        magnitude: absVelocity > 8 ? 'strong' : absVelocity > 2.5 ? 'moderate' : 'low'
      };
    }
    return { raw: 0, direction: 'neutral', magnitude: 'low' };
  }

  const shortTermWeight = earlyStage ? 0.4 : 0.65;
  const baselineWeight = earlyStage ? 0.6 : 0.35;

  const shortTermDelta = sevenDayAvg - thirtyDayAvg;
  const baselineDelta = sevenDayAvg - baselineScore;

  const rawVelocity = (shortTermDelta * shortTermWeight) + (baselineDelta * baselineWeight);

  const dampened = rawVelocity * 0.6;
  const smoothed = clamp(dampened, -15, 15);

  const dirThreshold = earlyStage ? 1.0 : 1.5;
  let direction = 'neutral';
  if (smoothed > dirThreshold) direction = 'positive';
  else if (smoothed < -dirThreshold) direction = 'negative';

  const modThreshold = earlyStage ? 2.5 : 3;
  let magnitude = 'low';
  const absVelocity = Math.abs(smoothed);
  if (absVelocity > 8) magnitude = 'strong';
  else if (absVelocity > modThreshold) magnitude = 'moderate';

  return {
    raw: Math.round(smoothed * 100) / 100,
    direction,
    magnitude
  };
}

function extractBaselineScore(traitId, baselineData) {
  if (!baselineData) return 50;

  const baselineMap = {
    vitality: ['activity', 'sleep', 'nutrition'],
    resilience: ['stress', 'sleep', 'activity'],
    emotionalStability: ['stress', 'sleep'],
    discipline: [],
    confidence: [],
    socialConnectedness: [],
    purposeAlignment: []
  };

  const keys = baselineMap[traitId] || [];
  if (keys.length === 0) return 50;

  let sum = 0;
  let count = 0;
  for (const key of keys) {
    const val = baselineData[key] ?? baselineData?.onboardingBaseline?.[key];
    if (val != null) {
      const normalized = key === 'stress' ? normalizeStressMetric(val) : normalizeMetric(val);
      sum += normalized;
      count++;
    }
  }

  return count > 0 ? clamp(sum / count, 0, 100) : 50;
}

export function computeIdentityState(rawMetrics, historyData, baselineData, earlyStage) {
  const sources = buildSourceMap(rawMetrics, historyData, baselineData);
  const traitIds = getTraitIds();
  const traitState = {};

  for (const traitId of traitIds) {
    const currentScore = computeTraitCurrentScore(traitId, sources);
    const baselineScore = extractBaselineScore(traitId, baselineData);
    const sevenDayAvg = computeHistoricalAverage(traitId, historyData, sources, 7) ?? currentScore;
    const thirtyDayAvgRaw = computeHistoricalAverage(traitId, historyData, sources, 30);
    const thirtyDayAvg = earlyStage && thirtyDayAvgRaw === null ? null : (thirtyDayAvgRaw ?? currentScore);

    const velocity = computeVelocity(sevenDayAvg, thirtyDayAvg, baselineScore, earlyStage);

    traitState[traitId] = {
      traitId,
      currentScore: Math.round(currentScore * 10) / 10,
      baselineScore: Math.round(baselineScore * 10) / 10,
      sevenDayAvg: Math.round(sevenDayAvg * 10) / 10,
      thirtyDayAvg: thirtyDayAvg !== null ? Math.round(thirtyDayAvg * 10) / 10 : Math.round(currentScore * 10) / 10,
      velocity: velocity.raw,
      velocityDirection: velocity.direction,
      velocityMagnitude: velocity.magnitude,
      projected12Month: 50,
      projected5Year: 50
    };
  }

  return traitState;
}
