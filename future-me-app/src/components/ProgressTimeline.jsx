import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const METRIC_CONFIG = {
  sleep: { label: 'Sleep', icon: '💤', baselineKey: 'sleep' },
  activity: { label: 'Activity', icon: '💪', baselineKey: 'activity' },
  stress: { label: 'Stress', icon: '⚖️', baselineKey: 'stress', inverse: true },
  nutrition: { label: 'Nutrition', icon: '❤️', baselineKey: 'nutrition' }
};

function getTrendIcon(direction) {
  if (direction === 'improving') return '📈';
  if (direction === 'declining') return '📉';
  return '➡️';
}

function getTrendLabel(direction, inverse = false) {
  if (inverse) {
    if (direction === 'improving') return 'Lower';
    if (direction === 'declining') return 'Higher';
  } else {
    if (direction === 'improving') return 'Improving';
    if (direction === 'declining') return 'Declining';
  }
  return 'Stable';
}

function calculateMetricStats(historyData, metric, baseline, inverse = false) {
  if (!historyData || historyData.length === 0) {
    return { baseline: 0, current7Day: 0, direction: 'stable' };
  }

  const last7Days = historyData.slice(0, 7);
  const values = last7Days.map(d => d[metric]).filter(v => v !== undefined && v !== null);
  
  if (values.length === 0) {
    return { baseline: baseline || 0, current7Day: 0, direction: 'stable' };
  }

  const current7Day = values.reduce((a, b) => a + b, 0) / values.length;
  const baselineValue = baseline || current7Day;
  
  const diff = current7Day - baselineValue;
  let direction = 'stable';
  
  if (inverse) {
    if (diff > 0.3) direction = 'declining';
    else if (diff < -0.3) direction = 'improving';
  } else {
    if (diff > 0.3) direction = 'improving';
    else if (diff < -0.3) direction = 'declining';
  }

  return {
    baseline: baselineValue,
    current7Day: parseFloat(current7Day.toFixed(1)),
    direction
  };
}

function MetricRow({ metric, config, stats }) {
  const progressPercent = (stats.current7Day / 5) * 100;
  const baselinePercent = (stats.baseline / 5) * 100;
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {config.icon} {config.label}
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {getTrendIcon(stats.direction)} {getTrendLabel(stats.direction, config.inverse)}
        </span>
      </div>
      
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {stats.baseline > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
            style={{ left: `${Math.min(baselinePercent, 100)}%` }}
            title={`Baseline: ${stats.baseline}`}
          />
        )}
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            stats.direction === 'improving' 
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : stats.direction === 'declining'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-blue-400 to-blue-500'
          }`}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Baseline: {stats.baseline.toFixed(1)}</span>
        <span>7-day avg: {stats.current7Day.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function ProgressTimeline() {
  const { liveProfile, historyData } = useApp();
  
  const baseline = liveProfile?.onboardingBaseline || {};
  
  const metricStats = useMemo(() => {
    const stats = {};
    Object.entries(METRIC_CONFIG).forEach(([key, config]) => {
      stats[key] = calculateMetricStats(
        historyData, 
        key, 
        baseline[config.baselineKey],
        config.inverse
      );
    });
    return stats;
  }, [historyData, baseline]);
  
  const hasData = historyData && historyData.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          📊 Your Progress
        </h3>
        {hasData && (
          <span className="text-xs text-gray-400">
            {historyData.length} day{historyData.length !== 1 ? 's' : ''} tracked
          </span>
        )}
      </div>
      
      {!hasData ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>Start logging to see your progress timeline.</p>
          <p className="text-xs mt-1">Your baseline from onboarding will appear here.</p>
        </div>
      ) : (
        <div>
          {Object.entries(METRIC_CONFIG).map(([key, config]) => (
            <MetricRow 
              key={key}
              metric={key}
              config={config}
              stats={metricStats[key]}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
