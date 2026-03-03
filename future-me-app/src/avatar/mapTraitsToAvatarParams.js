import { getPreset, selectPresetFromScore, interpolatePresets } from './avatarPresets';
import { normalizeParams } from './avatarParams';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function scoreFromMetrics(activity, nutrition, sleep, stress) {
  const actNorm = clamp((activity - 1) / 4, 0, 1);
  const nutNorm = clamp((nutrition - 1) / 4, 0, 1);
  const sleepNorm = clamp((sleep - 1) / 4, 0, 1);
  const stressNorm = clamp(1 - (stress - 1) / 4, 0, 1);
  return (actNorm * 0.3 + nutNorm * 0.2 + sleepNorm * 0.25 + stressNorm * 0.25) * 100;
}

export function mapTraitsToAvatarParams(currentTraits, projectionTraits, fallbackMetrics, gender) {
  const g = gender === 'female' ? 'female' : 'male';
  let vibrancy = 0.5;
  let energyGlow = 0.4;
  let facialTension = 0.3;
  let postureLean = 0;
  let compositeScore = 50;

  const hasTraits = currentTraits && typeof currentTraits === 'object' &&
    (currentTraits.vitality != null || currentTraits.confidence != null);

  if (hasTraits) {
    const vit = currentTraits.vitality?.currentScore ?? currentTraits.vitality ?? 50;
    const emo = currentTraits.emotionalStability?.currentScore ?? currentTraits.emotionalStability ?? 50;
    const conf = currentTraits.confidence?.currentScore ?? currentTraits.confidence ?? 50;
    const disc = currentTraits.discipline?.currentScore ?? currentTraits.discipline ?? 50;
    const res = currentTraits.resilience?.currentScore ?? currentTraits.resilience ?? 50;

    vibrancy = clamp(vit / 100, 0, 1);
    energyGlow = clamp((vit * 0.6 + res * 0.4) / 100, 0, 1);
    facialTension = clamp(1 - emo / 100, 0, 1);
    postureLean = clamp(((conf + disc) / 2 - 50) / 50, -1, 1);
    compositeScore = (vit + emo + conf + disc + res) / 5;
  } else if (fallbackMetrics) {
    const act = fallbackMetrics.activity ?? 3;
    const nut = fallbackMetrics.nutrition ?? 3;
    const slp = fallbackMetrics.sleep ?? 3;
    const str = fallbackMetrics.stress ?? 3;

    compositeScore = scoreFromMetrics(act, nut, slp, str);
    vibrancy = clamp(compositeScore / 100, 0, 1);
    energyGlow = clamp((act - 1) / 4, 0, 1) * 0.7 + clamp((slp - 1) / 4, 0, 1) * 0.3;
    facialTension = clamp((str - 1) / 4, 0, 1);
    const postureInput = (clamp((act - 1) / 4, 0, 1) + clamp((nut - 1) / 4, 0, 1)) / 2;
    postureLean = clamp(postureInput * 2 - 1, -1, 1);
  }

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
    postureLean,
    energyGlow,
    facialTension,
    vibrancy
  });
}

function getInterpolationT(score) {
  if (score >= 80) return clamp((score - 80) / 20, 0, 0.3);
  if (score >= 65) return clamp((80 - score) / 15, 0, 0.4);
  if (score >= 45) return clamp((65 - score) / 20, 0, 0.4);
  if (score >= 30) return clamp((45 - score) / 15, 0, 0.4);
  return clamp((30 - score) / 30, 0, 0.3);
}

export function mapFromAvatarEffects(avatarEffects, avatarTraits, gender) {
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

  return mapTraitsToAvatarParams(currentTraits, null, fallbackMetrics, gender);
}
