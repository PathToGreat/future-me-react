import { getPreset, selectPresetFromScore, interpolatePresets } from './avatarPresets';
import { normalizeParams } from './avatarParams';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const PROJECTION_BLEND = 0.35;

function scoreFromMetrics(activity, nutrition, sleep, stress) {
  const actNorm = clamp((activity - 1) / 4, 0, 1);
  const nutNorm = clamp((nutrition - 1) / 4, 0, 1);
  const sleepNorm = clamp((sleep - 1) / 4, 0, 1);
  const stressNorm = clamp(1 - (stress - 1) / 4, 0, 1);
  return (actNorm * 0.3 + nutNorm * 0.2 + sleepNorm * 0.25 + stressNorm * 0.25) * 100;
}

function extractTraitScore(trait) {
  if (trait == null) return 50;
  if (typeof trait === 'number') return trait;
  return trait.currentScore ?? trait.score ?? 50;
}

function computeVisualParams(traits) {
  const vit = extractTraitScore(traits.vitality);
  const emo = extractTraitScore(traits.emotionalStability);
  const conf = extractTraitScore(traits.confidence);
  const disc = extractTraitScore(traits.discipline);
  const res = extractTraitScore(traits.resilience);

  return {
    vibrancy: clamp(vit / 100, 0, 1),
    energyGlow: clamp((vit * 0.6 + res * 0.4) / 100, 0, 1),
    facialTension: clamp(1 - emo / 100, 0, 1),
    postureLean: clamp(((conf + disc) / 2 - 50) / 50, -1, 1),
    compositeScore: (vit + emo + conf + disc + res) / 5
  };
}

function buildBodyParams(compositeScore, visualParams, gender, skinTone) {
  const g = gender === 'female' ? 'female' : 'male';
  const presetName = selectPresetFromScore(compositeScore);
  const preset = getPreset(presetName, g);

  const neighborScore = compositeScore >= 80 ? 65 : compositeScore >= 65 ? 80
    : compositeScore >= 45 ? 65 : compositeScore >= 30 ? 45 : 30;
  const neighborPresetName = selectPresetFromScore(neighborScore);
  const neighborPreset = getPreset(neighborPresetName, g);

  const scoreInRange = getInterpolationT(compositeScore);
  const blended = interpolatePresets(preset, neighborPreset, scoreInRange);

  return normalizeParams({
    gender: g,
    ...blended,
    postureLean: visualParams.postureLean,
    energyGlow: visualParams.energyGlow,
    facialTension: visualParams.facialTension,
    vibrancy: visualParams.vibrancy,
    skinTone: skinTone || null
  });
}

export function mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone) {
  const g = gender === 'female' ? 'female' : 'male';

  const hasCurrentTraits = currentTraits && typeof currentTraits === 'object' &&
    (currentTraits.vitality != null || currentTraits.confidence != null);

  const hasProjectionTraits = projectionTraits && typeof projectionTraits === 'object' &&
    (projectionTraits.vitality != null || projectionTraits.confidence != null);

  let currentVisual;
  let compositeScore;

  if (hasCurrentTraits) {
    currentVisual = computeVisualParams(currentTraits);
    compositeScore = currentVisual.compositeScore;
  } else if (fallbackMetrics) {
    const act = fallbackMetrics.activity ?? 3;
    const nut = fallbackMetrics.nutrition ?? 3;
    const slp = fallbackMetrics.sleep ?? 3;
    const str = fallbackMetrics.stress ?? 3;

    compositeScore = scoreFromMetrics(act, nut, slp, str);
    currentVisual = {
      vibrancy: clamp(compositeScore / 100, 0, 1),
      energyGlow: clamp((act - 1) / 4, 0, 1) * 0.7 + clamp((slp - 1) / 4, 0, 1) * 0.3,
      facialTension: clamp((str - 1) / 4, 0, 1),
      postureLean: clamp(((clamp((act - 1) / 4, 0, 1) + clamp((nut - 1) / 4, 0, 1)) / 2) * 2 - 1, -1, 1),
      compositeScore
    };
  } else {
    currentVisual = { vibrancy: 0.5, energyGlow: 0.4, facialTension: 0.3, postureLean: 0, compositeScore: 50 };
    compositeScore = 50;
  }

  if (hasProjectionTraits) {
    const projVisual = computeVisualParams(projectionTraits);
    const t = PROJECTION_BLEND;

    const blendedVisual = {
      vibrancy: clamp(currentVisual.vibrancy + (projVisual.vibrancy - currentVisual.vibrancy) * t, 0, 1),
      energyGlow: clamp(currentVisual.energyGlow + (projVisual.energyGlow - currentVisual.energyGlow) * t, 0, 1),
      facialTension: clamp(currentVisual.facialTension + (projVisual.facialTension - currentVisual.facialTension) * t, 0, 1),
      postureLean: clamp(currentVisual.postureLean + (projVisual.postureLean - currentVisual.postureLean) * t, -1, 1),
      compositeScore: compositeScore + (projVisual.compositeScore - compositeScore) * t
    };

    return buildBodyParams(blendedVisual.compositeScore, blendedVisual, g, skinTone);
  }

  return buildBodyParams(compositeScore, currentVisual, g, skinTone);
}

function getInterpolationT(score) {
  if (score >= 80) return clamp((score - 80) / 20, 0, 0.3);
  if (score >= 65) return clamp((80 - score) / 15, 0, 0.4);
  if (score >= 45) return clamp((65 - score) / 20, 0, 0.4);
  if (score >= 30) return clamp((45 - score) / 15, 0, 0.4);
  return clamp((30 - score) / 30, 0, 0.3);
}

export function mapFromAvatarEffects(avatarEffects, avatarTraits, gender, skinTone) {
  const fallbackMetrics = {
    activity: avatarEffects?.activityScore ?? 3,
    nutrition: avatarEffects?.nutritionScore ?? 3,
    sleep: avatarEffects?.sleepScore ?? 3,
    stress: avatarEffects?.stressScore ?? 3
  };

  let currentTraits = null;
  if (avatarTraits?.glowEnergy && avatarTraits?.posture && avatarTraits?.facialExpression) {
    currentTraits = {
      vitality: avatarTraits.glowEnergy.score,
      emotionalStability: 100 - (avatarTraits.facialExpression.score < 40 ? 30 : avatarTraits.facialExpression.score < 60 ? 50 : 70),
      confidence: avatarTraits.posture.score,
      discipline: avatarTraits.posture.score * 0.8 + (avatarTraits.auraPresence?.score || 50) * 0.2,
      resilience: (avatarTraits.glowEnergy.score + avatarTraits.posture.score) / 2
    };
  }

  return mapTraitsToAvatarParams(currentTraits, null, fallbackMetrics, gender, skinTone);
}

export function mapFromAvatarEffectsProjected(avatarEffects, avatarTraits, iteResult, gender, skinTone) {
  const fallbackMetrics = {
    activity: avatarEffects?.activityScore ?? 3,
    nutrition: avatarEffects?.nutritionScore ?? 3,
    sleep: avatarEffects?.sleepScore ?? 3,
    stress: avatarEffects?.stressScore ?? 3
  };

  let currentTraits = null;
  if (avatarTraits?.glowEnergy && avatarTraits?.posture && avatarTraits?.facialExpression) {
    currentTraits = {
      vitality: avatarTraits.glowEnergy.score,
      emotionalStability: 100 - (avatarTraits.facialExpression.score < 40 ? 30 : avatarTraits.facialExpression.score < 60 ? 50 : 70),
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

  return mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender, skinTone);
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
