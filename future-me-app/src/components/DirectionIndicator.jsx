import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { checkDirectionChange } from '../utils/reminderEngine';

function computeDirection(historyData, baseline) {
  if (!historyData || historyData.length === 0) {
    return { status: 'stable', subtitle: 'Resume logging to update direction.', insufficient: true };
  }

  const last7Days = historyData.slice(0, 7);

  if (last7Days.length < 5) {
    return { status: 'stable', subtitle: 'Log a few more days to clarify direction.', insufficient: true };
  }

  const avg = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };

  const metrics = ['sleep', 'activity', 'nutrition', 'stress'];
  let totalDelta = 0;
  let measuredCount = 0;

  const hasBaseline = baseline && Object.keys(baseline).length > 0;

  if (hasBaseline) {
    for (const metric of metrics) {
      const recentAvg = avg(last7Days, metric);
      const baselineVal = baseline[metric];
      if (recentAvg === null || baselineVal === undefined || baselineVal === null) continue;

      let delta = recentAvg - baselineVal;
      if (metric === 'stress') delta = -delta;

      totalDelta += delta;
      measuredCount++;
    }
  } else {
    const prior7Days = historyData.slice(7, 14);
    if (prior7Days.length < 3) {
      return { status: 'stable', subtitle: 'Log a few more days to clarify direction.', insufficient: true };
    }

    for (const metric of metrics) {
      const recentAvg = avg(last7Days, metric);
      const priorAvg = avg(prior7Days, metric);
      if (recentAvg === null || priorAvg === null) continue;

      let delta = recentAvg - priorAvg;
      if (metric === 'stress') delta = -delta;

      totalDelta += delta;
      measuredCount++;
    }
  }

  if (measuredCount === 0) {
    return { status: 'stable', subtitle: 'Log a few more days to clarify direction.', insufficient: true };
  }

  const normalizedDelta = totalDelta / measuredCount;

  const STRENGTHEN_THRESHOLD = 0.3;
  const DECLINE_THRESHOLD = -0.3;

  if (normalizedDelta >= STRENGTHEN_THRESHOLD) {
    return {
      status: 'strengthening',
      subtitle: 'Your recent patterns are trending more consistent than your baseline.',
      insufficient: false
    };
  }

  if (normalizedDelta <= DECLINE_THRESHOLD) {
    return {
      status: 'declining',
      subtitle: 'Your recent patterns have softened compared to your baseline.',
      insufficient: false
    };
  }

  return {
    status: 'stable',
    subtitle: 'Your recent patterns are holding steady.',
    insufficient: false
  };
}

const STATUS_CONFIG = {
  strengthening: {
    label:      'Strengthening',
    dotColor:   'bg-green-500',
    accent:     'border-l-green-300',
    bg:         'bg-gradient-to-r from-green-50/35 to-white/90',
    textAccent: 'text-green-600',
  },
  stable: {
    label:      'Stable',
    dotColor:   'bg-slate-400',
    accent:     'border-l-slate-200',
    bg:         'bg-white/90',
    textAccent: 'text-slate-500',
  },
  declining: {
    label:      'Declining',
    dotColor:   'bg-amber-400',
    accent:     'border-l-amber-200',
    bg:         'bg-gradient-to-r from-amber-50/35 to-white/90',
    textAccent: 'text-amber-600',
  },
};

export default function DirectionIndicator() {
  const { historyData, liveProfile } = useApp();
  const { user } = useAuth();
  const [showExplanation, setShowExplanation] = useState(false);
  const prevDirectionRef = useRef(null);

  const baseline = liveProfile?.onboardingBaseline || {};

  const direction = useMemo(() => {
    return computeDirection(historyData, baseline);
  }, [historyData, baseline]);

  useEffect(() => {
    if (!user?.uid || direction.insufficient) return;
    const prev = prevDirectionRef.current;
    if (prev && prev !== direction.status) {
      checkDirectionChange(user.uid, direction.status, prev);
    }
    prevDirectionRef.current = direction.status;
  }, [user?.uid, direction.status, direction.insufficient]);

  const config = STATUS_CONFIG[direction.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`rounded-2xl border border-gray-100 border-l-4 shadow-sm px-5 py-4 ${config.bg} ${config.accent}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Direction</span>
              <span className={`text-sm font-semibold ${config.textAccent}`}>{config.label}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{direction.subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors flex-shrink-0"
          aria-label="How this is calculated"
        >
          <span className="text-xs font-medium">i</span>
        </button>
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50 leading-relaxed">
              Direction reflects your recent patterns compared to your baseline. It updates as you log, and it is meant to guide awareness, not grade you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
