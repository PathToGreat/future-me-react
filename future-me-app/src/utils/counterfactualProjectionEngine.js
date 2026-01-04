const COUNTERFACTUAL_CONFIG = {
  isExplorationOnly: true,
  neverPersist: true,
  bypassConfidenceGating: true,
  maxProjectionIntensity: 0.85,
  visualRestraint: 0.8
};

const IDEAL_SCENARIO_PRESETS = {
  balancedWellness: {
    id: 'balancedWellness',
    label: 'Balanced wellness across all areas',
    inputs: {
      sleepNorm: 0.8,
      stressNorm: 0.2,
      activityNorm: 0.75,
      nutritionNorm: 0.8,
      disciplineNorm: 0.85
    }
  },
  recoveryFocused: {
    id: 'recoveryFocused',
    label: 'Prioritizing rest and recovery',
    inputs: {
      sleepNorm: 0.9,
      stressNorm: 0.15,
      activityNorm: 0.5,
      nutritionNorm: 0.7,
      disciplineNorm: 0.7
    }
  },
  activeLifestyle: {
    id: 'activeLifestyle',
    label: 'Consistent movement and activity',
    inputs: {
      sleepNorm: 0.7,
      stressNorm: 0.25,
      activityNorm: 0.9,
      nutritionNorm: 0.75,
      disciplineNorm: 0.8
    }
  },
  structuredRoutine: {
    id: 'structuredRoutine',
    label: 'High consistency and discipline',
    inputs: {
      sleepNorm: 0.75,
      stressNorm: 0.3,
      activityNorm: 0.7,
      nutritionNorm: 0.75,
      disciplineNorm: 0.95
    }
  },
  stressReduction: {
    id: 'stressReduction',
    label: 'Lower stress with balanced support',
    inputs: {
      sleepNorm: 0.8,
      stressNorm: 0.1,
      activityNorm: 0.6,
      nutritionNorm: 0.7,
      disciplineNorm: 0.7
    }
  }
};

let projectionSessionState = null;

export function initializeProjectionSession(realAvatarState) {
  projectionSessionState = {
    isActive: false,
    realStateSnapshot: deepClone(realAvatarState),
    projectedState: null,
    activeScenario: null,
    customInputs: null,
    sessionId: generateSessionId(),
    entryTimestamp: null,
    isCounterfactual: true
  };

  return projectionSessionState;
}

export function enterProjectionMode(scenarioId = null, customInputs = null) {
  if (!projectionSessionState) {
    console.warn('Projection session not initialized');
    return null;
  }

  projectionSessionState.isActive = true;
  projectionSessionState.entryTimestamp = Date.now();

  if (scenarioId && IDEAL_SCENARIO_PRESETS[scenarioId]) {
    projectionSessionState.activeScenario = IDEAL_SCENARIO_PRESETS[scenarioId];
    projectionSessionState.customInputs = null;
  } else if (customInputs) {
    projectionSessionState.activeScenario = null;
    projectionSessionState.customInputs = validateCustomInputs(customInputs);
  } else {
    projectionSessionState.activeScenario = IDEAL_SCENARIO_PRESETS.balancedWellness;
    projectionSessionState.customInputs = null;
  }

  return projectionSessionState;
}

export function exitProjectionMode() {
  if (!projectionSessionState) return null;

  const restoredState = projectionSessionState.realStateSnapshot;

  projectionSessionState = {
    ...projectionSessionState,
    isActive: false,
    projectedState: null,
    activeScenario: null,
    customInputs: null,
    entryTimestamp: null
  };

  return restoredState;
}

export function getProjectionInputs() {
  if (!projectionSessionState?.isActive) return null;

  if (projectionSessionState.customInputs) {
    return {
      ...projectionSessionState.customInputs,
      isCounterfactual: true,
      bypassConfidence: true
    };
  }

  if (projectionSessionState.activeScenario) {
    return {
      ...projectionSessionState.activeScenario.inputs,
      isCounterfactual: true,
      bypassConfidence: true
    };
  }

  return null;
}

export function updateProjectedState(newProjectedState) {
  if (!projectionSessionState?.isActive) return;

  projectionSessionState.projectedState = {
    ...newProjectedState,
    isCounterfactual: true,
    projectionSource: projectionSessionState.activeScenario?.id || 'custom'
  };
}

export function getProjectionSessionState() {
  return projectionSessionState;
}

export function isProjectionModeActive() {
  return projectionSessionState?.isActive === true;
}

export function getRealStateSnapshot() {
  return projectionSessionState?.realStateSnapshot || null;
}

export function getProjectedState() {
  return projectionSessionState?.projectedState || null;
}

export function getAvailableScenarios() {
  return Object.values(IDEAL_SCENARIO_PRESETS).map(scenario => ({
    id: scenario.id,
    label: scenario.label
  }));
}

export function setCustomScenarioInputs(inputs) {
  if (!projectionSessionState?.isActive) return false;

  projectionSessionState.customInputs = validateCustomInputs(inputs);
  projectionSessionState.activeScenario = null;

  return true;
}

function validateCustomInputs(inputs) {
  return {
    sleepNorm: clamp(inputs.sleepNorm ?? 0.5, 0, 1),
    stressNorm: clamp(inputs.stressNorm ?? 0.5, 0, 1),
    activityNorm: clamp(inputs.activityNorm ?? 0.5, 0, 1),
    nutritionNorm: clamp(inputs.nutritionNorm ?? 0.5, 0, 1),
    disciplineNorm: clamp(inputs.disciplineNorm ?? 0.5, 0, 1)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

function generateSessionId() {
  return `projection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clearProjectionSession() {
  projectionSessionState = null;
}

export { COUNTERFACTUAL_CONFIG, IDEAL_SCENARIO_PRESETS };
