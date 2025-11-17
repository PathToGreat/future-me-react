import { motion } from 'framer-motion';

export default function JourneyMeter({ onboardingCompleted }) {
  const baseProgress = onboardingCompleted ? 50 : 0;
  const totalProgress = onboardingCompleted ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card bg-gradient-to-r from-indigo-50 to-purple-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Your Journey</h3>
        <span className="text-2xl font-bold text-indigo-600">{totalProgress}%</span>
      </div>

      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
        />
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className={onboardingCompleted ? "text-green-600" : "text-gray-400"}>
            ✓
          </span>
          <span>Assessment Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={onboardingCompleted ? "text-green-600" : "text-gray-400"}>
            ✓
          </span>
          <span>Profile Active</span>
        </div>
      </div>
    </motion.div>
  );
}
