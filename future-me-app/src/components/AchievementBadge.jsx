import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement }) => {
  const { iconEmoji, name, description, earnedAt, category } = achievement;

  // Format earned date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Category-based gradient colors
  const categoryColors = {
    habit: 'from-purple-500/40 to-indigo-500/40 border-purple-400/50',
    zone: 'from-blue-500/40 to-cyan-500/40 border-blue-400/50',
    tracking: 'from-green-500/40 to-emerald-500/40 border-green-400/50',
    general: 'from-amber-500/40 to-orange-500/40 border-amber-400/50'
  };

  const gradientClass = categoryColors[category] || categoryColors.general;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-gradient-to-br ${gradientClass} border rounded-xl p-4 backdrop-blur-sm`}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-2">
        <div className="text-4xl mb-2">
          {iconEmoji}
        </div>
        <div className="text-xs text-gray-400">
          {formatDate(earnedAt)}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-white mb-1">
        {name}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-300">
        {description}
      </p>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-xl pointer-events-none" />
    </motion.div>
  );
};

export default AchievementBadge;
