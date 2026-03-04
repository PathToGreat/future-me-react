const PRESETS = {
  Overweight: {
    shoulderWidth: 0.48,
    chestSize: 0.65,
    waistTaper: 0.10,
    hipWidth: 0.68,
    armThickness: 0.62,
    legThickness: 0.64,
    neckThickness: 0.42,
    headScale: 0.55
  },
  Soft: {
    shoulderWidth: 0.46,
    chestSize: 0.55,
    waistTaper: 0.25,
    hipWidth: 0.58,
    armThickness: 0.52,
    legThickness: 0.54,
    neckThickness: 0.40,
    headScale: 0.53
  },
  AverageFit: {
    shoulderWidth: 0.55,
    chestSize: 0.48,
    waistTaper: 0.48,
    hipWidth: 0.47,
    armThickness: 0.42,
    legThickness: 0.46,
    neckThickness: 0.42,
    headScale: 0.50
  },
  LeanAthletic: {
    shoulderWidth: 0.66,
    chestSize: 0.44,
    waistTaper: 0.72,
    hipWidth: 0.38,
    armThickness: 0.34,
    legThickness: 0.38,
    neckThickness: 0.38,
    headScale: 0.48
  },
  MuscularAthletic: {
    shoulderWidth: 0.85,
    chestSize: 0.78,
    waistTaper: 0.74,
    hipWidth: 0.52,
    armThickness: 0.72,
    legThickness: 0.62,
    neckThickness: 0.58,
    headScale: 0.52
  }
};

const TIER_ORDER = ['Overweight', 'Soft', 'AverageFit', 'LeanAthletic', 'MuscularAthletic'];

const TIER_BOUNDARIES = [
  { tier: 'Overweight',       min: 0,   max: 30  },
  { tier: 'Soft',             min: 30,  max: 50  },
  { tier: 'AverageFit',       min: 50,  max: 70  },
  { tier: 'LeanAthletic',     min: 70,  max: 85  },
  { tier: 'MuscularAthletic', min: 85,  max: 100 }
];

const FEMALE_ADJUSTMENTS = {
  Overweight: {
    shoulderWidth: -0.04,
    hipWidth: 0.06,
    waistTaper: 0.02,
    armThickness: -0.03,
    neckThickness: -0.04,
    chestSize: 0.02
  },
  Soft: {
    shoulderWidth: -0.05,
    hipWidth: 0.07,
    waistTaper: 0.04,
    armThickness: -0.04,
    neckThickness: -0.05,
    chestSize: 0.0
  },
  AverageFit: {
    shoulderWidth: -0.06,
    hipWidth: 0.07,
    waistTaper: 0.05,
    armThickness: -0.05,
    neckThickness: -0.05,
    chestSize: -0.02
  },
  LeanAthletic: {
    shoulderWidth: -0.05,
    hipWidth: 0.06,
    waistTaper: 0.04,
    armThickness: -0.04,
    neckThickness: -0.04,
    chestSize: -0.03
  },
  MuscularAthletic: {
    shoulderWidth: -0.03,
    hipWidth: 0.05,
    waistTaper: 0.03,
    armThickness: -0.02,
    neckThickness: -0.03,
    chestSize: -0.02
  }
};

export function getPreset(name, gender) {
  const base = PRESETS[name] || PRESETS.AverageFit;
  if (gender !== 'female') return { ...base };
  const adjustments = FEMALE_ADJUSTMENTS[name] || FEMALE_ADJUSTMENTS.AverageFit;
  const adjusted = { ...base };
  for (const [key, delta] of Object.entries(adjustments)) {
    adjusted[key] = Math.max(0, Math.min(1, (adjusted[key] || 0.5) + delta));
  }
  return adjusted;
}

export function getTierInterpolation(physicalScore) {
  const score = Math.max(0, Math.min(100, physicalScore));

  for (let i = 0; i < TIER_BOUNDARIES.length; i++) {
    const band = TIER_BOUNDARIES[i];
    if (score >= band.min && score < band.max) {
      const t = (score - band.min) / (band.max - band.min);
      const nextIdx = Math.min(i + 1, TIER_BOUNDARIES.length - 1);
      return {
        lowerTier: band.tier,
        upperTier: TIER_BOUNDARIES[nextIdx].tier,
        t: i === nextIdx ? 0 : t
      };
    }
  }

  return { lowerTier: 'MuscularAthletic', upperTier: 'MuscularAthletic', t: 0 };
}

export function selectPresetFromScore(score) {
  if (score >= 85) return 'MuscularAthletic';
  if (score >= 70) return 'LeanAthletic';
  if (score >= 50) return 'AverageFit';
  if (score >= 30) return 'Soft';
  return 'Overweight';
}

export function interpolatePresets(presetA, presetB, t) {
  const result = {};
  const keys = Object.keys(presetA);
  for (const key of keys) {
    const a = presetA[key] ?? 0.5;
    const b = presetB[key] ?? 0.5;
    result[key] = a + (b - a) * t;
  }
  return result;
}

export { PRESETS, TIER_ORDER, TIER_BOUNDARIES };
