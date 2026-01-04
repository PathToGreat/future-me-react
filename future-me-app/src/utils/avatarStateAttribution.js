import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CONFIDENCE_THRESHOLD = 0.7;
const MIN_DATA_POINTS = 7;

const POSTURE_STATES = {
  confident: { score: [85, 100], label: 'Confident', angle: 3, scale: 1.04 },
  upright: { score: [70, 84], label: 'Upright', angle: 1, scale: 1.02 },
  relaxed: { score: [55, 69], label: 'Relaxed', angle: 0, scale: 1.0 },
  neutral: { score: [40, 54], label: 'Neutral', angle: -1, scale: 0.99 },
  fatigued: { score: [25, 39], label: 'Fatigued', angle: -3, scale: 0.97 },
  slumped: { score: [0, 24], label: 'Slumped', angle: -5, scale: 0.95 }
};

const EXPRESSION_STATES = {
  joyful: { score: [85, 100], eyeScale: 1.15, browAngle: -6, mouthCurve: 14 },
  happy: { score: [70, 84], eyeScale: 1.1, browAngle: -4, mouthCurve: 10 },
  content: { score: [55, 69], eyeScale: 1.05, browAngle: -2, mouthCurve: 6 },
  calm: { score: [45, 54], eyeScale: 1.0, browAngle: 0, mouthCurve: 3 },
  neutral: { score: [35, 44], eyeScale: 1.0, browAngle: 0, mouthCurve: 0 },
  weary: { score: [25, 34], eyeScale: 0.92, browAngle: 2, mouthCurve: -2 },
  tired: { score: [15, 24], eyeScale: 0.85, browAngle: 4, mouthCurve: -4 },
  strained: { score: [0, 14], eyeScale: 0.88, browAngle: 7, mouthCurve: -6 }
};

const TRAJECTORY_STATES = {
  improving: { direction: 1, icon: '↗', color: '#10b981' },
  stabilizing: { direction: 0, icon: '→', color: '#3b82f6' },
  fluctuating: { direction: 0, icon: '↔', color: '#f59e0b' },
  degrading: { direction: -1, icon: '↘', color: '#ef4444' }
};

const STATE_SOURCES = {
  energy: { weight: 0.25, posture: 0.4, expression: 0.6 },
  stressLoad: { weight: 0.2, posture: 0.3, expression: 0.7 },
  consistency: { weight: 0.15, posture: 0.6, expression: 0.4 },
  recovery: { weight: 0.2, posture: 0.5, expression: 0.5 },
  momentum: { weight: 0.2, posture: 0.4, expression: 0.6 }
};

function getStateFromScore(score, stateMap) {
  for (const [stateName, config] of Object.entries(stateMap)) {
    if (score >= config.score[0] && score <= config.score[1]) {
      return { name: stateName, ...config };
    }
  }
  return { name: 'neutral', ...stateMap.neutral };
}

function calculateTrajectory(recentData, windowDays = 7) {
  if (!recentData || recentData.length < 3) {
    return { state: 'stabilizing', confidence: 0 };
  }

  const scores = recentData.slice(-windowDays).map(d => d.score || 50);
  if (scores.length < 3) return { state: 'stabilizing', confidence: 0 };

  const halfPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, halfPoint);
  const secondHalf = scores.slice(halfPoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const variance = scores.reduce((sum, s) => sum + Math.pow(s - (firstAvg + secondAvg) / 2, 2), 0) / scores.length;
  const isFluctuating = variance > 150;

  const delta = secondAvg - firstAvg;
  const confidence = Math.min(1, Math.abs(delta) / 15);

  if (isFluctuating && Math.abs(delta) < 5) {
    return { state: 'fluctuating', ...TRAJECTORY_STATES.fluctuating, confidence: 0.6 };
  }

  if (delta > 5) {
    return { state: 'improving', ...TRAJECTORY_STATES.improving, confidence };
  } else if (delta < -5) {
    return { state: 'degrading', ...TRAJECTORY_STATES.degrading, confidence };
  }

  return { state: 'stabilizing', ...TRAJECTORY_STATES.stabilizing, confidence };
}

function computeValidatedStateScores(metrics, operatingStyle = null) {
  const {
    sleepNorm = 0.5,
    stressNorm = 0.5,
    activityNorm = 0.5,
    nutritionNorm = 0.5,
    disciplineNorm = 0.5
  } = metrics;

  let energy = (activityNorm * 0.3 + nutritionNorm * 0.25 + sleepNorm * 0.25 + (1 - stressNorm) * 0.2) * 100;
  let stressLoad = stressNorm * 100;
  let consistency = disciplineNorm * 100;
  let recovery = (sleepNorm * 0.6 + (1 - stressNorm) * 0.4) * 100;
  let momentum = (disciplineNorm * 0.4 + activityNorm * 0.3 + nutritionNorm * 0.3) * 100;

  if (operatingStyle) {
    const styleId = operatingStyle.id || operatingStyle;
    
    switch (styleId) {
      case 'recoverySensitive':
        recovery *= 1.15;
        energy = energy * 0.9 + recovery * 0.1;
        break;
      case 'stressReactive':
        stressLoad *= 1.1;
        break;
      case 'consistencyResponder':
        consistency *= 1.15;
        momentum = momentum * 0.85 + consistency * 0.15;
        break;
      case 'movementBuffered':
        if (activityNorm > 0.5) {
          stressLoad *= 0.9;
          recovery *= 1.1;
        }
        break;
      case 'momentumDriven':
        momentum *= 1.15;
        break;
      case 'equilibriumSeeker':
        const avg = (energy + stressLoad + consistency + recovery + momentum) / 5;
        energy = energy * 0.8 + avg * 0.2;
        stressLoad = stressLoad * 0.8 + avg * 0.2;
        break;
    }
  }

  return {
    energy: clamp(energy, 0, 100),
    stressLoad: clamp(stressLoad, 0, 100),
    consistency: clamp(consistency, 0, 100),
    recovery: clamp(recovery, 0, 100),
    momentum: clamp(momentum, 0, 100)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function computeAvatarStateAttribution(metrics, options = {}) {
  const {
    operatingStyle = null,
    recentHistory = [],
    confidenceOverride = null
  } = options;

  const confidence = confidenceOverride !== null 
    ? confidenceOverride 
    : (recentHistory.length >= MIN_DATA_POINTS ? 0.8 : recentHistory.length / MIN_DATA_POINTS * 0.7);

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      posture: { name: 'neutral', ...POSTURE_STATES.neutral },
      expression: { name: 'neutral', ...EXPRESSION_STATES.neutral },
      trajectory: { state: 'stabilizing', ...TRAJECTORY_STATES.stabilizing, confidence: 0 },
      stateScores: null,
      confidence,
      isReliable: false,
      attribution: null
    };
  }

  const stateScores = computeValidatedStateScores(metrics, operatingStyle);

  const postureScore = (
    stateScores.energy * STATE_SOURCES.energy.posture * STATE_SOURCES.energy.weight +
    (100 - stateScores.stressLoad) * STATE_SOURCES.stressLoad.posture * STATE_SOURCES.stressLoad.weight +
    stateScores.consistency * STATE_SOURCES.consistency.posture * STATE_SOURCES.consistency.weight +
    stateScores.recovery * STATE_SOURCES.recovery.posture * STATE_SOURCES.recovery.weight +
    stateScores.momentum * STATE_SOURCES.momentum.posture * STATE_SOURCES.momentum.weight
  ) / Object.values(STATE_SOURCES).reduce((sum, s) => sum + s.posture * s.weight, 0);

  const expressionScore = (
    stateScores.energy * STATE_SOURCES.energy.expression * STATE_SOURCES.energy.weight +
    (100 - stateScores.stressLoad) * STATE_SOURCES.stressLoad.expression * STATE_SOURCES.stressLoad.weight +
    stateScores.consistency * STATE_SOURCES.consistency.expression * STATE_SOURCES.consistency.weight +
    stateScores.recovery * STATE_SOURCES.recovery.expression * STATE_SOURCES.recovery.weight +
    stateScores.momentum * STATE_SOURCES.momentum.expression * STATE_SOURCES.momentum.weight
  ) / Object.values(STATE_SOURCES).reduce((sum, s) => sum + s.expression * s.weight, 0);

  const posture = getStateFromScore(postureScore, POSTURE_STATES);
  const expression = getStateFromScore(expressionScore, EXPRESSION_STATES);
  const trajectory = calculateTrajectory(recentHistory);

  const attribution = {
    posture: identifyDominantInfluence(stateScores, 'posture'),
    expression: identifyDominantInfluence(stateScores, 'expression')
  };

  return {
    posture,
    expression,
    trajectory,
    stateScores,
    confidence,
    isReliable: true,
    attribution,
    operatingStyleInfluence: operatingStyle ? operatingStyle.id || operatingStyle : null
  };
}

function identifyDominantInfluence(stateScores, type) {
  const influences = [];
  
  for (const [source, config] of Object.entries(STATE_SOURCES)) {
    const score = source === 'stressLoad' ? (100 - stateScores[source]) : stateScores[source];
    const influence = score * config[type] * config.weight;
    influences.push({ source, influence, score: stateScores[source] });
  }

  influences.sort((a, b) => b.influence - a.influence);
  return influences.slice(0, 2).map(i => i.source);
}

export function interpolateExpressionState(current, target, progress) {
  return {
    eyeScale: current.eyeScale + (target.eyeScale - current.eyeScale) * progress,
    browAngle: current.browAngle + (target.browAngle - current.browAngle) * progress,
    mouthCurve: current.mouthCurve + (target.mouthCurve - current.mouthCurve) * progress
  };
}

export function interpolatePostureState(current, target, progress) {
  return {
    angle: current.angle + (target.angle - current.angle) * progress,
    scale: current.scale + (target.scale - current.scale) * progress
  };
}

export async function getOperatingStyleForAvatar(userId) {
  try {
    const styleRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const styleSnap = await getDoc(styleRef);
    
    if (styleSnap.exists()) {
      const data = styleSnap.data();
      const surfaced = data.surfacedStyles || [];
      
      if (surfaced.length > 0) {
        const latest = surfaced[surfaced.length - 1];
        if (latest.confidence >= 0.7) {
          return latest.styleId;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting operating style for avatar:', error);
    return null;
  }
}

export { POSTURE_STATES, EXPRESSION_STATES, TRAJECTORY_STATES, CONFIDENCE_THRESHOLD };
