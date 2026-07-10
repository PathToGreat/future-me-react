import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateZoneScore, calculateAllLifeZones } from '../utils/lifeZoneEngine';
import { calculateHabitZoneBonuses } from '../utils/habitHelpers';
import { getZoneConfig, getZoneInputDefaults, getZoneColor } from '../utils/zoneConfig';
import { useAuth } from '../context/AuthContext';
import { fetchAllZoneHistories } from '../hooks/useZoneHistoryData';

export default function LifeZoneDetailsModal({ isOpen, onClose, zone, zoneId }) {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const zoneConfig = getZoneConfig(zoneId);
  const zoneColors = getZoneColor(zoneId);
  
  const [newLog, setNewLog] = useState(() => getZoneInputDefaults(zoneId));

  useEffect(() => {
    if (zoneId) {
      setNewLog(getZoneInputDefaults(zoneId));
    }
  }, [zoneId]);

  useEffect(() => {
    if (!isOpen || !user?.uid || !zoneId) return;

    setLoading(true);
    
    const zoneLogsRef = collection(db, 'users', user.uid, 'zoneLogs', zoneId, 'daily');
    const zoneQuery = query(zoneLogsRef, orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      zoneQuery,
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
        console.log(`📊 Loaded ${logs.length} zone-specific logs for ${zoneId}`);
      },
      (error) => {
        console.error('Error loading zone logs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, user?.uid, zoneId]);

  const handleSliderChange = (key, value) => {
    setNewLog(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !zoneId || !zoneConfig) return;

    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const logData = {
        date: today,
        timestamp: new Date().toISOString(),
        ...newLog
      };

      const zoneLogRef = doc(db, 'users', user.uid, 'zoneLogs', zoneId, 'daily', today);
      await setDoc(zoneLogRef, logData, { merge: true });

      console.log(`✅ ${zoneId} zone log saved:`, logData);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const currentUserData = userDoc.data();

      const zoneHistories = await fetchAllZoneHistories(user.uid, 30);
      
      if (!zoneHistories[zoneId]) {
        zoneHistories[zoneId] = [];
      }
      
      const existingIndex = zoneHistories[zoneId].findIndex(l => l.date === today);
      if (existingIndex >= 0) {
        zoneHistories[zoneId][existingIndex] = { ...logData, id: today };
      } else {
        zoneHistories[zoneId].unshift({ ...logData, id: today });
      }

      const habitsRef = collection(db, 'users', user.uid, 'habits');
      const habitsSnapshot = await getDocs(habitsRef);
      const habits = [];
      habitsSnapshot.forEach(docSnap => {
        habits.push({ id: docSnap.id, ...docSnap.data() });
      });

      const habitBonuses = calculateHabitZoneBonuses(habits);

      const updatedZones = calculateAllLifeZones(zoneHistories, habitBonuses);

      let updatedUserData = { 
        ...currentUserData,
        lifeZones: updatedZones 
      };

      // The Daily Quick Log now owns the profile's core lifestyle fields
      // (activity/nutrition/sleep/stress) — Health Detail must NOT overwrite them.
      // Instead persist the latest deep physical check-in for the ITE to read.
      if (zoneId === 'health') {
        updatedUserData.lastHealthDetail = { ...newLog, date: today };
      }

      await setDoc(userDocRef, updatedUserData, { merge: true });

      console.log('✅ User profile and Life Zones updated');
      console.log(`📊 Updated ${zoneId} zone score:`, updatedZones[zoneId]?.score);

      alert(`✅ ${zoneConfig.title} log saved!\n\nNew score: ${updatedZones[zoneId]?.score || 50} points`);

      setNewLog(getZoneInputDefaults(zoneId));
      
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Error submitting zone log:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInputColor = (colorName) => {
    const colors = {
      blue: { slider: 'accent-blue-600', text: 'text-blue-600', bg: 'bg-blue-200' },
      green: { slider: 'accent-green-600', text: 'text-green-600', bg: 'bg-green-200' },
      purple: { slider: 'accent-purple-600', text: 'text-purple-600', bg: 'bg-purple-200' },
      red: { slider: 'accent-red-600', text: 'text-red-600', bg: 'bg-red-200' },
      orange: { slider: 'accent-orange-600', text: 'text-orange-600', bg: 'bg-orange-200' },
      pink: { slider: 'accent-pink-600', text: 'text-pink-600', bg: 'bg-pink-200' },
      indigo: { slider: 'accent-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-200' },
      teal: { slider: 'accent-teal-600', text: 'text-teal-600', bg: 'bg-teal-200' },
      amber: { slider: 'accent-amber-600', text: 'text-amber-600', bg: 'bg-amber-200' },
      cyan: { slider: 'accent-cyan-600', text: 'text-cyan-600', bg: 'bg-cyan-200' },
      emerald: { slider: 'accent-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-200' },
      violet: { slider: 'accent-violet-600', text: 'text-violet-600', bg: 'bg-violet-200' }
    };
    return colors[colorName] || colors.blue;
  };

  if (!isOpen || !zoneConfig) return null;

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
          <div className={`sticky top-0 bg-gradient-to-r ${zoneColors.bg} text-white p-6 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{zoneConfig.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{zoneConfig.title}</h2>
                  <p className="text-white/80 text-sm mt-1">{zoneConfig.description}</p>
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
              <h3 className="text-lg font-bold text-gray-800 mb-3">Log Today's {zoneConfig.title} Metrics</h3>
              <p className="text-sm text-gray-600 mb-4">
                These inputs are specific to your {zoneConfig.title} zone and directly affect its score.
              </p>

              <div className={`space-y-4 ${zoneColors.light} rounded-xl p-5 border ${zoneColors.border}`}>
                {zoneConfig.inputs.map((input) => {
                  const inputColors = getInputColor(input.color);
                  return (
                    <div key={input.key}>
                      <label className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">{input.label}</span>
                          <p className="text-xs text-gray-500">{input.description}</p>
                        </div>
                        <span className={`text-lg font-bold ${inputColors.text}`}>{newLog[input.key] || 3}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={newLog[input.key] || 3}
                        onChange={(e) => handleSliderChange(input.key, parseInt(e.target.value))}
                        className={`w-full h-2 ${inputColors.bg} rounded-lg appearance-none cursor-pointer ${inputColors.slider}`}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{input.minLabel}</span>
                        <span>{input.maxLabel}</span>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full mt-4 py-3 bg-gradient-to-r ${zoneColors.bg} text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Saving...' : `Save ${zoneConfig.title} Log`}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📊</span>
                Recent {zoneConfig.title} Logs
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : dailyLogs.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">No {zoneConfig.title.toLowerCase()} logs yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start logging to track your {zoneConfig.title.toLowerCase()} progress</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dailyLogs.map((log) => {
                    // Only show fields actually recorded on this log, so legacy
                    // entries don't render misleading default values.
                    const presentInputs = zoneConfig.inputs.filter((input) => log[input.key] !== undefined);
                    return (
                      <div
                        key={log.id}
                        className={`${zoneColors.light} rounded-lg p-4 border ${zoneColors.border}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">{log.date}</span>
                        </div>
                        {presentInputs.length > 0 ? (
                          <div
                            className="grid gap-2 text-xs"
                            style={{ gridTemplateColumns: `repeat(${Math.min(presentInputs.length, 4)}, minmax(0, 1fr))` }}
                          >
                            {presentInputs.map((input) => {
                              const inputColors = getInputColor(input.color);
                              return (
                                <div key={input.key} className="text-center">
                                  <div className={`font-bold ${inputColors.text}`}>{log[input.key]}</div>
                                  <div className="text-gray-500 truncate">{input.label.split(' ')[0]}</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Daily quick-log entry</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {zone?.details && (
              <div className={`${zoneColors.light} rounded-lg p-4 border ${zoneColors.border}`}>
                <h4 className="text-sm font-bold text-gray-700 mb-2">{zoneConfig.title} Zone Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(zone.details)
                    .filter(([key]) => !['interpretation'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-semibold text-gray-800">
                          {typeof value === 'number' ? Math.round(value) : value}
                        </span>
                      </div>
                    ))}
                </div>
                {zone.details.interpretation && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Status: </span>
                    <span className={`text-xs font-semibold capitalize ${
                      zone.details.interpretation === 'excellent' ? 'text-green-600' :
                      zone.details.interpretation === 'strong' ? 'text-blue-600' :
                      zone.details.interpretation === 'developing' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {zone.details.interpretation}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
