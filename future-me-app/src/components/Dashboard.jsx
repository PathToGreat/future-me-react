import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FutureMeAvatar from './FutureMeAvatar';
import ImageUpload from './ImageUpload';
import { useHistoryData, saveDailySnapshot } from '../hooks/useHistoryData';

export default function Dashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  const { historyData, trendAnalysis, loading: historyLoading } = useHistoryData(user?.uid, userProfile);

  useEffect(() => {
    if (userProfile && !userProfile.onboardingCompleted) {
      navigate('/onboarding');
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    if (userProfile) {
      console.log('📊 Dashboard Updated with new metrics:');
      console.log('  - Lifestyle Score:', userProfile.lifestyleScore);
      console.log('  - Activity:', userProfile.activity);
      console.log('  - Nutrition:', userProfile.nutrition);
      console.log('  - Sleep:', userProfile.sleep);
      console.log('  - Stress:', userProfile.stress);
      console.log('  - Goals:', userProfile.goals);
    }
  }, [userProfile]);

  useEffect(() => {
    if (user && userProfile && userProfile.onboardingCompleted) {
      const lastSaved = localStorage.getItem(`lastSnapshot_${user.uid}`);
      const today = new Date().toISOString().split('T')[0];
      
      if (lastSaved !== today) {
        console.log('📅 New day detected - saving daily snapshot');
        saveDailySnapshot(user.uid, userProfile);
        localStorage.setItem(`lastSnapshot_${user.uid}`, today);
      }
    }
  }, [user, userProfile]);

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRetake = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Your Future Self</h1>
            <p className="text-gray-600">Based on your current lifestyle choices</p>
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Personalize Your Avatar</h2>
          <p className="text-gray-600 text-sm mb-4">
            Upload a full-body image to help your avatar reflect your physical appearance. Your avatar will adapt based on the uploaded image.
          </p>
          <ImageUpload onUploadSuccess={() => console.log('🎨 Dashboard: Image upload successful, avatar will update automatically')} />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card flex items-center justify-center p-12 bg-gradient-to-br from-blue-50 to-purple-50"
          >
            <FutureMeAvatar
              lifestyleScore={userProfile.lifestyleScore || 50}
              activity={userProfile.activity || 3}
              nutrition={userProfile.nutrition || 3}
              sleep={userProfile.sleep || 3}
              stress={userProfile.stress || 3}
              images={userProfile.images || []}
              trendAnalysis={trendAnalysis}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Lifestyle Metrics</h2>
              <div className="space-y-4">
                <MetricBar label="Physical Activity" value={userProfile.activity} max={5} color="blue" />
                <MetricBar label="Nutrition Quality" value={userProfile.nutrition} max={5} color="green" />
                <MetricBar label="Sleep Quality" value={userProfile.sleep} max={5} color="purple" />
                <MetricBar label="Stress Level" value={userProfile.stress} max={5} color="red" reverse />
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Goals</h2>
              <div className="flex flex-wrap gap-2">
                {userProfile.goals && userProfile.goals.length > 0 ? (
                  userProfile.goals.map((goal, idx) => (
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
                <span className="text-5xl font-bold">{Math.round(userProfile.lifestyleScore || 50)}</span>
                <span className="text-2xl mb-2">/100</span>
              </div>
              <p className="text-blue-100 mt-2">
                {(() => {
                  const score = userProfile.lifestyleScore || 50;
                  let summary = '';
                  
                  if (score >= 80) {
                    summary = "You're on an excellent path! Keep up the great work.";
                  } else if (score >= 60) {
                    summary = "Good progress! Some areas can improve.";
                  } else {
                    summary = "Let's focus on building healthier habits.";
                  }
                  
                  console.log('💯 Wellness Score:', score);
                  console.log('📋 Summary:', summary);
                  
                  return summary;
                })()}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 card"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Understanding Your Future Self</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Body Composition</h3>
              <p className="text-sm text-gray-600">
                {(() => {
                  const nutrition = userProfile.nutrition || 3;
                  const activity = userProfile.activity || 3;
                  console.log('💪 Body Composition - Nutrition:', nutrition, 'Activity:', activity);
                  return `Your avatar's body width reflects nutrition (${nutrition}/5) and posture shows activity level (${activity}/5)`;
                })()}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔭</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Energy & Vitality</h3>
              <p className="text-sm text-gray-600">
                {(() => {
                  const score = userProfile.lifestyleScore || 50;
                  const energyLevel = ((userProfile.activity + userProfile.nutrition + userProfile.sleep + (5 - userProfile.stress)) / 16 * 100).toFixed(0);
                  console.log('✨ Energy & Vitality - Score:', score, 'Energy Level:', energyLevel);
                  return `Animated glow changes color based on your ${score}/100 wellness score, showing your overall energy`;
                })()}
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">😊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mental Wellness</h3>
              <p className="text-sm text-gray-600">
                {(() => {
                  const stress = userProfile.stress || 3;
                  const sleep = userProfile.sleep || 3;
                  console.log('😊 Mental Wellness - Stress:', stress, 'Sleep:', sleep);
                  return `Avatar expression reflects stress (${stress}/5) and posture shows sleep quality (${sleep}/5)`;
                })()}
              </p>
            </div>
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
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
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
