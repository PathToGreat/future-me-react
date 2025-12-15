import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const NOTICING_TEMPLATES = [
  {
    id: 'baseline_stress_lower',
    condition: (data) => data.currentStress < data.baselineStress - 0.5,
    text: 'Your baseline stress is now lower than when you started.',
    category: 'stress'
  },
  {
    id: 'logging_consistency',
    condition: (data) => data.recentLoggingRate > data.initialLoggingRate + 0.2,
    text: 'You are logging with more consistency than your first two weeks.',
    category: 'consistency'
  },
  {
    id: 'sleep_improved',
    condition: (data) => data.currentSleep > data.baselineSleep + 0.3,
    text: 'Your average sleep quality has improved since you began tracking.',
    category: 'sleep'
  },
  {
    id: 'activity_increase',
    condition: (data) => data.currentActivity > data.baselineActivity + 0.4,
    text: 'Your activity levels are higher than your initial baseline.',
    category: 'activity'
  },
  {
    id: 'stress_stabilized',
    condition: (data) => data.stressVariance < 0.5 && data.historyLength >= 10,
    text: 'Your stress levels have become more stable over time.',
    category: 'stress'
  },
  {
    id: 'logging_streak',
    condition: (data) => data.currentStreak >= 7,
    text: 'You have maintained awareness tracking for a full week.',
    category: 'consistency'
  },
  {
    id: 'nutrition_consistency',
    condition: (data) => data.nutritionConsistency > 0.7,
    text: 'Your nutrition patterns show increased consistency.',
    category: 'nutrition'
  },
  {
    id: 'overall_score_up',
    condition: (data) => data.currentScore > data.baselineScore + 5,
    text: 'Your overall wellness indicators have shifted upward.',
    category: 'overall'
  }
];

function calculateNoticingData(historyData, baseline, liveProfile) {
  if (!historyData || historyData.length < 7) {
    return null;
  }

  const last7Days = historyData.slice(0, 7);
  const first14Days = historyData.slice(-14);
  
  const avg = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const variance = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  };

  const countStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < historyData.length; i++) {
      const logDate = new Date(historyData[i].date);
      logDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const diffDays = Math.abs(Math.floor((logDate - expectedDate) / (1000 * 60 * 60 * 24)));
      if (diffDays <= 1) streak++;
      else break;
    }
    return streak;
  };

  return {
    currentStress: avg(last7Days, 'stress'),
    baselineStress: baseline?.stress || 3,
    currentSleep: avg(last7Days, 'sleep'),
    baselineSleep: baseline?.sleep || 3,
    currentActivity: avg(last7Days, 'activity'),
    baselineActivity: baseline?.activity || 3,
    stressVariance: variance(last7Days, 'stress'),
    nutritionConsistency: 1 - (variance(last7Days, 'nutrition') / 2),
    historyLength: historyData.length,
    currentStreak: countStreak(),
    recentLoggingRate: last7Days.length / 7,
    initialLoggingRate: first14Days.length > 7 ? (first14Days.slice(-7).length / 7) : 0.3,
    currentScore: liveProfile?.lifestyleScore || 50,
    baselineScore: baseline?.lifestyleScore || 50
  };
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek);
}

export default function NoticingCard({ onNoticingTriggered }) {
  const { historyData, liveProfile } = useApp();
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentNoticing, setCurrentNoticing] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);

  const baseline = liveProfile?.onboardingBaseline || {};
  
  const currentWeek = getWeekNumber();
  const dismissKey = `noticing_dismissed_${user?.uid}_${currentWeek}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [dismissKey]);

  const noticingData = useMemo(() => 
    calculateNoticingData(historyData, baseline, liveProfile),
    [historyData, baseline, liveProfile]
  );

  useEffect(() => {
    if (!noticingData || isDismissed) {
      setCurrentNoticing(null);
      return;
    }

    for (const template of NOTICING_TEMPLATES) {
      try {
        if (template.condition(noticingData)) {
          setCurrentNoticing(template);
          if (onNoticingTriggered) {
            onNoticingTriggered(true);
          }
          return;
        }
      } catch (e) {
        continue;
      }
    }
    
    setCurrentNoticing(null);
  }, [noticingData, isDismissed, onNoticingTriggered]);

  const handleShare = useCallback(async () => {
    if (!currentNoticing) return;

    const shareText = `Observed Change: ${currentNoticing.text}\n\nTracking my awareness journey.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Observation',
          text: shareText
        });
        setShareStatus('shared');
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          setShareStatus('copied');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
    }

    setTimeout(() => setShareStatus(null), 2000);
  }, [currentNoticing]);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, 'true');
    setIsDismissed(true);
  };

  if (!currentNoticing || isDismissed || !historyData || historyData.length < 7) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="text-lg">📊</div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Observed Change</h4>
              <p className="text-sm text-gray-600">{currentNoticing.text}</p>
              <button
                onClick={handleShare}
                className="text-xs text-gray-400 hover:text-gray-600 mt-2 flex items-center gap-1"
              >
                {shareStatus === 'copied' ? '✓ Copied' : shareStatus === 'shared' ? '✓ Shared' : 'Share this reflection'}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-sm ml-2"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
