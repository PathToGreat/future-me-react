const DETERMINISTIC_SEED_FACTOR = 1000;

const STATE_FINGERPRINT_PRECISION = {
  posture: 2,
  expression: 2,
  trajectory: 1
};

export function generateStateFingerprint(state) {
  if (!state) return 'neutral-neutral-stabilizing';

  const postureScore = roundToPrecision(state.postureScore || 50, STATE_FINGERPRINT_PRECISION.posture);
  const expressionScore = roundToPrecision(state.expressionScore || 50, STATE_FINGERPRINT_PRECISION.expression);
  const trajectory = state.trajectory?.state || 'stabilizing';
  const isReliable = state.isReliable ? 1 : 0;

  return `${postureScore}-${expressionScore}-${trajectory}-${isReliable}`;
}

function roundToPrecision(value, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

export function ensureDeterministicOutput(state, operatingStyle = null) {
  if (!state) {
    return getNeutralDeterministicState();
  }

  const fingerprint = generateStateFingerprint(state);
  
  const deterministicState = {
    ...state,
    fingerprint,
    posture: {
      ...state.posture,
      angle: roundToPrecision(state.posture?.angle || 0, 2),
      scale: roundToPrecision(state.posture?.scale || 1.0, 4)
    },
    expression: {
      ...state.expression,
      eyeScale: roundToPrecision(state.expression?.eyeScale || 1.0, 3),
      browAngle: roundToPrecision(state.expression?.browAngle || 0, 2),
      mouthCurve: roundToPrecision(state.expression?.mouthCurve || 0, 2)
    },
    isDeterministic: true
  };

  if (state.glowIntensity !== undefined) {
    deterministicState.glowIntensity = roundToPrecision(state.glowIntensity, 3);
  }
  if (state.saturationLevel !== undefined) {
    deterministicState.saturationLevel = roundToPrecision(state.saturationLevel, 3);
  }

  return deterministicState;
}

function getNeutralDeterministicState() {
  return {
    fingerprint: 'neutral-neutral-stabilizing-0',
    posture: {
      name: 'neutral',
      angle: 0,
      scale: 1.0
    },
    expression: {
      name: 'neutral',
      eyeScale: 1.0,
      browAngle: 0,
      mouthCurve: 0
    },
    trajectory: {
      state: 'stabilizing',
      confidence: 0
    },
    isReliable: false,
    isDeterministic: true
  };
}

export function validateStateConsistency(currentState, previousState) {
  if (!previousState) return { isConsistent: true, drift: 0 };

  const currentFingerprint = generateStateFingerprint(currentState);
  const previousFingerprint = generateStateFingerprint(previousState);

  if (currentFingerprint === previousFingerprint) {
    const postureDrift = Math.abs((currentState.posture?.angle || 0) - (previousState.posture?.angle || 0));
    const expressionDrift = Math.abs((currentState.expression?.eyeScale || 1) - (previousState.expression?.eyeScale || 1));

    if (postureDrift > 0.01 || expressionDrift > 0.001) {
      return {
        isConsistent: false,
        drift: postureDrift + expressionDrift * 100,
        reason: 'visual_drift_detected'
      };
    }
  }

  return { isConsistent: true, drift: 0 };
}

export function enforceSessionContinuity(newState, sessionCache) {
  if (!sessionCache || !sessionCache.lastRenderedState) {
    return newState;
  }

  const newFingerprint = generateStateFingerprint(newState);
  const cachedFingerprint = sessionCache.lastRenderedFingerprint;

  if (newFingerprint === cachedFingerprint) {
    return {
      ...newState,
      posture: { ...sessionCache.lastRenderedState.posture },
      expression: { ...sessionCache.lastRenderedState.expression },
      preservedFromCache: true
    };
  }

  return newState;
}

export function createSessionCache() {
  return {
    lastRenderedState: null,
    lastRenderedFingerprint: null,
    stateHistory: [],
    maxHistoryLength: 10
  };
}

export function updateSessionCache(cache, state) {
  const fingerprint = generateStateFingerprint(state);
  
  return {
    ...cache,
    lastRenderedState: ensureDeterministicOutput(state),
    lastRenderedFingerprint: fingerprint,
    stateHistory: [
      ...cache.stateHistory.slice(-(cache.maxHistoryLength - 1)),
      { fingerprint, timestamp: Date.now() }
    ]
  };
}

export { STATE_FINGERPRINT_PRECISION };
