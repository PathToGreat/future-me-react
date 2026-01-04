import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ActiveCommitmentIndicator({ 
  commitment, 
  daysRemaining, 
  progress,
  onDismiss 
}) {
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  if (!commitment) {
    return null;
  }

  function handleDismissClick() {
    setShowDismissConfirm(true);
  }

  function handleConfirmDismiss() {
    onDismiss?.();
    setShowDismissConfirm(false);
  }

  function handleCancelDismiss() {
    setShowDismissConfirm(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-blue-700 font-medium">
              Current focus
            </span>
            {daysRemaining > 0 && (
              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                {daysRemaining} days left
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">
            {commitment.focusType}
          </p>
        </div>

        <button
          onClick={handleDismissClick}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Remove focus"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>

      {progress && (
        <div className="mt-2">
          <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentComplete}%` }}
              className="h-full bg-blue-300 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Day {progress.daysElapsed} of {progress.totalDays}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showDismissConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-blue-100"
          >
            <p className="text-xs text-gray-600 mb-2">
              Remove this focus? There's no penalty.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDismiss}
                className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              >
                Yes, remove
              </button>
              <button
                onClick={handleCancelDismiss}
                className="flex-1 py-1.5 px-3 bg-white text-gray-600 rounded text-xs border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Keep it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ActiveCommitmentIndicator;
