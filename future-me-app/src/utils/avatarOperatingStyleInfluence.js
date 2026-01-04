const STYLE_INFLUENCE_LIMITS = {
  maxPostureModification: 8,
  maxExpressionModification: 8,
  maxGlowModification: 0.1,
  maxSaturationModification: 0.08
};

const STYLE_VISUAL_MODIFIERS = {
  recoverySensitive: {
    postureRecoveryBoost: 1.08,
    expressionRecoveryBoost: 1.06,
    transitionSmoothing: 1.15,
    reboundSpeed: 1.2,
    description: 'Visual rebound appears more pronounced after rest periods'
  },
  stressReactive: {
    stressExpressionSensitivity: 1.1,
    postureStressSensitivity: 1.08,
    tensionVisibility: 1.1,
    transitionSmoothing: 0.95,
    description: 'Stress-related visual changes appear more distinctly'
  },
  consistencyResponder: {
    stabilityBonus: 1.1,
    streakGlowBoost: 1.08,
    postureConsistencyBoost: 1.06,
    transitionSmoothing: 1.1,
    description: 'Sustained logging visually reinforces stable posture'
  },
  movementBuffered: {
    activityPostureBoost: 1.1,
    stressBufferEffect: 0.92,
    energyGlowBoost: 1.05,
    transitionSmoothing: 1.05,
    description: 'Activity provides visible buffer against stress effects'
  },
  nutritionAnchored: {
    nutritionExpressionBoost: 1.08,
    energyFromNutrition: 1.1,
    saturationBoost: 1.05,
    transitionSmoothing: 1.0,
    description: 'Nutrition quality influences expression vibrancy'
  },
  sociallyRegulated: {
    emotionalExpressionBoost: 1.08,
    calmnessFactor: 1.06,
    socialWarmth: 1.05,
    transitionSmoothing: 1.05,
    description: 'Emotional expression reflects social connection quality'
  },
  momentumDriven: {
    progressGlowBoost: 1.1,
    postureConfidenceBoost: 1.08,
    trajectoryVisibility: 1.1,
    transitionSmoothing: 0.98,
    description: 'Forward progress visually enhances confidence indicators'
  },
  equilibriumSeeker: {
    balanceNormalization: 1.15,
    extremeDampening: 0.88,
    centeringEffect: 1.1,
    transitionSmoothing: 1.2,
    description: 'Visual states naturally return toward balanced center'
  }
};

export function applyOperatingStyleInfluence(baseState, operatingStyleId, metrics = {}) {
  if (!operatingStyleId || !STYLE_VISUAL_MODIFIERS[operatingStyleId]) {
    return baseState;
  }

  const modifiers = STYLE_VISUAL_MODIFIERS[operatingStyleId];
  const modifiedState = { ...baseState };

  const originalPosture = modifiedState.postureScore || 50;
  const originalExpression = modifiedState.expressionScore || 50;

  switch (operatingStyleId) {
    case 'recoverySensitive':
      if (metrics.sleepNorm > 0.6) {
        modifiedState.postureScore = Math.min(100, originalPosture * modifiers.postureRecoveryBoost);
        modifiedState.expressionScore = Math.min(100, originalExpression * modifiers.expressionRecoveryBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'stressReactive':
      if (metrics.stressNorm > 0.5) {
        const stressIntensity = metrics.stressNorm;
        modifiedState.expressionScore = Math.max(0, originalExpression - (stressIntensity * 5 * modifiers.stressExpressionSensitivity));
        modifiedState.postureScore = Math.max(0, originalPosture - (stressIntensity * 4 * modifiers.postureStressSensitivity));
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'consistencyResponder':
      if (metrics.disciplineNorm > 0.6) {
        modifiedState.postureScore = Math.min(100, originalPosture * modifiers.postureConsistencyBoost);
        modifiedState.glowIntensity = Math.min(STYLE_INFLUENCE_LIMITS.maxGlowModification, 
          (modifiedState.glowIntensity || 0) + 0.05 * modifiers.streakGlowBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'movementBuffered':
      if (metrics.activityNorm > 0.5) {
        modifiedState.postureScore = Math.min(100, originalPosture * modifiers.activityPostureBoost);
        if (metrics.stressNorm > 0.4) {
          modifiedState.expressionScore = Math.min(100, originalExpression + (3 * (1 - modifiers.stressBufferEffect)));
        }
        modifiedState.glowIntensity = Math.min(STYLE_INFLUENCE_LIMITS.maxGlowModification, 
          (modifiedState.glowIntensity || 0) + 0.03 * modifiers.energyGlowBoost);
      }
      break;

    case 'nutritionAnchored':
      if (metrics.nutritionNorm > 0.6) {
        modifiedState.expressionScore = Math.min(100, originalExpression * modifiers.nutritionExpressionBoost);
        modifiedState.saturationLevel = Math.min(1 + STYLE_INFLUENCE_LIMITS.maxSaturationModification, 
          (modifiedState.saturationLevel || 1) * modifiers.saturationBoost);
      }
      break;

    case 'sociallyRegulated':
      modifiedState.expressionScore = Math.min(100, originalExpression * modifiers.emotionalExpressionBoost);
      modifiedState.warmthTint = Math.min(0.05, (modifiedState.warmthTint || 0) + 0.02 * modifiers.socialWarmth);
      break;

    case 'momentumDriven':
      if (modifiedState.trajectory?.state === 'improving') {
        modifiedState.postureScore = Math.min(100, originalPosture * modifiers.postureConfidenceBoost);
        modifiedState.glowIntensity = Math.min(STYLE_INFLUENCE_LIMITS.maxGlowModification, 
          (modifiedState.glowIntensity || 0) + 0.05 * modifiers.progressGlowBoost);
      }
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;

    case 'equilibriumSeeker':
      const centerScore = 50;
      const postureDeviation = originalPosture - centerScore;
      const expressionDeviation = originalExpression - centerScore;
      
      modifiedState.postureScore = centerScore + (postureDeviation * modifiers.extremeDampening);
      modifiedState.expressionScore = centerScore + (expressionDeviation * modifiers.extremeDampening);
      modifiedState.transitionDuration = (modifiedState.transitionDuration || 800) * modifiers.transitionSmoothing;
      break;
  }

  modifiedState.postureScore = clampStyleInfluence(modifiedState.postureScore, originalPosture, 'posture');
  modifiedState.expressionScore = clampStyleInfluence(modifiedState.expressionScore, originalExpression, 'expression');

  modifiedState.operatingStyleApplied = operatingStyleId;
  modifiedState.styleDescription = modifiers.description;
  modifiedState.styleInfluenceBounded = true;

  return modifiedState;
}

function clampStyleInfluence(modified, original, type) {
  const maxChange = type === 'posture' 
    ? STYLE_INFLUENCE_LIMITS.maxPostureModification 
    : STYLE_INFLUENCE_LIMITS.maxExpressionModification;
  
  const change = modified - original;
  
  if (Math.abs(change) > maxChange) {
    return original + (change > 0 ? maxChange : -maxChange);
  }
  
  return modified;
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

export { STYLE_VISUAL_MODIFIERS, STYLE_INFLUENCE_LIMITS };
