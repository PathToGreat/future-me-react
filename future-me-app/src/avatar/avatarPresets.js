const PRESETS = {
  LeanAthletic: {
    shoulderWidth: 0.62,
    chestSize: 0.48,
    waistTaper: 0.7,
    hipWidth: 0.4,
    armThickness: 0.38,
    legThickness: 0.42,
    neckThickness: 0.4,
    headScale: 0.48
  },
  MuscularAthletic: {
    shoulderWidth: 0.82,
    chestSize: 0.75,
    waistTaper: 0.72,
    hipWidth: 0.48,
    armThickness: 0.7,
    legThickness: 0.65,
    neckThickness: 0.6,
    headScale: 0.52
  },
  AverageFit: {
    shoulderWidth: 0.55,
    chestSize: 0.5,
    waistTaper: 0.5,
    hipWidth: 0.48,
    armThickness: 0.45,
    legThickness: 0.48,
    neckThickness: 0.45,
    headScale: 0.5
  },
  Soft: {
    shoulderWidth: 0.5,
    chestSize: 0.52,
    waistTaper: 0.32,
    hipWidth: 0.55,
    armThickness: 0.5,
    legThickness: 0.52,
    neckThickness: 0.5,
    headScale: 0.52
  },
  Overweight: {
    shoulderWidth: 0.52,
    chestSize: 0.6,
    waistTaper: 0.15,
    hipWidth: 0.62,
    armThickness: 0.6,
    legThickness: 0.6,
    neckThickness: 0.58,
    headScale: 0.54
  }
};

const FEMALE_ADJUSTMENTS = {
  shoulderWidth: -0.08,
  hipWidth: 0.08,
  waistTaper: 0.05,
  armThickness: -0.06,
  neckThickness: -0.06,
  chestSize: -0.04
};

export function getPreset(name, gender) {
  const base = PRESETS[name] || PRESETS.AverageFit;
  if (gender !== 'female') return { ...base };
  const adjusted = { ...base };
  for (const [key, delta] of Object.entries(FEMALE_ADJUSTMENTS)) {
    adjusted[key] = Math.max(0, Math.min(1, (adjusted[key] || 0.5) + delta));
  }
  return adjusted;
}

export function selectPresetFromScore(score) {
  if (score >= 80) return 'MuscularAthletic';
  if (score >= 65) return 'LeanAthletic';
  if (score >= 45) return 'AverageFit';
  if (score >= 30) return 'Soft';
  return 'Overweight';
}

export function interpolatePresets(presetA, presetB, t) {
  const result = {};
  const keysA = Object.keys(presetA);
  for (const key of keysA) {
    const a = presetA[key] ?? 0.5;
    const b = presetB[key] ?? 0.5;
    result[key] = a + (b - a) * t;
  }
  return result;
}

export { PRESETS };
