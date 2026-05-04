import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createHabit } from '../utils/habitHelpers';

const LIFE_ZONES = [
  { id: null,              name: 'None',              icon: '⭐' },
  { id: 'health',          name: 'Health',            icon: '💪' },
  { id: 'socialEmotional', name: 'Social & Emotional', icon: '❤️' },
  { id: 'wealth',          name: 'Wealth',            icon: '📊' },
  { id: 'faith',           name: 'Faith',             icon: '📖' },
  { id: 'family',          name: 'Family',            icon: '❤️' },
  { id: 'community',       name: 'Community',         icon: '🤲' },
];

export default function HabitCreationModal({ isOpen, onClose, userId, onHabitCreated }) {
  const [title,        setTitle]        = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [isCreating,   setIsCreating]   = useState(false);
  const [error,        setError]        = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter a habit title'); return; }
    if (title.trim().length > 50) { setError('Habit title must be 50 characters or less'); return; }
    setIsCreating(true);
    try {
      await createHabit(userId, { title: title.trim(), zoneId: selectedZone });
      setTitle('');
      setSelectedZone(null);
      if (onHabitCreated) onHabitCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create habit. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSelectedZone(null);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-1">Add Custom Habit</h2>
            <p className="text-gray-500 text-sm mb-6">
              Add a personal habit to your daily practice
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning walk, Call a friend, Read 10 pages"
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none transition-colors text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{title.length}/50</p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Life Zone Connection
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Optional — links this habit to a life area
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {LIFE_ZONES.map((zone, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedZone(zone.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        selectedZone === zone.id
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{zone.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{zone.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isCreating || !title.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
                  }`}
                >
                  {isCreating ? 'Adding…' : 'Add Habit'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
