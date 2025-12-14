import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

async function fetchInvestorMetrics() {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let totalUsers = 0;
    let usersWithOnboarding = 0;
    let usersLogging3Plus = 0;
    let usersReturnedAfter7Days = 0;
    let usersReached7DayConsistency = 0;
    let usersReachedFirstInsight = 0;
    let usersReturnedAfterFirstInsight = 0;
    let totalDaysToFirstChange = 0;
    let usersWithFirstChange = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      totalUsers++;
      const userData = userDoc.data();
      
      if (userData.onboardingCompleted) {
        usersWithOnboarding++;
      }
      
      try {
        const dailyDataRef = collection(db, 'users', userDoc.id, 'dailyData');
        const dailyQuery = query(dailyDataRef, orderBy('timestamp', 'desc'), limit(30));
        const dailySnapshot = await getDocs(dailyQuery);
        
        const allLogs = [];
        const thisWeekLogs = [];
        const olderLogs = [];
        
        dailySnapshot.forEach(doc => {
          const data = doc.data();
          const logDate = data.timestamp ? new Date(data.timestamp) : new Date(doc.id);
          allLogs.push({ id: doc.id, date: logDate, ...data });
          
          if (logDate >= sevenDaysAgo) {
            thisWeekLogs.push(doc.id);
          }
          
          if (logDate < sevenDaysAgo) {
            olderLogs.push(doc.id);
          }
        });
        
        if (thisWeekLogs.length >= 3) {
          usersLogging3Plus++;
        }
        
        if (thisWeekLogs.length > 0 && olderLogs.length > 0) {
          usersReturnedAfter7Days++;
        }

        if (allLogs.length >= 7) {
          let consecutiveDays = 0;
          const sortedLogs = [...allLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
          
          for (let i = 0; i < sortedLogs.length - 1; i++) {
            const diff = Math.abs(new Date(sortedLogs[i].date) - new Date(sortedLogs[i + 1].date));
            if (diff <= 86400000 * 1.5) {
              consecutiveDays++;
            } else {
              break;
            }
          }
          
          if (consecutiveDays >= 6) {
            usersReached7DayConsistency++;
          }
        }

        const baseline = userData.onboardingBaseline || {};
        if (allLogs.length >= 7) {
          const sortedLogs = [...allLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
          const firstLogDate = new Date(sortedLogs[0].date);
          
          const avg = (arr, key) => {
            const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
            return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
          };
          
          for (let endIdx = 6; endIdx < sortedLogs.length; endIdx++) {
            const window = sortedLogs.slice(Math.max(0, endIdx - 6), endIdx + 1);
            const windowDate = new Date(sortedLogs[endIdx].date);
            const daysFromStart = Math.floor((windowDate - firstLogDate) / (1000 * 60 * 60 * 24));
            
            const currentSleep = avg(window, 'sleep');
            const currentStress = avg(window, 'stress');
            const currentActivity = avg(window, 'activity');
            
            const baselineSleep = baseline.sleep || 3;
            const baselineStress = baseline.stress || 3;
            const baselineActivity = baseline.activity || 3;
            
            const hasChange = 
              (currentSleep !== null && currentSleep > baselineSleep + 0.3) ||
              (currentStress !== null && currentStress < baselineStress - 0.5) ||
              (currentActivity !== null && currentActivity > baselineActivity + 0.4);
            
            if (hasChange) {
              usersWithFirstChange++;
              totalDaysToFirstChange += Math.min(daysFromStart, 14);
              break;
            }
          }
        }

        if (allLogs.length >= 5) {
          usersReachedFirstInsight++;
          
          if (allLogs.length >= 7) {
            usersReturnedAfterFirstInsight++;
          }
        }
      } catch (error) {
        console.log('Could not fetch daily data for user:', userDoc.id);
      }
    }
    
    return {
      totalUsers,
      onboardingCompletionRate: totalUsers > 0 ? Math.round((usersWithOnboarding / totalUsers) * 100) : 0,
      weeklyLoggingRate: totalUsers > 0 ? Math.round((usersLogging3Plus / totalUsers) * 100) : 0,
      retentionRate: totalUsers > 0 ? Math.round((usersReturnedAfter7Days / totalUsers) * 100) : 0,
      sevenDayConsistencyRate: totalUsers > 0 ? Math.round((usersReached7DayConsistency / totalUsers) * 100) : 0,
      avgDaysToFirstChange: usersWithFirstChange > 0 ? Math.round(totalDaysToFirstChange / usersWithFirstChange) : 0,
      returnAfterInsightRate: usersReachedFirstInsight > 0 ? Math.round((usersReturnedAfterFirstInsight / usersReachedFirstInsight) * 100) : 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching investor metrics:', error);
    return null;
  }
}

export default function InvestorMetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const data = await fetchInvestorMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-white">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !metrics) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-white">
        <p className="text-red-400">{error || 'Unable to load metrics'}</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-900 rounded-xl p-6 text-white"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">📊 Founder Metrics (Internal)</h2>
        <span className="text-xs text-gray-400">
          Updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{metrics.totalUsers}</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Onboarding Completion</p>
          <p className="text-3xl font-bold text-green-400">{metrics.onboardingCompletionRate}%</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Weekly Active (3+ logs)</p>
          <p className="text-3xl font-bold text-blue-400">{metrics.weeklyLoggingRate}%</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">7-Day Retention</p>
          <p className="text-3xl font-bold text-purple-400">{metrics.retentionRate}%</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Engagement Signals</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Avg Days to First Change</p>
            <p className="text-xl font-bold text-amber-400">{metrics.avgDaysToFirstChange || '—'}</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">7-Day Consistency</p>
            <p className="text-xl font-bold text-cyan-400">{metrics.sevenDayConsistencyRate}%</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Return After Insight</p>
            <p className="text-xl font-bold text-pink-400">{metrics.returnAfterInsightRate}%</p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        This dashboard is for founder insight only and not visible to users.
      </p>
    </motion.div>
  );
}
