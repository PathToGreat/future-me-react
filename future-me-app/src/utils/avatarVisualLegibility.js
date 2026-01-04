const LEGIBILITY_CONFIG = {
  stateContrastMinimum: 0.15,
  bandSeparation: 8,
  neutralZoneWidth: 10,
  transitionBuffer: 3
};

const ENHANCED_POSTURE_BANDS = {
  confident: { range: [82, 100], baseAngle: 4, baseScale: 1.05, contrast: 'high' },
  upright: { range: [66, 81], baseAngle: 2, baseScale: 1.025, contrast: 'medium' },
  relaxed: { range: [50, 65], baseAngle: 0.5, baseScale: 1.01, contrast: 'low' },
  neutral: { range: [35, 49], baseAngle: 0, baseScale: 1.0, contrast: 'baseline' },
  fatigued: { range: [20, 34], baseAngle: -2, baseScale: 0.98, contrast: 'medium' },
  slumped: { range: [0, 19], baseAngle: -4, baseScale: 0.96, contrast: 'high' }
};

const ENHANCED_EXPRESSION_BANDS = {
  joyful: { range: [88, 100], eyeScale: 1.12, browAngle: -5, mouthCurve: 12, contrast: 'high' },
  happy: { range: [74, 87], eyeScale: 1.08, browAngle: -3, mouthCurve: 8, contrast: 'medium' },
  content: { range: [60, 73], eyeScale: 1.04, browAngle: -1, mouthCurve: 4, contrast: 'low' },
  calm: { range: [46, 59], eyeScale: 1.0, browAngle: 0, mouthCurve: 1, contrast: 'baseline' },
  neutral: { range: [34, 45], eyeScale: 1.0, browAngle: 0, mouthCurve: 0, contrast: 'baseline' },
  weary: { range: [22, 33], eyeScale: 0.95, browAngle: 1, mouthCurve: -2, contrast: 'low' },
  tired: { range: [10, 21], eyeScale: 0.9, browAngle: 3, mouthCurve: -4, contrast: 'medium' },
  strained: { range: [0, 9], eyeScale: 0.88, browAngle: 5, mouthCurve: -5, contrast: 'high' }
};

const TRAJECTORY_VISUAL_CUES = {
  improving: { glowShift: 0.08, saturationBoost: 1.05, postureBias: 2 },
  stabilizing: { glowShift: 0, saturationBoost: 1.0, postureBias: 0 },
  fluctuating: { glowShift: -0.02, saturationBoost: 0.98, postureBias: 0 },
  degrading: { glowShift: -0.05, saturationBoost: 0.95, postureBias: -2 }
};

export function enhanceStateLegibility(state) {
  if (!state || !state.isReliable) {
    return state;
  }

  const enhanced = { ...state };

  const postureScore = state.postureScore || 50;
  const expressionScore = state.expressionScore || 50;

  enhanced.posture = mapToEnhancedPosture(postureScore);
  enhanced.expression = mapToEnhancedExpression(expressionScore);

  if (state.trajectory && state.trajectory.confidence >= 0.5) {
    const trajectoryCues = TRAJECTORY_VISUAL_CUES[state.trajectory.state] || TRAJECTORY_VISUAL_CUES.stabilizing;
    enhanced.trajectoryVisualCues = trajectoryCues;
  } else {
    enhanced.trajectoryVisualCues = TRAJECTORY_VISUAL_CUES.stabilizing;
  }

  enhanced.legibilityEnhanced = true;

  return enhanced;
}

function mapToEnhancedPosture(score) {
  for (const [name, config] of Object.entries(ENHANCED_POSTURE_BANDS)) {
    if (score >= config.range[0] && score <= config.range[1]) {
      const bandProgress = (score - config.range[0]) / (config.range[1] - config.range[0]);
      
      return {
        name,
        angle: config.baseAngle,
        scale: config.baseScale,
        bandProgress,
        contrast: config.contrast,
        score
      };
    }
  }
  
  return {
    name: 'neutral',
    angle: 0,
    scale: 1.0,
    bandProgress: 0.5,
    contrast: 'baseline',
    score
  };
}

function mapToEnhancedExpression(score) {
  for (const [name, config] of Object.entries(ENHANCED_EXPRESSION_BANDS)) {
    if (score >= config.range[0] && score <= config.range[1]) {
      const bandProgress = (score - config.range[0]) / (config.range[1] - config.range[0]);
      
      return {
        name,
        eyeScale: config.eyeScale,
        browAngle: config.browAngle,
        mouthCurve: config.mouthCurve,
        bandProgress,
        contrast: config.contrast,
        score
      };
    }
  }
  
  return {
    name: 'neutral',
    eyeScale: 1.0,
    browAngle: 0,
    mouthCurve: 0,
    bandProgress: 0.5,
    contrast: 'baseline',
    score
  };
}

export function calculateStateDistance(stateA, stateB) {
  if (!stateA || !stateB) return 0;

  const postureDistance = Math.abs((stateA.postureScore || 50) - (stateB.postureScore || 50));
  const expressionDistance = Math.abs((stateA.expressionScore || 50) - (stateB.expressionScore || 50));

  return Math.sqrt(postureDistance * postureDistance + expressionDistance * expressionDistance);
}

export function isStateDistinguishable(stateA, stateB) {
  const distance = calculateStateDistance(stateA, stateB);
  return distance >= LEGIBILITY_CONFIG.bandSeparation;
}

export function getStateBandName(score, type = 'posture') {
  const bands = type === 'posture' ? ENHANCED_POSTURE_BANDS : ENHANCED_EXPRESSION_BANDS;
  
  for (const [name, config] of Object.entries(bands)) {
    if (score >= config.range[0] && score <= config.range[1]) {
      return name;
    }
  }
  
  return 'neutral';
}

export function isNearBandBoundary(score, type = 'posture') {
  const bands = type === 'posture' ? ENHANCED_POSTURE_BANDS : ENHANCED_EXPRESSION_BANDS;
  
  for (const config of Object.values(bands)) {
    const lowerBoundary = config.range[0];
    const upperBoundary = config.range[1];
    
    if (Math.abs(score - lowerBoundary) <= LEGIBILITY_CONFIG.transitionBuffer ||
        Math.abs(score - upperBoundary) <= LEGIBILITY_CONFIG.transitionBuffer) {
      return true;
    }
  }
  
  return false;
}

export { ENHANCED_POSTURE_BANDS, ENHANCED_EXPRESSION_BANDS, TRAJECTORY_VISUAL_CUES, LEGIBILITY_CONFIG };
