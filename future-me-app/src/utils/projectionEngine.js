import { getTraitIds } from './identityTraits';

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

function computeThirtyDaySlope(sevenDayAvg, thirtyDayAvg) {
  if (sevenDayAvg == null || thirtyDayAvg == null) return 0;
  return (sevenDayAvg - thirtyDayAvg) / 30;
}

export function project12Months(traitState, earlyStage) {
  const projections = {};
  const traitIds = getTraitIds();
  const MONTHS = 12;
  const DAMPING_PER_MONTH = earlyStage ? 0.88 : 0.92;

  for (const traitId of traitIds) {
    const trait = traitState[traitId];
    if (!trait) {
      projections[traitId] = 50;
      continue;
    }

    const { currentScore, velocity, sevenDayAvg, thirtyDayAvg, baselineScore } = trait;

    if (earlyStage) {
      const baselineDelta = currentScore - (baselineScore ?? 50);
      const velocitySignal = velocity * 2.0;
      const blendedMonthlyDelta = (velocitySignal * 0.7) + (baselineDelta * 0.08);

      let projected = currentScore;
      for (let m = 1; m <= MONTHS; m++) {
        const dampingFactor = Math.pow(DAMPING_PER_MONTH, m);
        const rawDelta = blendedMonthlyDelta * dampingFactor;
        const adjustedDelta = diminishingReturns(projected, rawDelta);
        projected = clamp(projected + adjustedDelta, 0, 100);
      }
      projections[traitId] = Math.round(projected * 10) / 10;
      continue;
    }

    const slope = computeThirtyDaySlope(sevenDayAvg, thirtyDayAvg);
    const monthlyVelocity = velocity * 2.5;
    const monthlySlope = slope * 30;
    const blendedMonthlyDelta = (monthlyVelocity * 0.6) + (monthlySlope * 0.4);

    let projected = currentScore;

    for (let m = 1; m <= MONTHS; m++) {
      const dampingFactor = Math.pow(DAMPING_PER_MONTH, m);
      const rawDelta = blendedMonthlyDelta * dampingFactor;
      const adjustedDelta = diminishingReturns(projected, rawDelta);
      projected = clamp(projected + adjustedDelta, 0, 100);
    }

    projections[traitId] = Math.round(projected * 10) / 10;
  }

  return projections;
}

export function project5Years(traitState, earlyStage) {
  const projections = {};
  const traitIds = getTraitIds();
  const MONTHS = 60;
  const DAMPING_PER_MONTH = earlyStage ? 0.84 : 0.88;

  for (const traitId of traitIds) {
    const trait = traitState[traitId];
    if (!trait) {
      projections[traitId] = 50;
      continue;
    }

    const { currentScore, velocity, sevenDayAvg, thirtyDayAvg, baselineScore } = trait;

    const slope = computeThirtyDaySlope(sevenDayAvg, thirtyDayAvg);
    const monthlyVelocity = velocity * 2.5;
    const monthlySlope = slope * 30;
    const blendedMonthlyDelta = (monthlyVelocity * 0.5) + (monthlySlope * 0.3);

    const baselineGravity = (baselineScore - currentScore) * 0.003;

    let projected = currentScore;

    for (let m = 1; m <= MONTHS; m++) {
      const dampingFactor = Math.pow(DAMPING_PER_MONTH, m);
      const rawDelta = (blendedMonthlyDelta * dampingFactor) + baselineGravity;
      const adjustedDelta = diminishingReturns(projected, rawDelta);
      projected = clamp(projected + adjustedDelta, 0, 100);
    }

    projections[traitId] = Math.round(projected * 10) / 10;
  }

  return projections;
}
