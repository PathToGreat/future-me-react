import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

function calculateLoggingStreak(historyData) {
  if (!historyData || historyData.length === 0) {
    return { current: 0, status: 'starting', message: 'Ready to begin' };
  }
  
  const sortedData = [...historyData].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  let lastLogDate = new Date(sortedData[0].date);
  lastLogDate.setHours(0, 0, 0, 0);
  
  const daysSinceLastLog = Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastLog > 1) {
    return { 
      current: 0, 
      status: 'resuming', 
      message: 'Ready to resume',
      previousStreak: sortedData.length > 0 ? Math.min(sortedData.length, 7) : 0
    };
  }
  
  for (let i = 0; i < sortedData.length; i++) {
    const logDate = new Date(sortedData[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.abs(Math.floor((logDate - expectedDate) / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 1) {
      streak++;
    } else {
      break;
    }
  }
  
  let status = 'active';
  let message = '';
  
  if (streak >= 7) {
    message = 'A week of consistent awareness';
  } else if (streak >= 3) {
    message = 'Building momentum';
  } else if (streak >= 1) {
    message = 'Staying present';
  } else {
    message = 'Ready to begin';
  }
  
  return { current: streak, status, message };
}

function calculateHabitConsistency(habits) {
  if (!habits || habits.length === 0) {
    return { percentage: 0, activeHabits: 0 };
  }
  
  const activeHabits = habits.filter(h => h.completions && h.completions.length > 0);
  
  if (activeHabits.length === 0) {
    return { percentage: 0, activeHabits: 0 };
  }
  
  const last7Days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  let totalPossible = activeHabits.length * 7;
  let totalCompleted = 0;
  
  activeHabits.forEach(habit => {
    const completions = habit.completions || [];
    const completedDates = completions.map(c => c.date || c);
    
    last7Days.forEach(date => {
      if (completedDates.includes(date)) {
        totalCompleted++;
      }
    });
  });
  
  const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  
  return { percentage, activeHabits: activeHabits.length };
}

export default function ConsistencyStreaks() {
  const { historyData, habits } = useApp();
  
  const loggingStreak = useMemo(() => 
    calculateLoggingStreak(historyData), 
    [historyData]
  );
  
  const habitConsistency = useMemo(() => 
    calculateHabitConsistency(habits), 
    [habits]
  );
  
  const totalDaysLogged = historyData?.length || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
    >
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        ✓ Consistency
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Logging Streak</p>
            <p className="text-xs text-gray-500">{loggingStreak.message}</p>
          </div>
          <div className="text-right">
            {loggingStreak.status === 'resuming' ? (
              <div>
                <span className="text-lg font-bold text-amber-500">Paused</span>
                <p className="text-xs text-gray-400">Tap to resume</p>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-bold text-green-600">{loggingStreak.current}</span>
                <span className="text-sm text-gray-500 ml-1">day{loggingStreak.current !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        
        {habitConsistency.activeHabits > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Habit Follow-Through</p>
              <p className="text-xs text-gray-500">
                {habitConsistency.activeHabits} active habit{habitConsistency.activeHabits !== 1 ? 's' : ''} this week
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">{habitConsistency.percentage}%</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Total Awareness Days</p>
            <p className="text-xs text-gray-500">Since you started</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-600">{totalDaysLogged}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
