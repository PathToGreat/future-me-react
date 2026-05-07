/**
 * futureLabRender.js
 *
 * Client-side render orchestration for Future Lab — Version B.
 * Calls Replicate directly from the browser (no backend server required).
 * Rate limiting is enforced via Firestore render history (3/day per user).
 *
 * Storage: users/{uid}/futureLabRenders/{renderId}
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { buildPrompt } from './promptBuilder.js';

// ─── Version constants ────────────────────────────────────────────────────────

export const EXPERIMENT_VERSION = 'future_lab_visual_direction_v1';
export const PROMPT_VERSION     = 'identity_trajectory_full_body_v1';
export const PROVIDER_TARGET    = 'replicate_flux_1.1_pro';

export const RENDER_EXPERIMENT_VERSION = EXPERIMENT_VERSION;
export const RENDER_PROMPT_VERSION     = PROMPT_VERSION;

const MODEL_ID    = 'black-forest-labs/flux-1.1-pro';
const MAX_PER_DAY = 3;
const POLL_MS     = 3000;   // poll every 3 s
const TIMEOUT_MS  = 95_000; // 95 s hard stop

// ─── ITE summary builder ──────────────────────────────────────────────────────

const TRAIT_IDS = [
  'vitality',
  'resilience',
  'emotionalStability',
  'discipline',
  'confidence',
  'socialConnectedness',
  'purposeAlignment',
];

export function buildITESummary(iteResult) {
  if (!iteResult?.traits) return null;

  const t = iteResult.traits;
  const p = iteResult.projection12Month || {};

  const currentState   = {};
  const projectedState = {};

  TRAIT_IDS.forEach(id => {
    currentState[id]   = Math.round(t[id]?.currentScore  ?? 50);
    projectedState[id] = Math.round(p[id] ?? t[id]?.currentScore ?? 50);
  });

  return {
    currentState,
    projectedState,
    projectionConfidence: iteResult.projectionConfidence?.tier ?? 'LOW',
    earlyStage:           iteResult.earlyStage ?? true,
  };
}

// ─── Transformation direction builder ────────────────────────────────────────

export function buildTransformationDirection(iteResult) {
  if (!iteResult?.traits) return null;

  const t  = iteResult.traits;
  const p  = iteResult.projection12Month || {};

  const cur  = id => Math.round(t[id]?.currentScore ?? 50);
  const proj = id => Math.round(p[id] ?? t[id]?.currentScore ?? 50);

  const emoStabilityCurrent   = cur('emotionalStability');
  const emoStabilityProjected = proj('emotionalStability');

  return {
    vitality:           { current: cur('vitality'),   projected: proj('vitality')   },
    emotionalStability: { current: emoStabilityCurrent, projected: emoStabilityProjected },
    discipline:         { current: cur('discipline'), projected: proj('discipline') },
    resilience:         { current: cur('resilience'), projected: proj('resilience') },
    confidence:         { current: cur('confidence'), projected: proj('confidence') },
    stressReduction:    Math.max(0, emoStabilityProjected - emoStabilityCurrent),
    strongestLever:     iteResult.narrative?.strongestLever ?? null,
    projectedFutureState: proj('vitality') > 60 ? 'improving'
                        : proj('vitality') < 40 ? 'declining'
                        : 'stable',
  };
}

// ─── Full payload builder ─────────────────────────────────────────────────────

const PROMPT_INTENT =
  'Full-body photorealistic future-self image driven by ITE trajectory. ' +
  'Preserve identity. Restrained realistic transformation — no exaggeration.';

export function buildRenderPayload({ userId, sourcePhotoReference, iteResult, rawMetrics, gender }) {
  return {
    userId,
    gender:               gender ?? null,
    sourcePhotoReference: sourcePhotoReference ?? null,
    iteSummary:           buildITESummary(iteResult),
    currentStateSummary: {
      activity:  rawMetrics?.activityScore  ?? rawMetrics?.activity  ?? null,
      nutrition: rawMetrics?.nutritionScore ?? rawMetrics?.nutrition ?? null,
      sleep:     rawMetrics?.sleepScore     ?? rawMetrics?.sleep     ?? null,
      stress:    rawMetrics?.stressScore    ?? rawMetrics?.stress    ?? null,
    },
    transformationDirection: buildTransformationDirection(iteResult),
    renderConstraints: {
      preserveIdentity:          true,
      realisticButAvatarLike:    false,
      restrainedTransformation:  true,
      notOverlyMuscular:         true,
      notFantasy:                true,
      notCartoon:                true,
      notMedicalPrediction:      true,
      visuallyBasedOnTrajectory: true,
    },
    promptIntent:      PROMPT_INTENT,
    promptVersion:     PROMPT_VERSION,
    experimentVersion: EXPERIMENT_VERSION,
    providerTarget:    PROVIDER_TARGET,
  };
}

// ─── Firestore rate limiter ───────────────────────────────────────────────────
// Single-field query on createdAt only — avoids needing a composite index.
// Status filtering is done client-side after fetching.

async function checkFirestoreRate(db, userId) {
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  try {
    const q = query(
      collection(db, 'users', userId, 'futureLabRenders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfDayUtc)),
    );

    const snap = await getDocs(q);
    // Count only non-error renders against the daily limit
    const used = snap.docs.filter(d => d.data().renderStatus !== 'error').length;

    console.log('[FutureLab] Rate check — renders today:', used, '/', MAX_PER_DAY);

    if (used >= MAX_PER_DAY) {
      return {
        allowed:   false,
        remaining: 0,
        used,
        error:     `Daily limit of ${MAX_PER_DAY} generations reached. Resets at midnight UTC.`,
      };
    }

    return { allowed: true, remaining: MAX_PER_DAY - used - 1, used };
  } catch (err) {
    // If Firestore check fails, allow the request rather than blocking
    console.warn('[FutureLab] Rate check failed, allowing request:', err.message);
    return { allowed: true, remaining: MAX_PER_DAY - 1, used: 0 };
  }
}

// ─── Direct Replicate call ────────────────────────────────────────────────────

async function callReplicate({ iteSummary, transformationDirection, rawMetrics, gender }) {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;
  if (!token) {
    console.error('[FutureLab] VITE_REPLICATE_API_TOKEN is not set in this build.');
    return { error: 'Image generation is not configured. Please contact support.' };
  }

  console.log('[FutureLab] Starting Replicate call, token present:', token.slice(0, 8) + '...');
  const { prompt } = buildPrompt({ iteSummary, transformationDirection, rawMetrics, gender });

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Prefer':        'wait=5',
  };

  let prediction;
  try {
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${MODEL_ID}/predictions`,
      {
        method:  'POST',
        headers,
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio:      '2:3',
            output_format:     'webp',
            output_quality:    80,
            safety_tolerance:  2,
            prompt_upsampling: true,
          },
        }),
      }
    );

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return { error: err.detail || `Generation service error (${createRes.status}). Please try again.` };
    }

    prediction = await createRes.json();
  } catch (err) {
    return { error: 'Could not reach the image generation service. Check your connection and try again.' };
  }

  // Poll until complete
  const deadline = Date.now() + TIMEOUT_MS;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    if (Date.now() > deadline) {
      return { error: 'Generation timed out — the service may be busy. Please try again.' };
    }

    await new Promise(r => setTimeout(r, POLL_MS));

    try {
      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      prediction = await pollRes.json();
    } catch {
      return { error: 'Lost connection while waiting for the image. Please try again.' };
    }
  }

  if (prediction.status !== 'succeeded') {
    return { error: prediction.error || 'Image generation failed. Please try again.' };
  }

  const output   = prediction.output;
  const imageUrl = Array.isArray(output) ? String(output[0]) : String(output);

  if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
    return { error: 'No image was returned. Please try again.' };
  }

  return { imageUrl };
}

// ─── Initiate render ──────────────────────────────────────────────────────────

export async function initiateRender({ db, userId, payload }) {
  // Check rate limit first
  const rate = await checkFirestoreRate(db, userId);
  if (!rate.allowed) {
    return { status: 'rate_limited', error: rate.error };
  }

  const renderRecord = {
    renderStatus:            'pending',
    imageUrl:                null,
    storageReference:        null,
    sourcePhotoReference:    payload.sourcePhotoReference,
    gender:                  payload.gender ?? null,
    promptVersion:           payload.promptVersion,
    experimentVersion:       payload.experimentVersion,
    providerTarget:          payload.providerTarget,
    promptIntent:            payload.promptIntent,
    createdAt:               serverTimestamp(),
    provider:                'replicate',
    iteSummaryData:          payload.iteSummary,
    transformationDirection: payload.transformationDirection,
    currentStateSummary:     payload.currentStateSummary,
    renderConstraints:       payload.renderConstraints,
    errorMessage:            null,
    userId,
  };

  const colRef = collection(db, 'users', userId, 'futureLabRenders');
  const docRef = await addDoc(colRef, renderRecord);

  const result = await callReplicate({
    iteSummary:              payload.iteSummary,
    transformationDirection: payload.transformationDirection,
    rawMetrics:              payload.currentStateSummary,
    gender:                  payload.gender,
  });

  if (result.error) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'error',
      errorMessage: result.error,
    });
    return { status: 'error', renderId: docRef.id, error: result.error };
  }

  await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
    renderStatus: 'complete',
    imageUrl:     result.imageUrl,
  });

  return {
    status:    'complete',
    renderId:  docRef.id,
    imageUrl:  result.imageUrl,
    remaining: rate.remaining,
  };
}

// ─── Latest render query ──────────────────────────────────────────────────────

export async function getLatestRender({ db, userId }) {
  const q = query(
    collection(db, 'users', userId, 'futureLabRenders'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}
