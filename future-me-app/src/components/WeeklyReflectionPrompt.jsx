import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const REFLECTION_TEMPLATES = [
  {
    id: 'consistency_improved',
    condition: (data) => data.thisWeekLogs > data.lastWeekLogs,
    observation: 'You logged more consistently this week than last.',
    question: 'What supported that?'
  },
  {
    id: 'consistency_maintained',
    condition: (data) => data.thisWeekLogs >= 5 && data.thisWeekLogs === data.lastWeekLogs,
    observation: 'You maintained consistent logging this week.',
    question: 'What helps you stay present with this practice?'
  },
  {
    id: 'stress_sleep_pattern',
    condition: (data) => data.avgStress > 3 && data.sleepVariance > 1,
    observation: 'Stress remained elevated while sleep varied.',
    question: 'What did you notice about this pattern?'
  },
  {
    id: 'activity_energy',
    condition: (data) => data.avgActivity >= 3.5,
    observation: 'Your activity levels were solid this week.',
    question: 'How did that affect your energy?'
  },
  {
    id: 'stress_decreased',
    condition: (data) => data.stressChange < -0.5,
    observation: 'Your stress levels decreased from last week.',
    question: 'What contributed to that shift?'
  },
  {
    id: 'sleep_improved',
    condition: (data) => data.sleepChange > 0.3,
    observation: 'Your sleep patterns improved this week.',
    question: 'What changes supported better rest?'
  },
  {
    id: 'general_awareness',
    condition: () => true,
    observation: 'You showed up to track your habits this week.',
    question: 'What are you learning about yourself?'
  }
];

function calculateWeeklyData(historyData) {
  if (!historyData || historyData.length === 0) {
    return null;
  }
  
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const thisWeekLogs = historyData.filter(d => {
    const logDate = new Date(d.date);
    return logDate >= thisWeekStart && logDate <= today;
  });
  
  const lastWeekLogs = historyData.filter(d => {
    const logDate = new Date(d.date);
    return logDate >= lastWeekStart && logDate < thisWeekStart;
  });
  
  if (thisWeekLogs.length === 0) {
    return null;
  }
  
  const avg = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };
  
  const variance = (arr, key) => {
    const values = arr.map(d => d[key]).filter(v => v !== undefined);
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  };
  
  return {
    thisWeekLogs: thisWeekLogs.length,
    lastWeekLogs: lastWeekLogs.length,
    avgSleep: avg(thisWeekLogs, 'sleep'),
    avgStress: avg(thisWeekLogs, 'stress'),
    avgActivity: avg(thisWeekLogs, 'activity'),
    sleepVariance: variance(thisWeekLogs, 'sleep'),
    sleepChange: avg(thisWeekLogs, 'sleep') - avg(lastWeekLogs, 'sleep'),
    stressChange: avg(thisWeekLogs, 'stress') - avg(lastWeekLogs, 'stress')
  };
}

function selectReflection(weeklyData) {
  if (!weeklyData) return null;
  
  for (const template of REFLECTION_TEMPLATES) {
    if (template.condition(weeklyData)) {
      return template;
    }
  }
  
  return REFLECTION_TEMPLATES[REFLECTION_TEMPLATES.length - 1];
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek);
}

export default function WeeklyReflectionPrompt() {
  const { historyData } = useApp();
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const currentWeek = getWeekNumber();
  const dismissKey = `reflection_dismissed_${user?.uid}_${currentWeek}`;
  
  useEffect(() => {
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [dismissKey]);
  
  const weeklyData = useMemo(() => calculateWeeklyData(historyData), [historyData]);
  const reflection = useMemo(() => selectReflection(weeklyData), [weeklyData]);
  
  const handleDismiss = () => {
    localStorage.setItem(dismissKey, 'true');
    setIsDismissed(true);
  };
  
  const dayOfWeek = new Date().getDay();
  const isReflectionDay = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (!reflection || isDismissed || !isReflectionDay || !weeklyData || weeklyData.thisWeekLogs < 3) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            📖 Weekly Reflection
          </h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-700 text-sm">
            {reflection.observation}
          </p>
          
          <p className="text-gray-600 text-sm italic">
            {reflection.question}
          </p>
          
          <p className="text-xs text-gray-400 pt-2">
            No response needed. This is just for your awareness.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
