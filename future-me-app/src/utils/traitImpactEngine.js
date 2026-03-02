import { getActionMapping } from './actionTraitMappingTable';
import { getTraitMeta, getTraitIds } from './identityTraits';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function estimateMagnitude(weight, currentScore) {
  const headroom = currentScore < 50 ? 'moderate' : currentScore < 75 ? 'small' : 'minimal';
  if (weight >= 0.4) return headroom === 'minimal' ? 'small' : headroom;
  if (weight >= 0.2) return 'small';
  return 'minimal';
}

function magnitudeLabel(mag) {
  if (mag === 'moderate') return 'measurably';
  if (mag === 'small') return 'incrementally';
  return 'subtly';
}

export function computeActionTraitImpact(actionKey, currentTraitState) {
  const mapping = getActionMapping(actionKey);
  if (!mapping) return null;

  const impactedTraits = mapping.traits.map(t => {
    const currentScore = currentTraitState?.[t.traitId]?.currentScore ?? 50;
    const magnitude = estimateMagnitude(t.weight, currentScore);
    const meta = getTraitMeta(t.traitId);
    return {
      traitId: t.traitId,
      label: meta?.label || t.traitId,
      weight: t.weight,
      polarity: t.polarity,
      estimatedMagnitude: magnitude,
      currentScore
    };
  });

  impactedTraits.sort((a, b) => b.weight - a.weight);

  const primary = impactedTraits[0];
  const secondary = impactedTraits[1];

  let consequenceLine = '';
  if (primary && secondary) {
    consequenceLine = `This ${magnitudeLabel(primary.estimatedMagnitude)} supports ${primary.label} and ${secondary.label}.`;
  } else if (primary) {
    consequenceLine = `This ${magnitudeLabel(primary.estimatedMagnitude)} supports ${primary.label}.`;
  }

  return {
    actionKey,
    actionLabel: mapping.label,
    impactedTraits,
    timeToEffect: mapping.timeToEffect,
    consequenceLine
  };
}

export function computeMultipleActionImpacts(actionKeys, currentTraitState) {
  return actionKeys
    .map(key => computeActionTraitImpact(key, currentTraitState))
    .filter(Boolean);
}

export function findStrongestLever(actionKeys, currentTraitState, targetTraitId) {
  const impacts = computeMultipleActionImpacts(actionKeys, currentTraitState);
  let best = null;
  let bestWeight = 0;

  for (const impact of impacts) {
    const match = impact.impactedTraits.find(t => t.traitId === targetTraitId);
    if (match && match.weight > bestWeight) {
      bestWeight = match.weight;
      best = impact;
    }
  }

  return best;
}

export function computeTrajectoryIntensity(traitState, projections, earlyStage) {
  if (!traitState || !projections) {
    return { intensityScore: 0, toneState: 'stable' };
  }

  const traitIds = getTraitIds();
  const velocities = traitIds
    .map(id => ({ id, velocity: Math.abs(traitState[id]?.velocity ?? 0) }))
    .sort((a, b) => b.velocity - a.velocity);

  const top3Velocities = velocities.slice(0, 3);
  const avgTopVelocity = top3Velocities.length > 0
    ? top3Velocities.reduce((sum, t) => sum + t.velocity, 0) / top3Velocities.length
    : 0;

  const dirThreshold = earlyStage ? 1.0 : 1.5;
  let convergenceCount = 0;
  const directions = traitIds.map(id => {
    const v = traitState[id]?.velocity ?? 0;
    if (v > dirThreshold) return 'positive';
    if (v < -dirThreshold) return 'negative';
    return 'neutral';
  });
  const positiveCount = directions.filter(d => d === 'positive').length;
  const negativeCount = directions.filter(d => d === 'negative').length;
  const convergenceMin = earlyStage ? 2 : 3;
  if (positiveCount >= convergenceMin) convergenceCount = positiveCount;
  if (negativeCount >= convergenceMin) convergenceCount = Math.max(convergenceCount, negativeCount);

  let totalSlopeStrength = 0;
  for (const traitId of traitIds) {
    const current = traitState[traitId]?.currentScore ?? 50;
    const projected = projections[traitId] ?? current;
    totalSlopeStrength += Math.abs(projected - current);
  }
  const avgSlopeStrength = totalSlopeStrength / traitIds.length;

  const velocityComponent = clamp(avgTopVelocity / 15, 0, 1) * 40;
  const convergenceComponent = clamp(convergenceCount / 5, 0, 1) * 30;
  const slopeComponent = clamp(avgSlopeStrength / 10, 0, 1) * 30;
  const intensityScore = clamp(velocityComponent + convergenceComponent + slopeComponent, 0, 100);

  const strengtheningThreshold = earlyStage ? 30 : 40;
  const driftingThreshold = earlyStage ? 28 : 35;

  let toneState = 'stable';
  if (intensityScore >= strengtheningThreshold && positiveCount > negativeCount) {
    toneState = 'strengthening';
  } else if (intensityScore >= driftingThreshold && negativeCount > positiveCount) {
    if (earlyStage) {
      const historyDepth = Object.values(traitState)[0]?.historyDepth;
      if (historyDepth != null && historyDepth <= 3 && intensityScore < 50) {
        toneState = 'stable';
      } else {
        toneState = 'drifting';
      }
    } else {
      toneState = 'drifting';
    }
  }

  return { intensityScore, toneState };
}
