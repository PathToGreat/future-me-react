import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { detectPatterns, selectPatternForDisplay } from '../utils/trendPatternEngine';
import { getLastShownPatterns } from '../utils/patternMetrics';

const FOCUS_AREAS = {
  sleep: { label: 'Sleep Consistency', icon: '💤', benefit: 'would support energy and stress recovery' },
  stress: { label: 'Stress Management', icon: '⚖️', benefit: 'would help with sleep quality and mental clarity' },
  activity: { label: 'Physical Activity', icon: '💪', benefit: 'would boost energy and mood stability' },
  nutrition: { label: 'Nutrition Habits', icon: '❤️', benefit: 'would enhance overall energy and recovery' }
};

const PATTERN_LEARN_MORE = {
  stress_stability: 'Sustained sleep consistency lowers baseline stress load and improves emotional resilience. Your data shows this connection over time.',
  sleep_recovery: 'When your body gets consistent rest, recovery becomes more efficient. Your metrics reflect this pattern in your recent history.',
  movement_buffer: 'Physical activity creates a physiological buffer against the effects of poor sleep or elevated stress. Your data confirms this for your patterns.',
  consistency_decay: 'Behavioral consistency tends to erode after disruptions. Recognizing the trigger point helps you anticipate and prepare.',
  nutrition_impact: 'Nutritional changes take time to show measurable effects on energy and focus. Your data is beginning to reflect these shifts.',
  focus_stability: 'When attention stays directed at one area long enough, measurable improvements accumulate. Frequent shifts scatter the effect.',
  stress_lag: 'Stress effects often appear in other metrics 1-2 days later. Your data shows this delayed response pattern.',
  recovery_slope: 'After a period of stability, your system responds to improvements more quickly. This is visible in your recent trajectory.',
  multi_metric_correlation: 'When two metrics consistently move together, it suggests a shared underlying driver. Your data reveals this connection.',
  early_signal: 'First measurable changes are significant because they indicate your system is responding. This is an early data point, not a conclusion.',
  plateau_detection: 'Stability in your metrics is not stagnation. It can indicate a new baseline forming or a period of consolidation.',
  focus_drift: 'Changing focus frequently makes it harder to see the effect of any single change. Your data reflects more variability during these periods.',
  peak_effect: 'Your highest-performing days tend to follow consistent behavior earlier in the week. The preparation period matters.',
  cross_impact: 'Gains in one area sometimes correspond with small dips in another. This is a common tradeoff visible in your data.',
  momentum: 'When multiple metrics improve simultaneously, it suggests a systemic shift rather than isolated change.'
};

function calculateNoticingData(historyData, baseline, liveProfile) {
  if (!historyData || historyData.length < 7) return null;
  const last7Days = historyData.slice(0, 7);
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
    currentScore: liveProfile?.lifestyleScore || 50,
    baselineScore: baseline?.lifestyleScore || 50
  };
}

const OBSERVATION_CHECKS = [
  {
    id: 'baseline_stress_lower',
    condition: (d) => d.currentStress < d.baselineStress - 0.5,
    headline: 'Your stress baseline has shifted downward.',
    supporting: 'Current stress readings are consistently below where you started.',
    learnMore: 'A lower stress baseline suggests your system is adapting. This shift became visible after sustained changes in your logged behavior.'
  },
  {
    id: 'sleep_improved',
    condition: (d) => d.currentSleep > d.baselineSleep + 0.3,
    headline: 'Your sleep quality has shifted above your starting point.',
    supporting: 'Average sleep quality over the past week is higher than your initial baseline.',
    learnMore: 'Sleep quality improvements often precede changes in other metrics. Your data shows this upward movement is sustained, not isolated.'
  },
  {
    id: 'activity_increase',
    condition: (d) => d.currentActivity > d.baselineActivity + 0.4,
    headline: 'Your activity levels are higher than your initial baseline.',
    supporting: 'Recent movement data exceeds where you started when you first began tracking.',
    learnMore: 'Increased activity creates downstream effects on stress regulation and sleep quality. These connections may become visible in your patterns over time.'
  },
  {
    id: 'stress_stabilized',
    condition: (d) => d.stressVariance < 0.5 && d.historyLength >= 10,
    headline: 'Your stress levels have become more stable over time.',
    supporting: 'Day-to-day stress variation has narrowed compared to earlier in your tracking.',
    learnMore: 'Lower stress variance indicates your system is regulating more consistently. This stability often supports improvements in other areas.'
  },
  {
    id: 'nutrition_consistency',
    condition: (d) => d.nutritionConsistency > 0.7,
    headline: 'Your nutrition patterns show increased consistency.',
    supporting: 'Day-to-day variation in nutrition quality has decreased in recent entries.',
    learnMore: 'Consistent nutrition supports stable energy levels and recovery. The effect accumulates over weeks rather than days.'
  }
];

function determineFocusArea(historyData, baseline) {
  if (!historyData || historyData.length < 3) return null;
  const last7Days = historyData.slice(0, 7);
  const avgMetrics = { sleep: 0, stress: 0, activity: 0, nutrition: 0 };
  last7Days.forEach(day => {
    avgMetrics.sleep += day.sleep || 0;
    avgMetrics.stress += day.stress || 0;
    avgMetrics.activity += day.activity || 0;
    avgMetrics.nutrition += day.nutrition || 0;
  });
  Object.keys(avgMetrics).forEach(key => { avgMetrics[key] = avgMetrics[key] / last7Days.length; });
  const gaps = [];
  if (baseline?.sleep) gaps.push({ area: 'sleep', gap: baseline.sleep - avgMetrics.sleep });
  if (baseline?.stress) gaps.push({ area: 'stress', gap: avgMetrics.stress - baseline.stress });
  if (baseline?.activity) gaps.push({ area: 'activity', gap: baseline.activity - avgMetrics.activity });
  if (baseline?.nutrition) gaps.push({ area: 'nutrition', gap: baseline.nutrition - avgMetrics.nutrition });
  if (avgMetrics.sleep < 3 || avgMetrics.stress > 3.5) return 'sleep';
  gaps.sort((a, b) => b.gap - a.gap);
  if (gaps.length > 0 && gaps[0].gap > 0.3) return gaps[0].area;
  return null;
}

function selectReflection(pattern, observation, dailyInsight, focusArea, historyData) {
  if (pattern) {
    return {
      type: 'pattern',
      icon: getPatternIcon(pattern.type),
      label: 'Pattern Detected',
      headline: pattern.message,
      supporting: `Based on ${pattern.data?.days || 7}+ days of your logged data. This observation is drawn directly from your metrics.`,
      learnMore: PATTERN_LEARN_MORE[pattern.type] || null
    };
  }

  if (observation) {
    return {
      type: 'observation',
      icon: '📊',
      label: 'Observed Change',
      headline: observation.headline,
      supporting: observation.supporting,
      learnMore: observation.learnMore
    };
  }

  if (dailyInsight) {
    return {
      type: 'insight',
      icon: getCategoryIcon(dailyInsight.category),
      label: 'Today',
      headline: dailyInsight.title,
      supporting: dailyInsight.message,
      learnMore: null
    };
  }

  if (focusArea) {
    const config = FOCUS_AREAS[focusArea];
    return {
      type: 'focus',
      icon: config.icon,
      label: 'Current Focus',
      headline: `This week, ${config.label.toLowerCase()} ${config.benefit}.`,
      supporting: 'Based on the gap between your recent averages and your baseline.',
      learnMore: null
    };
  }

  if (!historyData || historyData.length === 0) {
    return {
      type: 'welcome',
      icon: '📊',
      label: 'Getting Started',
      headline: 'Log your first day to begin building your reflection.',
      supporting: 'Once you have a few days of data, patterns and observations will appear here.',
      learnMore: null
    };
  }

  return {
    type: 'continuity',
    icon: '📊',
    label: 'Status',
    headline: 'Your data is being observed.',
    supporting: 'Patterns and changes will surface here as your history grows.',
    learnMore: null
  };
}

function getPatternIcon(type) {
  const icons = {
    stress_stability: '⚖️', sleep_recovery: '💤', movement_buffer: '💪',
    consistency_decay: '📉', nutrition_impact: '❤️', focus_stability: '🎯',
    stress_lag: '📊', recovery_slope: '📈', multi_metric_correlation: '📊',
    early_signal: '🌱', plateau_detection: '➡️', focus_drift: '📊',
    peak_effect: '⭐', cross_impact: '⚖️', momentum: '📈'
  };
  return icons[type] || '📊';
}

function getCategoryIcon(category) {
  const icons = {
    activity: '💪', nutrition: '❤️', sleep: '💤',
    stress: '⚖️', rhythm: '📈', general: '📊'
  };
  return icons[category] || '📊';
}

export default function TodaysReflection({ currentPattern, onPatternDismiss, onPatternExpand, onPatternReflection }) {
  const { liveProfile, historyData } = useApp();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dailyInsight, setDailyInsight] = useState(null);

  const baseline = liveProfile?.onboardingBaseline || {};

  useEffect(() => {
    if (user?.uid && historyData?.length > 0) {
      loadDailyInsight();
    }
  }, [user?.uid, historyData]);

  const loadDailyInsight = async () => {
    try {
      const insightsRef = doc(db, 'users', user.uid, 'insights', 'current');
      const snap = await getDoc(insightsRef);
      if (snap.exists()) {
        setDailyInsight(snap.data().dailyInsight || null);
      }
    } catch (error) {}
  };

  const observation = useMemo(() => {
    const noticingData = calculateNoticingData(historyData, baseline, liveProfile);
    if (!noticingData) return null;
    for (const check of OBSERVATION_CHECKS) {
      try {
        if (check.condition(noticingData)) return check;
      } catch (e) { continue; }
    }
    return null;
  }, [historyData, baseline, liveProfile]);

  const focusArea = useMemo(() => {
    return determineFocusArea(historyData, baseline);
  }, [historyData, baseline]);

  const reflection = useMemo(() => {
    return selectReflection(currentPattern, observation, dailyInsight, focusArea, historyData);
  }, [currentPattern, observation, dailyInsight, focusArea, historyData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Today's Reflection
          </span>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lg">{reflection.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {reflection.label}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-800 leading-snug mb-2">
              {reflection.headline}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {reflection.supporting}
            </p>
          </div>
        </div>

        {reflection.learnMore && (
          <div className="mt-4 pt-3 border-t border-gray-50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <motion.svg
                animate={{ rotate: isExpanded ? 90 : 0 }}
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
              Why this matters
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-gray-500 leading-relaxed mt-3 pl-4 border-l-2 border-slate-100">
                    {reflection.learnMore}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {reflection.type === 'pattern' && currentPattern && (
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                if (onPatternExpand) onPatternExpand(currentPattern.type);
                setIsExpanded(!isExpanded);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {isExpanded ? 'Less detail' : 'More detail'}
            </button>
            <button
              onClick={() => {
                if (onPatternDismiss) onPatternDismiss(currentPattern.type, Date.now());
              }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
