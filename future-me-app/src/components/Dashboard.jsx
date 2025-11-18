import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import FutureMeAvatar from "./FutureMeAvatar";
import FutureAvatar from "./FutureAvatar";
import ImageUpload from "./ImageUpload";
import FutureSelfPreview from "./FutureSelfPreview";
import ZoneCard from "./ZoneCard";
import DailyInsight from "./DailyInsight";
import JourneyMeter from "./JourneyMeter";
import DailyTracking from "./DailyTracking";
import { useHistoryData, saveDailySnapshot } from "../hooks/useHistoryData";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { predictFutureState, getMotivationalMessage } from "../utils/predictFutureState";
import { projectFutureMetrics, getFutureAvatarDescription } from "../utils/futureAvatarModel";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liveProfile, setLiveProfile] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [showFutureAvatar, setShowFutureAvatar] = useState(false);
  const [futureMetrics, setFutureMetrics] = useState(null);
  const [showDailyTracking, setShowDailyTracking] = useState(false);

  const { trendAnalysis, historyData } = useHistoryData(user?.uid, liveProfile);

  // Calculate future growth outlook when trend analysis is available
  useEffect(() => {
    if (trendAnalysis && liveProfile?.lifestyleScore) {
      const futureProjections = predictFutureState(
        liveProfile.lifestyleScore,
        trendAnalysis.trendSlope
      );
      setPredictions(futureProjections);
      console.log('🌅 Future Growth Model Run:', futureProjections);
    }
  }, [trendAnalysis, liveProfile?.lifestyleScore]);

  // Calculate future avatar metrics when predictions and history are available
  useEffect(() => {
    if (liveProfile && historyData && predictions && historyData.length >= 2) {
      const projected = projectFutureMetrics(liveProfile, historyData, predictions, 90);
      setFutureMetrics(projected);
      console.log('🔮 Future Avatar Metrics calculated');
    }
  }, [liveProfile, historyData, predictions]);

  // Real-time listener for user profile updates
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setLiveProfile(data);
          console.log("🔄 Real-time update received:", data);
        }
      },
      (error) => {
        console.error("❌ Firebase listener error:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Refresh dashboard if user navigates back here
  useEffect(() => {
    if (location.pathname === "/dashboard" && liveProfile) {
      setLiveProfile(liveProfile);
      console.log("🔁 Dashboard refreshed on navigation");
    }
  }, [location.pathname, liveProfile]);

  // Redirect if onboarding not completed
  useEffect(() => {
    if (liveProfile && !liveProfile.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [liveProfile, navigate]);

  // Log dashboard metrics
  useEffect(() => {
    if (liveProfile) {
      console.log("📊 Dashboard Updated with new metrics:");
      console.log("  - Lifestyle Score:", liveProfile.lifestyleScore);
      console.log("  - Activity:", liveProfile.activity);
      console.log("  - Nutrition:", liveProfile.nutrition);
      console.log("  - Sleep:", liveProfile.sleep);
      console.log("  - Stress:", liveProfile.stress);
      console.log("  - Goals:", liveProfile.goals);
    }
  }, [liveProfile]);

  // Save daily snapshot once per day
  useEffect(() => {
    if (user && liveProfile && liveProfile.onboardingCompleted) {
      const lastSaved = localStorage.getItem(`lastSnapshot_${user.uid}`);
      const today = new Date().toISOString().split("T")[0];

      if (lastSaved !== today) {
        console.log("📅 New day detected - saving daily snapshot");
        saveDailySnapshot(user.uid, liveProfile);
        localStorage.setItem(`lastSnapshot_${user.uid}`, today);
      }
    }
  }, [user, liveProfile]);

  if (!liveProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleRetake = () => {
    navigate("/onboarding");
  };

  // Get Life Zones from profile data
  const lifeZones = liveProfile.lifeZones || {};
  
  const zones = [
    {
      title: "Health",
      score: lifeZones.health?.score || 50,
      icon: "💪",
      details: lifeZones.health?.details,
      isPlaceholder: !lifeZones.health
    },
    {
      title: "Wealth",
      score: lifeZones.wealth?.score || 50,
      icon: "💰",
      details: lifeZones.wealth?.details,
      isPlaceholder: !lifeZones.wealth
    },
    {
      title: "Faith",
      score: lifeZones.faith?.score || 50,
      icon: "✨",
      details: lifeZones.faith?.details,
      isPlaceholder: !lifeZones.faith
    },
    {
      title: "Family",
      score: lifeZones.family?.score || 50,
      icon: "👨‍👩‍👧‍👦",
      details: lifeZones.family?.details,
      isPlaceholder: !lifeZones.family
    },
    {
      title: "Community",
      score: lifeZones.community?.score || 50,
      icon: "🤝",
      details: lifeZones.community?.details,
      isPlaceholder: !lifeZones.community
    },
    {
      title: "Social Emotional",
      score: lifeZones.socialEmotional?.score || 50,
      icon: "😊",
      details: lifeZones.socialEmotional?.details,
      isPlaceholder: !lifeZones.socialEmotional
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Your Future Self
            </h1>
            <p className="text-gray-600">
              Based on your current lifestyle choices
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRetake} className="btn-secondary text-sm">
              Retake Assessment
            </button>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>

        <FutureSelfPreview 
          lifestyleScore={liveProfile.lifestyleScore || 50} 
          lifeZones={liveProfile.lifeZones}
        />

        {/* Log Today's Metrics Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          {!showDailyTracking && (
            <button
              onClick={() => setShowDailyTracking(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📊</span>
              <span>Log Today's Metrics</span>
            </button>
          )}
        </motion.div>

        {/* Daily Tracking Modal/Card */}
        <AnimatePresence>
          {showDailyTracking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <DailyTracking
                onClose={() => setShowDailyTracking(false)}
                onSave={() => {
                  console.log("✅ Daily metrics saved, dashboard will auto-refresh via Firebase listeners");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <DailyInsight
            activity={liveProfile.activity}
            nutrition={liveProfile.nutrition}
            sleep={liveProfile.sleep}
            stress={liveProfile.stress}
          />
          <JourneyMeter onboardingCompleted={liveProfile.onboardingCompleted} />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Life Zones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone, index) => (
              <ZoneCard
                key={zone.title}
                title={zone.title}
                score={zone.score}
                icon={zone.icon}
                index={index}
                isPlaceholder={zone.isPlaceholder}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Personalize Your Avatar
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Upload a full-body image to help your avatar reflect your physical
            appearance. Your avatar will adapt based on the uploaded image.
          </p>
          <ImageUpload
            onUploadSuccess={() =>
              console.log(
                "🎨 Dashboard: Image upload successful, avatar will update automatically",
              )
            }
          />
        </motion.div>

        {/* Avatar Toggle UI */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-gray-600">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowFutureAvatar(false)}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
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
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
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

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card flex flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-purple-50"
          >
            {!showFutureAvatar ? (
              <FutureMeAvatar
                lifestyleScore={liveProfile.lifestyleScore || 50}
                activity={liveProfile.activity || 3}
                nutrition={liveProfile.nutrition || 3}
                sleep={liveProfile.sleep || 3}
                stress={liveProfile.stress || 3}
                images={liveProfile.images || []}
                trendAnalysis={trendAnalysis}
                predictions={predictions}
              />
            ) : (
              <FutureAvatar
                futureMetrics={futureMetrics}
                images={liveProfile.images || []}
              />
            )}
            
            {/* Dynamic Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center max-w-md"
            >
              {!showFutureAvatar ? (
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    This is your current self based on today's lifestyle habits.
                  </p>
                  <p className="text-xs text-gray-500">
                    Your avatar reflects your activity, nutrition, sleep, and stress levels in real-time.
                  </p>
                </div>
              ) : futureMetrics ? (
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    {getFutureAvatarDescription(liveProfile.lifestyleScore, futureMetrics.lifestyleScore).primary}
                  </p>
                  <p className={`text-xs ${
                    getFutureAvatarDescription(liveProfile.lifestyleScore, futureMetrics.lifestyleScore).tone === 'positive'
                      ? 'text-green-600 font-semibold'
                      : getFutureAvatarDescription(liveProfile.lifestyleScore, futureMetrics.lifestyleScore).tone === 'warning'
                      ? 'text-orange-600 font-semibold'
                      : 'text-gray-600'
                  }`}>
                    {getFutureAvatarDescription(liveProfile.lifestyleScore, futureMetrics.lifestyleScore).secondary}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Track your habits for a few more days to unlock your future projection.
                </p>
              )}
            </motion.div>
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
                  value={!showFutureAvatar ? liveProfile.activity : futureMetrics?.activity || liveProfile.activity}
                  max={5}
                  color="blue"
                />
                <MetricBar
                  label="Nutrition Quality"
                  value={!showFutureAvatar ? liveProfile.nutrition : futureMetrics?.nutrition || liveProfile.nutrition}
                  max={5}
                  color="green"
                />
                <MetricBar
                  label="Sleep Quality"
                  value={!showFutureAvatar ? liveProfile.sleep : futureMetrics?.sleep || liveProfile.sleep}
                  max={5}
                  color="purple"
                />
                <MetricBar
                  label="Stress Level"
                  value={!showFutureAvatar ? liveProfile.stress : futureMetrics?.stress || liveProfile.stress}
                  max={5}
                  color="red"
                  reverse
                />
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Your Goals
              </h2>
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

            <div className="card bg-gradient-to-r from-primary-500 to-accent-500 text-white">
              <h2 className="text-xl font-bold mb-2">Your Wellness Score</h2>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">
                  {Math.round(liveProfile.lifestyleScore || 50)}
                </span>
                <span className="text-2xl mb-2">/100</span>
              </div>
              <p className="text-blue-100 mt-2">
                {(() => {
                  const score = liveProfile.lifestyleScore || 50;
                  if (score >= 80)
                    return "You're on an excellent path! Keep up the great work.";
                  if (score >= 60)
                    return "Good progress! Some areas can improve.";
                  return "Let's focus on building healthier habits.";
                })()}
              </p>
            </div>

            {trendAnalysis && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`card ${
                  trendAnalysis.direction === "improving"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : trendAnalysis.direction === "declining"
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gradient-to-r from-gray-400 to-gray-500"
                } text-white`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">7-Day Trend</h2>
                  <span className="text-3xl">
                    {trendAnalysis.direction === "improving"
                      ? "📈"
                      : trendAnalysis.direction === "declining"
                        ? "📉"
                        : "⚖️"}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    {trendAnalysis.changePercentage > 0 ? "+" : ""}
                    {trendAnalysis.changePercentage}%
                  </span>
                </div>
                <p className="text-white/90 mt-2 capitalize">
                  {trendAnalysis.description} ({trendAnalysis.dataPoints} days
                  of data)
                </p>
              </motion.div>
            )}

            {predictions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Future Path</h2>
                  <span className="text-3xl">🌅</span>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>30 Days</span>
                      <span className="font-semibold">{predictions[30].score}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${predictions[30].score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>90 Days</span>
                      <span className="font-semibold">{predictions[90].score}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${predictions[90].score}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>180 Days</span>
                      <span className="font-semibold">{predictions[180].score}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${predictions[180].score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-white/90 text-sm">
                  {getMotivationalMessage(predictions)}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 card"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Understanding Your Future Self
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ProfileMetric
              icon="💪"
              title="Body Composition"
              description="Your avatar's body shape reflects your combined lifestyle inputs: activity, nutrition, sleep, and stress all influence your physical form"
            />
            <ProfileMetric
              icon="🔭"
              title="Energy & Vitality"
              description={`Animated glow changes color based on your ${liveProfile.lifestyleScore || 50}/100 wellness score, showing your overall energy`}
            />
            <ProfileMetric
              icon="😊"
              title="Mental Wellness"
              description={`Avatar expression reflects stress (${liveProfile.stress || 3}/5) and posture shows sleep quality (${liveProfile.sleep || 3}/5)`}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, color, reverse = false }) {
  const percentage = (value / max) * 100;
  const displayValue = reverse ? max - value + 1 : value;
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

function ProfileMetric({ icon, title, description }) {
  return (
    <div className="text-center p-4">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
