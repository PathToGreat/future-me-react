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

function MetricBar({ label, value, max, color, reverse = false }) {
  const displayValue = reverse ? max - value + 1 : value;
  const percentage = (displayValue / max) * 100;
  
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">
          {displayValue}/{max}
        </span>
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

function firstSentence(text) {
  if (!text) return null;
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.trim();
}

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

  const [skinTone, setSkinTone] = useState(() => loadSkinTone());
  const [hairStyle, setHairStyle] = useState(() => loadHairStyle());
  const [hairColor, setHairColor] = useState(() => loadHairColor());

  const handleAppearanceChange = useCallback((changes) => {
    if (changes.skinTone !== undefined) setSkinTone(changes.skinTone);
    if (changes.hairStyle !== undefined) setHairStyle(changes.hairStyle);
    if (changes.hairColor !== undefined) setHairColor(changes.hairColor);
  }, []);

  const iteNarrative = useMemo(() => {
    const baseline = liveProfile?.onboardingBaseline || liveProfile?.baselineState;
    if (!canRunITE(historyData, baseline)) return null;
    try {
      const latestMetrics = historyData?.[0] || {};
      const rawMetrics = {
        activity: latestMetrics.activity ?? 3,
        nutrition: latestMetrics.nutrition ?? 3,
        sleep: latestMetrics.sleep ?? 3,
        stress: latestMetrics.stress ?? 3,
        lifeZones: liveProfile?.lifeZones || {},
        habits: []
      };
      const iteResult = runIdentityTrajectoryEngine(rawMetrics, historyData, baseline);
      const narrative = iteResult.narrative || null;
      const contrast = iteResult.contrast || null;

      let leverLine = null;
      let strongestLeverLabel = null;
      try {
        const inferredActions = inferActionsFromLog(latestMetrics, historyData, liveProfile?.lifeZones);
        const lever = findStrongestInferredLever(inferredActions, iteResult);
        if (lever) {
          leverLine = lever.narrative;
          strongestLeverLabel = lever.actionLabel || null;
        }
      } catch (e) {}

      if (contrast && strongestLeverLabel) {
        contrast.strongestLever = strongestLeverLabel;
      }

      let scenarioLine = null;
      try {
        const scenarioResult = simulateDefaultScenario(
          iteResult,
          contrast?.mostSensitiveTrait || null,
          strongestLeverLabel
        );
        if (scenarioResult?.scenarioNarrative) {
          scenarioLine = scenarioResult.scenarioNarrative;
        }
      } catch (e) {}

      const projectionConfidence = iteResult.projectionConfidence?.tier || 'LOW';
      return narrative ? { ...narrative, leverLine, contrast, scenarioLine, projectionConfidence } : null;
    } catch (e) {
      return null;
    }
  }, [historyData, liveProfile]);

  const currentNarrative = useMemo(() => {
    if (iteNarrative?.currentSummary) {
      return firstSentence(iteNarrative.currentSummary);
    }
    const description = getCurrentMeDescription(
      currentMeMetrics || liveProfile?.onboardingBaseline,
      { slowDriftApplied: currentMeMetrics?.slowDriftApplied }
    );
    return description?.secondary || 'Based on your current lifestyle patterns.';
  }, [iteNarrative, currentMeMetrics, liveProfile]);

  const futureNarrative = useMemo(() => {
    if (!futureMetrics) return null;
    if (iteNarrative?.projection12MonthSummary) {
      return firstSentence(iteNarrative.projection12MonthSummary);
    }
    const description = getFutureAvatarDescription(futureMetrics, trendAnalysis);
    return description?.primary || null;
  }, [iteNarrative, futureMetrics, trendAnalysis]);

  const contrastLine = useMemo(() => {
    if (!futureMetrics) return null;
    if (iteNarrative?.leverLine) return iteNarrative.leverLine;
    if (iteNarrative?.contrast?.contrastSummaryCurrentToFuture) {
      return iteNarrative.contrast.contrastSummaryCurrentToFuture;
    }
    const lever = iteNarrative?.contrast?.strongestLever;
    const trait = iteNarrative?.contrast?.mostSensitiveTrait;
    if (lever && trait) return `The primary driver of this projection is ${lever}, with ${trait} most sensitive to change.`;
    if (lever) return `The primary driver of this projection is ${lever}.`;
    return null;
  }, [iteNarrative, futureMetrics]);

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const currentAvatarProps = {
    lifestyleScore: currentMeMetrics?.lifestyleScore || liveProfile.onboardingBaseline?.lifestyleScore || 50,
    activity: currentMeMetrics?.activity || liveProfile.onboardingBaseline?.activity || 3,
    nutrition: currentMeMetrics?.nutrition || liveProfile.onboardingBaseline?.nutrition || 3,
    sleep: currentMeMetrics?.sleep || liveProfile.onboardingBaseline?.sleep || 3,
    stress: currentMeMetrics?.stress || liveProfile.onboardingBaseline?.stress || 3,
    images: liveProfile.images,
    habits,
    achievements,
    lifeZones: liveProfile.lifeZones,
    gender: selectedGender,
    baselineData: {
      baselineState: liveProfile?.baselineState,
      lifestyleRhythm: liveProfile?.lifestyleRhythm,
      emotionalProfile: liveProfile?.emotionalProfile,
      faithPurpose: liveProfile?.faithPurpose
    },
    historyData,
    skinTone,
    hairStyle,
    hairColor,
  };

  const futureAvatarProps = {
    futureMetrics,
    images: liveProfile.images,
    habits,
    achievements,
    lifeZones: liveProfile.lifeZones,
    gender: selectedGender,
    baselineData: {
      baselineState: liveProfile?.baselineState,
      lifestyleRhythm: liveProfile?.lifestyleRhythm,
      emotionalProfile: liveProfile?.emotionalProfile,
      faithPurpose: liveProfile?.faithPurpose
    },
    historyData,
    skinTone,
    hairStyle,
    hairColor,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Your Avatar</h1>
      </div>

      {/* Side-by-side comparison panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {/* Current Me */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
              Current Me
            </span>
            <div className="w-full flex justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl py-4">
              {selectedGender === null ? (
                <div className="w-[120px] aspect-[2/3] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : (
                <FutureMeAvatar {...currentAvatarProps} />
              )}
            </div>
            <p className="text-sm text-gray-700 text-center mt-3 leading-snug px-1">
              {currentNarrative}
            </p>
          </div>

          {/* Future Me */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest mb-3">
              Future Me
            </span>
            <div className="w-full flex justify-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl py-4">
              {selectedGender === null ? (
                <div className="w-[120px] aspect-[2/3] flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : futureMetrics ? (
                <FutureAvatar {...futureAvatarProps} />
              ) : (
                <div className="w-[120px] aspect-[2/3] flex flex-col items-center justify-center gap-2 opacity-40">
                  <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-2xl">➡️</div>
                  <div className="w-10 h-20 rounded-full bg-purple-100" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 text-center mt-3 leading-snug px-1">
              {futureMetrics
                ? (futureNarrative || 'Projection updating as more data is logged.')
                : 'Log a few more days to unlock your future projection.'}
            </p>
            {iteNarrative?.projectionConfidence === 'LOW' && futureMetrics && (
              <p className="text-xs text-slate-400 text-center mt-1">
                Refining as more data is logged.
              </p>
            )}
          </div>
        </div>

        {/* Contrast line */}
        {contrastLine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 pt-4 border-t border-gray-100 text-center"
          >
            <p className="text-sm text-gray-500 italic">{contrastLine}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Controls + metrics row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: appearance controls */}
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

        {/* Right: metrics + goals + image upload */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Lifestyle Metrics</h2>
            <div className="space-y-4">
              <MetricBar
                label="Physical Activity"
                value={currentMeMetrics?.activity || liveProfile.onboardingBaseline?.activity || 3}
                max={5}
                color="blue"
              />
              <MetricBar
                label="Nutrition Quality"
                value={currentMeMetrics?.nutrition || liveProfile.onboardingBaseline?.nutrition || 3}
                max={5}
                color="green"
              />
              <MetricBar
                label="Sleep Quality"
                value={currentMeMetrics?.sleep || liveProfile.onboardingBaseline?.sleep || 3}
                max={5}
                color="purple"
              />
              <MetricBar
                label="Stress Level"
                value={currentMeMetrics?.stress || liveProfile.onboardingBaseline?.stress || 3}
                max={5}
                color="red"
                reverse
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Goals</h2>
            <div className="flex flex-wrap gap-2">
              {liveProfile.goals && liveProfile.goals.length > 0 ? (
                liveProfile.goals.map((goal, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {goal}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No goals set</p>
              )}
            </div>
          </div>

          <ImageUpload
            onUpload={(urls) =>
              console.log("Avatar Screen: Image upload successful")
            }
          />
        </motion.div>
      </div>
    </div>
  );
}
