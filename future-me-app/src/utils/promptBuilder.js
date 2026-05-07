/**
 * promptBuilder.js  (client-side copy)
 *
 * Builds a Replicate-compatible text prompt from ITE trajectory data.
 * Ported from server/promptBuilder.js so static deployments can call
 * Replicate directly from the browser without a backend.
 */

function vitalityDesc(score) {
  if (score >= 72) return 'upright energized posture, bright alert eyes, clear healthy complexion, natural radiance';
  if (score >= 55) return 'composed balanced posture, calm alert expression, healthy natural appearance';
  if (score >= 40) return 'relaxed steady posture, settled expression, natural appearance';
  return 'slightly inward posture, quieter energy, subdued expression';
}

function disciplineDesc(score) {
  if (score >= 72) return 'lean toned physique, purposeful deliberate bearing';
  if (score >= 50) return 'healthy natural build, balanced grounded bearing';
  return 'natural relaxed build, casual easy bearing';
}

function emotionalDesc(score) {
  if (score >= 70) return 'calm open expression, relaxed jaw, settled confident demeanor, no tension visible';
  if (score >= 50) return 'neutral composed expression, quiet inner steadiness';
  return 'thoughtful inward expression, composed reserved demeanor';
}

function resilienceDesc(score) {
  if (score >= 68) return 'grounded stable presence, shoulders relaxed and low, no postural tension';
  if (score >= 48) return 'steady grounded presence, natural ease in stance';
  return 'quiet measured presence';
}

function trajectoryFlavor(state) {
  if (state === 'improving') return 'subtle sense of forward momentum, light in the eyes, expansive open stance';
  if (state === 'declining') return 'quiet inward contemplative presence, still and self-contained';
  return 'still grounded presence, rooted and present in the moment';
}

function sleepDesc(score) {
  if (score === null || score === undefined) return null;
  if (score >= 7.5) return 'well-rested appearance, clear skin, no under-eye fatigue';
  if (score <= 4.5) return 'subtle signs of fatigue, slightly softened eyes';
  return 'naturally rested appearance';
}

function confidenceDesc(score) {
  if (score >= 68) return 'direct natural gaze, relaxed upright shoulders, at-ease confidence';
  if (score >= 48) return 'gentle steady gaze, natural comfortable stance';
  return 'slightly averted soft gaze, understated presence';
}

export function buildPrompt({ iteSummary, transformationDirection, rawMetrics, gender }) {
  const td = transformationDirection || {};
  const rm = rawMetrics || {};

  const vitality      = td.vitality?.projected          ?? 50;
  const resilience    = td.resilience?.projected        ?? 50;
  const discipline    = td.discipline?.projected        ?? 50;
  const emotionalStab = td.emotionalStability?.projected ?? 50;
  const confidence    = td.confidence?.projected        ?? 50;
  const futureState   = td.projectedFutureState         ?? 'stable';

  const sleepScore = rm.sleep ?? rm.sleepScore ?? null;
  const genderWord = gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person';

  const sleepLine = sleepDesc(sleepScore);

  const promptParts = [
    `A photorealistic full-body portrait of a ${genderWord} standing naturally in soft neutral indoor light.`,
    `${vitalityDesc(vitality)}.`,
    `${disciplineDesc(discipline)}.`,
    `${emotionalDesc(emotionalStab)}.`,
    `${resilienceDesc(resilience)}.`,
    `${confidenceDesc(confidence)}.`,
    `${trajectoryFlavor(futureState)}.`,
    sleepLine ? `${sleepLine}.` : null,
    'Wearing simple modern casual clothes — neutral tones, well-fitted.',
    'Clean softly blurred neutral background.',
    'Full body visible from head to feet. Shot at eye level.',
    'Natural skin texture, soft directional lighting with gentle shadows.',
    'Photorealistic, cinematic quality, no graphic overlay, no text, no logo.',
  ].filter(Boolean);

  const prompt = promptParts.join(' ');

  const negativePrompt = [
    'cartoon, illustration, painting, drawing, anime, 3D render, CGI, digital art',
    'extreme muscularity, bodybuilder physique, fantasy, supernatural, mystical',
    'medical imaging, clinical, X-ray',
    'logo, text, watermark, caption, frame, border',
    'multiple people, crowd, background people',
    'distorted limbs, extra fingers, missing limbs, deformed anatomy',
    'NSFW, explicit, revealing clothing',
    'over-saturated, HDR, fake lighting, studio pose',
  ].join(', ');

  return { prompt, negativePrompt };
}
