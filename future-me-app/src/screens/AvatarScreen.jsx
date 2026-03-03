import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { loadSkinTone, loadHairStyle } from '../components/SkinToneSelector';
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

  const handleAppearanceChange = useCallback((changes) => {
    if (changes.skinTone !== undefined) setSkinTone(changes.skinTone);
    if (changes.hairStyle !== undefined) setHairStyle(changes.hairStyle);
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

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Your Avatar</h1>
        <p className="text-gray-600">Visualize your current and future self</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium text-gray-600">View:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowFutureAvatar(false)}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                !showFutureAvatar
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Current You
            </button>
            <button
              onClick={() => setShowFutureAvatar(true)}
              disabled={!futureMetrics}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                showFutureAvatar
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : futureMetrics
                  ? 'text-gray-600 hover:text-gray-800'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Future You {!futureMetrics && '(Coming Soon)'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50"
        >
          {selectedGender === null ? (
            <div className="w-full max-w-[200px] aspect-[2/3] flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : !showFutureAvatar ? (
            <FutureMeAvatar
              lifestyleScore={currentMeMetrics?.lifestyleScore || liveProfile.onboardingBaseline?.lifestyleScore || 50}
              activity={currentMeMetrics?.activity || liveProfile.onboardingBaseline?.activity || 3}
              nutrition={currentMeMetrics?.nutrition || liveProfile.onboardingBaseline?.nutrition || 3}
              sleep={currentMeMetrics?.sleep || liveProfile.onboardingBaseline?.sleep || 3}
              stress={currentMeMetrics?.stress || liveProfile.onboardingBaseline?.stress || 3}
              images={liveProfile.images}
              habits={habits}
              achievements={achievements}
              lifeZones={liveProfile.lifeZones}
              gender={selectedGender}
              baselineData={{
                baselineState: liveProfile?.baselineState,
                lifestyleRhythm: liveProfile?.lifestyleRhythm,
                emotionalProfile: liveProfile?.emotionalProfile,
                faithPurpose: liveProfile?.faithPurpose
              }}
              historyData={historyData}
              skinTone={skinTone}
              hairStyle={hairStyle}
            />
          ) : (
            <FutureAvatar
              futureMetrics={futureMetrics}
              images={liveProfile.images}
              habits={habits}
              achievements={achievements}
              lifeZones={liveProfile.lifeZones}
              gender={selectedGender}
              baselineData={{
                baselineState: liveProfile?.baselineState,
                lifestyleRhythm: liveProfile?.lifestyleRhythm,
                emotionalProfile: liveProfile?.emotionalProfile,
                faithPurpose: liveProfile?.faithPurpose
              }}
              historyData={historyData}
              skinTone={skinTone}
              hairStyle={hairStyle}
            />
          )}

          <div className="mt-4 text-center">
            {!showFutureAvatar ? (
              (() => {
                if (iteNarrative?.currentSummary) {
                  return (
                    <>
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        {iteNarrative.currentSummary}
                      </p>
                      {iteNarrative.contrast?.contrastSummaryCurrentToFuture && (
                        <p className="text-xs text-gray-500 mt-1">
                          {iteNarrative.contrast.contrastSummaryCurrentToFuture}
                        </p>
                      )}
                    </>
                  );
                }
                const description = getCurrentMeDescription(
                  currentMeMetrics || liveProfile.onboardingBaseline,
                  { slowDriftApplied: currentMeMetrics?.slowDriftApplied }
                );
                return (
                  <>
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      This is your current self based on your lifestyle assessment.
                    </p>
                    <p className="text-xs text-gray-500">
                      {description.secondary}
                    </p>
                  </>
                );
              })()
            ) : futureMetrics ? (
              (() => {
                const showConfidenceBanner = iteNarrative?.projectionConfidence === 'LOW';
                if (iteNarrative?.projection12MonthSummary) {
                  const futureContrast = iteNarrative.contrast;
                  const influenceParts = [];
                  if (futureContrast?.strongestLever) influenceParts.push(futureContrast.strongestLever);
                  if (futureContrast?.mostSensitiveTrait) influenceParts.push(futureContrast.mostSensitiveTrait);
                  const influenceLine = influenceParts.length > 0
                    ? `This projection is most influenced by: ${influenceParts.join(' and ')}.`
                    : futureContrast?.contrastSummaryFutureToCurrent || null;

                  return (
                    <>
                      {showConfidenceBanner && (
                        <p className="text-xs text-slate-400 mb-2">
                          Future projection is refining as more data is logged.
                        </p>
                      )}
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        {iteNarrative.projection12MonthSummary}
                      </p>
                      {iteNarrative.leverLine && (
                        <p className="text-xs text-gray-500 mt-1">
                          {iteNarrative.leverLine}
                        </p>
                      )}
                      {influenceLine && (
                        <p className="text-xs text-gray-500 mt-1">
                          {influenceLine}
                        </p>
                      )}
                      {futureContrast?.deltaList && (
                        <p className="text-xs text-gray-400 mt-1">
                          {futureContrast.deltaList}
                        </p>
                      )}
                      {iteNarrative.scenarioLine && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          ➡️ {iteNarrative.scenarioLine}
                        </p>
                      )}
                    </>
                  );
                }
                const description = getFutureAvatarDescription(futureMetrics, trendAnalysis);
                return (
                  <>
                    <p className={`text-sm font-medium mb-2 ${
                      description.tone === 'positive'
                        ? 'text-green-600'
                        : description.tone === 'warning'
                        ? 'text-orange-600'
                        : 'text-gray-700'
                    }`}>
                      {description.primary}
                    </p>
                    <p className={`text-xs ${
                      description.tone === 'positive'
                        ? 'text-green-600 font-semibold'
                        : description.tone === 'warning'
                        ? 'text-orange-600 font-semibold'
                        : 'text-gray-600'
                    }`}>
                      {description.secondary}
                    </p>
                  </>
                );
              })()
            ) : (
              <p className="text-sm text-gray-500">
                Track your habits for a few more days to unlock your future projection.
              </p>
            )}
          </div>
          
          <p className="mt-3 text-xs text-gray-400 text-center">
            Your baseline only updates through reassessment, not daily logs.
          </p>

          <div className="mt-4 w-full max-w-xs">
            <GenderSelector onGenderChange={handleGenderChange} />
          </div>

          <div className="mt-4 w-full">
            <VisualInfluences lifeZones={liveProfile.lifeZones} onAppearanceChange={handleAppearanceChange} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {!showFutureAvatar ? 'Your Lifestyle Metrics' : 'Projected Metrics (90 Days)'}
            </h2>
            <div className="space-y-4">
              <MetricBar
                label="Physical Activity"
                value={!showFutureAvatar 
                  ? (currentMeMetrics?.activity || liveProfile.onboardingBaseline?.activity || 3)
                  : (futureMetrics?.activity || 3)}
                max={5}
                color="blue"
              />
              <MetricBar
                label="Nutrition Quality"
                value={!showFutureAvatar 
                  ? (currentMeMetrics?.nutrition || liveProfile.onboardingBaseline?.nutrition || 3)
                  : (futureMetrics?.nutrition || 3)}
                max={5}
                color="green"
              />
              <MetricBar
                label="Sleep Quality"
                value={!showFutureAvatar 
                  ? (currentMeMetrics?.sleep || liveProfile.onboardingBaseline?.sleep || 3)
                  : (futureMetrics?.sleep || 3)}
                max={5}
                color="purple"
              />
              <MetricBar
                label="Stress Level"
                value={!showFutureAvatar 
                  ? (currentMeMetrics?.stress || liveProfile.onboardingBaseline?.stress || 3)
                  : (futureMetrics?.stress || 3)}
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
              console.log("📸 Avatar Screen: Image upload successful")
            }
          />
        </motion.div>
      </div>
    </div>
  );
}
