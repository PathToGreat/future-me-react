import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  initializeProjectionSession,
  enterProjectionMode,
  exitProjectionMode,
  getProjectionInputs,
  updateProjectedState,
  isProjectionModeActive,
  getRealStateSnapshot,
  getProjectedState,
  getAvailableScenarios,
  setCustomScenarioInputs,
  clearProjectionSession
} from '../utils/counterfactualProjectionEngine';
import { computeAvatarStateAttribution } from '../utils/avatarStateAttribution';
import {
  applyProjectionVisualDifferentiation,
  enforceProjectionRestraint
} from '../utils/counterfactualVisualDifferentiation';
import {
  enforceProjectionGuardrails,
  validateProjectionIntegrity,
  ensureCleanExit
} from '../utils/counterfactualGuardrails';
import { computeAvatarEffects } from '../components/avatar/AvatarEffectsEngine';

export function useCounterfactualProjection(realAvatarState, realMetrics) {
  const { user } = useAuth();
  
  const [isActive, setIsActive] = useState(false);
  const [projectedState, setProjectedState] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  
  const sessionRef = useRef(null);

  useEffect(() => {
    setScenarios(getAvailableScenarios());
  }, []);

  useEffect(() => {
    return () => {
      if (sessionRef.current?.isActive) {
        exitProjectionMode();
        clearProjectionSession();
      }
    };
  }, []);

  const enter = useCallback((scenarioId = 'balancedWellness') => {
    if (!realAvatarState) return false;

    sessionRef.current = initializeProjectionSession(realAvatarState);
    const session = enterProjectionMode(scenarioId);
    
    if (session) {
      setIsActive(true);
      setActiveScenarioId(scenarioId);
      computeProjection(scenarioId);
      return true;
    }
    
    return false;
  }, [realAvatarState]);

  const exit = useCallback(() => {
    const result = ensureCleanExit(sessionRef.current, projectedState);
    
    exitProjectionMode();
    clearProjectionSession();
    sessionRef.current = null;
    
    setIsActive(false);
    setProjectedState(null);
    setActiveScenarioId(null);
    
    return result.success;
  }, [projectedState]);

  const changeScenario = useCallback((scenarioId) => {
    if (!isActive) return false;

    enterProjectionMode(scenarioId);
    setActiveScenarioId(scenarioId);
    computeProjection(scenarioId);
    
    return true;
  }, [isActive]);

  const setCustomInputs = useCallback((inputs) => {
    if (!isActive) return false;

    setCustomScenarioInputs(inputs);
    setActiveScenarioId('custom');
    
    const validatedInputs = getProjectionInputs();
    if (validatedInputs) {
      computeProjectionFromInputs(validatedInputs);
    }
    
    return true;
  }, [isActive]);

  const computeProjection = useCallback((scenarioId) => {
    const inputs = getProjectionInputs();
    if (!inputs) return;

    computeProjectionFromInputs(inputs);
  }, []);

  const computeProjectionFromInputs = useCallback((inputs) => {
    let attributedState = computeAvatarStateAttribution(inputs, {
      operatingStyle: null,
      recentHistory: [],
      confidenceOverride: 0.9
    });

    attributedState.isReliable = true;
    attributedState.isCounterfactual = true;

    const postureScore = getPostureScoreFromState(attributedState.posture);
    const expressionScore = getExpressionScoreFromState(attributedState.expression);

    const baseEffects = computeAvatarEffects({
      activityScore: denormalize(inputs.activityNorm),
      nutritionScore: denormalize(inputs.nutritionNorm),
      sleepScore: denormalize(inputs.sleepNorm),
      stressScore: denormalize(inputs.stressNorm),
      disciplineScore: denormalize(inputs.disciplineNorm),
      gender: realMetrics?.gender || 'male'
    });

    let projected = {
      ...attributedState,
      postureScore,
      expressionScore,
      effects: baseEffects,
      isCounterfactual: true,
      timestamp: Date.now()
    };

    const realState = getRealStateSnapshot();
    projected = enforceProjectionGuardrails(projected, realState);
    projected = applyProjectionVisualDifferentiation(projected);
    projected = enforceProjectionRestraint(projected, realState);

    const validation = validateProjectionIntegrity(projected, realState, sessionRef.current);
    if (!validation.isValid) {
      console.warn('Projection integrity issues detected:', validation.violations);
    }

    updateProjectedState(projected);
    setProjectedState(projected);
  }, [realMetrics]);

  const getDisplayState = useCallback(() => {
    if (isActive && projectedState) {
      return {
        state: projectedState,
        isProjection: true,
        realStateAvailable: getRealStateSnapshot()
      };
    }

    return {
      state: realAvatarState,
      isProjection: false,
      realStateAvailable: null
    };
  }, [isActive, projectedState, realAvatarState]);

  return {
    isActive,
    projectedState,
    activeScenarioId,
    scenarios,
    enter,
    exit,
    changeScenario,
    setCustomInputs,
    getDisplayState,
    getRealState: getRealStateSnapshot
  };
}

function getPostureScoreFromState(postureState) {
  if (!postureState) return 50;
  const scores = {
    confident: 92,
    upright: 77,
    relaxed: 62,
    neutral: 47,
    fatigued: 32,
    slumped: 12
  };
  return scores[postureState.name] || 50;
}

function getExpressionScoreFromState(expressionState) {
  if (!expressionState) return 50;
  const scores = {
    joyful: 92,
    happy: 77,
    content: 62,
    calm: 50,
    neutral: 40,
    weary: 30,
    tired: 20,
    strained: 7
  };
  return scores[expressionState.name] || 50;
}

function denormalize(norm, min = 1, max = 5) {
  return min + norm * (max - min);
}

export default useCounterfactualProjection;
