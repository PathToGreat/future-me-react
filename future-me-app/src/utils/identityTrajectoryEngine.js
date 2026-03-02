import { computeIdentityState } from './identityStateEngine';
import { project12Months, project5Years } from './projectionEngine';
import { computeVisualDelta } from './identityVisualDeltaEngine';
import { generateIdentityNarrative } from './identityNarrativeEngine';
import { getTraitIds } from './identityTraits';
import { computeTrajectoryIntensity } from './traitImpactEngine';
import { computeIdentityContrast } from './identityContrastEngine';

function detectEarlyStage(historyData) {
  const historyLength = historyData?.length || 0;
  if (historyLength < 7) return true;

  if (historyData && historyData.length > 0) {
    const dates = historyData
      .map(e => new Date(e.date))
      .filter(d => !isNaN(d.getTime()));
    if (dates.length > 0) {
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const daysSinceFirst = (Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceFirst < 7) return true;
    }
  }

  return false;
}

export function runIdentityTrajectoryEngine(rawMetrics, historyData, baselineData) {
  const earlyStage = detectEarlyStage(historyData);

  const traits = computeIdentityState(rawMetrics, historyData, baselineData, earlyStage);

  const velocity = {};
  for (const traitId of getTraitIds()) {
    const trait = traits[traitId];
    if (trait) {
      velocity[traitId] = {
        raw: trait.velocity,
        direction: trait.velocityDirection,
        magnitude: trait.velocityMagnitude
      };
    }
  }

  const projection12Month = project12Months(traits, earlyStage);
  const projection5Year = project5Years(traits, earlyStage);

  for (const traitId of getTraitIds()) {
    if (traits[traitId]) {
      traits[traitId].projected12Month = projection12Month[traitId] ?? traits[traitId].currentScore;
      traits[traitId].projected5Year = projection5Year[traitId] ?? traits[traitId].currentScore;
    }
  }

  const visualDelta = computeVisualDelta(traits, projection12Month);

  const { toneState } = computeTrajectoryIntensity(traits, projection12Month, earlyStage);

  const narrative = generateIdentityNarrative(traits, projection12Month, projection5Year, toneState, earlyStage);

  const iteResultForContrast = { traits, projection12Month, toneState };
  const contrast = computeIdentityContrast(iteResultForContrast);

  return {
    traits,
    velocity,
    projection12Month,
    projection5Year,
    visualDelta,
    narrative,
    toneState,
    contrast,
    earlyStage,
    _meta: {
      generatedAt: new Date().toISOString(),
      traitCount: getTraitIds().length,
      historyDepth: historyData?.length || 0,
      earlyStage
    }
  };
}
