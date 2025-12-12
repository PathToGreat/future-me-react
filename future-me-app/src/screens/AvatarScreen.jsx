import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FutureMeAvatar from '../components/FutureMeAvatar';
import FutureAvatar from '../components/FutureAvatar';
import ImageUpload from '../components/ImageUpload';
import GenderSelector from '../components/GenderSelector';
import { getFutureAvatarDescription } from '../utils/futureAvatarModel';
import { getCurrentMeDescription } from '../utils/currentMeAvatarModel';

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
            />
          )}

          <div className="mt-4 text-center">
            {!showFutureAvatar ? (
              (() => {
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
          
          <div className="mt-4 w-full max-w-xs">
            <GenderSelector onGenderChange={handleGenderChange} />
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
