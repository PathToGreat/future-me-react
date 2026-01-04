const STYLE_VISUAL_MODIFIERS = {
  recoverySensitive: {
    postureRecoveryBoost: 1.2,
    expressionRecoveryBoost: 1.15,
    transitionSmoothing: 1.3,
    reboundSpeed: 1.4,
    description: 'Visual rebound appears more pronounced after rest periods'
  },
  stressReactive: {
    stressExpressionSensitivity: 1.25,
    postureStressSensitivity: 1.15,
    tensionVisibility: 1.2,
    transitionSmoothing: 0.9,
    description: 'Stress-related visual changes appear more distinctly'
  },
  consistencyResponder: {
    stabilityBonus: 1.2,
    streakGlowBoost: 1.3,
    postureConsistencyBoost: 1.15,
    transitionSmoothing: 1.2,
    description: 'Sustained logging visually reinforces stable posture'
  },
  movementBuffered: {
    activityPostureBoost: 1.25,
    stressBufferEffect: 0.85,
    energyGlowBoost: 1.2,
    transitionSmoothing: 1.1,
    description: 'Activity provides visible buffer against stress effects'
  },
  nutritionAnchored: {
    nutritionExpressionBoost: 1.2,
    energyFromNutrition: 1.25,
    saturationBoost: 1.15,
    transitionSmoothing: 1.0,
    description: 'Nutrition quality influences expression vibrancy'
  },
  sociallyRegulated: {
    emotionalExpressionBoost: 1.2,
    calmnessFactor: 1.15,
    socialWarmth: 1.2,
    transitionSmoothing: 1.1,
    description: 'Emotional expression reflects social connection quality'
  },
  momentumDriven: {
    progressGlowBoost: 1.3,
    postureConfidenceBoost: 1.2,
    trajectoryVisibility: 1.25,
    transitionSmoothing: 0.95,
    description: 'Forward progress visually enhances confidence indicators'
  },
  equilibriumSeeker: {
    balanceNormalization: 1.3,
    extremeDampening: 0.8,
    centeringEffect: 1.2,
    transitionSmoothing: 1.4,
    description: 'Visual states naturally return toward balanced center'
  }
};

export function applyOperatingStyleInfluence(baseState, operatingStyleId, metrics = {}) {
  if (!operatingStyleId || !STYLE_VISUAL_MODIFIERS[operatingStyleId]) {
    return baseState;
  }

  const modifiers = STYLE_VISUAL_MODIFIERS[operatingStyleId];
  const modifiedState = { ...baseState };

  switch (operatingStyleId) {
    case 'recoverySensitive':
      if (metrics.sleepNorm > 0.6) {
        modifiedState.postureScore = Math.min(100, (modifiedState.postureScore || 50) * modifiers.postureRecoveryBoost);
        modifiedState.expressionScore = Math.min(100, (modifiedState.expressionScore || 50) * modifiers.expressionRecoveryBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'stressReactive':
      if (metrics.stressNorm > 0.5) {
        const stressIntensity = metrics.stressNorm;
        modifiedState.expressionScore = Math.max(0, (modifiedState.expressionScore || 50) - (stressIntensity * 10 * modifiers.stressExpressionSensitivity));
        modifiedState.postureScore = Math.max(0, (modifiedState.postureScore || 50) - (stressIntensity * 8 * modifiers.postureStressSensitivity));
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'consistencyResponder':
      if (metrics.disciplineNorm > 0.6) {
        modifiedState.postureScore = Math.min(100, (modifiedState.postureScore || 50) * modifiers.postureConsistencyBoost);
        modifiedState.glowIntensity = Math.min(1, (modifiedState.glowIntensity || 0) + 0.15 * modifiers.streakGlowBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'movementBuffered':
      if (metrics.activityNorm > 0.5) {
        modifiedState.postureScore = Math.min(100, (modifiedState.postureScore || 50) * modifiers.activityPostureBoost);
        if (metrics.stressNorm > 0.4) {
          modifiedState.expressionScore = Math.min(100, (modifiedState.expressionScore || 50) + (10 * (1 - modifiers.stressBufferEffect)));
        }
        modifiedState.glowIntensity = Math.min(1, (modifiedState.glowIntensity || 0) + 0.1 * modifiers.energyGlowBoost);
      }
      break;

    case 'nutritionAnchored':
      if (metrics.nutritionNorm > 0.6) {
        modifiedState.expressionScore = Math.min(100, (modifiedState.expressionScore || 50) * modifiers.nutritionExpressionBoost);
        modifiedState.saturationLevel = Math.min(1.2, (modifiedState.saturationLevel || 1) * modifiers.saturationBoost);
      }
      break;

    case 'sociallyRegulated':
      modifiedState.expressionScore = Math.min(100, (modifiedState.expressionScore || 50) * modifiers.emotionalExpressionBoost);
      modifiedState.warmthTint = (modifiedState.warmthTint || 0) + 0.1 * modifiers.socialWarmth;
      break;

    case 'momentumDriven':
      if (modifiedState.trajectory?.state === 'improving') {
        modifiedState.postureScore = Math.min(100, (modifiedState.postureScore || 50) * modifiers.postureConfidenceBoost);
        modifiedState.glowIntensity = Math.min(1, (modifiedState.glowIntensity || 0) + 0.2 * modifiers.progressGlowBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'equilibriumSeeker':
      const centerScore = 55;
      const postureDeviation = (modifiedState.postureScore || 50) - centerScore;
      const expressionDeviation = (modifiedState.expressionScore || 50) - centerScore;
      
      modifiedState.postureScore = centerScore + (postureDeviation * modifiers.extremeDampening);
      modifiedState.expressionScore = centerScore + (expressionDeviation * modifiers.extremeDampening);
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;
  }

  modifiedState.operatingStyleApplied = operatingStyleId;
  modifiedState.styleDescription = modifiers.description;

  return modifiedState;
}

export function getStyleTransitionBehavior(operatingStyleId) {
  const modifiers = STYLE_VISUAL_MODIFIERS[operatingStyleId];
  
  if (!modifiers) {
    return {
      smoothingFactor: 1.0,
      reboundBehavior: 'standard',
      transitionEasing: 'easeInOutCubic'
    };
  }

  let reboundBehavior = 'standard';
  if (operatingStyleId === 'recoverySensitive') reboundBehavior = 'accelerated';
  if (operatingStyleId === 'equilibriumSeeker') reboundBehavior = 'centered';
  if (operatingStyleId === 'stressReactive') reboundBehavior = 'sensitive';

  return {
    smoothingFactor: modifiers.transitionSmoothing || 1.0,
    reboundBehavior,
    transitionEasing: modifiers.transitionSmoothing > 1.1 ? 'easeOutQuad' : 'easeInOutCubic'
  };
}

export function calculateStyleAwareGlow(baseGlow, operatingStyleId, metrics = {}) {
  let adjustedGlow = baseGlow;

  if (!operatingStyleId) return adjustedGlow;

  switch (operatingStyleId) {
    case 'consistencyResponder':
      if (metrics.disciplineNorm > 0.7) {
        adjustedGlow = Math.min(1, adjustedGlow * 1.25);
      }
      break;
    case 'movementBuffered':
      if (metrics.activityNorm > 0.6) {
        adjustedGlow = Math.min(1, adjustedGlow * 1.15);
      }
      break;
    case 'momentumDriven':
      if (metrics.trajectory === 'improving') {
        adjustedGlow = Math.min(1, adjustedGlow * 1.3);
      }
      break;
    case 'equilibriumSeeker':
      adjustedGlow = adjustedGlow * 0.9 + 0.3 * 0.1;
      break;
  }

  return adjustedGlow;
}

export { STYLE_VISUAL_MODIFIERS };
