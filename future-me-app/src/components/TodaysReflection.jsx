import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { runIdentityTrajectoryEngine } from '../utils/identityTrajectoryEngine';
import { getIdentityBaseline } from '../utils/identityStateEngine';
import { generateTraitInsights, selectBestTraitReflection } from '../utils/traitInsightsEngine';
import { canRunITE } from '../utils/iteAvatarAdapter';

const METRIC_EXPLANATIONS = {
  sleep: {
    why: 'Sleep consistency stabilizes recovery signals, which makes energy and stress regulation more predictable.',
    tryThis: 'Try keeping wake time within a 60-minute window for a few days.'
  },
  stress: {
    why: 'Lower baseline stress improves decision quality and makes healthy habits easier to sustain.',
    tryThis: 'Try a short decompression block after work before family time.'
  },
  activity: {
    why: 'Steady movement supports mood regulation and improves sleep pressure at night.',
    tryThis: 'Try a 10-minute walk earlier in the day.'
  },
  nutrition: {
    why: 'Stable nutrition reduces energy volatility and supports recovery.',
    tryThis: 'Try keeping the first meal consistent for a few days.'
  },
  consistency: {
    why: 'Consistency reduces friction. When the routine is predictable, change requires less willpower.',
    tryThis: 'Try logging at the same time each day to reduce friction.'
  }
};

const PATTERN_EXPLANATIONS = {
  stress_stability: {
    metrics: ['sleep', 'stress'],
    why: 'Sustained sleep consistency lowers baseline stress load and improves emotional resilience. Your data shows this connection over time.',
    tryThis: 'Try keeping wake time within a 60-minute window for a few days.'
  },
  sleep_recovery: {
    metrics: ['sleep'],
    why: 'When your body gets consistent rest, recovery becomes more efficient. Your metrics reflect this pattern in your recent history.',
    tryThis: 'Try reducing screen exposure in the last hour before sleep.'
  },
  movement_buffer: {
    metrics: ['activity', 'stress'],
    why: 'Physical activity creates a physiological buffer against the effects of poor sleep or elevated stress. Your data confirms this for your patterns.',
    tryThis: 'Try a 10-minute walk earlier in the day.'
  },
  consistency_decay: {
    metrics: ['consistency'],
    why: 'Behavioral consistency tends to erode after disruptions. Recognizing the trigger point helps you anticipate and prepare.',
    tryThis: 'Try logging at the same time each day to reduce friction.'
  },
  nutrition_impact: {
    metrics: ['nutrition'],
    why: 'Nutritional changes take time to show measurable effects on energy and focus. Your data is beginning to reflect these shifts.',
    tryThis: 'Try keeping the first meal consistent for a few days.'
  },
  focus_stability: {
    metrics: ['consistency'],
    why: 'When attention stays directed at one area long enough, measurable improvements accumulate. Frequent shifts scatter the effect.',
    tryThis: null
  },
  stress_lag: {
    metrics: ['stress'],
    why: 'Stress effects often appear in other metrics 1-2 days later. Your data shows this delayed response pattern.',
    tryThis: 'Try a short decompression block after work before family time.'
  },
  recovery_slope: {
    metrics: ['sleep', 'activity'],
    why: 'After a period of stability, your system responds to improvements more quickly. This is visible in your recent trajectory.',
    tryThis: null
  },
  multi_metric_correlation: {
    metrics: ['sleep', 'stress'],
    why: 'When two metrics consistently move together, it suggests a shared underlying driver. Your data reveals this connection.',
    tryThis: null
  },
  early_signal: {
    metrics: ['consistency'],
    why: 'First measurable changes are significant because they indicate your system is responding. This is an early data point, not a conclusion.',
    tryThis: null
  },
  plateau_detection: {
    metrics: ['consistency'],
    why: 'Stability in your metrics is not stagnation. It can indicate a new baseline forming or a period of consolidation.',
    tryThis: null
  },
  focus_drift: {
    metrics: ['consistency'],
    why: 'Changing focus frequently makes it harder to see the effect of any single change. Your data reflects more variability during these periods.',
    tryThis: null
  },
  peak_effect: {
    metrics: ['activity', 'consistency'],
    why: 'Your highest-performing days tend to follow consistent behavior earlier in the week. The preparation period matters.',
    tryThis: null
  },
  cross_impact: {
    metrics: ['activity', 'nutrition'],
    why: 'Gains in one area sometimes correspond with small dips in another. This is a common tradeoff visible in your data.',
    tryThis: null
  },
  momentum: {
    metrics: ['consistency'],
    why: 'When multiple metrics improve simultaneously, it suggests a systemic shift rather than isolated change.',
    tryThis: null
  }
};

const OBSERVATION_EXPLANATIONS = {
  baseline_stress_lower: {
    metrics: ['stress'],
    why: 'Lower baseline stress improves decision quality and makes healthy habits easier to sustain.',
    tryThis: 'Try a short decompression block after work before family time.'
  },
  sleep_improved: {
    metrics: ['sleep'],
    why: 'Sleep consistency stabilizes recovery signals, which makes energy and stress regulation more predictable.',
    tryThis: 'Try keeping wake time within a 60-minute window for a few days.'
  },
  activity_increase: {
    metrics: ['activity'],
    why: 'Steady movement supports mood regulation and improves sleep pressure at night.',
    tryThis: 'Try a 10-minute walk earlier in the day.'
  },
  stress_stabilized: {
    metrics: ['stress'],
    why: 'When stress variance decreases, your system can allocate resources more efficiently toward recovery and adaptation.',
    tryThis: null
  },
  nutrition_consistency: {
    metrics: ['nutrition'],
    why: 'Stable nutrition reduces energy volatility and supports recovery.',
    tryThis: 'Try keeping the first meal consistent for a few days.'
  }
};

const FOCUS_AREAS = {
  sleep: { label: 'Sleep Consistency', icon: '💤', benefit: 'would support energy and stress recovery' },
  stress: { label: 'Stress Management', icon: '⚖️', benefit: 'would help with sleep quality and mental clarity' },
  activity: { label: 'Physical Activity', icon: '💪', benefit: 'would boost energy and mood stability' },
  nutrition: { label: 'Nutrition Habits', icon: '❤️', benefit: 'would enhance overall energy and recovery' }
};

function getExplanationForInsight(type, context) {
  if (type === 'pattern' && context.patternType) {
    const entry = PATTERN_EXPLANATIONS[context.patternType];
    if (entry) return { why: entry.why, tryThis: entry.tryThis };
    return { why: 'This pattern is drawn directly from your logged data. Continued tracking will clarify whether it persists.', tryThis: null };
  }

  if (type === 'observation' && context.observationId) {
    const entry = OBSERVATION_EXPLANATIONS[context.observationId];
    if (entry) return { why: entry.why, tryThis: entry.tryThis };
  }

  if (type === 'insight' && context.category) {
    const metricEntry = METRIC_EXPLANATIONS[context.category];
    if (metricEntry) return { why: metricEntry.why, tryThis: metricEntry.tryThis };
    return { why: 'This observation is based on your most recent log compared to your history. It reflects what your data shows today.', tryThis: null };
  }

  if (type === 'focus' && context.focusArea) {
    const metricEntry = METRIC_EXPLANATIONS[context.focusArea];
    if (metricEntry) return { why: metricEntry.why, tryThis: metricEntry.tryThis };
  }

  if (type === 'continuity') {
    return {
      why: 'Consistency reduces friction. When the routine is predictable, change requires less willpower.',
      tryThis: 'Try logging at the same time each day to reduce friction.'
    };
  }

  if (type === 'earlySignal') {
    return {
      why: 'Early readings reflect where your data starts relative to your assessment. These are not trends — trends require more days of tracking.',
      tryThis: null
    };
  }

  if (type === 'welcome') {
    return {
      why: 'Tracking builds a data foundation. Even a few days of logging creates enough signal to surface meaningful patterns.',
      tryThis: null
    };
  }

  return { why: null, tryThis: null };
}

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
    supporting: 'Current stress readings are consistently below where you started.'
  },
  {
    id: 'sleep_improved',
    condition: (d) => d.currentSleep > d.baselineSleep + 0.3,
    headline: 'Your sleep quality has shifted above your starting point.',
    supporting: 'Average sleep quality over the past week is higher than your initial baseline.'
  },
  {
    id: 'activity_increase',
    condition: (d) => d.currentActivity > d.baselineActivity + 0.4,
    headline: 'Your activity levels are higher than your initial baseline.',
    supporting: 'Recent movement data exceeds where you started when you first began tracking.'
  },
  {
    id: 'stress_stabilized',
    condition: (d) => d.stressVariance < 0.5 && d.historyLength >= 10,
    headline: 'Your stress levels have become more stable over time.',
    supporting: 'Day-to-day stress variation has narrowed compared to earlier in your tracking.'
  },
  {
    id: 'nutrition_consistency',
    condition: (d) => d.nutritionConsistency > 0.7,
    headline: 'Your nutrition patterns show increased consistency.',
    supporting: 'Day-to-day variation in nutrition quality has decreased in recent entries.'
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
    const explanation = getExplanationForInsight('pattern', { patternType: pattern.type });
    return {
      type: 'pattern',
      icon: getPatternIcon(pattern.type),
      label: 'Pattern Detected',
      headline: pattern.message,
      supporting: `Based on ${pattern.data?.days || 7}+ days of your logged data. This observation is drawn directly from your metrics.`,
      whyThisMatters: explanation.why,
      tryThis: explanation.tryThis,
      context: { patternType: pattern.type }
    };
  }

  if (observation) {
    const explanation = getExplanationForInsight('observation', { observationId: observation.id });
    return {
      type: 'observation',
      icon: '📊',
      label: 'Observed Change',
      headline: observation.headline,
      supporting: observation.supporting,
      whyThisMatters: explanation.why,
      tryThis: explanation.tryThis,
      context: { observationId: observation.id }
    };
  }

  if (dailyInsight) {
    const explanation = getExplanationForInsight('insight', { category: dailyInsight.category });
    return {
      type: 'insight',
      icon: getCategoryIcon(dailyInsight.category),
      label: 'Today',
      headline: dailyInsight.title,
      supporting: dailyInsight.message,
      whyThisMatters: explanation.why,
      tryThis: explanation.tryThis,
      context: { category: dailyInsight.category }
    };
  }

  if (focusArea) {
    const config = FOCUS_AREAS[focusArea];
    const explanation = getExplanationForInsight('focus', { focusArea });
    return {
      type: 'focus',
      icon: config.icon,
      label: 'Current Focus',
      headline: `This week, ${config.label.toLowerCase()} ${config.benefit}.`,
      supporting: 'Based on the gap between your recent averages and your baseline.',
      whyThisMatters: explanation.why,
      tryThis: explanation.tryThis,
      context: { focusArea }
    };
  }

  if (!historyData || historyData.length === 0) {
    const explanation = getExplanationForInsight('welcome', {});
    return {
      type: 'welcome',
      icon: '📊',
      label: 'Getting Started',
      headline: 'Log your first day to begin building your reflection.',
      supporting: 'Once you have a few days of data, patterns and observations will appear here.',
      whyThisMatters: explanation.why,
      tryThis: explanation.tryThis,
      context: {}
    };
  }

  const explanation = getExplanationForInsight('continuity', {});
  return {
    type: 'continuity',
    icon: '📊',
    label: 'Status',
    headline: 'Your data is being observed.',
    supporting: 'Patterns and changes will surface here as your history grows.',
    whyThisMatters: explanation.why,
    tryThis: explanation.tryThis,
    context: {}
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

  const baseline = useMemo(() => getIdentityBaseline(liveProfile) || {}, [liveProfile]);

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

  const traitReflection = useMemo(() => {
    if (!historyData || !canRunITE(historyData, baseline)) return null;
    try {
      const latestMetrics = historyData[0] || {};
      const rawMetrics = {
        activity: latestMetrics.activity ?? 3,
        nutrition: latestMetrics.nutrition ?? 3,
        sleep: latestMetrics.sleep ?? 3,
        stress: latestMetrics.stress ?? 3,
        energy: latestMetrics.energy ?? null,
        mood: latestMetrics.mood ?? null,
        sleepDuration: latestMetrics.sleepDuration ?? null,
        ...(liveProfile?.lastHealthDetail || {}),
        lifeZones: liveProfile?.lifeZones || {},
        habits: []
      };
      const iteResult = runIdentityTrajectoryEngine(rawMetrics, historyData, baseline);
      const traitInsightResult = generateTraitInsights(iteResult, historyData, baseline);
      return selectBestTraitReflection(traitInsightResult);
    } catch (e) {
      return null;
    }
  }, [historyData, baseline, liveProfile?.lifeZones]);

  const reflection = useMemo(() => {
    if (traitReflection) {
      return {
        ...traitReflection,
        context: { traitBased: true, implicatedTraits: traitReflection.implicatedTraits || [] }
      };
    }
    return selectReflection(currentPattern, observation, dailyInsight, focusArea, historyData);
  }, [traitReflection, currentPattern, observation, dailyInsight, focusArea, historyData]);

  const hasExpansion = reflection.whyThisMatters || reflection.tryThis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-slate-50/50 rounded-2xl border border-indigo-200/60 border-l-4 border-l-indigo-500 shadow-md overflow-hidden"
    >
      {/* Header band */}
      <div className="px-5 pt-4 pb-0 flex items-center gap-2">
        <span className="text-sm">📖</span>
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
          Today's Reflection
        </span>
      </div>

      <div className="p-5 pt-3">
        <div className="flex items-start gap-4">
          {/* Icon container — indigo tinted */}
          <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-lg">{reflection.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1.5">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                {reflection.label}
              </span>
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-3">
              {reflection.headline}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {reflection.supporting}
            </p>
          </div>
        </div>

        {hasExpansion && (
          <div className="mt-4 pt-3 border-t border-indigo-100/50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-medium"
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
                  {reflection.whyThisMatters && (
                    <p className="text-sm text-gray-500 leading-relaxed mt-3 pl-4 border-l-2 border-indigo-200">
                      {reflection.whyThisMatters}
                    </p>
                  )}
                  {reflection.tryThis && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 pl-4 border-l-2 border-indigo-100">
                      <span className="text-slate-500">Try this:</span> {reflection.tryThis}
                    </p>
                  )}
                  {reflection.consequence && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 pl-4 border-l-2 border-indigo-100 italic">
                      {reflection.consequence}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {reflection.type === 'pattern' && currentPattern && (
          <div className="mt-3 pt-3 border-t border-indigo-100/50 flex items-center justify-end">
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
