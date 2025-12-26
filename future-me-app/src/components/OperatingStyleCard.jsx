import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { deriveOperatingStyle } from '../utils/operatingStyleEngine';
import { 
  trackStyleSurfaced, 
  trackStyleExpanded, 
  trackStyleReflection,
  trackStyleMilestone
} from '../utils/operatingStyleMetrics';

export default function OperatingStyleCard() {
  const { user } = useAuth();
  const [styleData, setStyleData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoggedSurfaced, setHasLoggedSurfaced] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadOperatingStyle();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadOperatingStyle = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const result = await deriveOperatingStyle(user.uid);
      
      if (result.style && !hasLoggedSurfaced) {
        setStyleData(result);
        setHasLoggedSurfaced(true);
        await trackStyleSurfaced(user.uid, result.style.id, result.style.confidence);
        
        if (result.style.confidence >= 0.8) {
          await trackStyleMilestone(user.uid, result.style.id, 'high_confidence');
        }
      } else if (result.style) {
        setStyleData(result);
      }
    } catch (error) {
      console.error('Error loading operating style:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async () => {
    if (!user?.uid || !styleData?.style) return;
    
    const wasExpanded = isExpanded;
    setIsExpanded(!isExpanded);
    
    if (!wasExpanded) {
      await trackStyleExpanded(user.uid, styleData.style.id);
      setShowReflection(true);
    }
  };

  const handleReflection = async (response) => {
    if (!user?.uid || !styleData?.style || reflectionSubmitted) return;
    
    await trackStyleReflection(user.uid, styleData.style.id, response);
    setReflectionSubmitted(true);
    
    if (response === 'yes') {
      await trackStyleMilestone(user.uid, styleData.style.id, 'user_confirmed');
    }
  };

  if (loading || !styleData?.style || !user?.uid) {
    return null;
  }

  const { style, alternateStyles } = styleData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={handleExpand}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-sm">Your Operating Style</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {style.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {style.description}
              </p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-slate-400 ml-2 mt-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-slate-200 pt-3">
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Why this observation
                  </h4>
                  <p className="text-sm text-slate-600">
                    {style.explanation}
                  </p>
                </div>

                {style.matchingPatterns && style.matchingPatterns.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Based on patterns
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {style.matchingPatterns.map((pattern, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          {formatPatternName(pattern)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {alternateStyles && alternateStyles.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Other possible styles
                    </h4>
                    <div className="space-y-1">
                      {alternateStyles.map((alt, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{alt.name}</span>
                          <span className="text-slate-400 text-xs">
                            {Math.round(alt.confidence * 100)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-400 italic">
                  This is an observation, not a prescription. Your patterns may shift over time.
                </div>

                {showReflection && !reflectionSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-3 border-t border-slate-200"
                  >
                    <p className="text-sm text-slate-600 mb-2">
                      Does this reflect how your behaviors influence your results?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReflection('yes')}
                        className="text-xs px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleReflection('not_quite')}
                        className="text-xs px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"
                      >
                        Not quite
                      </button>
                    </div>
                  </motion.div>
                )}

                {reflectionSubmitted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-3 border-t border-slate-200"
                  >
                    <p className="text-xs text-slate-400">
                      Thank you for your feedback.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function formatPatternName(pattern) {
  const names = {
    sleepRecovery: 'Sleep Recovery',
    stressStability: 'Stress Stability',
    restoreAfterDip: 'Restore After Dip',
    stressSleepLink: 'Stress-Sleep Link',
    emotionalVolatility: 'Emotional Volatility',
    consistencyDecay: 'Consistency Decay',
    focusStability: 'Focus Stability',
    momentum: 'Momentum',
    movementBuffer: 'Movement Buffer',
    exerciseRecovery: 'Exercise Recovery',
    activityMood: 'Activity-Mood',
    nutritionEnergy: 'Nutrition-Energy',
    mealMood: 'Meal-Mood',
    dietStability: 'Diet Stability',
    socialEmotional: 'Social-Emotional',
    connectionMood: 'Connection-Mood',
    isolationDip: 'Isolation Dip',
    multiMetricCorrelation: 'Multi-Metric',
    upwardTrend: 'Upward Trend',
    baselineReturn: 'Baseline Return',
    selfCorrection: 'Self Correction'
  };
  return names[pattern] || pattern.replace(/([A-Z])/g, ' $1').trim();
}
