const CONFLICT_RESOLUTION_CONFIG = {
  neutralBias: 0.6,
  composurePriority: 0.7,
  maxExtremeDeviation: 25,
  conflictThreshold: 0.3
};

const STATE_COMPATIBILITY_MATRIX = {
  energy_stressLoad: { compatible: false, resolution: 'composure' },
  energy_recovery: { compatible: true, resolution: 'blend' },
  consistency_momentum: { compatible: true, resolution: 'blend' },
  stressLoad_recovery: { compatible: false, resolution: 'recovery_priority' },
  consistency_stressLoad: { compatible: false, resolution: 'neutral' },
  momentum_stressLoad: { compatible: false, resolution: 'composure' }
};

export function detectStateConflicts(stateScores) {
  if (!stateScores) return { hasConflicts: false, conflicts: [] };

  const conflicts = [];
  const normalized = normalizeScores(stateScores);

  if (normalized.energy > 0.6 && normalized.stressLoad > 0.6) {
    conflicts.push({
      type: 'energy_stressLoad',
      severity: Math.min(normalized.energy, normalized.stressLoad) - 0.5,
      description: 'High energy with high stress'
    });
  }

  if (normalized.consistency > 0.7 && normalized.stressLoad > 0.6) {
    conflicts.push({
      type: 'consistency_stressLoad',
      severity: Math.min(normalized.consistency, normalized.stressLoad) - 0.5,
      description: 'High consistency with elevated stress'
    });
  }

  if (normalized.momentum > 0.6 && normalized.recovery < 0.4) {
    conflicts.push({
      type: 'momentum_recovery',
      severity: normalized.momentum - normalized.recovery - 0.2,
      description: 'Forward momentum without recovery support'
    });
  }

  if (normalized.stressLoad > 0.5 && normalized.recovery > 0.6) {
    conflicts.push({
      type: 'stressLoad_recovery',
      severity: Math.abs(normalized.stressLoad - normalized.recovery) - 0.1,
      description: 'Stress present during recovery'
    });
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    overallSeverity: conflicts.reduce((sum, c) => sum + c.severity, 0) / Math.max(conflicts.length, 1)
  };
}

function normalizeScores(scores) {
  return {
    energy: (scores.energy || 50) / 100,
    stressLoad: (scores.stressLoad || 50) / 100,
    consistency: (scores.consistency || 50) / 100,
    recovery: (scores.recovery || 50) / 100,
    momentum: (scores.momentum || 50) / 100
  };
}

export function resolveConflictingStates(state, conflictInfo) {
  if (!conflictInfo.hasConflicts) return state;

  const resolved = { ...state };
  let postureAdjustment = 0;
  let expressionAdjustment = 0;

  for (const conflict of conflictInfo.conflicts) {
    const resolution = getResolutionStrategy(conflict.type);
    const adjustment = calculateConflictAdjustment(conflict, resolution);
    
    postureAdjustment += adjustment.posture;
    expressionAdjustment += adjustment.expression;
  }

  postureAdjustment = clamp(postureAdjustment, -CONFLICT_RESOLUTION_CONFIG.maxExtremeDeviation, CONFLICT_RESOLUTION_CONFIG.maxExtremeDeviation);
  expressionAdjustment = clamp(expressionAdjustment, -CONFLICT_RESOLUTION_CONFIG.maxExtremeDeviation, CONFLICT_RESOLUTION_CONFIG.maxExtremeDeviation);

  const basePosture = resolved.postureScore || 50;
  const baseExpression = resolved.expressionScore || 50;

  const neutralPosture = 50;
  const neutralExpression = 50;

  const conflictBias = conflictInfo.overallSeverity * CONFLICT_RESOLUTION_CONFIG.neutralBias;
  
  resolved.postureScore = clamp(
    basePosture + postureAdjustment - (basePosture - neutralPosture) * conflictBias,
    0,
    100
  );
  
  resolved.expressionScore = clamp(
    baseExpression + expressionAdjustment - (baseExpression - neutralExpression) * conflictBias,
    0,
    100
  );

  resolved.conflictResolved = true;
  resolved.conflictInfo = {
    detected: conflictInfo.conflicts.length,
    severity: conflictInfo.overallSeverity,
    strategy: 'composure_bias'
  };

  return resolved;
}

function getResolutionStrategy(conflictType) {
  const matrix = STATE_COMPATIBILITY_MATRIX[conflictType];
  return matrix ? matrix.resolution : 'neutral';
}

function calculateConflictAdjustment(conflict, resolution) {
  const baseMagnitude = conflict.severity * 10;

  switch (resolution) {
    case 'composure':
      return {
        posture: -baseMagnitude * CONFLICT_RESOLUTION_CONFIG.composurePriority,
        expression: -baseMagnitude * 0.5
      };

    case 'neutral':
      return {
        posture: 0,
        expression: 0
      };

    case 'recovery_priority':
      return {
        posture: baseMagnitude * 0.3,
        expression: baseMagnitude * 0.5
      };

    case 'blend':
      return {
        posture: 0,
        expression: 0
      };

    default:
      return { posture: 0, expression: 0 };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function shouldDampenExtreme(score, type = 'posture') {
  const extremeThreshold = type === 'posture' ? 85 : 88;
  const lowThreshold = type === 'posture' ? 15 : 12;

  return score > extremeThreshold || score < lowThreshold;
}

export function applyExtremeDampening(score, type = 'posture') {
  if (!shouldDampenExtreme(score, type)) return score;

  const center = 50;
  const deviation = score - center;
  const dampenedDeviation = deviation * 0.85;

  return center + dampenedDeviation;
}

export function ensureComposure(state, stateScores) {
  if (!state || !stateScores) return state;

  const conflictInfo = detectStateConflicts(stateScores);
  
  if (conflictInfo.hasConflicts && conflictInfo.overallSeverity > CONFLICT_RESOLUTION_CONFIG.conflictThreshold) {
    return resolveConflictingStates(state, conflictInfo);
  }

  if (shouldDampenExtreme(state.postureScore, 'posture')) {
    state = {
      ...state,
      postureScore: applyExtremeDampening(state.postureScore, 'posture')
    };
  }

  if (shouldDampenExtreme(state.expressionScore, 'expression')) {
    state = {
      ...state,
      expressionScore: applyExtremeDampening(state.expressionScore, 'expression')
    };
  }

  return state;
}

export { CONFLICT_RESOLUTION_CONFIG, STATE_COMPATIBILITY_MATRIX };
