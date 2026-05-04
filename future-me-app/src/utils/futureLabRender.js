/**
 * futureLabRender.js
 *
 * Staged AI-render integration for Future Lab — Version B.
 * The Replicate provider pathway is fully scaffolded but NOT active.
 * When a Replicate API key is available, replace `callReplicateProvider` below
 * (server-side only — never put API keys here) and update the backend route.
 *
 * Storage: users/{uid}/futureLabRenders/{renderId}
 * Feedback stays in: users/{uid}/futureLabFeedback/{feedbackId}  ← untouched
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
// These version constants allow us to compare future render experiments cleanly.
// Update PROMPT_VERSION whenever the generation prompt meaningfully changes.
// Update EXPERIMENT_VERSION when the experiment design changes.

export const EXPERIMENT_VERSION = 'future_lab_visual_direction_v1';
export const PROMPT_VERSION     = 'identity_preserve_soft_transform_v1';
export const PROVIDER_TARGET    = 'replicate_not_configured';

// Legacy aliases — keep these so any import using the old names still compiles.
export const RENDER_EXPERIMENT_VERSION = EXPERIMENT_VERSION;
export const RENDER_PROMPT_VERSION     = PROMPT_VERSION;

// ─── Per-user generation limit (future enforcement — NOT yet active) ──────────
// TODO: Before allowing a new render, read users/{uid}/futureLabRenderMeta
//       and check generationCount against MAX_RENDERS_PER_USER.
// TODO: Increment generationCount on each successful initiation.
// Enforce this before connecting a live paid provider.
// eslint-disable-next-line no-unused-vars
const MAX_RENDERS_PER_USER = 3;

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

  const currentState    = {};
  const projectedState  = {};

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
    vitality:          { current: cur('vitality'),   projected: proj('vitality')   },
    emotionalStability:{ current: emoStabilityCurrent, projected: emoStabilityProjected },
    discipline:        { current: cur('discipline'), projected: proj('discipline') },
    resilience:        { current: cur('resilience'), projected: proj('resilience') },
    confidence:        { current: cur('confidence'), projected: proj('confidence') },
    stressReduction:   Math.max(0, emoStabilityProjected - emoStabilityCurrent),
    strongestLever:    iteResult.narrative?.strongestLever ?? null,
    projectedFutureState: proj('vitality') > 60 ? 'improving' : proj('vitality') < 40 ? 'declining' : 'stable',
  };
}

// ─── Full payload builder ─────────────────────────────────────────────────────
// This payload will be sent to the backend → Replicate when the provider is connected.

const PROMPT_INTENT =
  'Preserve user identity while creating a realistic but restrained future-facing visual ' +
  'interpretation based on current ITE projection. Improve posture, energy, calmness, and ' +
  'health signals without exaggeration or extreme muscularity.';

export function buildRenderPayload({ userId, sourcePhotoReference, iteResult, rawMetrics }) {
  return {
    userId,
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
      realisticButAvatarLike:    true,
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

// ─── Provider gate ────────────────────────────────────────────────────────────
// Replace this function when Replicate is configured.
//
// Future implementation:
//   POST /api/render/generate  (your backend)
//   Backend reads REPLICATE_API_KEY from env and calls Replicate.
//   Returns { imageUrl } on success, { error } on failure.
//   NEVER expose API keys here or in any frontend file.
//
// eslint-disable-next-line no-unused-vars
async function callReplicateProvider(_payload) {
  // TODO: return await fetch('/api/render/generate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(_payload),
  // }).then(r => r.json());

  return { connected: false }; // provider not configured yet
}

// ─── Initiate render ──────────────────────────────────────────────────────────

export async function initiateRender({ db, userId, payload }) {
  const renderRecord = {
    renderStatus:            'pending',
    imageUrl:                null,
    storageReference:        null,
    sourcePhotoReference:    payload.sourcePhotoReference,
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

  if (!result.connected) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'provider_not_connected',
      provider:     'not_configured',
      errorMessage: 'AI render provider is not connected yet.',
    });
    return { status: 'provider_not_connected', renderId: docRef.id };
  }

  if (result.error) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'error',
      errorMessage: result.error,
    });
    return { status: 'error', renderId: docRef.id };
  }

  if (result.imageUrl) {
    await updateDoc(doc(db, 'users', userId, 'futureLabRenders', docRef.id), {
      renderStatus: 'complete',
      imageUrl:     result.imageUrl,
    });
    return { status: 'complete', renderId: docRef.id, imageUrl: result.imageUrl };
  }

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
