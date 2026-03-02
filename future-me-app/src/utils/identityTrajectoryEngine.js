import { computeIdentityState } from './identityStateEngine';
import { project12Months, project5Years } from './projectionEngine';
import { computeVisualDelta } from './identityVisualDeltaEngine';
import { generateIdentityNarrative } from './identityNarrativeEngine';
import { getTraitIds } from './identityTraits';
import { computeTrajectoryIntensity } from './traitImpactEngine';
import { computeIdentityContrast } from './identityContrastEngine';

export function runIdentityTrajectoryEngine(rawMetrics, historyData, baselineData) {
  const traits = computeIdentityState(rawMetrics, historyData, baselineData);

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

  const projection12Month = project12Months(traits);
  const projection5Year = project5Years(traits);

  for (const traitId of getTraitIds()) {
    if (traits[traitId]) {
      traits[traitId].projected12Month = projection12Month[traitId] ?? traits[traitId].currentScore;
      traits[traitId].projected5Year = projection5Year[traitId] ?? traits[traitId].currentScore;
    }
  }

  const visualDelta = computeVisualDelta(traits, projection12Month);

  const { toneState } = computeTrajectoryIntensity(traits, projection12Month);

  const narrative = generateIdentityNarrative(traits, projection12Month, projection5Year, toneState);

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
    _meta: {
      generatedAt: new Date().toISOString(),
      traitCount: getTraitIds().length,
      historyDepth: historyData?.length || 0
    }
  };
}
