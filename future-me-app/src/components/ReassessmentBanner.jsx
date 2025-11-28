import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { calculateDismissUntilDate } from "../utils/reassessmentAnalyzer";

export default function ReassessmentBanner({ 
  isVisible, 
  improvements = [], 
  declines = [],
  summary,
  onDismiss 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isVisible) return null;

  const handleUpdateBaseline = async () => {
    navigate('/onboarding', { state: { isReassessment: true } });
  };

  const handleNotNow = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const dismissUntil = calculateDismissUntilDate();
      
      await updateDoc(userRef, {
        reassessmentDismissedUntil: dismissUntil
      });
      
      console.log('📊 Reassessment banner dismissed until:', dismissUntil);
      
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error dismissing reassessment banner:', error);
    }
  };

  const hasImprovements = improvements.length > 0;
  const hasDeclines = declines.length > 0;

  const bgGradient = hasDeclines && !hasImprovements
    ? 'from-orange-50 to-yellow-50 border-orange-200'
    : 'from-green-50 to-blue-50 border-green-200';

  const iconBg = hasDeclines && !hasImprovements
    ? 'bg-orange-100 text-orange-600'
    : 'bg-green-100 text-green-600';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`mb-6 rounded-xl border bg-gradient-to-r ${bgGradient} overflow-hidden`}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
              <span className="text-lg">📊</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Your lifestyle has shifted significantly from your baseline
              </h3>
              
              <p className="text-sm text-gray-600 mb-3">
                {summary || "Would you like to update your assessment?"}
              </p>

              {(hasImprovements || hasDeclines) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {improvements.map(metric => (
                    <span 
                      key={metric}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                    >
                      <span className="mr-1">📈</span>
                      {formatMetricName(metric)}
                    </span>
                  ))}
                  {declines.map(metric => (
                    <span 
                      key={metric}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
                    >
                      <span className="mr-1">➡️</span>
                      {formatMetricName(metric)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateBaseline}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <span className="mr-2">✓</span>
                  Update Baseline
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNotNow}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Not Now
                </motion.button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Dismissing will hide this for 7 days. Your progress tracking continues.
              </p>
            </div>

            <button
              onClick={handleNotNow}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatMetricName(metricName) {
  const nameMap = {
    activity: 'Physical Activity',
    nutrition: 'Nutrition',
    sleep: 'Sleep Quality',
    stress: 'Stress Management',
    movementRhythm: 'Movement',
    eatingRhythm: 'Eating',
    sleepRhythm: 'Sleep Rhythm',
    emotionalClimate: 'Emotional State',
    motivation: 'Motivation'
  };
  return nameMap[metricName] || metricName;
}
