import { motion } from 'framer-motion';

export default function DailyInsight({ activity, nutrition, sleep, stress }) {
  const getInsight = () => {
    if (stress <= 2) {
      return {
        icon: "😌",
        message: "Lower stress is strengthening your future self.",
        color: "from-green-500 to-emerald-500"
      };
    } else if (sleep <= 2) {
      return {
        icon: "😴",
        message: "Improving sleep will significantly boost your long-term vitality.",
        color: "from-purple-500 to-indigo-500"
      };
    } else if (activity >= 4) {
      return {
        icon: "💪",
        message: "Your activity levels are contributing to long-term health.",
        color: "from-blue-500 to-cyan-500"
      };
    } else if (nutrition >= 4) {
      return {
        icon: "🥗",
        message: "Your nutrition choices are building a healthier future.",
        color: "from-green-500 to-lime-500"
      };
    } else {
      return {
        icon: "🌟",
        message: "Small daily improvements create lasting change.",
        color: "from-amber-500 to-orange-500"
      };
    }
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
