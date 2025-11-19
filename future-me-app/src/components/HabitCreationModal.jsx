import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZONE_OPTIONS } from '../utils/habitUtils';

export default function HabitCreationModal({ isOpen, onClose, onCreateHabit, activeCount, maxHabits }) {
  const [title, setTitle] = useState('');
  const [linkedZone, setLinkedZone] = useState('health');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a habit title');
      return;
    }

    if (title.trim().length > 50) {
      setError('Title must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateHabit({ title: title.trim(), linkedZone });
      setTitle('');
      setLinkedZone('health');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setLinkedZone('health');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const canAddMore = activeCount < maxHabits;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Habit</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {!canAddMore ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You've reached the maximum of {maxHabits} active habits.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Archive an existing habit to create a new one.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="habit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Habit Title
                </label>
                <input
                  id="habit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning meditation, Daily walk..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  maxLength={50}
                  disabled={isSubmitting}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {title.length}/50 characters
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="linked-zone" className="block text-sm font-medium text-gray-700 mb-2">
                  Life Zone
                </label>
                <select
                  id="linked-zone"
                  value={linkedZone}
                  onChange={(e) => setLinkedZone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  disabled={isSubmitting}
                >
                  {ZONE_OPTIONS.map(zone => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Completing this habit will boost your {ZONE_OPTIONS.find(z => z.value === linkedZone)?.label} zone
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
