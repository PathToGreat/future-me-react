import { motion } from 'framer-motion';

export default function ZoneCard({ title, score, icon, index, isPlaceholder, details }) {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    return "text-orange-600 bg-orange-50";
  };

  const getTrendArrow = (score) => {
    if (score >= 80) return "↑";
    if (score < 60) return "↓";
    return "→";
  };

  const getTrendColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score < 60) return "text-orange-600";
    return "text-blue-600";
  };

  const getStatusText = (score) => {
    if (score >= 80) return "strong";
    if (score >= 60) return "developing";
    return "needs attention";
  };

  const getStatusColor = (score) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-blue-700";
    return "text-orange-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${getScoreColor(score)} flex items-center justify-center`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{score}</span>
              <span className={`text-2xl font-bold ${getTrendColor(score)}`}>
                {getTrendArrow(score)}
              </span>
            </div>
            <p className={`text-xs font-medium mt-1 ${getStatusColor(score)}`}>
              {getStatusText(score)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
          className={`h-2 rounded-full ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : 'bg-orange-500'
          }`}
        />
      </div>
    </motion.div>
  );
}
