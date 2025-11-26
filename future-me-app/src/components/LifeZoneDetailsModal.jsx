import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateAllLifeZones } from '../utils/lifeZoneEngine';
import { calculateHabitZoneBonuses } from '../utils/habitHelpers';
import { useAuth } from '../context/AuthContext';

export default function LifeZoneDetailsModal({ isOpen, onClose, zone, zoneId }) {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newLog, setNewLog] = useState({
    sleep: 3,
    activity: 3,
    nutrition: 3,
    stress: 3
  });

  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    setLoading(true);
    const dailyDataRef = collection(db, 'users', user.uid, 'dailyData');
    const dailyQuery = query(dailyDataRef, orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      dailyQuery,
      (snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logs.push({
            id: docSnap.id,
            date: docSnap.id,
            ...data
          });
        });
        setDailyLogs(logs);
        setLoading(false);
        console.log(`📊 Loaded ${logs.length} daily logs for ${zoneId}`);
      },
      (error) => {
        console.error('Error loading daily logs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user?.uid, zoneId]);

  const handleSliderChange = (metric, value) => {
    setNewLog(prev => ({ ...prev, [metric]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid) return;

    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const lifestyleScore = ((newLog.activity + newLog.nutrition + newLog.sleep + (5 - newLog.stress)) / 16) * 100;

      const logData = {
        date: today,
        timestamp: new Date().toISOString(),
        activity: newLog.activity,
        nutrition: newLog.nutrition,
        sleep: newLog.sleep,
        stress: newLog.stress,
        lifestyleScore: Math.round(lifestyleScore)
      };

      const dailyDataRef = doc(db, 'users', user.uid, 'dailyData', today);
      await setDoc(dailyDataRef, logData, { merge: true });

      console.log('✅ Daily log saved to dailyData collection:', logData);

      const userDocRef = doc(db, 'users', user.uid);
      
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const currentUserData = userDoc.data();

      const historyRef = collection(db, 'users', user.uid, 'dailyData');
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'), limit(30));
      const historySnapshot = await getDocs(historyQuery);
      
      const historyData = [];
      historySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        historyData.push({ 
          id: docSnap.id,
          date: docSnap.id,
          ...data
        });
      });

      const habitsRef = collection(db, 'users', user.uid, 'habits');
      const habitsSnapshot = await getDocs(habitsRef);
      const habits = [];
      habitsSnapshot.forEach(docSnap => {
        habits.push({ id: docSnap.id, ...docSnap.data() });
      });

      const habitBonuses = calculateHabitZoneBonuses(habits);

      const trendAnalysis = calculateTrendAnalysis(historyData);

      const updatedUserData = {
        ...currentUserData,
        activity: newLog.activity,
        nutrition: newLog.nutrition,
        sleep: newLog.sleep,
        stress: newLog.stress,
        lifestyleScore: Math.round(lifestyleScore)
      };

      const updatedZones = calculateAllLifeZones(
        updatedUserData,
        trendAnalysis,
        historyData,
        habitBonuses
      );

      await setDoc(userDocRef, {
        ...currentUserData,
        activity: newLog.activity,
        nutrition: newLog.nutrition,
        sleep: newLog.sleep,
        stress: newLog.stress,
        lifestyleScore: Math.round(lifestyleScore),
        lifeZones: updatedZones
      }, { merge: true });

      console.log('✅ User profile and Life Zones updated atomically');
      console.log(`📊 Updated ${zoneId} zone score:`, updatedZones[zoneId]?.score);

      alert(`✅ Daily log saved successfully!\n\n${zone?.title} Zone updated to ${updatedZones[zoneId]?.score || 50} points.`);

      setNewLog({ sleep: 3, activity: 3, nutrition: 3, stress: 3 });
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error submitting daily log:', error);
      alert('Failed to save daily log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTrendAnalysis = (historyData) => {
    if (!historyData || historyData.length < 2) return null;

    const sorted = [...historyData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const calculateSlope = (metric) => {
      const values = sorted.map(d => d[metric] || 3);
      const n = values.length;
      const xMean = (n - 1) / 2;
      const yMean = values.reduce((sum, v) => sum + v, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += (i - xMean) ** 2;
      }
      
      return denominator === 0 ? 0 : numerator / denominator;
    };

    return {
      sleepTrend: calculateSlope('sleep'),
      activityTrend: calculateSlope('activity'),
      nutritionTrend: calculateSlope('nutrition'),
      stressTrend: calculateSlope('stress'),
      trendSlope: calculateSlope('lifestyleScore') / 10
    };
  };

  const getZoneDescription = () => {
    const descriptions = {
      health: 'Track your physical wellness through activity, nutrition, and sleep quality',
      socialEmotional: 'Monitor your emotional balance and stress management',
      wealth: 'Build consistency in your daily tracking and personal growth',
      faith: 'Strengthen your commitment through daily dedication and streaks',
      family: 'Balance your energy and stress for harmonious relationships',
      community: 'Engage consistently and maintain low stress for connection'
    };
    return descriptions[zoneId] || 'Track your progress in this life zone';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{zone?.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{zone?.title}</h2>
                  <p className="text-blue-100 text-sm mt-1">{getZoneDescription()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Score</span>
                <span className="text-3xl font-bold">{zone?.score || 50}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Log Today's Metrics</h3>
              <p className="text-sm text-gray-600 mb-2">
                Rate your daily activities to update your Life Zone scores
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                <p className="text-xs text-blue-800">
                  ℹ️ <strong>Note:</strong> These daily metrics affect all Life Zones. Each zone uses these metrics differently in its calculations.
                </p>
              </div>

              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5">
                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Physical Activity</span>
                    <span className="text-lg font-bold text-blue-600">{newLog.activity}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newLog.activity}
                    onChange={(e) => handleSliderChange('activity', parseInt(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Minimal</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Nutrition Quality</span>
                    <span className="text-lg font-bold text-green-600">{newLog.nutrition}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newLog.nutrition}
                    onChange={(e) => handleSliderChange('nutrition', parseInt(e.target.value))}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Sleep Quality</span>
                    <span className="text-lg font-bold text-purple-600">{newLog.sleep}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newLog.sleep}
                    onChange={(e) => handleSliderChange('sleep', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Stress Level</span>
                    <span className="text-lg font-bold text-red-600">{newLog.stress}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newLog.stress}
                    onChange={(e) => handleSliderChange('stress', parseInt(e.target.value))}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>Very High</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Today\'s Log'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📊</span>
                Recent Daily Logs
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : dailyLogs.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">No daily logs yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start logging to track your progress</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dailyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">{log.date}</span>
                        <span className="text-xs text-gray-500">
                          Score: {Math.round(log.lifestyleScore || 50)}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-blue-600 font-bold">{log.activity || 3}</div>
                          <div className="text-gray-500">Activity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-600 font-bold">{log.nutrition || 3}</div>
                          <div className="text-gray-500">Nutrition</div>
                        </div>
                        <div className="text-center">
                          <div className="text-purple-600 font-bold">{log.sleep || 3}</div>
                          <div className="text-gray-500">Sleep</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-600 font-bold">{log.stress || 3}</div>
                          <div className="text-gray-500">Stress</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {zone?.details && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Zone Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(zone.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-gray-800">
                        {typeof value === 'number' ? Math.round(value) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
