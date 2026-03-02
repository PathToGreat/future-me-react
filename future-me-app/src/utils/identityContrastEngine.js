import { getTraitIds, getTraitMeta } from './identityTraits';

function classifyMagnitude(absDelta) {
  if (absDelta >= 10) return 'strong';
  if (absDelta >= 4) return 'moderate';
  return 'slight';
}

function formatSign(delta) {
  return delta > 0 ? '+' : '';
}

export function computeIdentityContrast(iteResult) {
  if (!iteResult?.traits || !iteResult?.projection12Month) return null;

  const { traits, projection12Month, toneState = 'stable' } = iteResult;
  const traitIds = getTraitIds();

  const deltas = traitIds.map(id => {
    const current = traits[id]?.currentScore ?? 50;
    const projected = projection12Month[id] ?? current;
    const delta = projected - current;
    return {
      traitId: id,
      trait: getTraitMeta(id)?.label || id,
      current,
      projected,
      delta,
      absDelta: Math.abs(delta),
      magnitudeLabel: classifyMagnitude(Math.abs(delta))
    };
  });

  const gains = deltas.filter(d => d.delta > 0).sort((a, b) => b.absDelta - a.absDelta);
  const losses = deltas.filter(d => d.delta < 0).sort((a, b) => b.absDelta - a.absDelta);

  const topGains = gains.slice(0, 2).map(({ trait, delta, magnitudeLabel }) => ({ trait, delta, magnitudeLabel }));
  const topLosses = losses.slice(0, 2).map(({ trait, delta, magnitudeLabel }) => ({ trait, delta, magnitudeLabel }));

  const allSorted = [...deltas].sort((a, b) => b.absDelta - a.absDelta);
  const velocitySorted = traitIds
    .map(id => ({ id, velocity: Math.abs(traits[id]?.velocity ?? 0) }))
    .sort((a, b) => b.velocity - a.velocity);

  const mostSensitiveTrait = velocitySorted.length > 0
    ? getTraitMeta(velocitySorted[0].id)?.label || velocitySorted[0].id
    : null;

  const contrastSummaryCurrentToFuture = buildCurrentToFutureSummary(topGains, topLosses, toneState);
  const contrastSummaryFutureToCurrent = buildFutureToCurrentSummary(topGains, topLosses, mostSensitiveTrait, toneState);

  const deltaList = buildDeltaList(topGains, topLosses);

  return {
    toneState,
    topGains,
    topLosses,
    mostSensitiveTrait,
    contrastSummaryCurrentToFuture,
    contrastSummaryFutureToCurrent,
    deltaList
  };
}

function buildCurrentToFutureSummary(topGains, topLosses, toneState) {
  const hasGains = topGains.length > 0;
  const hasLosses = topLosses.length > 0;

  if (!hasGains && !hasLosses) {
    if (toneState === 'drifting') {
      return 'Your current and projected states are close, though recent velocity shifts may begin to separate them.';
    }
    return 'Your current and projected states are closely aligned. Consistency will determine whether this holds or compounds.';
  }

  const biggestMovers = [...topGains, ...topLosses]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);
  const moverNames = biggestMovers.map(m => m.trait);

  if (toneState === 'strengthening') {
    if (moverNames.length === 2) {
      return `Compared to your projected future, the biggest shifts are in ${moverNames[0]} and ${moverNames[1]}. These patterns are building on each other.`;
    }
    return `Compared to your projected future, ${moverNames[0]} shows the most projected movement. Current patterns are compounding.`;
  }

  if (toneState === 'drifting') {
    if (moverNames.length === 2) {
      return `Compared to your projected future, the biggest shifts are in ${moverNames[0]} and ${moverNames[1]}. This reflects drift, not failure — small changes could redirect this.`;
    }
    return `Compared to your projected future, ${moverNames[0]} shows the most projected movement. The trajectory can still be adjusted.`;
  }

  if (moverNames.length === 2) {
    return `Compared to your projected future, the biggest shifts are in ${moverNames[0]} and ${moverNames[1]}.`;
  }
  return `Compared to your projected future, ${moverNames[0]} shows the most projected movement.`;
}

function buildFutureToCurrentSummary(topGains, topLosses, mostSensitiveTrait, toneState) {
  const parts = [];

  if (mostSensitiveTrait) {
    parts.push(mostSensitiveTrait);
  }

  if (parts.length === 0 && topGains.length > 0) {
    parts.push(topGains[0].trait);
  }

  if (toneState === 'strengthening') {
    if (parts.length > 0) {
      return `This projection is most influenced by ${parts[0]}. If these patterns hold, the gap between current and future continues to widen in a constructive direction.`;
    }
    return 'Current patterns are projected to compound. The distance between now and your projected future is growing steadily.';
  }

  if (toneState === 'drifting') {
    if (parts.length > 0) {
      return `This projection is most sensitive to ${parts[0]}. The data suggests this is where a small shift would have the largest effect.`;
    }
    return 'Your projected future reflects current drift. One or two consistent changes would measurably alter this trajectory.';
  }

  if (parts.length > 0) {
    return `This projection is most influenced by ${parts[0]}. Your trajectory is steady — the next shift will come from consistency in key areas.`;
  }
  return 'Your trajectory is steady. The next shift will come from consistency in one or two key areas.';
}

function buildDeltaList(topGains, topLosses) {
  const items = [];
  for (const g of topGains) {
    items.push(`+${g.trait} (${g.magnitudeLabel})`);
  }
  for (const l of topLosses) {
    items.push(`-${l.trait} (${l.magnitudeLabel})`);
  }
  if (items.length === 0) return null;
  return `Projected shifts: ${items.join(', ')}.`;
}
