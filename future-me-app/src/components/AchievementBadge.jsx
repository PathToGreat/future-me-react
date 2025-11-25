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
    habit: 'from-purple-500/80 to-indigo-500/80 border-purple-400/70',
    zone: 'from-blue-500/80 to-cyan-500/80 border-blue-400/70',
    tracking: 'from-green-500/80 to-emerald-500/80 border-green-400/70',
    general: 'from-amber-500/80 to-orange-500/80 border-amber-400/70'
  };

  const gradientClass = categoryColors[category] || categoryColors.general;
  
  // Use dark text for bright backgrounds (amber/orange), white text for darker backgrounds
  // Handle both undefined categories and explicit 'general' category
  const isGeneralCategory = !category || category === 'general';
  const textColorClass = isGeneralCategory ? 'text-gray-900' : 'text-white';
  const dateColorClass = isGeneralCategory ? 'text-gray-700' : 'text-gray-100';
  const descColorClass = isGeneralCategory ? 'text-gray-800' : 'text-gray-100';

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
        <div className={`text-xs ${dateColorClass}`}>
          {formatDate(earnedAt)}
        </div>
      </div>

      {/* Name */}
      <h3 className={`text-lg font-semibold ${textColorClass} mb-1`}>
        {name}
      </h3>

      {/* Description */}
      <p className={`text-sm ${descColorClass}`}>
        {description}
      </p>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-xl pointer-events-none" />
    </motion.div>
  );
};

export default AchievementBadge;
