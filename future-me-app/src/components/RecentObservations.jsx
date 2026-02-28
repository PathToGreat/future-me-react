import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecentObservations({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const visibleChildren = [];
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (child) visibleChildren.push(child);
    });
  } else if (children) {
    visibleChildren.push(children);
  }

  if (visibleChildren.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Recent Observations
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
            <div className="px-6 pb-5 space-y-4">
              {visibleChildren}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
