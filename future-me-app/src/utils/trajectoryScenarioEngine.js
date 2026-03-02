import { getScenario, selectDefaultScenario } from './scenarioLibrary';
import { getActionMapping } from './actionTraitMappingTable';
import { getTraitIds, getTraitMeta } from './identityTraits';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function diminishingReturns(current, delta) {
  if (delta > 0) {
    const headroom = 100 - current;
    const factor = headroom / 100;
    return delta * factor * factor;
  } else {
    const floor = current;
    const factor = floor / 100;
    return delta * factor * factor;
  }
}

function computeScenarioVelocityAdjustment(scenario) {
  const adjustments = {};

  for (const actionKey of scenario.actionKeys) {
    const mapping = getActionMapping(actionKey);
    if (!mapping) continue;

    for (const t of mapping.traits) {
      const sign = scenario.direction === 'negative' ? -1 : 1;
      const rawAdj = t.weight * sign * 1.5;
      const existing = adjustments[t.traitId] || 0;
      adjustments[t.traitId] = existing + rawAdj;
    }
  }

  for (const traitId of Object.keys(adjustments)) {
    adjustments[traitId] = clamp(adjustments[traitId], -3, 3);
  }

  return adjustments;
}

function projectWithScenario(traitState, velocityAdjustments, months) {
  const DAMPING_PER_MONTH = 0.92;
  const projections = {};
  const traitIds = getTraitIds();

  for (const traitId of traitIds) {
    const trait = traitState[traitId];
    if (!trait) {
      projections[traitId] = 50;
      continue;
    }

    const { currentScore, velocity, sevenDayAvg, thirtyDayAvg } = trait;
    const adjustedVelocity = velocity + (velocityAdjustments[traitId] || 0);

    const slope = (sevenDayAvg != null && thirtyDayAvg != null)
      ? (sevenDayAvg - thirtyDayAvg) / 30
      : 0;
    const monthlyVelocity = adjustedVelocity * 2.5;
    const monthlySlope = slope * 30;
    const blendedMonthlyDelta = (monthlyVelocity * 0.6) + (monthlySlope * 0.4);

    let projected = currentScore;
    for (let m = 1; m <= months; m++) {
      const dampingFactor = Math.pow(DAMPING_PER_MONTH, m);
      const rawDelta = blendedMonthlyDelta * dampingFactor;
      const adjustedDelta = diminishingReturns(projected, rawDelta);
      projected = clamp(projected + adjustedDelta, 0, 100);
    }

    projections[traitId] = Math.round(projected * 10) / 10;
  }

  return projections;
}

function classifyDelta(delta) {
  const abs = Math.abs(delta);
  if (abs >= 8) return 'strong';
  if (abs >= 3) return 'moderate';
  if (abs >= 0.5) return 'slight';
  return 'negligible';
}

function buildScenarioNarrative(scenario, topImprovements, topRiskReduction, scenarioTone) {
  const traitNames = topImprovements.map(t => t.label);
  const durationLabel = `${scenario.durationDays} days`;

  if (scenario.direction === 'negative') {
    if (topImprovements.length > 0) {
      const declineTraits = traitNames.slice(0, 2).join(' and ');
      return `If ${scenario.shortLabel.toLowerCase()} continues for ${durationLabel}, ${declineTraits} ${topImprovements.length === 1 ? 'is' : 'are'} projected to soften.`;
    }
    return `If ${scenario.shortLabel.toLowerCase()} continues for ${durationLabel}, several traits may begin to shift.`;
  }

  if (traitNames.length >= 2) {
    return `If ${scenario.shortLabel.toLowerCase()} holds for ${durationLabel}, ${traitNames[0]} and ${traitNames[1]} are projected to strengthen.`;
  }
  if (traitNames.length === 1) {
    return `If ${scenario.shortLabel.toLowerCase()} holds for ${durationLabel}, ${traitNames[0]} is projected to strengthen.`;
  }
  return `If ${scenario.shortLabel.toLowerCase()} holds for ${durationLabel}, your trajectory is projected to shift.`;
}

export function simulateScenario(iteResult, scenarioKey) {
  if (!iteResult?.traits || !iteResult?.projection12Month) return null;

  const scenario = getScenario(scenarioKey);
  if (!scenario) return null;

  const historyDepth = iteResult._meta?.historyDepth || 0;
  if (historyDepth < scenario.confidenceMinHistory) return null;

  const velocityAdjustments = computeScenarioVelocityAdjustment(scenario);

  const scenarioProjection12 = projectWithScenario(iteResult.traits, velocityAdjustments, 12);
  const scenarioProjection5Y = projectWithScenario(iteResult.traits, velocityAdjustments, 60);

  const traitIds = getTraitIds();
  const deltaFromBaseProjection = {};
  const allDeltas = [];

  for (const traitId of traitIds) {
    const baseProjScore = iteResult.projection12Month[traitId] ?? 50;
    const scenarioProjScore = scenarioProjection12[traitId] ?? 50;
    const delta = Math.round((scenarioProjScore - baseProjScore) * 10) / 10;
    deltaFromBaseProjection[traitId] = delta;
    allDeltas.push({
      traitId,
      label: getTraitMeta(traitId)?.label || traitId,
      delta,
      absDelta: Math.abs(delta),
      magnitude: classifyDelta(delta)
    });
  }

  const improvements = allDeltas
    .filter(d => (scenario.direction === 'positive' ? d.delta > 0 : d.delta < 0))
    .sort((a, b) => b.absDelta - a.absDelta);
  const topImprovements = improvements.slice(0, 2);

  const riskReductions = allDeltas
    .filter(d => scenario.direction === 'positive' && d.delta > 0)
    .sort((a, b) => b.absDelta - a.absDelta);
  const topRiskReduction = riskReductions.length > 0 ? riskReductions[0] : null;

  let scenarioTone = 'neutral';
  const totalPositiveDelta = allDeltas.filter(d => d.delta > 0).reduce((s, d) => s + d.delta, 0);
  const totalNegativeDelta = allDeltas.filter(d => d.delta < 0).reduce((s, d) => s + d.delta, 0);
  if (totalPositiveDelta > Math.abs(totalNegativeDelta) + 2) {
    scenarioTone = 'encouraging';
  } else if (Math.abs(totalNegativeDelta) > totalPositiveDelta + 2) {
    scenarioTone = 'confrontational';
  }

  const scenarioNarrative = buildScenarioNarrative(scenario, topImprovements, topRiskReduction, scenarioTone);

  let compactSummary = '';
  if (topImprovements.length >= 2) {
    const verb = scenario.direction === 'positive' ? 'strengthens' : 'shifts';
    compactSummary = `If held for ${scenario.durationDays} days, this most directly ${verb} ${topImprovements[0].label} and ${topImprovements[1].label}.`;
  } else if (topImprovements.length === 1) {
    const verb = scenario.direction === 'positive' ? 'strengthens' : 'shifts';
    compactSummary = `If held for ${scenario.durationDays} days, this most directly ${verb} ${topImprovements[0].label}.`;
  }

  return {
    scenarioKey,
    scenarioLabel: scenario.label,
    durationDays: scenario.durationDays,
    direction: scenario.direction,
    deltaFromBaseProjection,
    scenarioProjection12,
    scenarioProjection5Y,
    topImprovements,
    topRiskReduction,
    scenarioNarrative,
    scenarioTone,
    compactSummary,
    generatedAt: new Date().toISOString()
  };
}

export function simulateDefaultScenario(iteResult, mostSensitiveTrait, strongestLever) {
  const historyDepth = iteResult?._meta?.historyDepth || 0;

  const scenario = selectDefaultScenario(mostSensitiveTrait, strongestLever, historyDepth);
  if (!scenario) return null;

  return simulateScenario(iteResult, scenario.key);
}
