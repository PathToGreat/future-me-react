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

function computePhysicalCompositionScore(metrics) {
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

  const rawTension = 1 - emo / 100;
  const facialTension = clamp(rawTension * rawTension, 0, 1);

  return {
    vibrancy: clamp(vit / 100, 0, 1),
    energyGlow: clamp((vit * 0.6 + res * 0.4) / 100, 0, 1),
    facialTension,
    postureLean: clamp(((conf + disc) / 2 - 50) / 50, -1, 1)
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
    postureLean: emotionalParams.postureLean,
    energyGlow: emotionalParams.energyGlow,
    facialTension: emotionalParams.facialTension,
    vibrancy: emotionalParams.vibrancy,
    skinTone: skinTone || null
  };

  const constrained = enforceBodyConstraints(raw);
  return normalizeParams(constrained);
}

export function mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone, historyData) {
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
      const stressTension = rawStressTension * rawStressTension;
      emotionalParams = {
        vibrancy: clamp(physicalScore / 100, 0, 1),
        energyGlow: clamp((act - 1) / 4, 0, 1) * 0.7 + clamp((slp - 1) / 4, 0, 1) * 0.3,
        facialTension: stressTension,
        postureLean: clamp(((clamp((act - 1) / 4, 0, 1) + clamp((nut - 1) / 4, 0, 1)) / 2) * 2 - 1, -1, 1)
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
    const blendedEmotional = {
      vibrancy: clamp(emotionalParams.vibrancy + (projEmotional.vibrancy - emotionalParams.vibrancy) * t, 0, 1),
      energyGlow: clamp(emotionalParams.energyGlow + (projEmotional.energyGlow - emotionalParams.energyGlow) * t, 0, 1),
      facialTension: clamp(emotionalParams.facialTension + (projEmotional.facialTension - emotionalParams.facialTension) * t, 0, 1),
      postureLean: clamp(emotionalParams.postureLean + (projEmotional.postureLean - emotionalParams.postureLean) * t, -1, 1)
    };

    const currentParams = buildBodyParams(physicalScore, emotionalParams, g, skinTone);
    const projectedParams = buildBodyParams(blendedPhysical, blendedEmotional, g, skinTone);

    const physicalDelta = blendedPhysical - physicalScore;
    const emotionalDelta = (extractTraitScore(projectionTraits.emotionalStability) - extractTraitScore(currentTraits?.emotionalStability ?? 50));

    let scaledParams = applyConfidenceScaling(currentParams, projectedParams, confidence);
    scaledParams = applyDeltaVisibilityFloor(currentParams, scaledParams, physicalDelta, emotionalDelta, confidence);

    return scaledParams;
  }

  return buildBodyParams(physicalScore, emotionalParams, g, skinTone);
}

export function mapFromAvatarEffects(avatarEffects, avatarTraits, gender, skinTone) {
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
  }

  return mapTraitsToAvatarParams(currentTraits, null, fallbackMetrics, gender, skinTone, null);
}

export function mapFromAvatarEffectsProjected(avatarEffects, avatarTraits, iteResult, gender, skinTone, historyData) {
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
      resilience: projData.resilience ?? (traits.resilience?.currentScore ?? 50)
    };
  }

  return mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone, historyData);
}

export function computePhotoOverlayState(iteResult, isFuture) {
  if (!iteResult?.traits) {
    return {
      saturation: 1,
      brightness: 1,
      contrast: 1,
      warmth: 0,
      vignetteIntensity: 0,
      skinGlow: 0,
      underEyeIntensity: 0
    };
  }

  const traits = iteResult.traits;
  const vit = traits.vitality?.currentScore ?? 50;
  const emo = traits.emotionalStability?.currentScore ?? 50;
  const res = traits.resilience?.currentScore ?? 50;

  if (!isFuture) {
    const satBase = 0.9 + (vit / 100) * 0.2;
    const brightnessBase = 0.95 + (vit / 100) * 0.1;
    return {
      saturation: clamp(satBase, 0.8, 1.1),
      brightness: clamp(brightnessBase, 0.9, 1.05),
      contrast: 1,
      warmth: 0,
      vignetteIntensity: clamp((100 - emo) / 200, 0, 0.12),
      skinGlow: clamp((vit - 40) / 80, 0, 0.15),
      underEyeIntensity: clamp((100 - res) / 250, 0, 0.1)
    };
  }

  const proj = iteResult.projection12Month || {};
  const futVit = proj.vitality ?? vit;
  const futEmo = proj.emotionalStability ?? emo;
  const futRes = proj.resilience ?? res;

  const vitDelta = futVit - vit;
  const emoDelta = futEmo - emo;
  const resDelta = futRes - res;

  const satShift = clamp(vitDelta * 0.003, -0.12, 0.12);
  const brightnessShift = clamp(vitDelta * 0.002, -0.08, 0.08);
  const contrastShift = clamp(resDelta * 0.001, -0.05, 0.05);
  const warmthShift = clamp(vitDelta * 0.005, -0.15, 0.15);

  const baseSat = 0.9 + (futVit / 100) * 0.2;
  const baseBright = 0.95 + (futVit / 100) * 0.1;

  return {
    saturation: clamp(baseSat + satShift, 0.75, 1.2),
    brightness: clamp(baseBright + brightnessShift, 0.85, 1.12),
    contrast: clamp(1 + contrastShift, 0.92, 1.08),
    warmth: warmthShift,
    vignetteIntensity: clamp((100 - futEmo) / 200 - Math.max(0, emoDelta * 0.002), 0, 0.18),
    skinGlow: clamp((futVit - 40) / 80 + Math.max(0, vitDelta * 0.003), 0, 0.25),
    underEyeIntensity: clamp((100 - futRes) / 250 - Math.max(0, resDelta * 0.002), 0, 0.15)
  };
}

export { computePhysicalCompositionScore };
