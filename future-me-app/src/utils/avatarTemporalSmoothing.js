const DEFAULT_SMOOTHING_WINDOW = 7;
const DEFAULT_TRANSITION_DURATION = 800;
const MIN_CHANGE_THRESHOLD = 0.05;

class AvatarStateMemory {
  constructor() {
    this.history = [];
    this.currentState = null;
    this.targetState = null;
    this.transitionProgress = 1;
    this.lastUpdateTime = Date.now();
  }

  addDataPoint(state, timestamp = Date.now()) {
    this.history.push({ state, timestamp });
    
    if (this.history.length > 30) {
      this.history = this.history.slice(-30);
    }
  }

  getRollingAverage(windowDays = DEFAULT_SMOOTHING_WINDOW) {
    const now = Date.now();
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    
    const recentData = this.history.filter(h => now - h.timestamp < windowMs);
    
    if (recentData.length === 0) {
      return null;
    }

    const avgState = {};
    const numericKeys = ['postureScore', 'expressionScore', 'energy', 'stressLoad', 'recovery', 'momentum', 'consistency'];

    numericKeys.forEach(key => {
      const values = recentData.map(d => d.state[key]).filter(v => v !== undefined);
      if (values.length > 0) {
        avgState[key] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    });

    return avgState;
  }

  getWeightedAverage(windowDays = DEFAULT_SMOOTHING_WINDOW) {
    const now = Date.now();
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    
    const recentData = this.history.filter(h => now - h.timestamp < windowMs);
    
    if (recentData.length === 0) {
      return null;
    }

    const weights = recentData.map(d => {
      const age = now - d.timestamp;
      return Math.exp(-age / (windowMs / 2));
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    const avgState = {};
    const numericKeys = ['postureScore', 'expressionScore', 'energy', 'stressLoad', 'recovery', 'momentum', 'consistency'];

    numericKeys.forEach(key => {
      let weightedSum = 0;
      let validWeight = 0;
      
      recentData.forEach((d, i) => {
        if (d.state[key] !== undefined) {
          weightedSum += d.state[key] * weights[i];
          validWeight += weights[i];
        }
      });
      
      if (validWeight > 0) {
        avgState[key] = weightedSum / validWeight;
      }
    });

    return avgState;
  }

  clear() {
    this.history = [];
    this.currentState = null;
    this.targetState = null;
    this.transitionProgress = 1;
  }
}

const stateMemories = new Map();

export function getStateMemory(userId) {
  if (!stateMemories.has(userId)) {
    stateMemories.set(userId, new AvatarStateMemory());
  }
  return stateMemories.get(userId);
}

export function computeSmoothedState(rawState, userId, options = {}) {
  const {
    smoothingWindow = DEFAULT_SMOOTHING_WINDOW,
    useWeightedAverage = true,
    preserveTrajectory = true
  } = options;

  const memory = getStateMemory(userId);
  
  memory.addDataPoint(rawState);

  const averagedState = useWeightedAverage 
    ? memory.getWeightedAverage(smoothingWindow)
    : memory.getRollingAverage(smoothingWindow);

  if (!averagedState) {
    return rawState;
  }

  const smoothedState = { ...rawState };

  const numericKeys = ['postureScore', 'expressionScore', 'energy', 'stressLoad', 'recovery', 'momentum', 'consistency'];
  
  numericKeys.forEach(key => {
    if (averagedState[key] !== undefined && rawState[key] !== undefined) {
      const blendFactor = preserveTrajectory ? 0.6 : 0.4;
      smoothedState[key] = rawState[key] * blendFactor + averagedState[key] * (1 - blendFactor);
    }
  });

  return smoothedState;
}

export function shouldTransition(currentState, newState, threshold = MIN_CHANGE_THRESHOLD) {
  if (!currentState || !newState) return true;

  const numericKeys = ['postureScore', 'expressionScore'];
  
  for (const key of numericKeys) {
    if (currentState[key] !== undefined && newState[key] !== undefined) {
      const diff = Math.abs(currentState[key] - newState[key]) / 100;
      if (diff >= threshold) {
        return true;
      }
    }
  }

  if (currentState.posture?.name !== newState.posture?.name) {
    return true;
  }
  
  if (currentState.expression?.name !== newState.expression?.name) {
    return true;
  }

  return false;
}

export function computeTransitionProgress(startTime, duration = DEFAULT_TRANSITION_DURATION) {
  const elapsed = Date.now() - startTime;
  const linear = Math.min(1, elapsed / duration);
  
  return easeInOutCubic(linear);
}

function easeInOutCubic(t) {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolateStates(from, to, progress) {
  if (!from || !to) return to || from;

  const interpolated = { ...to };

  if (from.posture && to.posture) {
    interpolated.posture = {
      ...to.posture,
      angle: lerp(from.posture.angle || 0, to.posture.angle || 0, progress),
      scale: lerp(from.posture.scale || 1, to.posture.scale || 1, progress)
    };
  }

  if (from.expression && to.expression) {
    interpolated.expression = {
      ...to.expression,
      eyeScale: lerp(from.expression.eyeScale || 1, to.expression.eyeScale || 1, progress),
      browAngle: lerp(from.expression.browAngle || 0, to.expression.browAngle || 0, progress),
      mouthCurve: lerp(from.expression.mouthCurve || 0, to.expression.mouthCurve || 0, progress)
    };
  }

  const numericKeys = ['energy', 'stressLoad', 'recovery', 'momentum', 'consistency'];
  numericKeys.forEach(key => {
    if (from[key] !== undefined && to[key] !== undefined) {
      interpolated[key] = lerp(from[key], to[key], progress);
    }
  });

  return interpolated;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function preventAbruptReversal(currentState, newState, recentHistory = []) {
  if (!currentState || !newState || recentHistory.length < 3) {
    return newState;
  }

  const trend = calculateTrend(recentHistory);
  
  const stabilizedState = { ...newState };

  if (trend.isStable) {
    const numericKeys = ['postureScore', 'expressionScore'];
    numericKeys.forEach(key => {
      if (currentState[key] !== undefined && newState[key] !== undefined) {
        const diff = newState[key] - currentState[key];
        const maxChange = 15;
        
        if (Math.abs(diff) > maxChange) {
          stabilizedState[key] = currentState[key] + Math.sign(diff) * maxChange;
        }
      }
    });
  }

  return stabilizedState;
}

function calculateTrend(history) {
  if (history.length < 3) {
    return { isStable: false, direction: 0 };
  }

  const recent = history.slice(-5);
  const values = recent.map(h => h.state?.postureScore || 50);
  
  const variance = calculateVariance(values);
  const isStable = variance < 100;

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const direction = secondAvg > firstAvg ? 1 : secondAvg < firstAvg ? -1 : 0;

  return { isStable, direction };
}

function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

export function clearStateMemory(userId) {
  if (stateMemories.has(userId)) {
    stateMemories.get(userId).clear();
  }
}

export { DEFAULT_SMOOTHING_WINDOW, DEFAULT_TRANSITION_DURATION, MIN_CHANGE_THRESHOLD };
