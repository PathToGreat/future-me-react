import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import FutureMeAvatar from "./FutureMeAvatar";
import ImageUpload from "./ImageUpload";
import { useHistoryData, saveDailySnapshot } from "../hooks/useHistoryData";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liveProfile, setLiveProfile] = useState(null);

  const { trendAnalysis } = useHistoryData(user?.uid, liveProfile);

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

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card flex items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-purple-50"
          >
            <FutureMeAvatar
              lifestyleScore={liveProfile.lifestyleScore || 50}
              activity={liveProfile.activity || 3}
              nutrition={liveProfile.nutrition || 3}
              sleep={liveProfile.sleep || 3}
              stress={liveProfile.stress || 3}
              images={liveProfile.images || []}
              trendAnalysis={trendAnalysis}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Your Lifestyle Metrics
              </h2>
              <div className="space-y-4">
                <MetricBar
                  label="Physical Activity"
                  value={liveProfile.activity}
                  max={5}
                  color="blue"
                />
                <MetricBar
                  label="Nutrition Quality"
                  value={liveProfile.nutrition}
                  max={5}
                  color="green"
                />
                <MetricBar
                  label="Sleep Quality"
                  value={liveProfile.sleep}
                  max={5}
                  color="purple"
                />
                <MetricBar
                  label="Stress Level"
                  value={liveProfile.stress}
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
              description={`Your avatar's body width reflects nutrition (${liveProfile.nutrition || 3}/5) and posture shows activity level (${liveProfile.activity || 3}/5)`}
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
