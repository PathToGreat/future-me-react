const TRUST_PRESERVATION_CONFIG = {
  volatilityWindow: 3,
  volatilityThreshold: 15,
  maxSingleSessionChange: 20,
  neutralRecoveryRate: 0.3
};

const FORBIDDEN_VISUAL_PATTERNS = {
  reward: {
    glowSpike: 0.3,
    saturationSpike: 1.3,
    rapidPositiveShift: 25
  },
  punishment: {
    rapidNegativeShift: -25,
    saturationDrop: 0.7,
    glowDrop: -0.2
  },
  judgment: {
    extremeDeviation: 40
  },
  prediction: {
    trajectoryOveremphasis: 0.8
  }
};

export function validateTrustIntegrity(currentState, previousState, sessionContext = {}) {
  const violations = [];

  if (previousState) {
    const postureChange = (currentState.postureScore || 50) - (previousState.postureScore || 50);
    const expressionChange = (currentState.expressionScore || 50) - (previousState.expressionScore || 50);

    if (postureChange > FORBIDDEN_VISUAL_PATTERNS.reward.rapidPositiveShift) {
      violations.push({
        type: 'reward_like',
        field: 'posture',
        magnitude: postureChange,
        description: 'Rapid positive posture shift resembles reward'
      });
    }

    if (postureChange < FORBIDDEN_VISUAL_PATTERNS.punishment.rapidNegativeShift) {
      violations.push({
        type: 'punishment_like',
        field: 'posture',
        magnitude: postureChange,
        description: 'Rapid negative posture shift resembles punishment'
      });
    }

    if (expressionChange > FORBIDDEN_VISUAL_PATTERNS.reward.rapidPositiveShift) {
      violations.push({
        type: 'reward_like',
        field: 'expression',
        magnitude: expressionChange,
        description: 'Rapid positive expression shift resembles reward'
      });
    }

    if (expressionChange < FORBIDDEN_VISUAL_PATTERNS.punishment.rapidNegativeShift) {
      violations.push({
        type: 'punishment_like',
        field: 'expression',
        magnitude: expressionChange,
        description: 'Rapid negative expression shift resembles punishment'
      });
    }
  }

  if (currentState.glowIntensity > FORBIDDEN_VISUAL_PATTERNS.reward.glowSpike) {
    violations.push({
      type: 'reward_like',
      field: 'glow',
      magnitude: currentState.glowIntensity,
      description: 'Glow intensity resembles reward feedback'
    });
  }

  if (currentState.saturationLevel > FORBIDDEN_VISUAL_PATTERNS.reward.saturationSpike) {
    violations.push({
      type: 'reward_like',
      field: 'saturation',
      magnitude: currentState.saturationLevel,
      description: 'Saturation level resembles reward feedback'
    });
  }

  const postureDeviation = Math.abs((currentState.postureScore || 50) - 50);
  const expressionDeviation = Math.abs((currentState.expressionScore || 50) - 50);

  if (postureDeviation > FORBIDDEN_VISUAL_PATTERNS.judgment.extremeDeviation ||
      expressionDeviation > FORBIDDEN_VISUAL_PATTERNS.judgment.extremeDeviation) {
    violations.push({
      type: 'judgment_like',
      field: 'overall',
      magnitude: Math.max(postureDeviation, expressionDeviation),
      description: 'Extreme deviation implies judgment'
    });
  }

  return {
    isValid: violations.length === 0,
    violations,
    trustScore: Math.max(0, 1 - violations.length * 0.2)
  };
}

export function enforceTrustBoundaries(state, previousState) {
  if (!state) return state;

  let corrected = { ...state };

  if (previousState) {
    const postureChange = (corrected.postureScore || 50) - (previousState.postureScore || 50);
    const expressionChange = (corrected.expressionScore || 50) - (previousState.expressionScore || 50);

    if (Math.abs(postureChange) > TRUST_PRESERVATION_CONFIG.maxSingleSessionChange) {
      const direction = postureChange > 0 ? 1 : -1;
      corrected.postureScore = (previousState.postureScore || 50) + 
        direction * TRUST_PRESERVATION_CONFIG.maxSingleSessionChange;
    }

    if (Math.abs(expressionChange) > TRUST_PRESERVATION_CONFIG.maxSingleSessionChange) {
      const direction = expressionChange > 0 ? 1 : -1;
      corrected.expressionScore = (previousState.expressionScore || 50) + 
        direction * TRUST_PRESERVATION_CONFIG.maxSingleSessionChange;
    }
  }

  if (corrected.glowIntensity !== undefined) {
    corrected.glowIntensity = Math.min(corrected.glowIntensity, 0.25);
  }

  if (corrected.saturationLevel !== undefined) {
    corrected.saturationLevel = clamp(corrected.saturationLevel, 0.85, 1.15);
  }

  const maxDeviation = 35;
  const postureDeviation = (corrected.postureScore || 50) - 50;
  const expressionDeviation = (corrected.expressionScore || 50) - 50;

  if (Math.abs(postureDeviation) > maxDeviation) {
    const direction = postureDeviation > 0 ? 1 : -1;
    corrected.postureScore = 50 + direction * maxDeviation;
  }

  if (Math.abs(expressionDeviation) > maxDeviation) {
    const direction = expressionDeviation > 0 ? 1 : -1;
    corrected.expressionScore = 50 + direction * maxDeviation;
  }

  corrected.trustBoundariesEnforced = true;

  return corrected;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function detectVolatility(recentStates) {
  if (!recentStates || recentStates.length < 2) {
    return { isVolatile: false, volatilityScore: 0 };
  }

  const recentWindow = recentStates.slice(-TRUST_PRESERVATION_CONFIG.volatilityWindow);
  
  let totalPostureChange = 0;
  let totalExpressionChange = 0;

  for (let i = 1; i < recentWindow.length; i++) {
    const prev = recentWindow[i - 1];
    const curr = recentWindow[i];
    
    totalPostureChange += Math.abs((curr.postureScore || 50) - (prev.postureScore || 50));
    totalExpressionChange += Math.abs((curr.expressionScore || 50) - (prev.expressionScore || 50));
  }

  const avgChange = (totalPostureChange + totalExpressionChange) / (recentWindow.length - 1) / 2;
  const isVolatile = avgChange > TRUST_PRESERVATION_CONFIG.volatilityThreshold;

  return {
    isVolatile,
    volatilityScore: avgChange / TRUST_PRESERVATION_CONFIG.volatilityThreshold
  };
}

export function dampVolatileState(state, volatilityInfo) {
  if (!volatilityInfo.isVolatile) return state;

  const dampenFactor = 1 - (volatilityInfo.volatilityScore * 0.3);
  
  const postureDeviation = (state.postureScore || 50) - 50;
  const expressionDeviation = (state.expressionScore || 50) - 50;

  return {
    ...state,
    postureScore: 50 + postureDeviation * dampenFactor,
    expressionScore: 50 + expressionDeviation * dampenFactor,
    volatilityDampened: true
  };
}

export function ensureNeutralAcceptable(state) {
  if (!state.isReliable) {
    return {
      ...state,
      postureScore: 50,
      expressionScore: 50,
      posture: { name: 'neutral', angle: 0, scale: 1.0 },
      expression: { name: 'neutral', eyeScale: 1.0, browAngle: 0, mouthCurve: 0 },
      neutralAccepted: true
    };
  }

  return state;
}

export { TRUST_PRESERVATION_CONFIG, FORBIDDEN_VISUAL_PATTERNS };
