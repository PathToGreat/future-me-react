import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasUserDismissedReflection, setReflectionPermanentlyDismissed } from '../utils/commitmentStorage';

function ProjectionExitReflectionGate({ 
  isVisible, 
  scenarioId,
  scenarioLabel,
  userId,
  onProceedToCommitment,
  onDismiss,
  onClose
}) {
  const [isPermanentlyDismissed, setIsPermanentlyDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDismissOption, setShowDismissOption] = useState(false);

  useEffect(() => {
    async function checkDismissalStatus() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const dismissed = await hasUserDismissedReflection(userId);
      setIsPermanentlyDismissed(dismissed);
      setIsLoading(false);
    }

    if (isVisible) {
      checkDismissalStatus();
    }
  }, [userId, isVisible]);

  if (!isVisible || isLoading) {
    return null;
  }

  if (isPermanentlyDismissed) {
    onClose?.();
    return null;
  }

  async function handlePermanentDismiss() {
    if (userId) {
      await setReflectionPermanentlyDismissed(userId);
    }
    setIsPermanentlyDismissed(true);
    onClose?.();
  }

  function handleDismissOnce() {
    onDismiss?.();
    onClose?.();
  }

  function handleProceed() {
    onProceedToCommitment?.();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6"
        >
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">➡️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              A moment of reflection
            </h3>
            <p className="text-gray-600 text-sm">
              You explored: <span className="font-medium">{scenarioLabel}</span>
            </p>
          </div>

          <p className="text-gray-700 text-sm mb-6 text-center">
            Would you like to hold this direction in mind for a while?
          </p>

          <div className="space-y-3">
            <button
              onClick={handleProceed}
              className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              Yes, I'd like to explore this
            </button>

            <button
              onClick={handleDismissOnce}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              No, just exit
            </button>
          </div>

          {!showDismissOption ? (
            <button
              onClick={() => setShowDismissOption(true)}
              className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Don't show this again
            </button>
          ) : (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                This will permanently hide the reflection prompt after exploration.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePermanentDismiss}
                  className="flex-1 py-2 px-3 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowDismissOption(false)}
                  className="flex-1 py-2 px-3 bg-white text-gray-600 rounded text-xs border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProjectionExitReflectionGate;
