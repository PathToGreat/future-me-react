import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatternCard({ pattern, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pattern || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss(pattern.type);
    }
  };

  const getPatternIcon = (type) => {
    const icons = {
      stress_stability: '⚖️',
      sleep_recovery: '💤',
      movement_buffer: '💪',
      consistency_decay: '📉',
      nutrition_impact: '❤️',
      focus_stability: '🎯',
      stress_lag: '📊',
      recovery_slope: '📈',
      multi_metric_correlation: '🔗',
      early_signal: '🌱',
      plateau_detection: '➡️',
      focus_drift: '🔄',
      peak_effect: '⭐',
      cross_impact: '⚖️',
      momentum: '📈'
    };
    return icons[type] || '📊';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-xl mt-0.5">{getPatternIcon(pattern.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Pattern Detected
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {pattern.message}
                </p>
                
                {isExpanded && pattern.data && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-slate-200"
                  >
                    <p className="text-xs text-slate-500">
                      Based on your logged data over the past {pattern.data.days || 7}+ days.
                      This observation is drawn directly from your metrics.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2"
              aria-label="Dismiss pattern"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              {isExpanded ? 'Less detail' : 'More detail'}
            </button>
            <span className="text-xs text-slate-400">
              Observed pattern
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
