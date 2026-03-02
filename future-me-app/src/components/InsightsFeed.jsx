import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import InsightItem from './InsightItem';
import {
  loadRecentInsights,
  saveInsightsBatch,
  markInsightRead,
  countUnreadRecent,
  isDuplicateInsight,
  generateInsightsFromSources,
  normalizeInsight
} from '../utils/insightsFeedEngine';
import { detectPatterns } from '../utils/trendPatternEngine';
import { runIdentityTrajectoryEngine } from '../utils/identityTrajectoryEngine';
import { generateTraitInsights } from '../utils/traitInsightsEngine';
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
  stress_stability: { why: 'Sustained sleep consistency lowers baseline stress load and improves emotional resilience.', tryThis: 'Try keeping wake time within a 60-minute window for a few days.' },
  sleep_recovery: { why: 'When your body gets consistent rest, recovery becomes more efficient.', tryThis: null },
  movement_buffer: { why: 'Physical activity creates a physiological buffer against the effects of poor sleep or elevated stress.', tryThis: 'Try a 10-minute walk earlier in the day.' },
  consistency_decay: { why: 'Behavioral consistency tends to erode after disruptions. Recognizing the trigger point helps you anticipate.', tryThis: 'Try logging at the same time each day to reduce friction.' },
  nutrition_impact: { why: 'Nutritional changes take time to show measurable effects on energy and focus.', tryThis: 'Try keeping the first meal consistent for a few days.' },
  focus_stability: { why: 'When attention stays directed at one area long enough, measurable improvements accumulate.', tryThis: null },
  stress_lag: { why: 'Stress effects often appear in other metrics 1-2 days later.', tryThis: 'Try a short decompression block after work before family time.' },
  recovery_slope: { why: 'After a period of stability, your system responds to improvements more quickly.', tryThis: null },
  multi_metric_correlation: { why: 'When two metrics consistently move together, it suggests a shared underlying driver.', tryThis: null },
  early_signal: { why: 'First measurable changes indicate your system is responding. This is an early data point, not a conclusion.', tryThis: null },
  plateau_detection: { why: 'Stability in your metrics is not stagnation. It can indicate a new baseline forming.', tryThis: null },
  momentum: { why: 'When multiple metrics improve simultaneously, it suggests a systemic shift rather than isolated change.', tryThis: null }
};

const OBSERVATION_EXPLANATIONS = {
  baseline_stress_lower: { why: 'Lower baseline stress improves decision quality and makes healthy habits easier to sustain.', tryThis: 'Try a short decompression block after work before family time.' },
  sleep_improved: { why: 'Sleep consistency stabilizes recovery signals, which makes energy and stress regulation more predictable.', tryThis: 'Try keeping wake time within a 60-minute window for a few days.' },
  activity_increase: { why: 'Steady movement supports mood regulation and improves sleep pressure at night.', tryThis: 'Try a 10-minute walk earlier in the day.' },
  stress_stabilized: { why: 'When stress variance decreases, your system can allocate resources more efficiently toward recovery.', tryThis: null },
  nutrition_consistency: { why: 'Stable nutrition reduces energy volatility and supports recovery.', tryThis: 'Try keeping the first meal consistent for a few days.' }
};

function computeObservations(historyData, baseline) {
  if (!historyData || historyData.length < 7) return [];
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

  const data = {
    currentStress: avg(last7Days, 'stress'),
    baselineStress: baseline?.stress || 3,
    currentSleep: avg(last7Days, 'sleep'),
    baselineSleep: baseline?.sleep || 3,
    currentActivity: avg(last7Days, 'activity'),
    baselineActivity: baseline?.activity || 3,
    stressVariance: variance(last7Days, 'stress'),
    nutritionConsistency: 1 - (variance(last7Days, 'nutrition') / 2),
    historyLength: historyData.length
  };

  const checks = [
    { id: 'baseline_stress_lower', condition: (d) => d.currentStress < d.baselineStress - 0.5, headline: 'Your stress baseline has shifted downward.', supporting: 'Current stress readings are consistently below where you started.', metric: 'stress' },
    { id: 'sleep_improved', condition: (d) => d.currentSleep > d.baselineSleep + 0.3, headline: 'Your sleep quality has shifted above your starting point.', supporting: 'Average sleep quality over the past week is higher than your initial baseline.', metric: 'sleep' },
    { id: 'activity_increase', condition: (d) => d.currentActivity > d.baselineActivity + 0.4, headline: 'Your activity levels are higher than your initial baseline.', supporting: 'Recent movement data exceeds where you started.', metric: 'activity' },
    { id: 'stress_stabilized', condition: (d) => d.stressVariance < 0.5 && d.historyLength >= 10, headline: 'Your stress levels have become more stable over time.', supporting: 'Day-to-day stress variation has narrowed.', metric: 'stress' },
    { id: 'nutrition_consistency', condition: (d) => d.nutritionConsistency > 0.7, headline: 'Your nutrition patterns show increased consistency.', supporting: 'Day-to-day variation in nutrition quality has decreased.', metric: 'nutrition' }
  ];

  const results = [];
  for (const check of checks) {
    try {
      if (check.condition(data)) results.push(check);
    } catch (e) { continue; }
  }
  return results;
}

export default function InsightsFeed() {
  const { liveProfile, historyData } = useApp();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [feedInsights, setFeedInsights] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const baseline = liveProfile?.onboardingBaseline || {};

  useEffect(() => {
    if (!user?.uid) return;
    loadRecentInsights(user.uid).then(insights => {
      setFeedInsights(insights);
      setLoaded(true);
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !loaded || !historyData || historyData.length < 3) return;

    const patterns = historyData.length >= 7 ? detectPatterns(historyData, liveProfile?.lifeZones) : [];
    const observations = computeObservations(historyData, baseline);

    const explanationMap = {
      pattern: PATTERN_EXPLANATIONS,
      observation: OBSERVATION_EXPLANATIONS,
      insight: METRIC_EXPLANATIONS,
      focus: METRIC_EXPLANATIONS
    };

    const newInsights = generateInsightsFromSources({
      patterns: patterns.slice(0, 3),
      observations,
      dailyInsight: null,
      focusArea: null,
      explanationMap
    });

    let traitInsights = [];
    if (canRunITE(historyData, baseline)) {
      try {
        const latestMetrics = historyData[0] || {};
        const rawMetrics = {
          activity: latestMetrics.activity ?? 3,
          nutrition: latestMetrics.nutrition ?? 3,
          sleep: latestMetrics.sleep ?? 3,
          stress: latestMetrics.stress ?? 3,
          lifeZones: liveProfile?.lifeZones || {},
          habits: []
        };
        const iteResult = runIdentityTrajectoryEngine(rawMetrics, historyData, baseline);
        const traitResult = generateTraitInsights(iteResult, historyData, baseline);
        if (traitResult.available) {
          traitInsights = traitResult.insights.map(ti => normalizeInsight({
            type: ti.type,
            category: ti.category,
            headline: ti.headline,
            supporting: ti.supporting,
            whyThisMatters: ti.whyThisMatters,
            tryThis: ti.tryThis,
            date: new Date().toISOString().split('T')[0],
            metric: ti.implicatedTraits?.[0] || null
          }));
        }
      } catch (e) {}
    }

    const allNew = [...traitInsights, ...newInsights];
    const uniqueNew = allNew.filter(ni => !isDuplicateInsight(feedInsights, ni));

    if (uniqueNew.length > 0) {
      saveInsightsBatch(user.uid, uniqueNew).then(() => {
        setFeedInsights(prev => {
          const merged = [...uniqueNew, ...prev];
          merged.sort((a, b) => b.date.localeCompare(a.date));
          return merged.slice(0, 50);
        });
      });
    }
  }, [user?.uid, loaded, historyData?.length]);

  const handleMarkRead = useCallback((insightId) => {
    if (!user?.uid) return;
    markInsightRead(user.uid, insightId);
    setFeedInsights(prev => prev.map(i => i.id === insightId ? { ...i, read: true } : i));
  }, [user?.uid]);

  const unreadCount = useMemo(() => countUnreadRecent(feedInsights, 7), [feedInsights]);

  if (!loaded || feedInsights.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Insights{unreadCount > 0 ? ` (${unreadCount} new)` : ''}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">
              {feedInsights.map(insight => (
                <InsightItem
                  key={insight.id}
                  insight={insight}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
