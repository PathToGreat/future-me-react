import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createHabit } from '../utils/habitHelpers';

const LIFE_ZONES = [
  { id: null, name: 'None', icon: '⭐', color: 'from-gray-400 to-gray-500' },
  { id: 'health', name: 'Health', icon: '💪', color: 'from-green-400 to-emerald-500' },
  { id: 'socialEmotional', name: 'Social Emotional', icon: '❤️', color: 'from-pink-400 to-rose-500' },
  { id: 'wealth', name: 'Wealth', icon: '💰', color: 'from-yellow-400 to-amber-500' },
  { id: 'faith', name: 'Faith', icon: '📖', color: 'from-purple-400 to-violet-500' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', color: 'from-blue-400 to-cyan-500' },
  { id: 'community', name: 'Community', icon: '🤝', color: 'from-orange-400 to-red-500' }
];

export default function HabitCreationModal({ isOpen, onClose, userId, onHabitCreated }) {
  const [title, setTitle] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a habit title');
      return;
    }

    if (title.trim().length > 50) {
      setError('Habit title must be 50 characters or less');
      return;
    }

    setIsCreating(true);

    try {
      await createHabit(userId, {
        title: title.trim(),
        zoneId: selectedZone
      });

      // Reset form
      setTitle('');
      setSelectedZone(null);
      
      // Notify parent component
      if (onHabitCreated) {
        onHabitCreated();
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error creating habit:', err);
      setError(err.message || 'Failed to create habit. Please try again.');
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Habit
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Build simple habits to strengthen your Life Zones (up to 15 habits)
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning walk, Read 10 pages, Call a friend"
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/50 characters
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Life Zone (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Link this habit to a Life Zone for bonus points
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {LIFE_ZONES.map((zone, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedZone(zone.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedZone === zone.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{zone.icon}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {zone.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    isCreating || !title.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isCreating ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
