import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import {
  generateDailyInsight,
  generateWeeklyInsights,
  generateMonthlyInsights,
  shouldGenerateWeeklyInsight,
  shouldGenerateMonthlyInsight,
  getAllInsightsForDashboard
} from '../utils/insightsEngine';

export default function InsightsPanel({ 
  profile, 
  historyData, 
  onViewAll 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dailyInsight, setDailyInsight] = useState(null);
  const [weeklyBundle, setWeeklyBundle] = useState(null);
  const [monthlyBundle, setMonthlyBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState(null);

  useEffect(() => {
    if (user?.uid && historyData?.length > 0) {
      loadAndGenerateInsights();
    } else {
      setLoading(false);
    }
  }, [user?.uid, historyData, profile]);

  const loadAndGenerateInsights = async () => {
    try {
      const insightsRef = doc(db, 'users', user.uid, 'insights', 'current');
      const insightsSnap = await getDoc(insightsRef);
      const existingInsights = insightsSnap.exists() ? insightsSnap.data() : {};

      const today = new Date().toISOString().split('T')[0];
      const todayLog = historyData.find(l => l.date === today);
      const last7Days = historyData.slice(0, 7);
      const last30Days = historyData.slice(0, 30);

      let newDailyInsight = existingInsights.dailyInsight;
      if (todayLog && (!newDailyInsight || newDailyInsight.createdAt?.split('T')[0] !== today)) {
        newDailyInsight = generateDailyInsight(todayLog, profile, last7Days);
        console.log('📊 Generated daily insight:', newDailyInsight?.title);
      } else if (!todayLog && last7Days.length > 0 && (!newDailyInsight || newDailyInsight.createdAt?.split('T')[0] !== today)) {
        const mostRecentLog = last7Days[0];
        newDailyInsight = generateDailyInsight(mostRecentLog, profile, last7Days);
        if (newDailyInsight) {
          newDailyInsight.title = 'Recent Observation';
        }
        console.log('📊 Generated insight from recent log:', newDailyInsight?.title);
      }
      setDailyInsight(newDailyInsight);

      let newWeeklyBundle = existingInsights.weeklyBundle;
      if (shouldGenerateWeeklyInsight(newWeeklyBundle) && last7Days.length >= 3) {
        newWeeklyBundle = generateWeeklyInsights(last7Days, profile, last30Days);
        console.log('📊 Generated weekly insights');
      }
      setWeeklyBundle(newWeeklyBundle);

      let newMonthlyBundle = existingInsights.monthlyBundle;
      if (shouldGenerateMonthlyInsight(newMonthlyBundle) && last30Days.length >= 14) {
        newMonthlyBundle = generateMonthlyInsights(last30Days, profile);
        console.log('📊 Generated monthly insights');
        
        if (newMonthlyBundle?.id) {
          const historyRef = doc(db, 'users', user.uid, 'insights', 'history', 'monthly', newMonthlyBundle.id);
          await setDoc(historyRef, newMonthlyBundle);
          console.log('📊 Monthly bundle archived to history');
        }
      }
      setMonthlyBundle(newMonthlyBundle);

      await setDoc(insightsRef, {
        dailyInsight: newDailyInsight || null,
        weeklyBundle: newWeeklyBundle || null,
        monthlyBundle: newMonthlyBundle || null,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 1:
        return 'border-l-4 border-l-primary-500 bg-primary-50';
      case 2:
        return 'border-l-4 border-l-blue-400 bg-blue-50';
      default:
        return 'border-l-4 border-l-gray-300 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      activity: '💪',
      nutrition: '❤️',
      sleep: '💤',
      stress: '⚖️',
      rhythm: '📈',
      emotional: '🤲',
      motivation: '🎯',
      faith: '📖',
      general: '⭐'
    };
    return icons[category] || '📊';
  };

  const displayInsights = getAllInsightsForDashboard(dailyInsight, weeklyBundle, monthlyBundle);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>📊</span> Insights
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm">
            Log your first day to start receiving personalized insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📊</span> Insights
        </h3>
        {(weeklyBundle || monthlyBundle) && (
          <button
            onClick={() => navigate('/insights')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {dailyInsight && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${getPriorityStyles(dailyInsight.priority)} cursor-pointer transition-all hover:shadow-sm`}
            onClick={() => setExpandedInsight(expandedInsight === 'daily' ? null : 'daily')}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{getCategoryIcon(dailyInsight.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">Today</span>
                  {dailyInsight.priority === 1 && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Important</span>
                  )}
                </div>
                <h4 className="font-medium text-gray-800 text-sm">{dailyInsight.title}</h4>
                <AnimatePresence>
                  {expandedInsight === 'daily' && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm text-gray-600 mt-2"
                    >
                      {dailyInsight.message}
                    </motion.p>
                  )}
                </AnimatePresence>
                {expandedInsight !== 'daily' && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{dailyInsight.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {weeklyBundle?.insights?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 cursor-pointer transition-all hover:shadow-sm"
            onClick={() => setExpandedInsight(expandedInsight === 'weekly' ? null : 'weekly')}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">📈</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">This Week</span>
                </div>
                <h4 className="font-medium text-gray-800 text-sm">Weekly Summary</h4>
                <AnimatePresence>
                  {expandedInsight === 'weekly' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {weeklyBundle.insights.map((insight, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-700">{insight.title}:</span>
                          <span className="text-gray-600 ml-1">{insight.message}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {expandedInsight !== 'weekly' && (
                  <p className="text-sm text-gray-600 mt-1">
                    {weeklyBundle.summary?.daysLogged || 0} days logged
                    {weeklyBundle.summary?.bestMetric && (
                      <span className="ml-2 text-green-600">
                        Best: {weeklyBundle.summary.bestMetric}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {monthlyBundle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span className="text-sm font-medium text-gray-700">Monthly Review Available</span>
              </div>
              <button
                onClick={() => navigate('/insights')}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                View
              </button>
            </div>
          </motion.div>
        )}

        {!dailyInsight && !weeklyBundle && !monthlyBundle && historyData.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              Keep logging to unlock personalized insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
