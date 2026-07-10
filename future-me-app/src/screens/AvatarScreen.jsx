import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { loadSkinTone, loadHairStyle, loadHairColor } from '../components/SkinToneSelector';
import FutureMeAvatar from '../components/FutureMeAvatar';
import FutureAvatar from '../components/FutureAvatar';
import ImageUpload from '../components/ImageUpload';
import GenderSelector from '../components/GenderSelector';
import { getFutureAvatarDescription } from '../utils/futureAvatarModel';
import { getCurrentMeDescription } from '../utils/currentMeAvatarModel';
import VisualInfluences from '../components/VisualInfluences';
import { runIdentityTrajectoryEngine } from '../utils/identityTrajectoryEngine';
import { getIdentityBaseline } from '../utils/identityStateEngine';
import { canRunITE } from '../utils/iteAvatarAdapter';
import { generateHabitInfluenceSummary } from '../utils/habitInfluenceEngine';
import { inferActionsFromLog, findStrongestInferredLever } from '../utils/loggingConsequenceInference';
import { simulateDefaultScenario } from '../utils/trajectoryScenarioEngine';

// ─── Pure label helpers (unchanged) ───────────────────────────────────────────

function energyLabel(s) {
  if (s < 30) return { text: 'Low', color: 'red' };
  if (s < 55) return { text: 'Moderate', color: 'orange' };
  if (s < 75) return { text: 'Good', color: 'yellow' };
  return { text: 'High', color: 'green' };
}
function moodLabel(s) {
  if (s < 30) return { text: 'Stressed', color: 'red' };
  if (s < 55) return { text: 'Tense', color: 'orange' };
  if (s < 75) return { text: 'Balanced', color: 'yellow' };
  return { text: 'Calm', color: 'green' };
}
function sleepLabel(raw) {
  if (raw < 2)   return { text: 'Poor', color: 'red' };
  if (raw < 3)   return { text: 'Light', color: 'orange' };
  if (raw < 4)   return { text: 'Fair', color: 'yellow' };
  if (raw < 4.5) return { text: 'Good', color: 'lightgreen' };
  return { text: 'Restful', color: 'green' };
}
function healthLabel(s) {
  if (s < 30) return { text: 'Overweight', color: 'red' };
  if (s < 50) return { text: 'Below Avg', color: 'orange' };
  if (s < 70) return { text: 'Average', color: 'yellow' };
  if (s < 87) return { text: 'Fit', color: 'green' };
  return { text: 'Athletic', color: 'green' };
}
function mindsetLabel(s) {
  if (s < 30) return { text: 'Reactive', color: 'red' };
  if (s < 55) return { text: 'Scattered', color: 'orange' };
  if (s < 75) return { text: 'Developing', color: 'yellow' };
  return { text: 'Focused', color: 'green' };
}

const COLOR_MAP = {
  red:        'text-red-500',
  orange:     'text-orange-500',
  yellow:     'text-yellow-600',
  lightgreen: 'text-lime-600',
  green:      'text-green-600',
};

function thrivingColor(score) {
  if (score < 40) return { dot: 'bg-red-400',    text: 'text-red-500' };
  if (score < 60) return { dot: 'bg-yellow-400', text: 'text-yellow-600' };
  return { dot: 'bg-green-500', text: 'text-green-600' };
}

function buildBadges(energy, mood, sleepRaw, healthScore, mindset) {
  return [
    { icon: '💪', label: 'Energy',  ...energyLabel(energy)      },
    { icon: '❤️', label: 'Mood',    ...moodLabel(mood)           },
    { icon: '💤', label: 'Sleep',   ...sleepLabel(sleepRaw)      },
    { icon: '🌱', label: 'Health',  ...healthLabel(healthScore)  },
    { icon: '📖', label: 'Mindset', ...mindsetLabel(mindset)     },
  ];
}

function physicalScore(activity, nutrition) {
  return ((activity + nutrition) / 2 / 5) * 100;
}

function computeTags(activity, stress, vitalityScore) {
  const posture = activity <= 1.5 ? 'slouched posture'
    : activity <= 2.5 ? 'neutral posture'
    : activity <= 3.5 ? 'steady posture'
    : 'upright posture';
  const energy = vitalityScore < 35 ? 'low energy'
    : vitalityScore < 62 ? 'moderate energy'
    : 'steady energy';
  const mood = stress >= 4 ? 'stressed'
    : stress >= 3 ? 'moderate stress'
    : 'composed';
  return [posture, energy, mood];
}

function firstSentence(text) {
  if (!text) return null;
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : text.trim();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

// Compact horizontal chip — replaces the tall flanking badge column
function MetricChip({ icon, label, text, color }) {
  return (
    <div className="flex items-center gap-1 bg-white/70 rounded-md px-1.5 py-1 border border-white/80">
      <span className="text-[11px] leading-none shrink-0">{icon}</span>
      <span className={`text-[10px] font-semibold leading-none ${COLOR_MAP[color] || 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
}

// Single thriving status line directly beneath avatar
function ThrivingRow({ score }) {
  if (score == null) return null;
  const { dot, text } = thrivingColor(score);
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-xs text-gray-500">Thriving</span>
      <span className={`text-sm font-bold ${text}`}>{score}%</span>
    </div>
  );
}

// Descriptor chips row
function TagRow({ tags }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {tags.map(t => (
        <span
          key={t}
          className="text-[10px] text-gray-500 bg-white/60 px-2 py-0.5 rounded-full border border-white/80"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// Metric bar — slightly thinner, cleaner
function MetricBar({ label, value, max, color, reverse = false }) {
  const displayValue = reverse ? max - value + 1 : value;
  const percentage   = (displayValue / max) * 100;
  const colors = {
    blue:   'bg-blue-400',
    green:  'bg-green-500',
    purple: 'bg-purple-400',
    red:    'bg-red-400',
  };
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{displayValue}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-full ${colors[color]} rounded-full`}
        />
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function AvatarScreen() {
  const {
    liveProfile,
    showFutureAvatar,
    setShowFutureAvatar,
    futureMetrics,
    habits,
    achievements,
    selectedGender,
    currentMeMetrics,
    historyData,
    trendAnalysis,
    handleGenderChange,
    defaultHabitCompletions,
  } = useApp();

  const [skinTone, setSkinTone]   = useState(() => loadSkinTone());
  const [hairStyle, setHairStyle] = useState(() => loadHairStyle());
  const [hairColor, setHairColor] = useState(() => loadHairColor());

  const handleAppearanceChange = useCallback((changes) => {
    if (changes.skinTone  !== undefined) setSkinTone(changes.skinTone);
    if (changes.hairStyle !== undefined) setHairStyle(changes.hairStyle);
    if (changes.hairColor !== undefined) setHairColor(changes.hairColor);
  }, []);

  // Full ITE result — unchanged
  const iteData = useMemo(() => {
    const baseline = getIdentityBaseline(liveProfile);
    if (!canRunITE(historyData, baseline)) return null;
    try {
      const latestMetrics = historyData?.[0] || {};
      const rawMetrics = {
        activity:                latestMetrics.activity  ?? 3,
        nutrition:               latestMetrics.nutrition ?? 3,
        sleep:                   latestMetrics.sleep     ?? 3,
        stress:                  latestMetrics.stress    ?? 3,
        // Newer whole-person daily signals (null-safe additive ITE nudge)
        energy:                  latestMetrics.energy        ?? null,
        mood:                    latestMetrics.mood          ?? null,
        sleepDuration:           latestMetrics.sleepDuration ?? null,
        // Latest deeper physical check-in, when available
        ...(liveProfile?.lastHealthDetail || {}),
        lifeZones:               liveProfile?.lifeZones  || {},
        habits:                  [],
        defaultHabitCompletions: defaultHabitCompletions || null,
      };
      const iteResult = runIdentityTrajectoryEngine(rawMetrics, historyData, baseline);
      const narrative  = iteResult.narrative || null;
      const contrast   = iteResult.contrast  || null;

      let leverLine = null;
      let strongestLeverLabel = null;
      try {
        const inferredActions = inferActionsFromLog(latestMetrics, historyData, liveProfile?.lifeZones);
        const lever = findStrongestInferredLever(inferredActions, iteResult);
        if (lever) { leverLine = lever.narrative; strongestLeverLabel = lever.actionLabel || null; }
      } catch (_) {}

      if (contrast && strongestLeverLabel) contrast.strongestLever = strongestLeverLabel;

      let scenarioLine = null;
      try {
        const sr = simulateDefaultScenario(iteResult, contrast?.mostSensitiveTrait || null, strongestLeverLabel);
        if (sr?.scenarioNarrative) scenarioLine = sr.scenarioNarrative;
      } catch (_) {}

      const projectionConfidence = iteResult.projectionConfidence?.tier || 'LOW';
      return {
        traits:            iteResult.traits,
        projection12Month: iteResult.projection12Month,
        narrative:         narrative ? { ...narrative, leverLine, contrast, scenarioLine, projectionConfidence } : null,
      };
    } catch (_) {
      return null;
    }
  }, [historyData, liveProfile, defaultHabitCompletions]);

  // Current metric values — unchanged
  const cm = useMemo(() => {
    const m = currentMeMetrics || liveProfile?.onboardingBaseline || {};
    return {
      activity:  m.activity  ?? 3,
      nutrition: m.nutrition ?? 3,
      sleep:     m.sleep     ?? 3,
      stress:    m.stress    ?? 3,
      lifestyleScore: m.lifestyleScore,
    };
  }, [currentMeMetrics, liveProfile]);

  // Future metric values — unchanged
  const fm = useMemo(() => {
    if (!futureMetrics) return null;
    return {
      activity:  futureMetrics.activity  ?? 3,
      nutrition: futureMetrics.nutrition ?? 3,
      sleep:     futureMetrics.sleep     ?? 3,
      stress:    futureMetrics.stress    ?? 3,
      lifestyleScore: futureMetrics.lifestyleScore,
    };
  }, [futureMetrics]);

  // Thriving scores — unchanged
  const currentThrivingScore = useMemo(() => {
    if (cm.lifestyleScore) return Math.round(cm.lifestyleScore);
    return Math.round(((cm.activity + cm.nutrition + cm.sleep + (5 - cm.stress)) / 16) * 100);
  }, [cm]);

  const futureThrivingScore = useMemo(() => {
    if (!fm) return null;
    if (fm.lifestyleScore) return Math.round(fm.lifestyleScore);
    return Math.round(((fm.activity + fm.nutrition + fm.sleep + (5 - fm.stress)) / 16) * 100);
  }, [fm]);

  // Trait badge data — unchanged
  const currentBadges = useMemo(() => {
    const t = iteData?.traits;
    const energy  = t?.vitality?.currentScore           ?? (cm.activity  / 5) * 100;
    const mood    = t?.emotionalStability?.currentScore ?? ((5 - cm.stress) / 5) * 100;
    const health  = physicalScore(cm.activity, cm.nutrition);
    const mindset = t?.discipline?.currentScore         ?? 50;
    return buildBadges(energy, mood, cm.sleep, health, mindset);
  }, [iteData, cm]);

  const futureBadges = useMemo(() => {
    if (!fm) return null;
    const p = iteData?.projection12Month;
    const energy  = p?.vitality           ?? (fm.activity  / 5) * 100;
    const mood    = p?.emotionalStability ?? ((5 - fm.stress) / 5) * 100;
    const health  = physicalScore(fm.activity, fm.nutrition);
    const mindset = p?.discipline         ?? 50;
    return buildBadges(energy, mood, fm.sleep, health, mindset);
  }, [iteData, fm]);

  // Descriptor tags — unchanged
  const currentTags = useMemo(() => {
    const vitality = iteData?.traits?.vitality?.currentScore ?? (cm.activity / 5) * 100;
    return computeTags(cm.activity, cm.stress, vitality);
  }, [iteData, cm]);

  const futureTags = useMemo(() => {
    if (!fm) return [];
    const vitality = iteData?.projection12Month?.vitality ?? (fm.activity / 5) * 100;
    return computeTags(fm.activity, fm.stress, vitality);
  }, [iteData, fm]);

  // Key Pattern line — unchanged
  const keyPatternLine = useMemo(() => {
    const n = iteData?.narrative;
    if (!fm) return null;
    if (n?.leverLine) return n.leverLine;
    if (n?.contrast?.contrastSummaryCurrentToFuture) return n.contrast.contrastSummaryCurrentToFuture;
    const lever = n?.contrast?.strongestLever;
    const trait = n?.contrast?.mostSensitiveTrait;
    if (lever && trait) return `The primary driver of this projection is ${lever}, with ${trait} most sensitive to change.`;
    if (lever) return `The primary driver of this projection is ${lever}.`;
    return null;
  }, [iteData, fm]);

  const projectionConfidence = iteData?.narrative?.projectionConfidence;

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const habitInfluenceSummary = useMemo(() => {
    return generateHabitInfluenceSummary(defaultHabitCompletions);
  }, [defaultHabitCompletions]);

  const sharedAvatarBase = {
    images:    liveProfile.images,
    habits,
    achievements,
    lifeZones: liveProfile.lifeZones,
    gender:    selectedGender,
    baselineData: {
      baselineState:    liveProfile?.baselineState,
      lifestyleRhythm:  liveProfile?.lifestyleRhythm,
      emotionalProfile: liveProfile?.emotionalProfile,
      faithPurpose:     liveProfile?.faithPurpose,
    },
    historyData,
    skinTone,
    hairStyle,
    hairColor,
    defaultHabitCompletions: defaultHabitCompletions || null,
  };

  const currentAvatarProps = {
    ...sharedAvatarBase,
    lifestyleScore: cm.lifestyleScore || 50,
    activity:  cm.activity,
    nutrition: cm.nutrition,
    sleep:     cm.sleep,
    stress:    cm.stress,
  };

  const futureAvatarProps = {
    ...sharedAvatarBase,
    futureMetrics,
  };

  // Foot note per panel — absorbs the projection confidence state so both panels
  // always have exactly one explanatory sentence and the structure stays symmetric.
  const currentFootNote  = 'Reflects your baseline wellness state.';
  const futureFootNote   = !fm
    ? 'Track more days to generate your projection.'
    : projectionConfidence === 'LOW'
      ? 'Refining as more data is logged.'
      : 'Based on your current logged patterns.';

  return (
    <div className="space-y-5">

      <h1 className="text-2xl font-bold text-gray-800">Your Avatar</h1>

      {/* ── Side-by-side comparison ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_24px_1fr] mb-3">
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">Current Me</p>
          </div>
          <div />
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-widest text-purple-500 uppercase">Future Me</p>
            <p className="text-[9px] text-gray-400 font-medium">1 Year</p>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-[1fr_24px_1fr] items-start">

          {/* ── Current Me panel ─────────────────────────────────── */}
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50/40 rounded-xl p-3 flex flex-col items-center gap-2.5">

            {/* 2. Avatar — primary focal point */}
            <div className="flex justify-center w-full">
              {selectedGender === null ? (
                <div className="w-[100px] aspect-[2/3] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <FutureMeAvatar {...currentAvatarProps} />
              )}
            </div>

            {/* 3. Single status row */}
            <ThrivingRow score={currentThrivingScore} />

            {/* 4. Descriptor chips (2–3) */}
            <TagRow tags={currentTags} />

            {/* 5. Compact metric chip row */}
            <div className="flex flex-wrap justify-center gap-1 w-full">
              {currentBadges.map(b => <MetricChip key={b.label} {...b} />)}
            </div>

            {/* 6. Explanatory sentence */}
            <p className="text-[10px] text-gray-400 text-center leading-snug">
              {currentFootNote}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center pt-16">
            <span className="text-gray-300 text-xs">➡️</span>
          </div>

          {/* ── Future Me panel — exact mirror ───────────────────── */}
          <div className="bg-gradient-to-b from-purple-50 to-pink-50/40 rounded-xl p-3 flex flex-col items-center gap-2.5">

            {/* 2. Avatar — primary focal point */}
            <div className="flex justify-center w-full">
              {selectedGender === null ? (
                <div className="w-[100px] aspect-[2/3] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : fm ? (
                <FutureAvatar {...futureAvatarProps} amplifyContrast />
              ) : (
                <div className="w-[100px] aspect-[2/3] flex flex-col items-center justify-center gap-2 opacity-25">
                  <div className="w-10 h-10 rounded-full bg-purple-300" />
                  <div className="w-8 h-16 rounded-full bg-purple-200" />
                </div>
              )}
            </div>

            {/* 3. Single status row */}
            <ThrivingRow score={futureThrivingScore} />

            {/* 4. Descriptor chips (2–3) */}
            {fm
              ? <TagRow tags={futureTags} />
              : <p className="text-[10px] text-center text-gray-400">Log more days to unlock</p>
            }

            {/* 5. Compact metric chip row */}
            <div className="flex flex-wrap justify-center gap-1 w-full">
              {fm && futureBadges
                ? futureBadges.map(b => <MetricChip key={b.label} {...b} />)
                : <div className="h-[20px]" />
              }
            </div>

            {/* 6. Explanatory sentence */}
            <p className="text-[10px] text-gray-400 text-center leading-snug">
              {futureFootNote}
            </p>
          </div>
        </div>

        {/* Deterministic figure label */}
        <div className="mt-3 text-center">
          <p className="text-[11px] font-semibold text-gray-500">Trajectory Figure</p>
          <p className="text-[10px] text-gray-400 leading-snug">
            Built from your logged patterns and identity traits.
          </p>
        </div>

        {/* Key Transformation banner */}
        {keyPatternLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-indigo-50 rounded-xl flex gap-2.5 items-start"
          >
            <span className="text-sm shrink-0 mt-0.5">📖</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-800">Key Transformation: </span>
              {keyPatternLine}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Controls + metrics ───────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="card">
            <p className="text-xs text-gray-400 mb-3">
              Your baseline only updates through reassessment, not daily logs.
            </p>
            <GenderSelector onGenderChange={handleGenderChange} />
          </div>
          <div className="card">
            <VisualInfluences
              lifeZones={liveProfile.lifeZones}
              onAppearanceChange={handleAppearanceChange}
              habitInfluenceSummary={habitInfluenceSummary}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Lifestyle Metrics</h2>
            <div className="space-y-3.5">
              <MetricBar label="Physical Activity" value={cm.activity}  max={5} color="blue"   />
              <MetricBar label="Nutrition Quality" value={cm.nutrition} max={5} color="green"  />
              <MetricBar label="Sleep Quality"     value={cm.sleep}     max={5} color="purple" />
              <MetricBar label="Stress Level"      value={cm.stress}    max={5} color="red" reverse />
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Goals</h2>
            <div className="flex flex-wrap gap-1.5">
              {liveProfile.goals && liveProfile.goals.length > 0 ? (
                liveProfile.goals.map((goal, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
                  >
                    {goal}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No goals set</p>
              )}
            </div>
          </div>

          <ImageUpload onUpload={() => console.log('Avatar Screen: Image upload successful')} />
        </motion.div>
      </div>

    </div>
  );
}
