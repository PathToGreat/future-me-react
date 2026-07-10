const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const CONFIDENCE_TIERS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

const BODY_DELTA_LIMITS = {
  LOW: 0.08,
  MEDIUM: 0.15,
  HIGH: 1.0
};

const EMOTIONAL_DAMPING = {
  LOW: 0.5,
  MEDIUM: 0.8,
  HIGH: 1.0
};

const DELTA_VISIBILITY_FLOOR = {
  physicalScoreThreshold: 5,
  emotionalScoreThreshold: 5,
  minBodyParamShift: 0.02,
  minFacialTensionShift: 0.03
};

export function computeProjectionConfidence(historyData) {
  if (!historyData || historyData.length === 0) {
    return { tier: CONFIDENCE_TIERS.LOW, daysCovered: 0, logCount: 0 };
  }

  const logCount = historyData.length;

  const dates = historyData
    .map(e => new Date(e.date))
    .filter(d => !isNaN(d.getTime()));

  if (dates.length === 0) {
    return { tier: CONFIDENCE_TIERS.LOW, daysCovered: 0, logCount };
  }

  const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysCovered = Math.max(1, Math.floor((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const loggingDensity = logCount / Math.max(daysCovered, 1);

  if (daysCovered >= 30 && logCount >= 20 && loggingDensity >= 0.5) {
    return { tier: CONFIDENCE_TIERS.HIGH, daysCovered, logCount, loggingDensity };
  }

  if (daysCovered >= 14 && logCount >= 10) {
    return { tier: CONFIDENCE_TIERS.MEDIUM, daysCovered, logCount, loggingDensity };
  }

  return { tier: CONFIDENCE_TIERS.LOW, daysCovered, logCount, loggingDensity };
}

export function applyConfidenceToBodyDelta(currentValue, projectedValue, confidence) {
  const tier = confidence?.tier || CONFIDENCE_TIERS.LOW;
  const maxDelta = BODY_DELTA_LIMITS[tier];
  const rawDelta = projectedValue - currentValue;
  const clampedDelta = clamp(rawDelta, -maxDelta, maxDelta);
  return currentValue + clampedDelta;
}

export function applyConfidenceToEmotionalParam(currentValue, projectedValue, confidence) {
  const tier = confidence?.tier || CONFIDENCE_TIERS.LOW;
  const damping = EMOTIONAL_DAMPING[tier];
  const rawDelta = projectedValue - currentValue;
  return currentValue + rawDelta * damping;
}

export function applyConfidenceScaling(currentParams, projectedParams, confidence) {
  const tier = confidence?.tier || CONFIDENCE_TIERS.LOW;

  const bodyKeys = ['shoulderWidth', 'chestSize', 'waistTaper', 'hipWidth', 'armThickness', 'legThickness', 'neckThickness', 'headScale'];
  const emotionalKeys = [
    'postureLean', 'facialTension', 'vibrancy', 'energyGlow',
    'facialBrightness', 'expressionWarmth', 'eyeSoftness', 'faceOpenness',
    'glowWarmth', 'centeredness', 'steadiness', 'auraStability'
  ];

  const result = { ...projectedParams };

  for (const key of bodyKeys) {
    if (currentParams[key] != null && projectedParams[key] != null) {
      result[key] = applyConfidenceToBodyDelta(currentParams[key], projectedParams[key], confidence);
    }
  }

  for (const key of emotionalKeys) {
    if (currentParams[key] != null && projectedParams[key] != null) {
      result[key] = applyConfidenceToEmotionalParam(currentParams[key], projectedParams[key], confidence);
    }
  }

  return result;
}

export function applyDeltaVisibilityFloor(currentParams, projectedParams, physicalScoreDelta, emotionalScoreDelta, confidence) {
  const tier = confidence?.tier || CONFIDENCE_TIERS.LOW;
  if (tier === CONFIDENCE_TIERS.LOW) return projectedParams;

  const result = { ...projectedParams };
  const bodyKeys = ['shoulderWidth', 'chestSize', 'waistTaper', 'armThickness', 'legThickness'];

  if (Math.abs(physicalScoreDelta) >= DELTA_VISIBILITY_FLOOR.physicalScoreThreshold) {
    const sign = physicalScoreDelta > 0 ? 1 : -1;
    for (const key of bodyKeys) {
      if (currentParams[key] != null && result[key] != null) {
        const currentDelta = Math.abs(result[key] - currentParams[key]);
        if (currentDelta < DELTA_VISIBILITY_FLOOR.minBodyParamShift) {
          result[key] = currentParams[key] + sign * DELTA_VISIBILITY_FLOOR.minBodyParamShift;
        }
      }
    }
  }

  if (Math.abs(emotionalScoreDelta) >= DELTA_VISIBILITY_FLOOR.emotionalScoreThreshold) {
    if (currentParams.facialTension != null && result.facialTension != null) {
      const tensionDelta = Math.abs(result.facialTension - currentParams.facialTension);
      if (tensionDelta < DELTA_VISIBILITY_FLOOR.minFacialTensionShift) {
        const sign = emotionalScoreDelta > 0 ? -1 : 1;
        result.facialTension = currentParams.facialTension + sign * DELTA_VISIBILITY_FLOOR.minFacialTensionShift;
      }
    }
  }

  return result;
}

export function validateProjectionDifference(currentParams, projectedParams, confidence) {
  const tier = confidence?.tier || CONFIDENCE_TIERS.LOW;
  const bodyKeys = ['shoulderWidth', 'chestSize', 'waistTaper', 'hipWidth', 'armThickness', 'legThickness'];
  const emotionalKeys = ['postureLean', 'facialTension', 'vibrancy', 'energyGlow'];

  const bodyDeltas = bodyKeys.map(k => Math.abs((projectedParams[k] ?? 0) - (currentParams[k] ?? 0)));
  const emotionalDeltas = emotionalKeys.map(k => Math.abs((projectedParams[k] ?? 0) - (currentParams[k] ?? 0)));

  const maxBodyDelta = Math.max(...bodyDeltas);
  const maxEmotionalDelta = Math.max(...emotionalDeltas);
  const avgBodyDelta = bodyDeltas.reduce((a, b) => a + b, 0) / bodyDeltas.length;

  const warnings = [];

  if (tier === CONFIDENCE_TIERS.LOW && maxBodyDelta > 0.1) {
    warnings.push('Low confidence projection exceeds safe body delta range');
  }

  if (tier === CONFIDENCE_TIERS.HIGH && maxBodyDelta < 0.005 && maxEmotionalDelta < 0.005) {
    warnings.push('High confidence projection shows no visible difference');
  }

  return {
    valid: warnings.length === 0,
    maxBodyDelta,
    maxEmotionalDelta,
    avgBodyDelta,
    tier,
    warnings
  };
}

export { CONFIDENCE_TIERS, BODY_DELTA_LIMITS, EMOTIONAL_DAMPING };
