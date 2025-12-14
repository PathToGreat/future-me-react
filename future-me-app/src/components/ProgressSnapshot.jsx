import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

function calculateSnapshotData(historyData, baseline, liveProfile) {
  if (!historyData || historyData.length < 3) {
    return null;
  }

  const last7Days = historyData.slice(0, 7);
  
  const avg = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const currentSleep = avg(last7Days, 'sleep');
  const currentStress = avg(last7Days, 'stress');
  const currentActivity = avg(last7Days, 'activity');
  const currentNutrition = avg(last7Days, 'nutrition');

  const sleepChange = currentSleep - (baseline?.sleep || 3);
  const stressChange = (baseline?.stress || 3) - currentStress;
  const activityChange = currentActivity - (baseline?.activity || 3);
  const nutritionChange = currentNutrition - (baseline?.nutrition || 3);

  let focusInsight = '';
  if (stressChange > 0.3) {
    focusInsight = 'Stress levels have decreased since starting.';
  } else if (sleepChange > 0.3) {
    focusInsight = 'Sleep quality has improved over time.';
  } else if (activityChange > 0.3) {
    focusInsight = 'Activity levels have increased.';
  } else {
    focusInsight = 'Patterns are becoming more visible as you continue tracking.';
  }

  const reflectionOptions = [
    'Awareness of daily patterns is growing.',
    'Consistent tracking reveals what matters.',
    'Small shifts become visible over time.',
    'Self-observation leads to understanding.'
  ];
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const reflection = reflectionOptions[dayOfYear % reflectionOptions.length];

  return {
    startDate: historyData[historyData.length - 1]?.date || 'Beginning',
    daysTracked: historyData.length,
    starting: {
      sleep: baseline?.sleep || 3,
      stress: baseline?.stress || 3,
      activity: baseline?.activity || 3,
      nutrition: baseline?.nutrition || 3
    },
    current: {
      sleep: parseFloat(currentSleep.toFixed(1)),
      stress: parseFloat(currentStress.toFixed(1)),
      activity: parseFloat(currentActivity.toFixed(1)),
      nutrition: parseFloat(currentNutrition.toFixed(1))
    },
    focusInsight,
    reflection
  };
}

function MetricComparison({ label, icon, starting, current }) {
  const diff = current - starting;
  const improved = label === 'Stress' ? diff < 0 : diff > 0;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{icon} {label}</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">{starting.toFixed(1)}</span>
        <span className="text-gray-400">➡️</span>
        <span className={improved ? 'text-green-600 font-medium' : 'text-gray-700'}>
          {current.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export default function ProgressSnapshot({ isOpen, onClose }) {
  const { historyData, liveProfile } = useApp();
  const [copied, setCopied] = useState(false);
  
  const baseline = liveProfile?.onboardingBaseline || {};
  
  const snapshotData = useMemo(() => 
    calculateSnapshotData(historyData, baseline, liveProfile),
    [historyData, baseline, liveProfile]
  );

  const handleShare = async () => {
    if (!snapshotData) return;

    const shareText = `Here's what I'm noticing about myself:

${snapshotData.daysTracked} days of awareness tracking

Sleep: ${snapshotData.starting.sleep} ➡️ ${snapshotData.current.sleep}
Stress: ${snapshotData.starting.stress} ➡️ ${snapshotData.current.stress}
Activity: ${snapshotData.starting.activity} ➡️ ${snapshotData.current.activity}

${snapshotData.focusInsight}

${snapshotData.reflection}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Progress Snapshot',
          text: shareText
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg">Progress Snapshot</h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-white/80 text-sm mt-1">Here's what I'm noticing about myself</p>
          </div>

          {snapshotData ? (
            <div className="p-6">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-gray-800">{snapshotData.daysTracked}</span>
                <span className="text-gray-500 ml-2">days of awareness tracking</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Starting ➡️ Current</h3>
                <MetricComparison 
                  label="Sleep" 
                  icon="💤" 
                  starting={snapshotData.starting.sleep} 
                  current={snapshotData.current.sleep} 
                />
                <MetricComparison 
                  label="Stress" 
                  icon="⚖️" 
                  starting={snapshotData.starting.stress} 
                  current={snapshotData.current.stress} 
                />
                <MetricComparison 
                  label="Activity" 
                  icon="💪" 
                  starting={snapshotData.starting.activity} 
                  current={snapshotData.current.activity} 
                />
                <MetricComparison 
                  label="Nutrition" 
                  icon="❤️" 
                  starting={snapshotData.starting.nutrition} 
                  current={snapshotData.current.nutrition} 
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">{snapshotData.focusInsight}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-800 italic">{snapshotData.reflection}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Share'}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                This snapshot is private. Share only if you choose.
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>Keep tracking to build your progress snapshot.</p>
              <p className="text-sm mt-2">At least 3 days of data needed.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
