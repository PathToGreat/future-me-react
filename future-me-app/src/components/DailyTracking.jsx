import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateLifeZones } from '../utils/lifeZoneCalculator';
import { analyzeTrends } from '../utils/analyzeTrends';

const DailyTracking = ({ onClose, onSave }) => {
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
    stress: ['Overwhelming', 'High', 'Moderate', 'Low', 'Minimal'],
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
      
      // Calculate lifestyle score from metrics
      const lifestyleScore = ((metrics.activity + metrics.nutrition + metrics.sleep + (5 - metrics.stress)) / 16) * 100;

      // Save to dailyData collection
      const dailyDataRef = doc(db, 'users', user.uid, 'dailyData', today);
      await setDoc(dailyDataRef, {
        sleep: metrics.sleep,
        activity: metrics.activity,
        nutrition: metrics.nutrition,
        stress: metrics.stress,
        timestamp: serverTimestamp(),
      });

      // Also update main user profile so Dashboard refreshes immediately
      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(userProfileRef, {
        sleep: metrics.sleep,
        activity: metrics.activity,
        nutrition: metrics.nutrition,
        stress: metrics.stress,
        lifestyleScore: lifestyleScore,
      }, { merge: true });

      console.log('✅ Saved daily metrics and updated profile - lifestyleScore:', lifestyleScore.toFixed(1));

      // Recalculate and save life zones
      await recalculateLifeZones(user.uid, metrics, lifestyleScore);

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

  const recalculateLifeZones = async (userId, currentMetrics, lifestyleScore) => {
    try {
      // Fetch recent daily data for trend analysis
      const dailyDataRef = collection(db, 'users', userId, 'dailyData');
      const dailyDataQuery = query(dailyDataRef, orderBy('timestamp', 'desc'), limit(30));
      const snapshot = await getDocs(dailyDataQuery);
      
      const dailyData = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        dailyData.push({
          id: docSnap.id,
          date: docSnap.id,
          activity: data.activity,
          nutrition: data.nutrition,
          sleep: data.sleep,
          stress: data.stress,
          lifestyleScore: ((data.activity + data.nutrition + data.sleep + (5 - data.stress)) / 16) * 100
        });
      });

      // Analyze trends
      const trends = analyzeTrends(dailyData);

      // Calculate life zones
      const userMetrics = {
        activity: currentMetrics.activity,
        nutrition: currentMetrics.nutrition,
        sleep: currentMetrics.sleep,
        stress: currentMetrics.stress,
        lifestyleScore: lifestyleScore
      };

      const lifeZones = calculateLifeZones(userMetrics, trends, dailyData);

      // Save to lifeZones document
      const lifeZonesRef = doc(db, 'users', userId, 'lifeZones', 'current');
      await setDoc(lifeZonesRef, {
        ...lifeZones,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log('🎯 Life zones recalculated and saved:', lifeZones);
    } catch (error) {
      console.error('Error recalculating life zones:', error);
      // Don't throw - life zones are supplementary data
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
        <h2 className="text-2xl font-bold text-gray-800">Log Today's Metrics</h2>
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
          {saving ? 'Saving...' : 'Save Metrics'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Your metrics are saved securely and used to track your progress over time.
      </p>
    </motion.div>
  );
};

export default DailyTracking;
