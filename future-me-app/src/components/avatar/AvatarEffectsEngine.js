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
 * 
 * Baseline Modifiers (from onboarding):
 * - Physical State: energyLevel, morningFatigue, bodyTension
 * - Lifestyle Rhythm: movementRhythm, eatingRhythm, sleepRhythm
 * - Emotional Profile: primaryStressor, emotionalClimate, socialSupport
 * - Faith & Purpose: purposeAlignment, faithRhythm, motivationLevel
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
 * Baseline Modifier Calculators
 * These functions convert onboarding baseline data into normalized modifiers
 * that shift the avatar effect calculations
 */

/**
 * Converts baseline physical state to normalized modifiers
 * @param {Object} baselineState - Physical state from onboarding
 * @returns {Object} Normalized modifiers for energy, fatigue, and tension
 */
const normalizeBaselineState = (baselineState = {}) => {
  const {
    energyLevel = 3,
    morningFatigue = 'sometimes',
    bodyTension = 3
  } = baselineState;
  
  const energyModifier = normalize(energyLevel);
  
  const fatigueModifier = 
    morningFatigue === 'yes' ? 0.8 :
    morningFatigue === 'sometimes' ? 0.4 : 0.1;
  
  const tensionModifier = normalize(bodyTension);
  
  return {
    energyModifier,
    fatigueModifier,
    tensionModifier
  };
};

/**
 * Converts lifestyle rhythm to normalized modifiers
 * @param {Object} lifestyleRhythm - Rhythm data from onboarding
 * @returns {Object} Normalized rhythm modifiers
 */
const normalizeLifestyleRhythm = (lifestyleRhythm = {}) => {
  const {
    movementRhythm = 'moderate',
    eatingRhythm = 'regular',
    sleepRhythm = 'consistent'
  } = lifestyleRhythm;
  
  const movementModifier = 
    movementRhythm === 'intense' ? 1.0 :
    movementRhythm === 'moderate' ? 0.6 : 0.3;
  
  const eatingModifier = 
    eatingRhythm === 'regular' ? 1.0 :
    eatingRhythm === 'irregular' ? 0.5 : 0.3;
  
  const sleepRhythmModifier = 
    sleepRhythm === 'consistent' ? 1.0 :
    sleepRhythm === 'inconsistent' ? 0.5 : 0.2;
  
  return {
    movementModifier,
    eatingModifier,
    sleepRhythmModifier
  };
};

/**
 * Converts emotional profile to normalized modifiers
 * @param {Object} emotionalProfile - Emotional data from onboarding
 * @returns {Object} Normalized emotional modifiers
 */
const normalizeEmotionalProfile = (emotionalProfile = {}) => {
  const {
    primaryStressor = 'none',
    emotionalClimate = 'neutral',
    socialSupport = 'average'
  } = emotionalProfile;
  
  const stressorImpact = 
    primaryStressor === 'none' ? 0.0 :
    ['health', 'money', 'uncertainty'].includes(primaryStressor) ? 0.8 :
    ['work', 'family'].includes(primaryStressor) ? 0.5 : 0.3;
  
  const climateModifier = 
    emotionalClimate === 'hopeful' ? 1.0 :
    emotionalClimate === 'neutral' ? 0.5 : 0.1;
  
  const supportModifier = 
    socialSupport === 'strong' ? 1.0 :
    socialSupport === 'average' ? 0.5 : 0.2;
  
  return {
    stressorImpact,
    climateModifier,
    supportModifier,
    effectiveStress: stressorImpact * (1 - supportModifier * 0.3)
  };
};

/**
 * Converts faith/purpose data to normalized modifiers
 * @param {Object} faithPurpose - Faith/purpose data from onboarding
 * @returns {Object} Normalized purpose modifiers
 */
const normalizeFaithPurpose = (faithPurpose = {}) => {
  const {
    purposeAlignment = 'searching',
    faithRhythm = 'inconsistent',
    motivationLevel = 3
  } = faithPurpose;
  
  const alignmentModifier = 
    purposeAlignment === 'aligned' ? 1.0 :
    purposeAlignment === 'searching' ? 0.5 : 0.2;
  
  const faithModifier = 
    faithRhythm === 'consistent' ? 1.0 :
    faithRhythm === 'inconsistent' ? 0.5 : 0.3;
  
  const motivationModifier = normalize(motivationLevel);
  
  const clarityBoost = (alignmentModifier + faithModifier + motivationModifier) / 3;
  
  return {
    alignmentModifier,
    faithModifier,
    motivationModifier,
    clarityBoost
  };
};

/**
 * Computes combined baseline modifiers from all onboarding data
 * @param {Object} baselineData - All baseline data from onboarding
 * @returns {Object} Combined baseline modifiers
 */
export const computeBaselineModifiers = (baselineData = {}) => {
  const {
    baselineState = {},
    lifestyleRhythm = {},
    emotionalProfile = {},
    faithPurpose = {}
  } = baselineData;
  
  const physical = normalizeBaselineState(baselineState);
  const rhythm = normalizeLifestyleRhythm(lifestyleRhythm);
  const emotional = normalizeEmotionalProfile(emotionalProfile);
  const purpose = normalizeFaithPurpose(faithPurpose);
  
  const energyBaseline = (
    physical.energyModifier * 0.4 +
    (1 - physical.fatigueModifier) * 0.3 +
    rhythm.movementModifier * 0.2 +
    purpose.motivationModifier * 0.1
  );
  
  const postureBaseline = (
    (1 - physical.tensionModifier) * 0.5 +
    (1 - emotional.effectiveStress) * 0.3 +
    rhythm.sleepRhythmModifier * 0.2
  );
  
  const emotionalBaseline = (
    emotional.climateModifier * 0.4 +
    emotional.supportModifier * 0.3 +
    purpose.alignmentModifier * 0.3
  );
  
  const clarityBaseline = (
    purpose.clarityBoost * 0.5 +
    rhythm.sleepRhythmModifier * 0.3 +
    (1 - physical.fatigueModifier) * 0.2
  );
  
  const glowBaseline = (
    purpose.clarityBoost * 0.4 +
    energyBaseline * 0.3 +
    emotional.climateModifier * 0.3
  );
  
  return {
    physical,
    rhythm,
    emotional,
    purpose,
    energyBaseline: clamp(energyBaseline, 0, 1),
    postureBaseline: clamp(postureBaseline, 0, 1),
    emotionalBaseline: clamp(emotionalBaseline, 0, 1),
    clarityBaseline: clamp(clarityBaseline, 0, 1),
    glowBaseline: clamp(glowBaseline, 0, 1),
    fatigueBaseline: clamp(physical.fatigueModifier, 0, 1),
    stressBaseline: clamp(emotional.effectiveStress, 0, 1)
  };
};

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
 * Calculates emotional state based on metrics
 * Used for facial expression overlays
 * @param {Object} metrics - Normalized metrics
 * @returns {string} Emotion state: 'happy', 'content', 'neutral', 'tired', 'stressed'
 */
const calculateEmotionState = (metrics) => {
  const { sleepNorm, stressNorm, activityNorm, nutritionNorm, disciplineNorm } = metrics;
  
  const wellbeingScore = (
    sleepNorm * 0.25 +
    (1 - stressNorm) * 0.3 +
    activityNorm * 0.15 +
    nutritionNorm * 0.15 +
    disciplineNorm * 0.15
  );
  
  const stressLevel = stressNorm;
  const fatigueLevel = 1 - sleepNorm;
  
  if (stressLevel >= 0.75) return 'stressed';
  if (fatigueLevel >= 0.7 && sleepNorm < 0.35) return 'tired';
  if (wellbeingScore >= 0.75) return 'happy';
  if (wellbeingScore >= 0.55) return 'content';
  return 'neutral';
};

/**
 * Calculates Body Composition Index based on activity and nutrition ONLY
 * Used for body shape morphing between 3 states (soft, balanced, fit)
 * @param {Object} metrics - Normalized metrics
 * @param {Object} options - Additional options (gender)
 * @returns {Object} Body composition state, index, and morph values
 */
const calculateBodyComposition = (metrics, options = {}) => {
  const { activityNorm, nutritionNorm } = metrics;
  const { gender = 'male' } = options;
  
  const bodyCompositionIndex = clamp(
    (activityNorm * 0.6 + nutritionNorm * 0.4) * 100,
    0,
    100
  );
  
  let state = 'balanced';
  let morphProgress = 0.5;
  
  if (bodyCompositionIndex <= 33) {
    state = 'soft';
    morphProgress = bodyCompositionIndex / 33;
  } else if (bodyCompositionIndex <= 66) {
    state = 'balanced';
    morphProgress = (bodyCompositionIndex - 33) / 33;
  } else {
    state = 'fit';
    morphProgress = (bodyCompositionIndex - 66) / 34;
  }
  
  const genderMultipliers = gender === 'female' 
    ? { shoulder: 0.92, hip: 1.08, waist: 0.95 }
    : { shoulder: 1.08, hip: 0.92, waist: 1.0 };
  
  let shoulderWidth, torsoScale, waistScale, hipWidth, armDefinition;
  
  if (state === 'soft') {
    shoulderWidth = 0.88 + (morphProgress * 0.04);
    torsoScale = 1.08 - (morphProgress * 0.04);
    waistScale = 1.1 - (morphProgress * 0.05);
    hipWidth = 1.05 - (morphProgress * 0.03);
    armDefinition = morphProgress * 0.2;
  } else if (state === 'balanced') {
    shoulderWidth = 0.92 + (morphProgress * 0.06);
    torsoScale = 1.04 - (morphProgress * 0.04);
    waistScale = 1.05 - (morphProgress * 0.05);
    hipWidth = 1.02 - (morphProgress * 0.02);
    armDefinition = 0.2 + (morphProgress * 0.4);
  } else {
    shoulderWidth = 0.98 + (morphProgress * 0.08);
    torsoScale = 1.0 - (morphProgress * 0.05);
    waistScale = 1.0 - (morphProgress * 0.08);
    hipWidth = 1.0 - (morphProgress * 0.03);
    armDefinition = 0.6 + (morphProgress * 0.4);
  }
  
  shoulderWidth *= genderMultipliers.shoulder;
  hipWidth *= genderMultipliers.hip;
  waistScale *= genderMultipliers.waist;
  
  return {
    state,
    gender,
    bodyCompositionIndex,
    morphProgress,
    shoulderWidth: clamp(shoulderWidth, 0.8, 1.15),
    torsoScale: clamp(torsoScale, 0.85, 1.1),
    waistScale: clamp(waistScale, 0.85, 1.15),
    hipWidth: clamp(hipWidth, 0.85, 1.15),
    armDefinition: clamp(armDefinition, 0, 1)
  };
};

/**
 * Calculates energy pulse/glow parameters based on discipline and consistency
 * Used for pulsing aura effects around the avatar
 * @param {Object} metrics - Normalized metrics
 * @param {Object} options - Additional options (streakDays, consistencyScore)
 * @returns {Object} Energy pulse parameters
 */
const calculateEnergyPulse = (metrics, options = {}) => {
  const { activityNorm, nutritionNorm, sleepNorm, stressNorm, disciplineNorm } = metrics;
  const { streakDays = 0, consistencyScore = 0.5 } = options;
  
  const baseEnergy = (
    disciplineNorm * 0.35 +
    activityNorm * 0.25 +
    nutritionNorm * 0.15 +
    sleepNorm * 0.15 +
    (1 - stressNorm) * 0.1
  );
  
  const streakBonus = Math.min(streakDays / 30, 1) * 0.2;
  const consistencyBonus = consistencyScore * 0.15;
  
  const totalEnergy = clamp(baseEnergy + streakBonus + consistencyBonus, 0, 1);
  
  const pulseSpeed = totalEnergy >= 0.6 
    ? clamp(1 + (totalEnergy - 0.5) * 2, 1, 2.5)
    : clamp(0.5 + totalEnergy, 0.5, 1);
  
  const pulseIntensity = totalEnergy >= 0.4 
    ? clamp((totalEnergy - 0.3) * 1.5, 0, 1)
    : 0;
  
  const glowRadius = clamp(10 + (totalEnergy * 30), 10, 40);
  
  let state = 'dormant';
  if (totalEnergy >= 0.75) state = 'vibrant';
  else if (totalEnergy >= 0.55) state = 'active';
  else if (totalEnergy >= 0.35) state = 'steady';
  
  return {
    state,
    pulseSpeed,
    pulseIntensity,
    glowRadius,
    totalEnergy
  };
};

/**
 * Calculates facial overlay effects (stress desaturation, energy glow, sleep blur)
 * @param {Object} metrics - Normalized metrics
 * @returns {Object} Facial overlay effect values
 */
const calculateFacialOverlays = (metrics) => {
  const { sleepNorm, stressNorm, activityNorm, nutritionNorm, disciplineNorm } = metrics;
  
  const stressDesaturation = clamp(stressNorm * 0.4, 0, 0.5);
  
  const energyLevel = (activityNorm + nutritionNorm + disciplineNorm) / 3;
  const energyGlow = energyLevel >= 0.6 ? clamp((energyLevel - 0.5) * 1.5, 0, 0.8) : 0;
  
  const eyeBlur = sleepNorm < 0.4 ? clamp((0.4 - sleepNorm) * 2, 0, 0.6) : 0;
  
  const faceShadow = clamp((stressNorm * 0.3) + ((1 - sleepNorm) * 0.2), 0, 0.4);
  
  return {
    stressDesaturation,
    energyGlow,
    eyeBlur,
    faceShadow
  };
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
 * @param {Object} metrics.baselineData - Onboarding baseline data (optional)
 * 
 * @returns {Object} Visual effect states for avatar rendering
 */
export const computeAvatarEffects = (metrics = {}) => {
  const {
    activityScore = 3,
    nutritionScore = 3,
    sleepScore = 3,
    stressScore = 3,
    disciplineScore = 3,
    gender = 'male',
    baselineData = null
  } = metrics;
  
  const normalizedMetrics = {
    activityNorm: normalize(activityScore),
    nutritionNorm: normalize(nutritionScore),
    sleepNorm: normalize(sleepScore),
    stressNorm: normalize(stressScore),
    disciplineNorm: normalize(disciplineScore)
  };
  
  const {
    streakDays = 0,
    consistencyScore = 0.5
  } = metrics;
  
  const baselineModifiers = baselineData 
    ? computeBaselineModifiers(baselineData)
    : null;
  
  let adjustedMetrics = { ...normalizedMetrics };
  
  if (baselineModifiers) {
    adjustedMetrics = {
      ...normalizedMetrics,
      stressNorm: clamp(
        normalizedMetrics.stressNorm * 0.7 + baselineModifiers.stressBaseline * 0.3,
        0, 1
      ),
      sleepNorm: clamp(
        normalizedMetrics.sleepNorm * 0.8 + (1 - baselineModifiers.fatigueBaseline) * 0.2,
        0, 1
      )
    };
  }
  
  const brightnessLevel = calculateBrightness(adjustedMetrics);
  const contrastLevel = calculateContrast(adjustedMetrics);
  const saturationLevel = calculateSaturation(adjustedMetrics);
  
  let darknessOverlay = calculateDarknessOverlay(adjustedMetrics);
  if (baselineModifiers) {
    darknessOverlay = clamp(
      darknessOverlay * 0.6 + baselineModifiers.fatigueBaseline * 0.15,
      0, 0.5
    );
  }
  
  let glowIntensity = calculateGlowIntensity(adjustedMetrics);
  if (baselineModifiers) {
    const glowBoost = baselineModifiers.glowBaseline * 0.2;
    glowIntensity = clamp(glowIntensity + glowBoost, 0, 1);
  }
  
  let blurAmount = calculateBlurAmount(adjustedMetrics);
  if (baselineModifiers) {
    const clarityBoost = baselineModifiers.clarityBaseline * 0.3;
    blurAmount = clamp(blurAmount * (1 - clarityBoost), 0, 1);
  }
  
  let postureState = calculatePostureState(adjustedMetrics);
  if (baselineModifiers) {
    const postureFloor = baselineModifiers.postureBaseline;
    if (postureFloor < 0.4 && postureState === 'upright') {
      postureState = 'neutral';
    } else if (postureFloor >= 0.7 && postureState === 'slump') {
      postureState = 'neutral';
    }
  }
  
  let emotionState = calculateEmotionState(adjustedMetrics);
  if (baselineModifiers) {
    const emotionalFloor = baselineModifiers.emotionalBaseline;
    if (emotionalFloor >= 0.7 && (emotionState === 'tired' || emotionState === 'neutral')) {
      emotionState = 'content';
    } else if (emotionalFloor < 0.3 && emotionState === 'happy') {
      emotionState = 'content';
    }
  }
  
  const facialOverlays = calculateFacialOverlays(adjustedMetrics);
  if (baselineModifiers) {
    facialOverlays.energyGlow = clamp(
      facialOverlays.energyGlow + baselineModifiers.glowBaseline * 0.15,
      0, 0.8
    );
    facialOverlays.eyeBlur = clamp(
      facialOverlays.eyeBlur + baselineModifiers.fatigueBaseline * 0.1,
      0, 0.6
    );
  }
  
  const bodyComposition = calculateBodyComposition(normalizedMetrics, { gender });
  const energyPulse = calculateEnergyPulse(adjustedMetrics, { streakDays, consistencyScore });
  
  if (baselineModifiers) {
    energyPulse.pulseIntensity = clamp(
      energyPulse.pulseIntensity + baselineModifiers.energyBaseline * 0.15,
      0, 1
    );
  }
  
  return {
    brightnessLevel,
    contrastLevel,
    saturationLevel,
    darknessOverlay,
    glowIntensity,
    blurAmount,
    postureState,
    emotionState,
    facialOverlays,
    bodyComposition,
    energyPulse,
    baselineModifiers,

    activityScore,
    nutritionScore,
    sleepScore,
    stressScore,
    consistencyScore,
    
    cssFilter: buildCSSFilter({
      brightnessLevel,
      contrastLevel,
      saturationLevel,
      blurAmount
    }),
    
    _debug: {
      rawMetrics: metrics,
      normalizedMetrics,
      adjustedMetrics,
      baselineApplied: !!baselineModifiers,
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
  EMOTION_STATE: 'emotionState',
  FACIAL_OVERLAYS: 'facialOverlays',
  OUTLINE: 'outline',
  CARTOONIZE: 'cartoonize',
  BODY_COMPOSITION: 'bodyComposition'
};

export const POSTURE_STATES = {
  UPRIGHT: 'upright',
  NEUTRAL: 'neutral',
  SLUMP: 'slump'
};

export const EMOTION_STATES = {
  HAPPY: 'happy',
  CONTENT: 'content',
  NEUTRAL: 'neutral',
  TIRED: 'tired',
  STRESSED: 'stressed'
};

export const BODY_COMPOSITION_STATES = {
  ATHLETIC: 'athletic',
  FIT: 'fit',
  AVERAGE: 'average',
  SEDENTARY: 'sedentary'
};

export const ENERGY_STATES = {
  VIBRANT: 'vibrant',
  ACTIVE: 'active',
  STEADY: 'steady',
  DORMANT: 'dormant'
};

/**
 * Generates CSS styles for facial energy glow overlay
 * @param {number} intensity - Glow intensity (0-1)
 * @param {string} color - Glow color
 * @returns {Object} React style object
 */
export const getFacialGlowStyle = (intensity, color = '#fbbf24') => {
  if (intensity < 0.05) {
    return { display: 'none' };
  }
  
  return {
    position: 'absolute',
    top: '-10%',
    left: '15%',
    right: '15%',
    height: '45%',
    background: `radial-gradient(ellipse at center, ${color}${Math.round(intensity * 50).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
    pointerEvents: 'none',
    filter: `blur(${8 + intensity * 8}px)`,
    opacity: intensity * 0.7,
    transition: 'all 0.6s ease',
    borderRadius: '50%'
  };
};

/**
 * Generates CSS styles for eye tiredness blur overlay
 * @param {number} intensity - Blur intensity (0-1)
 * @returns {Object} React style object
 */
export const getEyeBlurStyle = (intensity) => {
  if (intensity < 0.05) {
    return { display: 'none' };
  }
  
  return {
    position: 'absolute',
    top: '15%',
    left: '20%',
    right: '20%',
    height: '25%',
    background: 'rgba(0, 0, 0, 0.08)',
    pointerEvents: 'none',
    filter: `blur(${3 + intensity * 6}px)`,
    opacity: intensity * 0.5,
    transition: 'all 0.6s ease',
    borderRadius: '40%'
  };
};

/**
 * Generates CSS styles for stress/fatigue face shadow
 * @param {number} intensity - Shadow intensity (0-1)
 * @returns {Object} React style object
 */
export const getFaceShadowStyle = (intensity) => {
  if (intensity < 0.05) {
    return { display: 'none' };
  }
  
  return {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,${intensity * 0.15}) 100%)`,
    pointerEvents: 'none',
    opacity: intensity,
    transition: 'all 0.6s ease',
    borderRadius: 'inherit'
  };
};

export default computeAvatarEffects;
