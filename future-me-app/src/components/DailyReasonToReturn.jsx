import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const CONTINUITY_MESSAGES = [
  "No data today yet. Your baseline still matters.",
  "Taking a day off from logging doesn't erase your progress.",
  "Your patterns from previous days are still being observed.",
  "Rest days are part of the journey too.",
  "Your data is here whenever you're ready to add more."
];

const REFLECTIVE_PROMPTS = {
  Health: [
    "How does your body feel today compared to yesterday?",
    "What one thing could support your physical energy today?",
    "Notice how your sleep affected your morning."
  ],
  'Social Emotional': [
    "Who might benefit from hearing from you today?",
    "What conversation has been on your mind lately?",
    "Consider one relationship you value."
  ],
  Wealth: [
    "What's one small step you could take toward a financial goal?",
    "How did your spending align with your values this week?",
    "Notice where your time and money go together."
  ],
  Faith: [
    "What are you grateful for in this moment?",
    "What principle is guiding your decisions today?",
    "Take a moment to reflect on your purpose."
  ],
  Family: [
    "Who in your family could use your attention today?",
    "What family tradition brings you strength?",
    "Consider how your actions affect those closest to you."
  ],
  Community: [
    "How might you contribute to someone else's day?",
    "What community do you feel connected to?",
    "Consider one way you could serve others."
  ]
};

function getLastKnownObservation(historyData, baseline) {
  if (!historyData || historyData.length === 0) return null;

  const lastLog = historyData[0];
  const observations = [];

  if (lastLog.sleep && baseline?.sleep) {
    const diff = lastLog.sleep - baseline.sleep;
    if (Math.abs(diff) >= 0.5) {
      observations.push(diff > 0 
        ? `Your last logged sleep quality was above your baseline.`
        : `Your last logged sleep was below your typical baseline.`
      );
    }
  }

  if (lastLog.stress && baseline?.stress) {
    const diff = baseline.stress - lastLog.stress;
    if (diff >= 0.5) {
      observations.push(`Your last stress reading was lower than your starting point.`);
    }
  }

  if (lastLog.activity && baseline?.activity) {
    const diff = lastLog.activity - baseline.activity;
    if (diff >= 0.5) {
      observations.push(`Your activity level was above baseline in your last entry.`);
    }
  }

  return observations.length > 0 ? observations[0] : null;
}

function getDaysSinceLastLog(historyData) {
  if (!historyData || historyData.length === 0) return Infinity;
  
  const lastLogDate = new Date(historyData[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastLogDate.setHours(0, 0, 0, 0);
  
  return Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
}

function hasLoggedToday(historyData) {
  if (!historyData || historyData.length === 0) return false;
  
  const lastLogDate = new Date(historyData[0].date);
  const today = new Date();
  
  return lastLogDate.toDateString() === today.toDateString();
}

export default function DailyReasonToReturn() {
  const { historyData, liveProfile } = useApp();
  
  const baseline = liveProfile?.onboardingBaseline || {};
  const focusZone = liveProfile?.currentFocusZone || 'Health';
  
  const content = useMemo(() => {
    if (hasLoggedToday(historyData)) {
      return null;
    }

    const daysSince = getDaysSinceLastLog(historyData);
    const lastObservation = getLastKnownObservation(historyData, baseline);

    if (lastObservation && daysSince <= 3) {
      return {
        type: 'observation',
        icon: '📊',
        text: lastObservation
      };
    }

    if (focusZone && REFLECTIVE_PROMPTS[focusZone]) {
      const prompts = REFLECTIVE_PROMPTS[focusZone];
      const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const prompt = prompts[dayOfYear % prompts.length];
      return {
        type: 'prompt',
        icon: '🎯',
        text: prompt
      };
    }

    const messageIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % CONTINUITY_MESSAGES.length;
    return {
      type: 'continuity',
      icon: '🌱',
      text: CONTINUITY_MESSAGES[messageIndex]
    };
  }, [historyData, baseline, focusZone]);

  if (!content) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-100 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{content.icon}</span>
        <div>
          <p className="text-sm text-gray-600">{content.text}</p>
          {content.type === 'continuity' && (
            <p className="text-xs text-gray-400 mt-1">No action needed</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
