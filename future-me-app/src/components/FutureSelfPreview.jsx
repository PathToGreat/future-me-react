import { motion } from 'framer-motion';

export default function FutureSelfPreview({ lifestyleScore }) {
  const getMessage = (score) => {
    if (score >= 80) {
      return "You are trending toward a strong future self.";
    } else if (score >= 60) {
      return "You are making progress but have opportunities for improvement.";
    } else {
      return "Your current habits may be impacting your future self.";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-blue-500 to-indigo-500";
    return "from-orange-500 to-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreColor(lifestyleScore)} flex items-center justify-center shadow-lg`}>
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                <svg 
                  className="w-20 h-20 text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br ${getScoreColor(lifestyleScore)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
              {Math.round(lifestyleScore)}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Future Self Preview
          </h2>
          <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
            <span className="text-sm font-medium text-gray-600">Future Self Score:</span>
            <span className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(lifestyleScore)} bg-clip-text text-transparent`}>
              {Math.round(lifestyleScore)}
            </span>
            <span className="text-lg text-gray-500">/100</span>
          </div>
          <p className="text-gray-700 text-base">
            {getMessage(lifestyleScore)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
