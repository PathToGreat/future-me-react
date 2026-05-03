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
import { canRunITE } from '../utils/iteAvatarAdapter';
import { inferActionsFromLog, findStrongestInferredLever } from '../utils/loggingConsequenceInference';
import { simulateDefaultScenario } from '../utils/trajectoryScenarioEngine';

// ─── Pure label helpers ────────────────────────────────────────────────────────

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
  return { text: 'Calm & Happy', color: 'green' };
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
  if (s < 50) return { text: 'Below Average', color: 'orange' };
  if (s < 70) return { text: 'Average', color: 'yellow' };
  if (s < 87) return { text: 'Fit & Healthy', color: 'green' };
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
const DOT_MAP = {
  red:    'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  lightgreen: 'bg-lime-500',
  green:  'bg-green-500',
};

function thrivingColor(score) {
  if (score < 40) return { dot: 'bg-red-400',    text: 'text-red-500' };
  if (score < 60) return { dot: 'bg-yellow-400', text: 'text-yellow-600' };
  return { dot: 'bg-green-500', text: 'text-green-600' };
}

function buildBadges(energy, mood, sleepRaw, healthScore, mindset) {
  return [
    { icon: '💪', label: 'Energy',  ...energyLabel(energy)  },
    { icon: '❤️', label: 'Mood',    ...moodLabel(mood)      },
    { icon: '💤', label: 'Sleep',   ...sleepLabel(sleepRaw) },
    { icon: '🌱', label: 'Health',  ...healthLabel(healthScore) },
    { icon: '📖', label: 'Mindset', ...mindsetLabel(mindset) },
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

function TraitBadge({ icon, label, text, color }) {
  return (
    <div className="bg-white rounded-lg px-2 py-1.5 shadow-sm border border-gray-100 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-none shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
          <div className={`text-[11px] font-semibold leading-tight truncate ${COLOR_MAP[color] || 'text-gray-600'}`}>
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThrivingRow({ score }) {
  if (score == null) return null;
  const { dot, text } = thrivingColor(score);
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-xs text-gray-500">Thriving</span>
      <span className={`text-sm font-bold ${text}`}>{score}%</span>
    </div>
  );
}

function TagRow({ tags }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
      {tags.map(t => (
        <span key={t} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {t}
        </span>
      ))}
    </div>
  );
}

function MetricBar({ label, value, max, color, reverse = false }) {
  const displayValue = reverse ? max - value + 1 : value;
  const percentage = (displayValue / max) * 100;
  const colors = {
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    purple: 'bg-purple-500',
    red:    'bg-red-500',
  };
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{displayValue}/{max}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
  } = useApp();

  const [skinTone, setSkinTone]   = useState(() => loadSkinTone());
  const [hairStyle, setHairStyle] = useState(() => loadHairStyle());
  const [hairColor, setHairColor] = useState(() => loadHairColor());

  const handleAppearanceChange = useCallback((changes) => {
    if (changes.skinTone  !== undefined) setSkinTone(changes.skinTone);
    if (changes.hairStyle !== undefined) setHairStyle(changes.hairStyle);
    if (changes.hairColor !== undefined) setHairColor(changes.hairColor);
  }, []);

  // Full ITE result — exposes traits + projection12Month alongside narrative
  const iteData = useMemo(() => {
    const baseline = liveProfile?.onboardingBaseline || liveProfile?.baselineState;
    if (!canRunITE(historyData, baseline)) return null;
    try {
      const latestMetrics = historyData?.[0] || {};
      const rawMetrics = {
        activity:  latestMetrics.activity  ?? 3,
        nutrition: latestMetrics.nutrition ?? 3,
        sleep:     latestMetrics.sleep     ?? 3,
        stress:    latestMetrics.stress    ?? 3,
        lifeZones: liveProfile?.lifeZones  || {},
        habits:    []
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
        traits:           iteResult.traits,
        projection12Month: iteResult.projection12Month,
        narrative:        narrative ? { ...narrative, leverLine, contrast, scenarioLine, projectionConfidence } : null,
      };
    } catch (_) {
      return null;
    }
  }, [historyData, liveProfile]);

  // Current metric values
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

  // Future metric values
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

  // Thriving scores
  const currentThrivingScore = useMemo(() => {
    if (cm.lifestyleScore) return Math.round(cm.lifestyleScore);
    return Math.round(((cm.activity + cm.nutrition + cm.sleep + (5 - cm.stress)) / 16) * 100);
  }, [cm]);

  const futureThrivingScore = useMemo(() => {
    if (!fm) return null;
    if (fm.lifestyleScore) return Math.round(fm.lifestyleScore);
    return Math.round(((fm.activity + fm.nutrition + fm.sleep + (5 - fm.stress)) / 16) * 100);
  }, [fm]);

  // Trait badge data — current
  const currentBadges = useMemo(() => {
    const t = iteData?.traits;
    const energy   = t?.vitality?.currentScore           ?? (cm.activity  / 5) * 100;
    const mood     = t?.emotionalStability?.currentScore ?? ((5 - cm.stress) / 5) * 100;
    const health   = physicalScore(cm.activity, cm.nutrition);
    const mindset  = t?.discipline?.currentScore         ?? 50;
    return buildBadges(energy, mood, cm.sleep, health, mindset);
  }, [iteData, cm]);

  // Trait badge data — future
  const futureBadges = useMemo(() => {
    if (!fm) return null;
    const p = iteData?.projection12Month;
    const energy  = p?.vitality           ?? (fm.activity  / 5) * 100;
    const mood    = p?.emotionalStability ?? ((5 - fm.stress) / 5) * 100;
    const health  = physicalScore(fm.activity, fm.nutrition);
    const mindset = p?.discipline         ?? 50;
    return buildBadges(energy, mood, fm.sleep, health, mindset);
  }, [iteData, fm]);

  // Descriptor tags
  const currentTags = useMemo(() => {
    const vitality = iteData?.traits?.vitality?.currentScore ?? (cm.activity / 5) * 100;
    return computeTags(cm.activity, cm.stress, vitality);
  }, [iteData, cm]);

  const futureTags = useMemo(() => {
    if (!fm) return [];
    const vitality = iteData?.projection12Month?.vitality ?? (fm.activity / 5) * 100;
    return computeTags(fm.activity, fm.stress, vitality);
  }, [iteData, fm]);

  // Key Pattern line
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

  const sharedAvatarBase = {
    images:   liveProfile.images,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Your Avatar</h1>
      </div>

      {/* ── Side-by-side comparison ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 sm:p-6"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_32px_1fr] mb-3">
          <h3 className="text-center text-xs font-bold tracking-widest text-blue-600 uppercase">
            Current Me
          </h3>
          <div />
          <h3 className="text-center text-xs font-bold tracking-widest text-purple-600 uppercase">
            Future Me&nbsp;(1 Year)
          </h3>
        </div>

        {/* Avatar panels + arrow */}
        <div className="grid grid-cols-[1fr_32px_1fr] gap-y-0">
          {/* ── Current Me panel ── */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-3 flex flex-col">
            <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
              {/* Left badges */}
              <div className="flex flex-col gap-1.5 shrink-0 w-[90px] sm:w-[110px]">
                {currentBadges.map(b => <TraitBadge key={b.label} {...b} />)}
              </div>
              {/* Avatar */}
              <div className="flex-1 flex justify-center items-start pt-1">
                {selectedGender === null ? (
                  <div className="w-[100px] aspect-[2/3] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <FutureMeAvatar {...currentAvatarProps} />
                )}
              </div>
            </div>

            <ThrivingRow score={currentThrivingScore} />
            <TagRow tags={currentTags} />
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center">
              <span className="text-xs text-gray-400">➡️</span>
            </div>
          </div>

          {/* ── Future Me panel ── */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-2 sm:p-3 flex flex-col">
            <div className="flex items-start gap-1.5 sm:gap-2 flex-1">
              {/* Avatar */}
              <div className="flex-1 flex justify-center items-start pt-1">
                {selectedGender === null ? (
                  <div className="w-[100px] aspect-[2/3] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : fm ? (
                  <FutureAvatar {...futureAvatarProps} />
                ) : (
                  <div className="w-[100px] aspect-[2/3] flex flex-col items-center justify-center gap-2 opacity-30">
                    <div className="w-10 h-10 rounded-full bg-purple-300" />
                    <div className="w-8 h-16 rounded-full bg-purple-200" />
                  </div>
                )}
              </div>
              {/* Right badges */}
              <div className="flex flex-col gap-1.5 shrink-0 w-[90px] sm:w-[110px]">
                {fm && futureBadges
                  ? futureBadges.map(b => <TraitBadge key={b.label} {...b} />)
                  : Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-[34px] rounded-lg bg-white/60 border border-white/80" />
                    ))}
              </div>
            </div>

            <ThrivingRow score={futureThrivingScore} />
            {fm
              ? <TagRow tags={futureTags} />
              : <p className="text-[10px] text-center text-gray-400 mt-2">Log more days to unlock</p>
            }
            {projectionConfidence === 'LOW' && fm && (
              <p className="text-[10px] text-slate-400 text-center mt-1">
                Refining as more data is logged.
              </p>
            )}
          </div>
        </div>

        {/* Card footers */}
        <div className="grid grid-cols-[1fr_32px_1fr] mt-2">
          <p className="text-[10px] text-gray-400 text-center leading-snug px-1">
            Your avatar reflects your baseline wellness state from onboarding.
          </p>
          <div />
          <p className="text-[10px] text-gray-400 text-center leading-snug px-1">
            {fm
              ? 'Your predicted physical trajectory based on current patterns.'
              : 'Track more days to generate your projection.'}
          </p>
        </div>

        {/* Key Pattern banner */}
        {keyPatternLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 sm:p-4 bg-indigo-50 rounded-xl flex gap-3 items-start"
          >
            <span className="text-base shrink-0 mt-0.5">📖</span>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-800">Key Transformation: </span>
              {keyPatternLine}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Controls + metrics ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
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
            <VisualInfluences lifeZones={liveProfile.lifeZones} onAppearanceChange={handleAppearanceChange} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Lifestyle Metrics</h2>
            <div className="space-y-4">
              <MetricBar label="Physical Activity" value={cm.activity}  max={5} color="blue"   />
              <MetricBar label="Nutrition Quality" value={cm.nutrition} max={5} color="green"  />
              <MetricBar label="Sleep Quality"     value={cm.sleep}     max={5} color="purple" />
              <MetricBar label="Stress Level"      value={cm.stress}    max={5} color="red" reverse />
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Goals</h2>
            <div className="flex flex-wrap gap-2">
              {liveProfile.goals && liveProfile.goals.length > 0 ? (
                liveProfile.goals.map((goal, idx) => (
                  <span key={idx} className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {goal}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No goals set</p>
              )}
            </div>
          </div>

          <ImageUpload onUpload={() => console.log('Avatar Screen: Image upload successful')} />
        </motion.div>
      </div>
    </div>
  );
}
