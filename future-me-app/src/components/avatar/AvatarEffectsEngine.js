/**
 * Avatar Effects Engine
 * 
 * A modular system that transforms lifestyle metrics into visual effect states
 * for the avatar component. This engine provides the foundation for future 
 * avatar upgrades including posture overlays, facial expression layers,
 * outlines, and cartoonization effects.
 * 
 * Current Effects:
 * - brightnessLevel: Overall illumination of avatar (0-1)
 * - contrastLevel: Color contrast intensity (0-1)  
 * - saturationLevel: Color vibrancy (0-1)
 * - darknessOverlay: Overlay opacity for fatigue/stress effects (0-1)
 * - glowIntensity: Energy glow strength (0-1)
 * - blurAmount: Focus/clarity of avatar (0-1 normalized, maps to px)
 * - postureState: Physical stance indicator ('upright', 'neutral', 'slump')
 */

/**
 * Normalizes a raw score to 0-1 range
 * @param {number} value - Raw score (expected 1-5 scale)
 * @param {number} min - Minimum bound (default 1)
 * @param {number} max - Maximum bound (default 5)
 * @returns {number} Normalized value (0-1)
 */
const normalize = (value, min = 1, max = 5) => {
  if (value == null || isNaN(value)) return 0.5;
  const clamped = Math.max(min, Math.min(max, value));
  return (clamped - min) / (max - min);
};

/**
 * Clamps a value between min and max bounds
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Effect Calculators
 * Each calculator takes normalized metrics and returns an effect value
 */

const calculateBrightness = (metrics) => {
  const { activityNorm, nutritionNorm, sleepNorm, stressNorm, disciplineNorm } = metrics;
  
  const baseValue = (
    activityNorm * 0.2 +
    nutritionNorm * 0.2 +
    sleepNorm * 0.25 +
    disciplineNorm * 0.15 +
    (1 - stressNorm) * 0.2
  );
  
  return clamp(0.7 + (baseValue * 0.5), 0.5, 1.2);
};

const calculateContrast = (metrics) => {
  const { activityNorm, nutritionNorm, disciplineNorm } = metrics;
  
  const baseValue = (
    disciplineNorm * 0.5 +
    activityNorm * 0.3 +
    nutritionNorm * 0.2
  );
  
  return clamp(0.85 + (baseValue * 0.3), 0.7, 1.15);
};

const calculateSaturation = (metrics) => {
  const { sleepNorm, nutritionNorm, stressNorm, disciplineNorm } = metrics;
  
  const baseValue = (
    sleepNorm * 0.3 +
    nutritionNorm * 0.25 +
    (1 - stressNorm) * 0.3 +
    disciplineNorm * 0.15
  );
  
  return clamp(0.6 + (baseValue * 0.6), 0.4, 1.2);
};

const calculateDarknessOverlay = (metrics) => {
  const { sleepNorm, stressNorm, activityNorm } = metrics;
  
  const fatigueLevel = (
    (1 - sleepNorm) * 0.5 +
    stressNorm * 0.35 +
    (1 - activityNorm) * 0.15
  );
  
  return clamp(fatigueLevel * 0.4, 0, 0.5);
};

const calculateGlowIntensity = (metrics) => {
  const { activityNorm, nutritionNorm, sleepNorm, disciplineNorm, stressNorm } = metrics;
  
  const energyLevel = (
    activityNorm * 0.25 +
    nutritionNorm * 0.2 +
    sleepNorm * 0.2 +
    disciplineNorm * 0.25 +
    (1 - stressNorm) * 0.1
  );
  
  const threshold = 0.5;
  if (energyLevel < threshold) return 0;
  
  return clamp((energyLevel - threshold) * 2, 0, 1);
};

const calculateBlurAmount = (metrics) => {
  const { sleepNorm, stressNorm } = metrics;
  
  const clarityLevel = sleepNorm * 0.7 + (1 - stressNorm) * 0.3;
  
  const threshold = 0.3;
  if (clarityLevel >= threshold) return 0;
  
  return clamp((threshold - clarityLevel) * 3, 0, 1);
};

const calculatePostureState = (metrics) => {
  const { sleepNorm, stressNorm, activityNorm } = metrics;
  
  const postureScore = (
    sleepNorm * 0.4 +
    (1 - stressNorm) * 0.4 +
    activityNorm * 0.2
  );
  
  if (postureScore >= 0.7) return 'upright';
  if (postureScore >= 0.4) return 'neutral';
  return 'slump';
};

/**
 * Main Effects Computation Function
 * 
 * Takes raw lifestyle metrics and transforms them into visual effect states.
 * This is the primary export that avatar components should use.
 * 
 * @param {Object} metrics - Raw lifestyle metrics
 * @param {number} metrics.activityScore - Physical activity level (1-5)
 * @param {number} metrics.nutritionScore - Nutrition quality (1-5)
 * @param {number} metrics.sleepScore - Sleep quality (1-5)
 * @param {number} metrics.stressScore - Stress level (1-5, higher = more stress)
 * @param {number} metrics.disciplineScore - Discipline/consistency level (1-5)
 * 
 * @returns {Object} Visual effect states for avatar rendering
 */
export const computeAvatarEffects = (metrics = {}) => {
  const {
    activityScore = 3,
    nutritionScore = 3,
    sleepScore = 3,
    stressScore = 3,
    disciplineScore = 3
  } = metrics;
  
  const normalizedMetrics = {
    activityNorm: normalize(activityScore),
    nutritionNorm: normalize(nutritionScore),
    sleepNorm: normalize(sleepScore),
    stressNorm: normalize(stressScore),
    disciplineNorm: normalize(disciplineScore)
  };
  
  const brightnessLevel = calculateBrightness(normalizedMetrics);
  const contrastLevel = calculateContrast(normalizedMetrics);
  const saturationLevel = calculateSaturation(normalizedMetrics);
  const darknessOverlay = calculateDarknessOverlay(normalizedMetrics);
  const glowIntensity = calculateGlowIntensity(normalizedMetrics);
  const blurAmount = calculateBlurAmount(normalizedMetrics);
  const postureState = calculatePostureState(normalizedMetrics);
  
  return {
    brightnessLevel,
    contrastLevel,
    saturationLevel,
    darknessOverlay,
    glowIntensity,
    blurAmount,
    postureState,
    
    cssFilter: buildCSSFilter({
      brightnessLevel,
      contrastLevel,
      saturationLevel,
      blurAmount
    }),
    
    _debug: {
      rawMetrics: metrics,
      normalizedMetrics,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Builds a CSS filter string from effect values
 * @param {Object} effects - Effect values
 * @returns {string} CSS filter property value
 */
const buildCSSFilter = ({ brightnessLevel, contrastLevel, saturationLevel, blurAmount }) => {
  const filters = [
    `brightness(${brightnessLevel.toFixed(2)})`,
    `contrast(${contrastLevel.toFixed(2)})`,
    `saturate(${saturationLevel.toFixed(2)})`
  ];
  
  if (blurAmount > 0.01) {
    const blurPx = blurAmount * 3;
    filters.push(`blur(${blurPx.toFixed(1)}px)`);
  }
  
  return filters.join(' ');
};

/**
 * Generates CSS styles for darkness overlay layer
 * @param {number} opacity - Overlay opacity (0-1)
 * @returns {Object} React style object
 */
export const getDarknessOverlayStyle = (opacity) => ({
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, ' + opacity.toFixed(3) + ')',
  pointerEvents: 'none',
  borderRadius: 'inherit',
  transition: 'background-color 0.5s ease'
});

/**
 * Generates CSS styles for glow effect layer
 * @param {number} intensity - Glow intensity (0-1)
 * @param {string} color - Glow color (default: golden warm)
 * @returns {Object} React style object
 */
export const getGlowOverlayStyle = (intensity, color = '#fbbf24') => {
  if (intensity < 0.01) {
    return { display: 'none' };
  }
  
  return {
    position: 'absolute',
    inset: '-20px',
    background: `radial-gradient(circle, ${color}${Math.round(intensity * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
    pointerEvents: 'none',
    filter: `blur(${10 + intensity * 10}px)`,
    opacity: intensity * 0.8,
    transition: 'all 0.5s ease',
    zIndex: -1
  };
};

/**
 * Future extensibility hooks
 * These placeholders allow easy addition of new effect types
 */
export const EFFECT_TYPES = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  SATURATION: 'saturation',
  DARKNESS: 'darkness',
  GLOW: 'glow',
  BLUR: 'blur',
  POSTURE: 'posture',
  FACIAL_EXPRESSION: 'facialExpression',
  OUTLINE: 'outline',
  CARTOONIZE: 'cartoonize'
};

export const POSTURE_STATES = {
  UPRIGHT: 'upright',
  NEUTRAL: 'neutral',
  SLUMP: 'slump'
};

export default computeAvatarEffects;
