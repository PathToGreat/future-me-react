import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FutureMeAvatar from './FutureMeAvatar';

export default function Dashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (userProfile && !userProfile.onboardingCompleted) {
      navigate('/onboarding');
    }
  }, [userProfile, navigate]);

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
                {userProfile.lifestyleScore >= 75
                  ? "You're on an excellent path! Keep up the great work."
                  : userProfile.lifestyleScore >= 50
                  ? "You're making progress. Small changes can lead to big improvements!"
                  : "There's room for improvement. Start with one healthy habit today!"}
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
                Your avatar's shape reflects your nutrition and activity levels
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔭</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Energy & Vitality</h3>
              <p className="text-sm text-gray-600">
                The glow and animation show your overall energy levels
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">😊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mental Wellness</h3>
              <p className="text-sm text-gray-600">
                Expression and posture indicate stress and sleep quality
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
