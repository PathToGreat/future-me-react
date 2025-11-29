import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const AchievementNotification = ({ achievement, onClose }) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 max-w-md md:w-full"
      >
        <div className="bg-gradient-to-br from-purple-600/90 to-indigo-600/90 backdrop-blur-lg border border-purple-400/50 rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="text-4xl flex-shrink-0">
              {achievement.iconEmoji}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-purple-200 uppercase tracking-wide mb-1">
                Achievement Unlocked!
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {achievement.name}
              </h3>
              <p className="text-sm text-purple-100">
                {achievement.description}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Celebration symbols */}
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
            ⭐
          </div>
          <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce delay-100">
            🎉
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementNotification;
