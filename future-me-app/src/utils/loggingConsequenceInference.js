import { getActionMapping } from './actionTraitMappingTable';
import { getTraitMeta } from './identityTraits';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function avg(arr, key) {
  const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function variance(arr, key) {
  const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

function consecutiveLoggingDays(historyData) {
  if (!historyData || historyData.length === 0) return 0;
  const sorted = [...historyData].sort((a, b) => new Date(b.date) - new Date(a.date));
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diff <= 1.5) count++;
    else break;
  }
  return count;
}

export function inferActionsFromLog(todayMetrics, historyData, lifeZones) {
  const inferred = [];
  if (!todayMetrics || !historyData || historyData.length < 3) return inferred;

  const recent = historyData.slice(0, 7);
  const recentSleepAvg = avg(recent, 'sleep');
  const recentStressAvg = avg(recent, 'stress');
  const recentActivityAvg = avg(recent, 'activity');
  const recentNutritionAvg = avg(recent, 'nutrition');
  const sleepVar = variance(recent, 'sleep');
  const nutritionVar = variance(recent, 'nutrition');

  if (sleepVar !== null && sleepVar < 0.4 && recent.length >= 5) {
    inferred.push({ actionKey: 'SleepConsistencyImproved', confidence: clamp(0.5 + (0.4 - sleepVar), 0.5, 0.9) });
  }

  if (recentSleepAvg !== null && todayMetrics.sleep > recentSleepAvg + 0.3) {
    inferred.push({ actionKey: 'SleepDurationImproved', confidence: 0.7 });
  }

  if (recentStressAvg !== null && todayMetrics.stress < recentStressAvg - 0.3) {
    inferred.push({ actionKey: 'StressDecompressionBlock', confidence: 0.6 });
  }

  if (todayMetrics.activity >= 4) {
    inferred.push({ actionKey: 'StrengthTraining', confidence: 0.6 });
  } else if (todayMetrics.activity >= 3) {
    inferred.push({ actionKey: 'DailyWalk', confidence: 0.6 });
  }

  if (nutritionVar !== null && nutritionVar < 0.3 && recent.length >= 5) {
    inferred.push({ actionKey: 'NutritionStability', confidence: clamp(0.5 + (0.3 - nutritionVar), 0.5, 0.85) });
  }

  if (recentNutritionAvg !== null && todayMetrics.nutrition > recentNutritionAvg + 0.3) {
    inferred.push({ actionKey: 'NutritionQuality', confidence: 0.65 });
  }

  const consecutiveDays = consecutiveLoggingDays(historyData);
  if (consecutiveDays >= 3) {
    inferred.push({ actionKey: 'LoggingConsistency', confidence: clamp(0.5 + (consecutiveDays - 3) * 0.05, 0.5, 0.9) });
  }

  if (lifeZones?.socialEmotional?.score > 50) {
    inferred.push({ actionKey: 'SocialConnectionTouchpoint', confidence: 0.5 });
  }

  if (lifeZones?.family?.score > 50) {
    inferred.push({ actionKey: 'FamilyConnectionBlock', confidence: 0.5 });
  }

  if (lifeZones?.faith?.score > 50) {
    inferred.push({ actionKey: 'FaithPracticeConsistency', confidence: 0.5 });
  }

  return inferred
    .filter(a => a.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export function findStrongestInferredLever(inferredActions, iteResult) {
  if (!inferredActions || inferredActions.length === 0 || !iteResult) return null;

  const projShifts = [];
  const traitIds = Object.keys(iteResult.traits || {});
  for (const traitId of traitIds) {
    const current = iteResult.traits[traitId]?.currentScore ?? 50;
    const projected = iteResult.projection12Month?.[traitId] ?? current;
    const diff = projected - current;
    if (diff > 2) projShifts.push({ traitId, diff });
  }

  if (projShifts.length === 0) return null;
  projShifts.sort((a, b) => b.diff - a.diff);
  const topTrait = projShifts[0];

  for (const inferred of inferredActions) {
    const mapping = getActionMapping(inferred.actionKey);
    if (!mapping) continue;
    const match = mapping.traits.find(t => t.traitId === topTrait.traitId && t.weight >= 0.25);
    if (match) {
      const meta = getTraitMeta(topTrait.traitId);
      return {
        actionKey: inferred.actionKey,
        actionLabel: mapping.label,
        traitId: topTrait.traitId,
        traitLabel: meta?.label || topTrait.traitId,
        narrative: `Your recent ${mapping.label.toLowerCase()} is the strongest lever moving your projected ${meta?.label || topTrait.traitId} upward.`
      };
    }
  }

  return null;
}
