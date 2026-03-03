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
  vibrancy: 0.5,
  skinTone: null
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

const SKIN_TONE_PALETTE = [
  { id: 'fair', label: 'Fair', base: '#f5dcc3', shadow: '#e8c8a8' },
  { id: 'light', label: 'Light', base: '#e8c4a0', shadow: '#d4aa80' },
  { id: 'medium', label: 'Medium', base: '#c99e6c', shadow: '#b48a58' },
  { id: 'tan', label: 'Tan', base: '#a8784a', shadow: '#956838' },
  { id: 'brown', label: 'Brown', base: '#8b5e3c', shadow: '#7a4e2e' },
  { id: 'dark', label: 'Dark', base: '#5c3a1e', shadow: '#4a2e14' },
  { id: 'deep', label: 'Deep', base: '#3d2510', shadow: '#2e1a0a' }
];

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
    } else if (key === 'skinTone') {
      result.skinTone = rawParams.skinTone || null;
    } else if (PARAM_RANGES[key]) {
      result[key] = clampParam(rawParams[key], key);
    }
  }
  return result;
}

export function getSkinToneById(id) {
  return SKIN_TONE_PALETTE.find(t => t.id === id) || null;
}

export { AVATAR_PARAM_DEFAULTS, PARAM_RANGES, SKIN_TONE_PALETTE };
