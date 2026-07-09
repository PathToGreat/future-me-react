/**
 * promptBuilder.js
 *
 * Builds Replicate-compatible prompts from ITE trajectory data.
 * Generates a full-body photorealistic image prompt — not a headshot.
 * Identity-preserving intent, trajectory-informed, never exaggerated.
 *
 * Prompt branches by trajectory direction:
 *   strengthening | stable | declining
 * Each branch shapes posture, energy, expression, body language,
 * clothing fit, lighting/mood, and overall tone.
 *
 * Two prompt styles:
 *   - buildPrompt()          → scene description for text-to-image models
 *   - buildEditInstruction() → edit instruction for image-editing models
 *                              (e.g. flux-kontext-pro) that preserve identity
 */

export const PROMPT_VERSION = 'identity_trajectory_full_body_v2';

// ─── Trajectory direction ─────────────────────────────────────────────────────

export function resolveTrajectoryDirection(transformationDirection) {
  const state = transformationDirection?.projectedFutureState;
  if (state === 'improving') return 'strengthening';
  if (state === 'declining') return 'declining';
  return 'stable';
}

export function resolveStrongestTraits(transformationDirection, count = 2) {
  const td = transformationDirection || {};
  const entries = ['vitality', 'emotionalStability', 'discipline', 'resilience', 'confidence']
    .map(id => ({ id, projected: td[id]?.projected ?? 50 }))
    .sort((a, b) => b.projected - a.projected);
  return entries.slice(0, count).map(e => e.id);
}

// ─── Trajectory branch descriptors ───────────────────────────────────────────
// Restrained and believable. No fantasy, no extremes, no medical claims.

const TRAJECTORY_BRANCHES = {
  strengthening: {
    posture:      'upright open posture, shoulders back and relaxed, weight evenly grounded',
    energy:       'steady visible vitality, a light sense of forward momentum',
    expression:   'clear settled gaze, faint natural smile, alert and present',
    bodyLanguage: 'open at-ease body language, arms relaxed at the sides',
    clothingFit:  'simple modern casual clothes that fit well, neat and cared for',
    lighting:     'soft warm directional light with a gentle morning tone',
    tone:         'grounded hopeful realism — a person quietly doing better, not a transformation fantasy',
  },
  stable: {
    posture:      'balanced neutral posture, natural comfortable stance',
    energy:       'calm even energy, neither pushed nor withdrawn',
    expression:   'composed neutral expression, steady unhurried gaze',
    bodyLanguage: 'settled unhurried body language, nothing performed',
    clothingFit:  'ordinary comfortable casual clothes with a natural fit',
    lighting:     'even neutral indoor daylight with soft shadows',
    tone:         'quiet everyday realism — an ordinary honest moment',
  },
  declining: {
    posture:      'slightly rounded shoulders, subtle inward posture, weight settled back on the heels',
    energy:       'lowered subdued energy, stillness without spark',
    expression:   'tired distant gaze, faint tension around the eyes, no smile',
    bodyLanguage: 'closed-in body language, arms held closer to the body',
    clothingFit:  'casual clothes that fit slightly loose and look a little unconsidered',
    lighting:     'flat cooler light, muted tones, slightly dim',
    tone:         'honest muted realism — subdued but dignified, never bleak or theatrical',
  },
};

// ─── Trait → secondary visual modifiers ─────────────────────────────────────

function vitalityDesc(score) {
  if (score >= 72) return 'bright alert eyes and a clear healthy complexion';
  if (score >= 55) return 'a calm alert look and healthy natural appearance';
  if (score >= 40) return 'a settled natural appearance';
  return 'quieter energy and a subdued look';
}

function disciplineDesc(score) {
  if (score >= 72) return 'a lean toned build and purposeful bearing';
  if (score >= 50) return 'a healthy natural build';
  return 'a natural relaxed build';
}

function sleepDesc(score) {
  if (score === null || score === undefined) return null;
  if (score >= 7.5) return 'well-rested, no under-eye fatigue';
  if (score <= 4.5) return 'subtle signs of fatigue around the eyes';
  return null;
}

// ─── Shared guardrail lines ──────────────────────────────────────────────────

const REALISM_LINES = [
  'Natural skin texture, realistic proportions, soft directional lighting with gentle shadows.',
  'Photorealistic, candid documentary quality — not a fashion shoot, not a stock photo, no retouched gloss.',
  'No graphic overlay, no text, no logo.',
];

// ─── Scene-description prompt (text-to-image models) ─────────────────────────

export function buildPrompt({ iteSummary, transformationDirection, rawMetrics, gender }) {
  const td = transformationDirection || {};
  const rm = rawMetrics || {};

  const direction = resolveTrajectoryDirection(td);
  const branch    = TRAJECTORY_BRANCHES[direction];

  const vitality   = td.vitality?.projected   ?? 50;
  const discipline = td.discipline?.projected ?? 50;
  const sleepScore = rm.sleep ?? rm.sleepScore ?? null;
  const genderWord = gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person';
  const sleepLine  = sleepDesc(sleepScore);

  const promptParts = [
    `A photorealistic full-body portrait of an ordinary ${genderWord} standing naturally in a plain everyday indoor setting.`,
    `Posture: ${branch.posture}.`,
    `Energy: ${branch.energy}.`,
    `Expression: ${branch.expression}.`,
    `Body language: ${branch.bodyLanguage}.`,
    `They have ${vitalityDesc(vitality)} and ${disciplineDesc(discipline)}.`,
    sleepLine ? `${sleepLine}.` : null,
    `Clothing: ${branch.clothingFit} in neutral tones.`,
    `Lighting and mood: ${branch.lighting}.`,
    `Overall tone: ${branch.tone}.`,
    'Full body visible from head to feet, shot at eye level, clean softly blurred neutral background.',
    ...REALISM_LINES,
  ].filter(Boolean);

  return {
    prompt:              promptParts.join(' '),
    negativePrompt:      buildNegativePrompt(), // kept for models that support it
    trajectoryDirection: direction,
    strongestTraits:     resolveStrongestTraits(td),
    promptVersion:       PROMPT_VERSION,
  };
}

// ─── Edit-instruction prompt (identity-preserving image-editing models) ──────

export function buildEditInstruction({ transformationDirection, rawMetrics, gender }) {
  const td        = transformationDirection || {};
  const direction = resolveTrajectoryDirection(td);
  const branch    = TRAJECTORY_BRANCHES[direction];
  const sleepLine = sleepDesc((rawMetrics || {}).sleep ?? (rawMetrics || {}).sleepScore ?? null);

  const parts = [
    'Show this same person about one year in the future.',
    'Keep the exact same face, identity, skin tone, hair, and overall build — this must clearly be the same person.',
    `Adjust only: posture (${branch.posture}), energy (${branch.energy}), expression (${branch.expression}), body language (${branch.bodyLanguage}).`,
    `Clothing: ${branch.clothingFit} in neutral tones.`,
    `Lighting and mood: ${branch.lighting}.`,
    sleepLine ? `Subtle detail: ${sleepLine}.` : null,
    'Changes must be restrained and believable — no fantasy, no dramatic body transformation, no extreme muscularity or weight change.',
    'Photorealistic, natural skin texture, no text, no logo.',
  ].filter(Boolean);

  return {
    prompt:              parts.join(' '),
    trajectoryDirection: direction,
    strongestTraits:     resolveStrongestTraits(td),
    promptVersion:       PROMPT_VERSION,
  };
}

// ─── Negative prompt (only used by models that accept one) ───────────────────

function buildNegativePrompt() {
  return [
    'cartoon, illustration, painting, drawing, anime, 3D render, CGI, digital art',
    'extreme muscularity, bodybuilder physique, extreme obesity, fantasy, supernatural, mystical',
    'medical imaging, clinical, X-ray',
    'logo, text, watermark, caption, frame, border',
    'multiple people, crowd, background people',
    'distorted limbs, extra fingers, missing limbs, deformed anatomy',
    'NSFW, explicit, revealing clothing',
    'over-saturated, HDR, fake lighting, studio pose, fashion model, stock photo',
  ].join(', ');
}
