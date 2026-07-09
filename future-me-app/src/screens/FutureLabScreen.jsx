import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import FutureAvatar from '../components/FutureAvatar';
import { runIdentityTrajectoryEngine } from '../utils/identityTrajectoryEngine';
import {
  buildRenderPayload,
  initiateRender,
  getLatestRender,
} from '../utils/futureLabRender';

const EXPERIMENT_VERSION = 'v1.0-visual-direction';

// ─── Render states ────────────────────────────────────────────────────────────
// idle | generating | provider_not_connected | complete | error

// ─── Placeholder visual ───────────────────────────────────────────────────────

function PlaceholderVisual({ label, description, accentColor }) {
  const colors = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-400' },
    teal:  { bg: 'bg-teal-50',  border: 'border-teal-200',  text: 'text-teal-600',  dot: 'bg-teal-400' },
  };
  const c = colors[accentColor] || colors.amber;
  return (
    <div className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed ${c.bg} ${c.border} py-10 px-4`}>
      <div className={`w-14 h-14 rounded-full ${c.dot} opacity-30`} />
      <div className={`w-8 h-20 rounded-full ${c.dot} opacity-20`} />
      <p className={`text-xs font-semibold uppercase tracking-wide mt-2 ${c.text}`}>{label}</p>
      {description && (
        <p className="text-xs text-gray-400 text-center max-w-[160px]">{description}</p>
      )}
    </div>
  );
}

// ─── Version B inner content ──────────────────────────────────────────────────

function VersionBContent({ renderState, renderError, latestRender, onGenerate, onRegenerate, loadingRender }) {
  const showRender   = latestRender?.renderStatus === 'complete' && latestRender?.imageUrl;
  const isGenerating = renderState === 'generating';
  const isRateLimited = renderState === 'rate_limited';

  // Honest microcopy: only identity-preserving render modes may imply likeness.
  const identityPreserved =
    latestRender?.renderMode === 'identity_preserving' ||
    latestRender?.renderMode === 'image_to_image';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Visual area */}
      {showRender ? (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={latestRender.imageUrl}
            alt="AI-generated future self render"
            className="w-full object-cover"
          />
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {identityPreserved
                ? 'Experimental — based on your photo'
                : 'Experimental trajectory visualization'}
            </p>
            <span className="text-[10px] text-green-600 font-semibold shrink-0">✓ Generated</span>
          </div>
          {!identityPreserved && (
            <div className="px-3 pb-2 bg-gray-50">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Likeness preservation is still being tested — this image does not yet
                use your uploaded photo for identity.
              </p>
            </div>
          )}
        </div>
      ) : isGenerating ? (
        <div className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 py-10 px-4">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-xs text-amber-600 font-medium">Generating — this may take up to 60 seconds…</p>
          <p className="text-[10px] text-amber-500 text-center">Building your future self from trajectory data</p>
        </div>
      ) : (
        <PlaceholderVisual
          label="Future Me Image"
          description="Tap generate to create a full-body image from your trajectory data"
          accentColor="amber"
        />
      )}

      {/* Status messages */}
      <AnimatePresence mode="wait">
        {(renderState === 'error' || renderState === 'provider_not_connected') && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
          >
            <span className="text-red-400 text-sm mt-0.5">📊</span>
            <p className="text-xs text-red-700 leading-relaxed">
              {renderError || 'Generation failed. Please try again.'}
            </p>
          </motion.div>
        )}

        {isRateLimited && (
          <motion.div
            key="rate-limited"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
          >
            <span className="text-amber-500 text-sm mt-0.5">⚖️</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              {renderError || 'Daily generation limit reached. Try again tomorrow.'}
            </p>
          </motion.div>
        )}

        {renderState === 'complete' && showRender && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5"
          >
            <span className="text-green-500 text-sm">✓</span>
            <p className="text-xs text-green-700 flex-1">
              Experimental output only — not a medical or physical prediction.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button — never auto-triggered */}
      {!showRender && !isGenerating && !isRateLimited && (
        <button
          onClick={e => { e.stopPropagation(); onGenerate(); }}
          disabled={isGenerating || loadingRender}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all border
            ${isGenerating || loadingRender
              ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
              : 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm'}`}
        >
          {loadingRender ? 'Checking…' : 'Generate Future Me Image'}
        </button>
      )}

      {/* Regenerate button — only shown when image is cached */}
      {showRender && !isGenerating && (
        <button
          onClick={e => { e.stopPropagation(); onRegenerate(); }}
          className="w-full py-2 rounded-xl text-[11px] font-medium text-gray-400 border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition-all bg-white"
        >
          Regenerate
        </button>
      )}

      {!showRender && !isGenerating && !isRateLimited && (
        <p className="text-[10px] text-gray-400 text-center px-2 leading-relaxed">
          User-triggered only. Limited to 3 generations per day during testing.
        </p>
      )}

      {/* In-app disclaimer notice */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
        <p className="text-[10px] text-gray-400 leading-relaxed text-center">
          This experimental visualization reflects general trajectory patterns and is not a
          medical prediction or guaranteed future outcome. Likeness accuracy is not guaranteed.
        </p>
      </div>
    </div>
  );
}

// ─── Version card ─────────────────────────────────────────────────────────────

function VersionCard({ id, label, descriptor, children, selected, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
        ${selected ? 'border-indigo-400 shadow-md shadow-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
      onClick={onSelect}
    >
      <div className={`flex items-center justify-between px-4 py-2.5 ${selected ? 'bg-indigo-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
            ${selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'}`}>
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
          ${selected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
          Version {id}
        </span>
      </div>

      <div className="flex justify-center items-start bg-white px-4 py-4 min-h-[220px]">
        {children}
      </div>

      {descriptor && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">{descriptor}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Rating input ─────────────────────────────────────────────────────────────

function RatingInput({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          className={`w-9 h-9 rounded-full border-2 text-sm font-semibold transition-all
            ${value === n
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-gray-300 text-gray-500 hover:border-indigo-300'}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FutureLabScreen({ onBack }) {
  const { user } = useAuth();
  const {
    futureMetrics,
    habits,
    achievements,
    selectedGender,
    liveProfile,
    historyData,
  } = useApp();

  // ── Feedback state (unchanged) ───────────────────────────────────────────
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [rating, setRating]                   = useState(null);
  const [textFeedback, setTextFeedback]       = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [submitError, setSubmitError]         = useState(null);

  // ── Render state (Version B) ─────────────────────────────────────────────
  const [renderState, setRenderState]     = useState('idle');
  const [renderError, setRenderError]     = useState(null);
  const [latestRender, setLatestRender]   = useState(null);
  const [loadingRender, setLoadingRender] = useState(true);

  // ── ITE computation for payload ──────────────────────────────────────────
  const iteResult = useMemo(() => {
    if (!historyData || !liveProfile) return null;
    try {
      const latest     = historyData?.[0] || {};
      const rawMetrics = {
        activityScore:  latest.activityScore  ?? 3,
        nutritionScore: latest.nutritionScore ?? 3,
        sleepScore:     latest.sleepScore     ?? 3,
        stressScore:    latest.stressScore    ?? 3,
        lifeZones:      liveProfile?.lifeZones || {},
        habits:         [],
      };
      const baseline = liveProfile?.onboardingBaseline || liveProfile?.baselineState || null;
      return runIdentityTrajectoryEngine(rawMetrics, historyData, baseline);
    } catch {
      return null;
    }
  }, [historyData, liveProfile]);

  // ── Load latest render on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingRender(true);
    getLatestRender({ db, userId: user.uid })
      .then(render => {
        if (cancelled) return;
        setLatestRender(render);
        if (render?.renderStatus === 'complete') setRenderState('complete');
        else if (render?.renderStatus === 'provider_not_connected') setRenderState('provider_not_connected');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingRender(false); });
    return () => { cancelled = true; };
  }, [user]);

  // ── Handle render request ────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!user || renderState === 'generating') return;
    setRenderState('generating');
    setRenderError(null);

    try {
      const latest     = historyData?.[0] || {};
      const rawMetrics = {
        activityScore:  latest.activityScore  ?? null,
        nutritionScore: latest.nutritionScore ?? null,
        sleepScore:     latest.sleepScore     ?? null,
        stressScore:    latest.stressScore    ?? null,
      };

      // Most recent upload — ImageUpload appends new photos to the end
      const imgs = liveProfile?.images;
      const lastImg = Array.isArray(imgs) && imgs.length > 0 ? imgs[imgs.length - 1] : null;
      const sourcePhotoReference = lastImg?.path || lastImg?.url || lastImg || null;

      const payload = buildRenderPayload({
        userId:               user.uid,
        sourcePhotoReference,
        iteResult,
        rawMetrics,
        gender:               selectedGender,
      });

      const result = await initiateRender({ db, userId: user.uid, payload });

      const fresh = await getLatestRender({ db, userId: user.uid });
      setLatestRender(fresh);
      setRenderState(result.status);
      if (result.error) setRenderError(result.error);
    } catch (err) {
      console.error('FutureLab render initiation failed:', err);
      setRenderState('error');
      setRenderError('Something went wrong. Please try again.');
    }
  }, [user, renderState, historyData, liveProfile, iteResult, selectedGender]);

  // ── Feedback submit (unchanged logic) ────────────────────────────────────
  const canSubmit = selectedVersion !== null && !submitting && !submitted;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addDoc(collection(db, 'users', user.uid, 'futureLabFeedback'), {
        selectedOption:    selectedVersion,
        rating:            rating ?? null,
        textFeedback:      textFeedback.trim() || null,
        timestamp:         serverTimestamp(),
        experimentVersion: EXPERIMENT_VERSION,
        userId:            user.uid,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('FutureLab feedback write failed:', err);
      setSubmitError('Something went wrong saving your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, user, selectedVersion, rating, textFeedback]);

  // ── Avatar props for Version A ────────────────────────────────────────────
  const futureAvatarProps = {
    futureMetrics,
    images:    liveProfile?.images,
    habits,
    achievements,
    lifeZones: liveProfile?.lifeZones,
    gender:    selectedGender,
    baselineData: {
      baselineState:    liveProfile?.baselineState,
      lifestyleRhythm:  liveProfile?.lifestyleRhythm,
      emotionalProfile: liveProfile?.emotionalProfile,
      faithPurpose:     liveProfile?.faithPurpose,
    },
    historyData,
    skinTone:  'medium',
    hairStyle: 'medium',
    hairColor: '#3b2314',
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* Header + back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
          aria-label="Back"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Future Lab</h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-medium">
            Preview — Experimental
          </p>
        </div>
      </div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 space-y-1"
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          This area previews visual directions we are testing. These representations are
          experimental and may not reflect the final version of your Future Me.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Version B includes a staged AI render pathway. No generation happens automatically —
          only when you request it.
        </p>
      </motion.div>

      {/* Visual versions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Which version best helps you understand your future self?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Version A — SVG avatar */}
          <VersionCard
            id="A"
            label="Current Avatar"
            descriptor="SVG-based avatar driven by your logged metrics"
            selected={selectedVersion === 'A'}
            onSelect={() => setSelectedVersion('A')}
          >
            {futureMetrics && selectedGender !== null ? (
              <FutureAvatar {...futureAvatarProps} />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-40">
                <div className="w-12 h-12 rounded-full bg-indigo-200" />
                <div className="w-8 h-20 rounded-full bg-indigo-100" />
                <p className="text-xs text-gray-400 mt-1">Log more days to preview</p>
              </div>
            )}
          </VersionCard>

          {/* Version B — staged AI render */}
          <VersionCard
            id="B"
            label="Experimental Render"
            descriptor={
              latestRender?.renderStatus === 'complete'
                ? 'AI render — experimental output only'
                : 'AI-generated image — tap to generate'
            }
            selected={selectedVersion === 'B'}
            onSelect={() => setSelectedVersion('B')}
          >
            <VersionBContent
              renderState={renderState}
              renderError={renderError}
              latestRender={latestRender}
              onGenerate={handleGenerate}
              onRegenerate={() => {
                setLatestRender(null);
                setRenderState('idle');
                setRenderError(null);
              }}
              loadingRender={loadingRender}
            />
          </VersionCard>

          {/* Version C — placeholder */}
          <VersionCard
            id="C"
            label="Stylized Concept"
            descriptor="Alternative visual style — direction under evaluation"
            selected={selectedVersion === 'C'}
            onSelect={() => setSelectedVersion('C')}
          >
            <PlaceholderVisual
              label="In Exploration"
              description="A different visual representation of projected identity"
              accentColor="teal"
            />
          </VersionCard>

        </div>
      </div>

      {/* Feedback form — unchanged */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card space-y-5"
      >
        <h2 className="text-base font-semibold text-gray-800">Your Feedback</h2>

        <div>
          <p className="text-sm text-gray-600 mb-3">
            How useful is this visualization? <span className="text-gray-400">(optional)</span>
          </p>
          <RatingInput value={rating} onChange={setRating} />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 px-1">
            <span>Not useful</span>
            <span>Very useful</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-2">
            What feels accurate or inaccurate about this?{' '}
            <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={textFeedback}
            onChange={e => setTextFeedback(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Share anything that stands out…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 placeholder-gray-400"
            disabled={submitted}
          />
          <p className="text-[10px] text-gray-400 text-right mt-0.5">
            {textFeedback.length}/500
          </p>
        </div>

        {submitted ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3">
            <span className="text-lg">✓</span>
            <p className="text-sm font-medium">Response recorded. Thank you.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all
                ${canSubmit
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {submitting
                ? 'Saving…'
                : selectedVersion
                  ? 'Submit Feedback'
                  : 'Select a version above to continue'}
            </button>
            {submitError && (
              <p className="text-xs text-red-500 text-center">{submitError}</p>
            )}
          </div>
        )}
      </motion.div>

    </div>
  );
}
