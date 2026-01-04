import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { computeAvatarStateAttribution, getOperatingStyleForAvatar } from '../utils/avatarStateAttribution';
import { computeSmoothedState, shouldTransition, interpolateStates, computeTransitionProgress, getStateMemory } from '../utils/avatarTemporalSmoothing';
import { applyOperatingStyleInfluence, getStyleTransitionBehavior } from '../utils/avatarOperatingStyleInfluence';
import { computeAvatarEffects } from '../components/avatar/AvatarEffectsEngine';

const DEFAULT_TRANSITION_DURATION = 800;

export function useEnhancedAvatarState(metrics, options = {}) {
  const { user } = useAuth();
  const {
    historyData = [],
    enableSmoothing = true,
    enableOperatingStyleInfluence = true
  } = options;

  const [currentState, setCurrentState] = useState(null);
  const [targetState, setTargetState] = useState(null);
  const [operatingStyle, setOperatingStyle] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const transitionStartRef = useRef(null);
  const animationFrameRef = useRef(null);
  const previousStateRef = useRef(null);

  useEffect(() => {
    if (user?.uid && enableOperatingStyleInfluence) {
      loadOperatingStyle();
    }
  }, [user?.uid, enableOperatingStyleInfluence]);

  const loadOperatingStyle = async () => {
    if (!user?.uid) return;
    
    try {
      const styleId = await getOperatingStyleForAvatar(user.uid);
      setOperatingStyle(styleId);
    } catch (error) {
      console.error('Error loading operating style for avatar:', error);
    }
  };

  useEffect(() => {
    if (!metrics) return;

    const normalizedMetrics = {
      sleepNorm: normalize(metrics.sleepScore || metrics.sleep || 3),
      stressNorm: normalize(metrics.stressScore || metrics.stress || 3),
      activityNorm: normalize(metrics.activityScore || metrics.activity || 3),
      nutritionNorm: normalize(metrics.nutritionScore || metrics.nutrition || 3),
      disciplineNorm: normalize(metrics.disciplineScore || metrics.discipline || 3)
    };

    let attributedState = computeAvatarStateAttribution(normalizedMetrics, {
      operatingStyle,
      recentHistory: historyData.slice(-14).map(d => ({ score: d.score || 50, timestamp: d.timestamp })),
      confidenceOverride: historyData.length >= 7 ? null : historyData.length / 7 * 0.7
    });

    if (enableOperatingStyleInfluence && operatingStyle && attributedState.isReliable) {
      attributedState = applyOperatingStyleInfluence(attributedState, operatingStyle, normalizedMetrics);
    }

    let postureScore = getPostureScoreFromState(attributedState.posture);
    let expressionScore = getExpressionScoreFromState(attributedState.expression);

    if (enableSmoothing && user?.uid) {
      const smoothedState = computeSmoothedState({
        ...attributedState,
        postureScore,
        expressionScore
      }, user.uid, {
        smoothingWindow: 7,
        useWeightedAverage: true,
        preserveTrajectory: true
      });

      postureScore = smoothedState.postureScore || postureScore;
      expressionScore = smoothedState.expressionScore || expressionScore;

      attributedState = {
        ...attributedState,
        posture: updatePostureFromScore(attributedState.posture, postureScore),
        expression: updateExpressionFromScore(attributedState.expression, expressionScore)
      };
    }

    const baseEffects = computeAvatarEffects({
      activityScore: metrics.activityScore || metrics.activity || 3,
      nutritionScore: metrics.nutritionScore || metrics.nutrition || 3,
      sleepScore: metrics.sleepScore || metrics.sleep || 3,
      stressScore: metrics.stressScore || metrics.stress || 3,
      disciplineScore: metrics.disciplineScore || metrics.discipline || 3,
      gender: metrics.gender || 'male',
      baselineData: metrics.baselineData
    });

    const enhancedState = {
      ...attributedState,
      postureScore,
      expressionScore,
      effects: baseEffects,
      operatingStyle,
      timestamp: Date.now()
    };

    if (!currentState) {
      setCurrentState(enhancedState);
      setTargetState(enhancedState);
    } else if (shouldTransition(currentState, enhancedState)) {
      startTransition(enhancedState);
    } else {
      setCurrentState(enhancedState);
    }

    previousStateRef.current = enhancedState;

  }, [metrics, operatingStyle, historyData, enableSmoothing, enableOperatingStyleInfluence, user?.uid]);

  const startTransition = useCallback((newState) => {
    setTargetState(newState);
    setIsTransitioning(true);
    transitionStartRef.current = Date.now();

    const styleBehavior = getStyleTransitionBehavior(operatingStyle);
    const duration = DEFAULT_TRANSITION_DURATION * (styleBehavior.smoothingFactor || 1);

    const animate = () => {
      const progress = computeTransitionProgress(transitionStartRef.current, duration);
      
      if (progress >= 1) {
        setCurrentState(newState);
        setIsTransitioning(false);
        return;
      }

      const interpolatedState = interpolateStates(currentState, newState, progress);
      setCurrentState(interpolatedState);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [currentState, operatingStyle]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    state: currentState,
    targetState,
    isTransitioning,
    operatingStyle,
    refreshOperatingStyle: loadOperatingStyle
  };
}

function normalize(value, min = 1, max = 5) {
  if (value == null || isNaN(value)) return 0.5;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
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

function updatePostureFromScore(currentPosture, newScore) {
  if (!currentPosture) return currentPosture;
  
  const lerp = (a, b, t) => a + (b - a) * t;
  const normalizedScore = newScore / 100;

  return {
    ...currentPosture,
    angle: lerp(-5, 3, normalizedScore),
    scale: lerp(0.95, 1.04, normalizedScore)
  };
}

function updateExpressionFromScore(currentExpression, newScore) {
  if (!currentExpression) return currentExpression;
  
  const lerp = (a, b, t) => a + (b - a) * t;
  const normalizedScore = newScore / 100;

  return {
    ...currentExpression,
    eyeScale: lerp(0.85, 1.15, normalizedScore),
    browAngle: lerp(8, -6, normalizedScore),
    mouthCurve: lerp(-6, 14, normalizedScore)
  };
}

export default useEnhancedAvatarState;
