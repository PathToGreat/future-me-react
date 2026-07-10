import { getPreset, getTierInterpolation, interpolatePresets } from './avatarPresets';
import { normalizeParams } from './avatarParams';
import { enforceBodyConstraints } from './bodyConstraints';
import {
  computeProjectionConfidence,
  applyConfidenceScaling,
  applyDeltaVisibilityFloor,
  CONFIDENCE_TIERS
} from './projectionConfidence';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PROJECTION_BLEND = 0.35;

export function computePhysicalCompositionScore(metrics) {
  const act = clamp((metrics.activity - 1) / 4, 0, 1);
  const nut = clamp((metrics.nutrition - 1) / 4, 0, 1);
  const slp = clamp((metrics.sleep - 1) / 4, 0, 1);
  const consistency = clamp(metrics.consistency ?? 0.5, 0, 1);

  return (act * 0.40 + nut * 0.25 + consistency * 0.25 + slp * 0.10) * 100;
}

function extractTraitScore(trait) {
  if (trait == null) return 50;
  if (typeof trait === 'number') return trait;
  return trait.currentScore ?? trait.score ?? 50;
}

function computeEmotionalVisualParams(traits) {
  const emo = extractTraitScore(traits.emotionalStability);
  const conf = extractTraitScore(traits.confidence);
  const disc = extractTraitScore(traits.discipline);
  const res = extractTraitScore(traits.resilience);
  const vit = extractTraitScore(traits.vitality);
  // Social Connectedness & Purpose Alignment default to a neutral 50 when a
  // trait set does not carry them (e.g. the legacy avatarTraits path), so the
  // avatar simply reads neutral rather than shifting.
  const soc = extractTraitScore(traits.socialConnectedness);
  const pur = extractTraitScore(traits.purposeAlignment);

  const rawTension = 1 - emo / 100;
  const facialTension = clamp(rawTension * rawTension * 1.15, 0, 1);

  const postureBase = (conf * 0.40 + disc * 0.35 + emo * 0.25);
  const postureLean = clamp((postureBase - 50) / 50, -1, 1);

  return {
    vibrancy: clamp(vit / 100, 0, 1),
    energyGlow: clamp((vit * 0.6 + res * 0.4) / 100, 0, 1),
    facialTension,
    postureLean,
    // Facial expressiveness — lifted / bright vs flat, from stability + vitality.
    facialBrightness: clamp((emo * 0.5 + vit * 0.5) / 100, 0, 1),
    // Social Connectedness channels — warmth, eye softness, face openness, glow warmth.
    expressionWarmth: clamp(soc / 100, 0, 1),
    eyeSoftness: clamp((soc * 0.6 + emo * 0.4) / 100, 0, 1),
    faceOpenness: clamp((soc * 0.7 + conf * 0.3) / 100, 0, 1),
    glowWarmth: clamp(soc / 100, 0, 1),
    // Purpose Alignment channels — centeredness, steadiness, aura stability.
    centeredness: clamp(pur / 100, 0, 1),
    steadiness: clamp((pur * 0.7 + emo * 0.3) / 100, 0, 1),
    auraStability: clamp((pur * 0.6 + res * 0.4) / 100, 0, 1)
  };
}

function buildBodyParams(physicalScore, emotionalParams, gender, skinTone) {
  const g = gender === 'female' ? 'female' : 'male';

  const { lowerTier, upperTier, t } = getTierInterpolation(physicalScore);
  const lowerPreset = getPreset(lowerTier, g);
  const upperPreset = getPreset(upperTier, g);
  const blended = interpolatePresets(lowerPreset, upperPreset, t);

  const raw = {
    gender: g,
    ...blended,
    // Spread the full emotional/expression param set (postureLean, energyGlow,
    // facialTension, vibrancy plus the social/purpose/expression channels).
    // normalizeParams keeps only whitelisted keys, filling neutral defaults for
    // any the fallback path omits.
    ...emotionalParams,
    skinTone: skinTone || null
  };

  const constrained = enforceBodyConstraints(raw);
  return normalizeParams(constrained);
}

// Display-only amplification of the visible Current→Future difference.
// A modest, bounded multiplier is applied ONLY to the perceptual channels the
// spec calls out (posture, shoulder alignment, facial brightness, facial
// tension, energy glow, stance openness). The result is re-run through the body
// constraint + normalize pipeline so nothing can escape its valid range and the
// figure never becomes exaggerated.
const AMPLIFY_MULTIPLIER = 1.3;
const AMPLIFY_FIELDS = [
  'postureLean',    // posture
  'shoulderWidth',  // shoulder alignment
  'vibrancy',       // facial brightness
  'facialTension',  // facial tension
  'energyGlow',     // energy glow
  'chestSize'       // stance openness
];

function amplifyVisibleDelta(currentParams, futureParams) {
  if (!currentParams || !futureParams) return futureParams;
  const result = { ...futureParams };
  for (const key of AMPLIFY_FIELDS) {
    const cur = currentParams[key];
    const fut = futureParams[key];
    if (cur == null || fut == null) continue;
    result[key] = cur + (fut - cur) * AMPLIFY_MULTIPLIER;
  }
  return normalizeParams(enforceBodyConstraints(result));
}

export function mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone, historyData, options = {}) {
  const g = gender === 'female' ? 'female' : 'male';

  const hasCurrentTraits = currentTraits && typeof currentTraits === 'object' &&
    (currentTraits.vitality != null || currentTraits.confidence != null);

  const hasProjectionTraits = projectionTraits && typeof projectionTraits === 'object' &&
    (projectionTraits.vitality != null || projectionTraits.confidence != null);

  let emotionalParams;
  let physicalScore;

  if (hasCurrentTraits) {
    emotionalParams = computeEmotionalVisualParams(currentTraits);
  } else {
    emotionalParams = { vibrancy: 0.5, energyGlow: 0.4, facialTension: 0.3, postureLean: 0 };
  }

  if (fallbackMetrics) {
    const act = fallbackMetrics.activity ?? 3;
    const nut = fallbackMetrics.nutrition ?? 3;
    const slp = fallbackMetrics.sleep ?? 3;
    const consistency = fallbackMetrics.consistency ?? 0.5;

    physicalScore = computePhysicalCompositionScore({ activity: act, nutrition: nut, sleep: slp, consistency });

    if (!hasCurrentTraits) {
      const str = fallbackMetrics.stress ?? 3;
      const rawStressTension = clamp((str - 1) / 4, 0, 1);
      const stressTension = clamp(rawStressTension * rawStressTension * 1.15, 0, 1);
      const actNorm = clamp((act - 1) / 4, 0, 1);
      const nutNorm = clamp((nut - 1) / 4, 0, 1);
      const stressCalm = 1 - rawStressTension;
      const postureBase = (actNorm * 0.35 + nutNorm * 0.35 + stressCalm * 0.30);
      emotionalParams = {
        vibrancy: clamp(physicalScore / 100, 0, 1),
        energyGlow: actNorm * 0.7 + clamp((slp - 1) / 4, 0, 1) * 0.3,
        facialTension: stressTension,
        postureLean: clamp(postureBase * 2 - 1, -1, 1)
      };
    }
  } else {
    physicalScore = 50;
  }

  if (hasProjectionTraits) {
    const confidence = computeProjectionConfidence(historyData);

    const projEmotional = computeEmotionalVisualParams(projectionTraits);
    const t = PROJECTION_BLEND;

    const projPhysical = fallbackMetrics
      ? computePhysicalCompositionScore({
          activity: (fallbackMetrics.activity ?? 3) * (1 + (extractTraitScore(projectionTraits.vitality) - 50) * 0.005),
          nutrition: (fallbackMetrics.nutrition ?? 3) * (1 + (extractTraitScore(projectionTraits.discipline) - 50) * 0.003),
          sleep: fallbackMetrics.sleep ?? 3,
          consistency: (fallbackMetrics.consistency ?? 0.5) * (1 + (extractTraitScore(projectionTraits.discipline) - 50) * 0.004)
        })
      : physicalScore;

    const blendedPhysical = physicalScore + (projPhysical - physicalScore) * t;
    // Blend every emotional/expression channel (not just the original four) so
    // the projected face/posture reflects social + purpose shifts too.
    const blendedEmotional = {};
    for (const key of Object.keys(emotionalParams)) {
      const curVal = emotionalParams[key] ?? 0.5;
      const projVal = projEmotional[key] ?? curVal;
      const min = key === 'postureLean' ? -1 : 0;
      blendedEmotional[key] = clamp(curVal + (projVal - curVal) * t, min, 1);
    }

    const currentParams = buildBodyParams(physicalScore, emotionalParams, g, skinTone);
    const projectedParams = buildBodyParams(blendedPhysical, blendedEmotional, g, skinTone);

    const physicalDelta = blendedPhysical - physicalScore;
    const emotionalDelta = (extractTraitScore(projectionTraits.emotionalStability) - extractTraitScore(currentTraits?.emotionalStability ?? 50));

    let scaledParams = applyConfidenceScaling(currentParams, projectedParams, confidence);
    scaledParams = applyDeltaVisibilityFloor(currentParams, scaledParams, physicalDelta, emotionalDelta, confidence);

    // Display-only contrast amplification — used exclusively by the side-by-side
    // Current Me vs Future Me comparison. Does not touch trait scores, projection
    // math, or stored data; it only pushes the already-computed render params a
    // little further from Current Me so the difference reads more clearly.
    if (options.amplifyContrast) {
      scaledParams = amplifyVisibleDelta(currentParams, scaledParams);
    }

    return scaledParams;
  }

  return buildBodyParams(physicalScore, emotionalParams, g, skinTone);
}

export function mapFromAvatarEffects(avatarEffects, avatarTraits, gender, skinTone, iteResult = null) {
  const fallbackMetrics = {
    activity: avatarEffects?.activityScore ?? 3,
    nutrition: avatarEffects?.nutritionScore ?? 3,
    sleep: avatarEffects?.sleepScore ?? 3,
    stress: avatarEffects?.stressScore ?? 3,
    consistency: avatarEffects?.consistencyScore ?? 0.5
  };

  let currentTraits = null;
  if (avatarTraits?.glowEnergy && avatarTraits?.posture && avatarTraits?.facialExpression) {
    const faceScore = avatarTraits.facialExpression.score ?? 50;
    currentTraits = {
      vitality: avatarTraits.glowEnergy.score,
      emotionalStability: clamp(faceScore, 10, 95),
      confidence: avatarTraits.posture.score,
      discipline: avatarTraits.posture.score * 0.8 + (avatarTraits.auraPresence?.score || 50) * 0.2,
      resilience: (avatarTraits.glowEnergy.score + avatarTraits.posture.score) / 2
    };
    // Enrich with social + purpose current scores when the ITE is available so
    // warmth / openness / centeredness channels have real data to read. Purely
    // additive display input — no scores are altered.
    if (iteResult?.traits) {
      currentTraits.socialConnectedness = iteResult.traits.socialConnectedness?.currentScore ?? 50;
      currentTraits.purposeAlignment = iteResult.traits.purposeAlignment?.currentScore ?? 50;
    }
  }

  return mapTraitsToAvatarParams(currentTraits, null, fallbackMetrics, gender, skinTone, null);
}

export function mapFromAvatarEffectsProjected(avatarEffects, avatarTraits, iteResult, gender, skinTone, historyData, options = {}) {
  const fallbackMetrics = {
    activity: avatarEffects?.activityScore ?? 3,
    nutrition: avatarEffects?.nutritionScore ?? 3,
    sleep: avatarEffects?.sleepScore ?? 3,
    stress: avatarEffects?.stressScore ?? 3,
    consistency: avatarEffects?.consistencyScore ?? 0.5
  };

  let currentTraits = null;
  if (avatarTraits?.glowEnergy && avatarTraits?.posture && avatarTraits?.facialExpression) {
    const faceScore = avatarTraits.facialExpression.score ?? 50;
    currentTraits = {
      vitality: avatarTraits.glowEnergy.score,
      emotionalStability: clamp(faceScore, 10, 95),
      confidence: avatarTraits.posture.score,
      discipline: avatarTraits.posture.score * 0.8 + (avatarTraits.auraPresence?.score || 50) * 0.2,
      resilience: (avatarTraits.glowEnergy.score + avatarTraits.posture.score) / 2
    };
    if (iteResult?.traits) {
      currentTraits.socialConnectedness = iteResult.traits.socialConnectedness?.currentScore ?? 50;
      currentTraits.purposeAlignment = iteResult.traits.purposeAlignment?.currentScore ?? 50;
    }
  }

  let projectionTraits = null;
  if (iteResult?.traits) {
    const projData = iteResult.projection12Month || iteResult.projection5Year || {};
    const traits = iteResult.traits;

    projectionTraits = {
      vitality: projData.vitality ?? (traits.vitality?.currentScore ?? 50),
      emotionalStability: projData.emotionalStability ?? (traits.emotionalStability?.currentScore ?? 50),
      confidence: projData.confidence ?? (traits.confidence?.currentScore ?? 50),
      discipline: projData.discipline ?? (traits.discipline?.currentScore ?? 50),
      resilience: projData.resilience ?? (traits.resilience?.currentScore ?? 50),
      socialConnectedness: projData.socialConnectedness ?? (traits.socialConnectedness?.currentScore ?? 50),
      purposeAlignment: projData.purposeAlignment ?? (traits.purposeAlignment?.currentScore ?? 50)
    };
  }

  return mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone, historyData, options);
}

export function computePhotoOverlayState(iteResult, isFuture, rawMetrics, postureLean) {
  const pl = postureLean ?? 0;
  const framingScale = 1 + clamp(pl * 0.015, -0.015, 0.015);
  const framingTranslateY = clamp(pl * -1.5, -1.5, 1.5);
  const framingRotate = clamp(pl * -0.4, -0.4, 0.4);

  const baseOverlay = {
    saturation: 1,
    brightness: 1,
    contrast: 1,
    warmth: 0,
    vignetteIntensity: 0,
    skinGlow: 0,
    underEyeIntensity: 0,
    framingScale,
    framingTranslateY,
    framingRotate
  };

  if (!iteResult?.traits) {
    if (!rawMetrics) return baseOverlay;

    const act = clamp((rawMetrics.activity ?? 3) - 1, 0, 4) / 4;
    const slp = clamp((rawMetrics.sleep ?? 3) - 1, 0, 4) / 4;
    const str = clamp((rawMetrics.stress ?? 3) - 1, 0, 4) / 4;
    const nut = clamp((rawMetrics.nutrition ?? 3) - 1, 0, 4) / 4;
    const energy = (act * 0.5 + nut * 0.3 + slp * 0.2);

    return {
      ...baseOverlay,
      saturation: clamp(0.88 + energy * 0.24, 0.82, 1.12),
      brightness: clamp(0.94 + energy * 0.12, 0.9, 1.06),
      contrast: clamp(1 + (slp - 0.5) * 0.04, 0.96, 1.04),
      warmth: clamp((energy - 0.5) * 0.12, -0.06, 0.06),
      vignetteIntensity: clamp(str * 0.16, 0, 0.14),
      skinGlow: clamp((energy - 0.3) * 0.2, 0, 0.12),
      underEyeIntensity: clamp((1 - slp) * 0.12, 0, 0.1)
    };
  }

  const traits = iteResult.traits;
  const vit = traits.vitality?.currentScore ?? 50;
  const emo = traits.emotionalStability?.currentScore ?? 50;
  const res = traits.resilience?.currentScore ?? 50;

  if (!isFuture) {
    const satBase = 0.88 + (vit / 100) * 0.24;
    const brightnessBase = 0.94 + (vit / 100) * 0.12;
    return {
      ...baseOverlay,
      saturation: clamp(satBase, 0.82, 1.12),
      brightness: clamp(brightnessBase, 0.9, 1.06),
      contrast: clamp(1 + (res - 50) / 2500, 0.96, 1.04),
      warmth: clamp((vit - 50) * 0.002, -0.06, 0.06),
      vignetteIntensity: clamp((100 - emo) / 160, 0, 0.16),
      skinGlow: clamp((vit - 30) / 60, 0, 0.18),
      underEyeIntensity: clamp((100 - res) / 200, 0, 0.12)
    };
  }

  const proj = iteResult.projection12Month || {};
  const futVit = proj.vitality ?? vit;
  const futEmo = proj.emotionalStability ?? emo;
  const futRes = proj.resilience ?? res;

  const vitDelta = futVit - vit;
  const emoDelta = futEmo - emo;
  const resDelta = futRes - res;

  const satShift = clamp(vitDelta * 0.004, -0.14, 0.14);
  const brightnessShift = clamp(vitDelta * 0.003, -0.10, 0.10);
  const contrastShift = clamp(resDelta * 0.0015, -0.06, 0.06);
  const warmthShift = clamp(vitDelta * 0.006, -0.18, 0.18);

  const baseSat = 0.88 + (futVit / 100) * 0.24;
  const baseBright = 0.94 + (futVit / 100) * 0.12;

  const result = {
    ...baseOverlay,
    saturation: clamp(baseSat + satShift, 0.75, 1.22),
    brightness: clamp(baseBright + brightnessShift, 0.85, 1.14),
    contrast: clamp(1 + contrastShift, 0.92, 1.08),
    warmth: warmthShift,
    vignetteIntensity: clamp((100 - futEmo) / 160 - Math.max(0, emoDelta * 0.003), 0, 0.20),
    skinGlow: clamp((futVit - 30) / 60 + Math.max(0, vitDelta * 0.004), 0, 0.28),
    underEyeIntensity: clamp((100 - futRes) / 200 - Math.max(0, resDelta * 0.003), 0, 0.16)
  };

  const hasMeaningfulDelta = Math.abs(vitDelta) > 5 || Math.abs(emoDelta) > 5 || Math.abs(resDelta) > 5;
  if (hasMeaningfulDelta) {
    const satDiff = Math.abs(result.saturation - 1);
    if (satDiff < 0.03) result.saturation = vitDelta >= 0 ? 1.03 : 0.97;
    const brightDiff = Math.abs(result.brightness - 1);
    if (brightDiff < 0.02) result.brightness = vitDelta >= 0 ? 1.02 : 0.98;
  }

  return result;
}

export function diagnosticAvatarProfile(metrics, gender, label) {
  const act = metrics.activity ?? 3;
  const nut = metrics.nutrition ?? 3;
  const slp = metrics.sleep ?? 3;
  const str = metrics.stress ?? 3;
  const consistency = metrics.consistency ?? 0.5;

  const physicalScore = computePhysicalCompositionScore({ activity: act, nutrition: nut, sleep: slp, consistency });

  const rawStressTension = clamp((str - 1) / 4, 0, 1);
  const facialTension = clamp(rawStressTension * rawStressTension * 1.15, 0, 1);
  const vibrancy = clamp(physicalScore / 100, 0, 1);
  const actNorm = clamp((act - 1) / 4, 0, 1);
  const nutNorm = clamp((nut - 1) / 4, 0, 1);
  const stressCalm = 1 - rawStressTension;
  const energyGlow = actNorm * 0.7 + clamp((slp - 1) / 4, 0, 1) * 0.3;
  const postureBase = (actNorm * 0.35 + nutNorm * 0.35 + stressCalm * 0.30);
  const postureLean = clamp(postureBase * 2 - 1, -1, 1);

  const params = buildBodyParams(physicalScore, { vibrancy, energyGlow, facialTension, postureLean }, gender, null);

  const { lowerTier, upperTier, t } = getTierInterpolation(physicalScore);
  const confidence = computeProjectionConfidence(null);

  return {
    label,
    gender,
    physicalScore: Math.round(physicalScore * 10) / 10,
    tier: `${lowerTier} → ${upperTier} (t=${t.toFixed(3)})`,
    bodyParams: {
      waistTaper: round4(params.waistTaper),
      shoulderWidth: round4(params.shoulderWidth),
      armThickness: round4(params.armThickness),
      legThickness: round4(params.legThickness),
      chestSize: round4(params.chestSize),
      hipWidth: round4(params.hipWidth)
    },
    emotionalParams: {
      facialTension: round4(facialTension),
      postureLean: round4(postureLean),
      vibrancy: round4(vibrancy),
      energyGlow: round4(energyGlow)
    },
    projectionConfidence: confidence.tier
  };
}

function round4(v) { return Math.round(v * 10000) / 10000; }


