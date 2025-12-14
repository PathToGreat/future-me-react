import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignalAttributionBadge({ explanation, metric }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!explanation) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-2"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
      >
        <span>Why this changed</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">{explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
