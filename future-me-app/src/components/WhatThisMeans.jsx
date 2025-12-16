import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const clarityExplanations = {
  sleep_improved: {
    pattern: 'Sleep quality has improved',
    explanation: 'Your sleep scores have increased over recent days. This often accompanies more consistent bedtimes or reduced evening stress.'
  },
  sleep_declined: {
    pattern: 'Sleep quality has decreased',
    explanation: 'Your sleep scores have dropped recently. This can occur with irregular schedules, increased stress, or changes in environment.'
  },
  stress_reduced: {
    pattern: 'Stress levels have stabilized',
    explanation: 'Your stress trend shows less variability this week. This usually happens when sleep timing becomes more consistent or activity patterns stabilize.'
  },
  stress_increased: {
    pattern: 'Stress levels have risen',
    explanation: 'Your stress readings have increased recently. This often correlates with sleep disruption or changes in daily rhythm.'
  },
  activity_increased: {
    pattern: 'Activity levels have increased',
    explanation: 'You have been more active recently. Increased movement typically supports better sleep and steadier energy levels.'
  },
  activity_decreased: {
    pattern: 'Activity levels have dropped',
    explanation: 'Your activity has decreased recently. Lower movement can affect energy levels and sleep quality over time.'
  },
  nutrition_improved: {
    pattern: 'Nutrition balance has improved',
    explanation: 'Your nutrition scores have increased. Better eating patterns often support steadier energy throughout the day.'
  },
  consistency_growing: {
    pattern: 'Patterns are becoming more consistent',
    explanation: 'Your daily rhythms show less day-to-day variation. Consistency in tracking often reveals which habits have the most impact.'
  },
  general_observation: {
    pattern: 'Patterns are emerging',
    explanation: 'As you continue tracking, connections between different metrics become clearer. Awareness of these patterns grows over time.'
  }
};

function determineExplanation(insight, historyData, baseline) {
  if (!insight) return clarityExplanations.general_observation;

  const title = insight.title?.toLowerCase() || '';
  const message = insight.message?.toLowerCase() || '';
  const combined = title + ' ' + message;

  if (combined.includes('sleep') && (combined.includes('improve') || combined.includes('better') || combined.includes('increase'))) {
    return clarityExplanations.sleep_improved;
  }
  if (combined.includes('sleep') && (combined.includes('decline') || combined.includes('drop') || combined.includes('decrease'))) {
    return clarityExplanations.sleep_declined;
  }
  if (combined.includes('stress') && (combined.includes('stabil') || combined.includes('decrease') || combined.includes('lower'))) {
    return clarityExplanations.stress_reduced;
  }
  if (combined.includes('stress') && (combined.includes('increase') || combined.includes('rise') || combined.includes('higher'))) {
    return clarityExplanations.stress_increased;
  }
  if (combined.includes('activity') && (combined.includes('increase') || combined.includes('more') || combined.includes('active'))) {
    return clarityExplanations.activity_increased;
  }
  if (combined.includes('activity') && (combined.includes('decrease') || combined.includes('less') || combined.includes('drop'))) {
    return clarityExplanations.activity_decreased;
  }
  if (combined.includes('nutrition') && (combined.includes('improve') || combined.includes('better'))) {
    return clarityExplanations.nutrition_improved;
  }
  if (combined.includes('consist') || combined.includes('pattern') || combined.includes('rhythm')) {
    return clarityExplanations.consistency_growing;
  }

  return clarityExplanations.general_observation;
}

export default function WhatThisMeans({ insight, historyData, baseline }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  const explanation = determineExplanation(insight, historyData, baseline);

  const handleToggle = async () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    if (newState && user?.uid) {
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'clarity');
        await updateDoc(metricsRef, {
          whatThisMeansExpanded: increment(1),
          lastExpanded: new Date().toISOString()
        }).catch(() => {});
      } catch (error) {}
    }
  };

  if (!insight) return null;

  return (
    <div className="mt-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
        <span>What this means</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {explanation.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
