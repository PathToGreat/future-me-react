import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMITMENT_DURATION_OPTIONS, SCENARIO_TO_FOCUS_TYPE, createCommitmentIntent } from '../utils/commitmentIntentSystem';

function CommitmentPrompt({ 
  isVisible, 
  scenarioId,
  userId,
  onCommit,
  onDecline,
  onClose
}) {
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isVisible) {
    return null;
  }

  const focusType = SCENARIO_TO_FOCUS_TYPE[scenarioId] || SCENARIO_TO_FOCUS_TYPE.custom;

  function handleDecline() {
    onDecline?.();
    onClose?.();
  }

  function handleSelectDuration(days) {
    setSelectedDuration(days);
  }

  function handleConfirm() {
    if (!selectedDuration) {
      return;
    }

    setIsConfirming(true);

    const commitment = createCommitmentIntent(scenarioId, selectedDuration, userId);
    
    if (commitment) {
      onCommit?.(commitment);
    }
    
    onClose?.();
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Hold this direction
            </h3>
            <p className="text-gray-600 text-sm">
              Focus: <span className="font-medium">{focusType}</span>
            </p>
          </div>

          <p className="text-gray-700 text-sm mb-4">
            How long would you like to hold this focus in mind?
          </p>

          <div className="space-y-2 mb-6">
            {COMMITMENT_DURATION_OPTIONS.map(option => (
              <button
                key={option.days}
                onClick={() => handleSelectDuration(option.days)}
                className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  selectedDuration === option.days
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">
              This is a personal intention, not an obligation. 
              There are no penalties, reminders, or tracked streaks. 
              You can dismiss this at any time.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={!selectedDuration || isConfirming}
              className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedDuration
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isConfirming ? 'Setting...' : 'Set this intention'}
            </button>

            <button
              onClick={handleDecline}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Not right now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommitmentPrompt;
