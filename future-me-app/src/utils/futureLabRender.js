/**
 * futureLabRender.js
 *
 * Client-side render orchestration for Future Lab — Version B.
 * All Replicate calls happen server-side via /api/render/generate.
 * This file only manages Firestore records and triggers the backend.
 *
 * Storage: users/{uid}/futureLabRenders/{renderId}
 * Feedback: users/{uid}/futureLabFeedback/{feedbackId}  ← untouched
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Version constants ────────────────────────────────────────────────────────

export const EXPERIMENT_VERSION = 'future_lab_visual_direction_v1';
export const PROMPT_VERSION     = 'identity_trajectory_full_body_v1';
export const PROVIDER_TARGET    = 'replicate_flux_1.1_pro';

export const RENDER_EXPERIMENT_VERSION = EXPERIMENT_VERSION;
export const RENDER_PROMPT_VERSION     = PROMPT_VERSION;

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

// ─── Backend call (server-side proxy) ────────────────────────────────────────

async function callReplicateProvider(payload) {
  try {
    const res = await fetch('/api/render/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        userId:                  payload.userId,
        gender:                  payload.gender,
        iteSummary:              payload.iteSummary,
        transformationDirection: payload.transformationDirection,
        rawMetrics:              payload.currentStateSummary,
      }),
      signal: AbortSignal.timeout(100_000), // 100 s client-side guard
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return { rateLimited: true, error: data.error || 'Daily limit reached.' };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || `Server error ${res.status}` };
    }

    const data = await res.json();
    if (!data.imageUrl) return { error: 'No image returned from server.' };

    return { connected: true, imageUrl: data.imageUrl, remaining: data.remaining ?? null };

  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return { error: 'Request timed out. Replicate may be busy — try again.' };
    }
    return { error: err.message || 'Unknown network error.' };
  }
}

// ─── Initiate render ──────────────────────────────────────────────────────────

export async function initiateRender({ db, userId, payload }) {
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

  const result = await callReplicateProvider(payload);

  if (result.rateLimited) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'rate_limited',
      errorMessage: result.error,
    });
    return { status: 'rate_limited', renderId: docRef.id, error: result.error };
  }

  if (result.error) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'error',
      errorMessage: result.error,
    });
    return { status: 'error', renderId: docRef.id, error: result.error };
  }

  if (result.imageUrl) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'complete',
      imageUrl:     result.imageUrl,
    });
    return {
      status:    'complete',
      renderId:  docRef.id,
      imageUrl:  result.imageUrl,
      remaining: result.remaining,
    };
  }

  await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
    renderStatus: 'error',
    errorMessage: 'Unexpected empty response.',
  });
  return { status: 'error', renderId: docRef.id };
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
