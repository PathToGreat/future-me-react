import { motion } from 'framer-motion';

export default function ZoneCard({ title, score, icon, index }) {
  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600 bg-green-50";
    if (score >= 40) return "text-blue-600 bg-blue-50";
    return "text-orange-600 bg-orange-50";
  };

  const getTrendArrow = (score) => {
    if (score >= 70) return "↑";
    if (score <= 40) return "↓";
    return "→";
  };

  const getTrendColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score <= 40) return "text-red-600";
    return "text-gray-600";
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
          </div>
        </div>
      </div>

      <button className="w-full btn-secondary text-sm mt-4">
        View Details
      </button>
    </motion.div>
  );
}
