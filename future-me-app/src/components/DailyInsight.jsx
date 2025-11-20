import { motion } from 'framer-motion';

export default function DailyInsight({ activity, nutrition, sleep, stress }) {
  const getInsight = () => {
    // Priority 1: Address critical issues (high stress or very poor sleep)
    if (stress >= 4) {
      return {
        icon: "🤲",
        message: "High stress can undermine your progress. Consider adding stress-relief practices to your routine.",
        color: "from-red-500 to-orange-500"
      };
    }
    
    if (sleep <= 2 && stress >= 3) {
      return {
        icon: "😴",
        message: "Poor sleep combined with stress may be draining your potential. Rest is essential for growth.",
        color: "from-purple-500 to-pink-500"
      };
    }

    // Priority 2: Celebrate strengths (low stress)
    if (stress <= 2) {
      return {
        icon: "😌",
        message: "Your low stress levels are strengthening your foundation for a healthier future.",
        color: "from-green-500 to-emerald-500"
      };
    }

    // Priority 3: Address sleep issues
    if (sleep <= 2) {
      return {
        icon: "💤",
        message: "Better sleep will significantly boost your energy, focus, and long-term vitality.",
        color: "from-indigo-500 to-purple-500"
      };
    }

    if (sleep >= 4 && activity >= 4) {
      return {
        icon: "⚡",
        message: "Great sleep and activity levels are creating powerful momentum toward your goals.",
        color: "from-blue-500 to-cyan-500"
      };
    }

    // Priority 4: Celebrate high activity
    if (activity >= 4) {
      return {
        icon: "💪",
        message: "Your consistent physical activity is building strength and resilience for the long run.",
        color: "from-blue-500 to-teal-500"
      };
    }

    // Priority 5: Celebrate good nutrition
    if (nutrition >= 4) {
      return {
        icon: "🥗",
        message: "Your nutrition choices are fueling your body and supporting lasting health.",
        color: "from-green-500 to-lime-500"
      };
    }

    // Priority 6: Address low activity
    if (activity <= 2) {
      return {
        icon: "🚶",
        message: "Even small increases in movement can create noticeable improvements in your well-being.",
        color: "from-amber-500 to-yellow-500"
      };
    }

    // Priority 7: Address poor nutrition
    if (nutrition <= 2) {
      return {
        icon: "🍎",
        message: "Better nutrition choices will give you more energy and support your long-term health goals.",
        color: "from-orange-500 to-red-500"
      };
    }

    // Default: General encouragement
    return {
      icon: "⭐",
      message: "Small daily improvements create lasting change. Keep building your future self.",
      color: "from-amber-500 to-orange-500"
    };
  };

  const insight = getInsight();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className={`card bg-gradient-to-r ${insight.color} text-white`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-4xl">{insight.icon}</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">Daily Insight</h3>
          <p className="text-white/95">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
}
