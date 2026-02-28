import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABELS = {
  pattern: 'Pattern',
  change: 'Change',
  reflection: 'Reflection'
};

export default function InsightItem({ insight, onMarkRead }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasExpansion = insight.whyThisMatters || insight.tryThis;

  const handleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && !insight.read && onMarkRead) {
      onMarkRead(insight.id);
    }
  };

  return (
    <div className="border-b border-gray-50 last:border-b-0 py-3">
      <div className="flex items-start gap-3">
        {!insight.read && (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
        )}
        {insight.read && (
          <div className="w-1.5 h-1.5 rounded-full bg-transparent mt-2 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">{insight.date}</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {CATEGORY_LABELS[insight.category] || insight.category}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-700 leading-snug">
            {insight.headline}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {insight.supporting}
          </p>

          {hasExpansion && (
            <button
              onClick={handleExpand}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2 flex items-center gap-1"
            >
              <motion.svg
                animate={{ rotate: isExpanded ? 90 : 0 }}
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
              Why this matters
            </button>
          )}

          <AnimatePresence>
            {isExpanded && hasExpansion && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {insight.whyThisMatters && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-2 pl-3 border-l-2 border-slate-100">
                    {insight.whyThisMatters}
                  </p>
                )}
                {insight.tryThis && (
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5 pl-3 border-l-2 border-slate-50">
                    <span className="text-slate-500">Try this:</span> {insight.tryThis}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
