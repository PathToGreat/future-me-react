import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateAllLifeZones } from '../utils/lifeZoneEngine';
import { getMetricTrend } from '../utils/analyzeTrends';
import { getUserHabits, calculateHabitZoneBonuses } from '../utils/habitHelpers';
import { calculateAchievementData, checkAndAwardAchievements } from '../utils/achievementEngine';
import { fetchAllZoneHistories } from '../hooks/useZoneHistoryData';

const DailyTracking = ({ onClose, onSave, onAchievementsEarned }) => {
  const [metrics, setMetrics] = useState({
    sleep: null,
    activity: null,
    nutrition: null,
    stress: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const metricLabels = {
    sleep: 'Sleep Quality',
    activity: 'Physical Activity',
    nutrition: 'Nutrition Quality',
    stress: 'Stress Level',
  };

  const metricDescriptions = {
    sleep: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
    activity: ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'],
    nutrition: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
    stress: ['Minimal', 'Low', 'Moderate', 'High', 'Overwhelming'],
  };

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);
      
      const healthLogRef = doc(db, 'users', user.uid, 'zoneLogs', 'health', 'daily', today);
      const healthLogSnap = await getDoc(healthLogRef);

      if (healthLogSnap.exists()) {
        const data = healthLogSnap.data();
        setMetrics({
          sleep: data.sleep || null,
          activity: data.activity || null,
          nutrition: data.nutrition || null,
          stress: data.stress || null,
        });
      } else {
        const docRef = doc(db, 'users', user.uid, 'dailyData', today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setMetrics({
            sleep: data.sleep || null,
            activity: data.activity || null,
            nutrition: data.nutrition || null,
            stress: data.stress || null,
          });
        }
      }
    } catch (error) {
      console.error('Error loading today\'s data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (metric, value) => {
    setMetrics((prev) => ({ ...prev, [metric]: value }));
  };

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const allFilled = Object.values(metrics).every((val) => val !== null);
    if (!allFilled) {
      alert('Please select a value for all metrics before saving.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const lifestyleScore = ((metrics.activity + metrics.nutrition + metrics.sleep + (5 - metrics.stress)) / 16) * 100;

      const healthLogData = {
        date: today,
        timestamp: new Date().toISOString(),
        activity: metrics.activity,
        nutrition: metrics.nutrition,
        sleep: metrics.sleep,
        stress: metrics.stress
      };

      const healthLogRef = doc(db, 'users', user.uid, 'zoneLogs', 'health', 'daily', today);
      await setDoc(healthLogRef, healthLogData, { merge: true });
      console.log('✅ Health zone log saved:', healthLogData);

      const dailyDataRef = doc(db, 'users', user.uid, 'dailyData', today);
      await setDoc(dailyDataRef, {
        ...healthLogData,
        lifestyleScore: Math.round(lifestyleScore),
        timestamp: serverTimestamp()
      }, { merge: true });

      const zoneHistories = await fetchAllZoneHistories(user.uid, 30);
      
      const existingIndex = zoneHistories.health?.findIndex(l => l.date === today) || -1;
      if (existingIndex >= 0) {
        zoneHistories.health[existingIndex] = { ...healthLogData, id: today };
      } else {
        if (!zoneHistories.health) zoneHistories.health = [];
        zoneHistories.health.unshift({ ...healthLogData, id: today });
      }

      let habitBonuses = null;
      try {
        const userHabits = await getUserHabits(user.uid);
        if (userHabits.length > 0) {
          habitBonuses = calculateHabitZoneBonuses(userHabits);
          console.log('🎯 Habit bonuses applied to Life Zones:', habitBonuses);
        }
      } catch (error) {
        console.error('Error fetching habits for zone calculation:', error);
      }

      const lifeZones = calculateAllLifeZones(zoneHistories, habitBonuses);

      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(userProfileRef, {
        sleep: metrics.sleep,
        activity: metrics.activity,
        nutrition: metrics.nutrition,
        stress: metrics.stress,
        lifestyleScore: Math.round(lifestyleScore),
        lifeZones: lifeZones,
      }, { merge: true });

      console.log('✅ Saved daily metrics and updated profile - lifestyleScore:', lifestyleScore.toFixed(1));
      console.log('🎯 Life Zones recalculated with zone-specific data');

      try {
        const historyRef = collection(db, 'users', user.uid, 'dailyData');
        const historyQuery = query(historyRef, orderBy('date', 'desc'), limit(30));
        const historySnapshot = await getDocs(historyQuery);
        
        const historyData = historySnapshot.docs.map(doc => ({
          date: doc.id,
          ...doc.data()
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        const userProfileSnap = await getDoc(userProfileRef);
        const fullProfile = userProfileSnap.data();
        
        const userHabits = await getUserHabits(user.uid);
        const achievementData = await calculateAchievementData(
          user.uid,
          userHabits,
          historyData,
          { ...fullProfile, lifeZones }
        );
        
        const newAchievements = await checkAndAwardAchievements(user.uid, achievementData);
        
        if (newAchievements.length > 0) {
          console.log('🏆 New achievements earned:', newAchievements);
          if (onAchievementsEarned) {
            onAchievementsEarned(newAchievements);
          }
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving daily data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card relative overflow-hidden"
    >
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-green-500 bg-opacity-95 flex items-center justify-center z-10"
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-2">✓</div>
            <div className="text-xl font-bold">Saved Successfully!</div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Log Today's Health Metrics</h2>
          <p className="text-sm text-gray-500 mt-1">These metrics update your Health Life Zone</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-6">
        Rate each area on a scale of 1-5 based on today's habits.
      </p>

      <div className="space-y-6">
        {Object.keys(metrics).map((metric) => (
          <div key={metric}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">
                {metricLabels[metric]}
              </label>
              {metrics[metric] && (
                <span className="text-xs text-gray-500">
                  {metricDescriptions[metric][metrics[metric] - 1]}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleMetricChange(metric, value)}
                  className={`flex-1 py-3 px-2 rounded-lg font-semibold transition-all ${
                    metrics[metric] === value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || Object.values(metrics).some((val) => val === null)}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            saving || Object.values(metrics).some((val) => val === null)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {saving ? 'Saving...' : 'Save Health Metrics'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Your metrics are saved securely and used to track your Health zone progress.
      </p>
    </motion.div>
  );
};

export default DailyTracking;
