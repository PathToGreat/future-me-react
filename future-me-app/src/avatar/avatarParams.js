const AVATAR_PARAM_DEFAULTS = {
  gender: 'male',
  shoulderWidth: 0.5,
  chestSize: 0.5,
  waistTaper: 0.5,
  hipWidth: 0.5,
  armThickness: 0.5,
  legThickness: 0.5,
  neckThickness: 0.5,
  postureLean: 0,
  headScale: 0.5,
  energyGlow: 0.5,
  facialTension: 0.3,
  vibrancy: 0.5
};

const PARAM_RANGES = {
  shoulderWidth: { min: 0, max: 1 },
  chestSize: { min: 0, max: 1 },
  waistTaper: { min: 0, max: 1 },
  hipWidth: { min: 0, max: 1 },
  armThickness: { min: 0, max: 1 },
  legThickness: { min: 0, max: 1 },
  neckThickness: { min: 0, max: 1 },
  postureLean: { min: -1, max: 1 },
  headScale: { min: 0, max: 1 },
  energyGlow: { min: 0, max: 1 },
  facialTension: { min: 0, max: 1 },
  vibrancy: { min: 0, max: 1 }
};

function clampParam(value, paramName) {
  const range = PARAM_RANGES[paramName];
  if (!range) return value;
  return Math.max(range.min, Math.min(range.max, value));
}

export function normalizeParams(rawParams) {
  const result = { ...AVATAR_PARAM_DEFAULTS };
  for (const key of Object.keys(rawParams)) {
    if (key === 'gender') {
      result.gender = rawParams.gender === 'female' ? 'female' : 'male';
    } else if (PARAM_RANGES[key]) {
      result[key] = clampParam(rawParams[key], key);
    }
  }
  return result;
}

export { AVATAR_PARAM_DEFAULTS, PARAM_RANGES };
