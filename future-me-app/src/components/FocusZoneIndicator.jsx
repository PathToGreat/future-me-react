import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const FOCUS_AREAS = {
  sleep: {
    label: 'Sleep Consistency',
    icon: '💤',
    benefit: 'would support energy and stress recovery',
    priority: 1
  },
  stress: {
    label: 'Stress Management',
    icon: '⚖️',
    benefit: 'would help with sleep quality and mental clarity',
    priority: 2
  },
  activity: {
    label: 'Physical Activity',
    icon: '💪',
    benefit: 'would boost energy and mood stability',
    priority: 3
  },
  nutrition: {
    label: 'Nutrition Habits',
    icon: '❤️',
    benefit: 'would enhance overall energy and recovery',
    priority: 4
  }
};

function determineFocusArea(historyData, baseline) {
  if (!historyData || historyData.length < 3) {
    return { area: 'sleep', reason: 'default' };
  }
  
  const last7Days = historyData.slice(0, 7);
  
  const avgMetrics = {
    sleep: 0,
    stress: 0,
    activity: 0,
    nutrition: 0
  };
  
  last7Days.forEach(day => {
    avgMetrics.sleep += day.sleep || 0;
    avgMetrics.stress += day.stress || 0;
    avgMetrics.activity += day.activity || 0;
    avgMetrics.nutrition += day.nutrition || 0;
  });
  
  Object.keys(avgMetrics).forEach(key => {
    avgMetrics[key] = avgMetrics[key] / last7Days.length;
  });
  
  const gaps = [];
  
  if (baseline?.sleep) {
    gaps.push({ 
      area: 'sleep', 
      gap: baseline.sleep - avgMetrics.sleep,
      current: avgMetrics.sleep,
      priority: FOCUS_AREAS.sleep.priority
    });
  }
  
  if (baseline?.stress) {
    gaps.push({ 
      area: 'stress', 
      gap: avgMetrics.stress - baseline.stress,
      current: avgMetrics.stress,
      priority: FOCUS_AREAS.stress.priority
    });
  }
  
  if (baseline?.activity) {
    gaps.push({ 
      area: 'activity', 
      gap: baseline.activity - avgMetrics.activity,
      current: avgMetrics.activity,
      priority: FOCUS_AREAS.activity.priority
    });
  }
  
  if (baseline?.nutrition) {
    gaps.push({ 
      area: 'nutrition', 
      gap: baseline.nutrition - avgMetrics.nutrition,
      current: avgMetrics.nutrition,
      priority: FOCUS_AREAS.nutrition.priority
    });
  }
  
  if (avgMetrics.sleep < 3 || avgMetrics.stress > 3.5) {
    return { area: 'sleep', reason: 'foundation' };
  }
  
  gaps.sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    return a.priority - b.priority;
  });
  
  if (gaps.length > 0 && gaps[0].gap > 0.3) {
    return { area: gaps[0].area, reason: 'gap' };
  }
  
  return { area: 'sleep', reason: 'default' };
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek);
}

export default function FocusZoneIndicator() {
  const { liveProfile, historyData } = useApp();
  const [cachedFocus, setCachedFocus] = useState(null);
  
  const baseline = liveProfile?.onboardingBaseline || {};
  
  useEffect(() => {
    const currentWeek = getWeekNumber();
    const cacheKey = `focusZone_${liveProfile?.id || 'user'}_${currentWeek}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      setCachedFocus(JSON.parse(cached));
    } else {
      const newFocus = determineFocusArea(historyData, baseline);
      setCachedFocus(newFocus);
      localStorage.setItem(cacheKey, JSON.stringify(newFocus));
    }
  }, [historyData, baseline, liveProfile?.id]);
  
  const focusArea = cachedFocus?.area || 'sleep';
  const config = FOCUS_AREAS[focusArea];
  
  const hasEnoughData = historyData && historyData.length >= 3;
  
  if (!hasEnoughData) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">
            🎯 Current Focus
          </h3>
          <p className="text-gray-700 text-sm">
            This week, improving <span className="font-medium">{config.label.toLowerCase()}</span> {config.benefit}.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Updates weekly based on your patterns
          </p>
        </div>
      </div>
    </motion.div>
  );
}
