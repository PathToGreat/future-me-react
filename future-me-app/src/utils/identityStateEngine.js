import { getTraitIds, createEmptyTraitState } from './identityTraits';
import { getMappingsForTrait } from './traitMappingTable';
import { computeHabitTraitBoosts } from './habitInfluenceEngine';
import { computeDailySignalBoosts } from './dailySignalBoosts';

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

// Categorical onboarding answers -> 0-100 "goodness" scores. Goodness is encoded
// directly (higher is better for the trait), so no polarity flag is needed. An
// answer not present in a map resolves to null and is skipped, never coerced to 50.
const CATEGORICAL_BASELINE_SCORES = {
  // "Do you wake up tired even after a full night's sleep?" — less fatigue is better
  morningFatigue: { no: 100, sometimes: 50, yes: 15 },
  // Daily movement type
  movementRhythm: { light: 45, moderate: 70, intense: 90 },
  // Eating rhythm — regularity signals discipline
  eatingRhythm: { regular: 90, irregular: 40, snacking: 30 },
  // Sleep rhythm — consistency signals discipline
  sleepRhythm: { consistent: 90, inconsistent: 50, irregular: 25 },
  // Overall emotional climate
  emotionalClimate: { overwhelmed: 20, neutral: 55, hopeful: 90 },
  // Social support level
  socialSupport: { low: 25, average: 55, strong: 90 },
  // Purpose alignment
  purposeAlignment: { disconnected: 20, searching: 50, aligned: 90 },
  // Faith practice rhythm
  faithRhythm: { not_practicing: 40, inconsistent: 55, consistent: 90 },
};

// 1-5 sliders where a HIGHER raw value is worse (inverted on normalize).
const INVERSE_NUMERIC_FIELDS = new Set(['stress', 'bodyTension']);

function resolveBaselineField(key, flat) {
  const raw = flat[key];
  if (raw == null) return null;

  if (typeof raw === 'string') {
    const map = CATEGORICAL_BASELINE_SCORES[key];
    if (!map) return null;
    const score = map[raw];
    return score == null ? null : score;
  }

  const num = Number(raw);
  if (isNaN(num)) return null;
  return INVERSE_NUMERIC_FIELDS.has(key) ? normalizeStressMetric(num) : normalizeMetric(num);
}

// Flatten the shapes baseline data can arrive in (a raw onboardingBaseline, a merged
// getIdentityBaseline object, or — defensively — a full profile) into one flat field
// map. onboardingBaseline is spread LAST so the frozen core-4 baseline values always
// win over any live top-level metrics that a full profile might carry.
function flattenBaselineData(baselineData) {
  if (!baselineData || typeof baselineData !== 'object') return {};
  return {
    ...baselineData,
    ...baselineData.faithPurpose,
    ...baselineData.emotionalProfile,
    ...baselineData.lifestyleRhythm,
    ...baselineData.baselineState,
    ...baselineData.onboardingBaseline,
  };
}

// Trait -> onboarding/reassessment fields that anchor its baseline. Fields absent
// from the data resolve to null and are skipped, so a trait with no data keeps the
// neutral 50 fallback. Equal-weight average across whatever resolves (matches the
// existing design; the spec's mapping is a suggested direction, not fixed weights).
const BASELINE_TRAIT_FIELDS = {
  vitality: ['sleep', 'nutrition', 'activity', 'energyLevel', 'morningFatigue', 'bodyTension'],
  resilience: ['stress', 'sleep', 'bodyTension', 'emotionalClimate'],
  emotionalStability: ['stress', 'emotionalClimate', 'bodyTension', 'sleep'],
  discipline: ['motivationLevel', 'movementRhythm', 'eatingRhythm', 'sleepRhythm', 'activity', 'nutrition'],
  confidence: ['energyLevel', 'activity', 'motivationLevel', 'emotionalClimate', 'socialSupport'],
  socialConnectedness: ['socialSupport', 'emotionalClimate'],
  purposeAlignment: ['purposeAlignment', 'faithRhythm', 'motivationLevel'],
};

function extractBaselineScore(traitId, baselineData) {
  if (!baselineData) return 50;

  const flat = flattenBaselineData(baselineData);
  const keys = BASELINE_TRAIT_FIELDS[traitId] || [];
  if (keys.length === 0) return 50;

  let sum = 0;
  let count = 0;
  for (const key of keys) {
    const score = resolveBaselineField(key, flat);
    if (score != null) {
      sum += score;
      count++;
    }
  }

  return count > 0 ? clamp(sum / count, 0, 100) : 50;
}

/**
 * Merge the onboarding/reassessment baseline data — which lives across several
 * sibling profile objects — into a single flat baseline object for the ITE.
 * onboardingBaseline is spread LAST so the frozen core-4 baseline metrics win.
 * Returns null when the profile has no baseline data at all, so canRunITE keeps
 * gating the ITE off for users who have not completed onboarding.
 */
export function getIdentityBaseline(profile) {
  if (!profile || typeof profile !== 'object') return null;

  const { onboardingBaseline, baselineState, lifestyleRhythm, emotionalProfile, faithPurpose } = profile;
  if (!onboardingBaseline && !baselineState && !lifestyleRhythm && !emotionalProfile && !faithPurpose) {
    return null;
  }

  return {
    ...baselineState,
    ...lifestyleRhythm,
    ...emotionalProfile,
    ...faithPurpose,
    ...onboardingBaseline,
  };
}

export function computeIdentityState(rawMetrics, historyData, baselineData, earlyStage) {
  const sources = buildSourceMap(rawMetrics, historyData, baselineData);
  const habitBoosts = computeHabitTraitBoosts(rawMetrics?.defaultHabitCompletions);
  // Bounded, additive nudges from the newer daily/health-detail signals. Applied
  // to the current score only (never to historical averages), mirroring habitBoost.
  const dailyBoosts = computeDailySignalBoosts(rawMetrics);
  const traitIds = getTraitIds();
  const traitState = {};

  for (const traitId of traitIds) {
    const rawScore = computeTraitCurrentScore(traitId, sources);
    const habitBoost = habitBoosts[traitId] || 0;
    const dailyBoost = dailyBoosts[traitId] || 0;
    const currentScore = clamp(rawScore + habitBoost + dailyBoost, 0, 100);
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
