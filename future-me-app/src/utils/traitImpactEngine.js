import { getActionMapping } from './actionTraitMappingTable';
import { getTraitMeta } from './identityTraits';

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
