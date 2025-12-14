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
        
        const thisWeekLogs = [];
        const olderLogs = [];
        
        dailySnapshot.forEach(doc => {
          const data = doc.data();
          const logDate = data.timestamp ? new Date(data.timestamp) : new Date(doc.id);
          
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
      } catch (error) {
        console.log('Could not fetch daily data for user:', userDoc.id);
      }
    }
    
    return {
      totalUsers,
      onboardingCompletionRate: totalUsers > 0 ? Math.round((usersWithOnboarding / totalUsers) * 100) : 0,
      weeklyLoggingRate: totalUsers > 0 ? Math.round((usersLogging3Plus / totalUsers) * 100) : 0,
      retentionRate: totalUsers > 0 ? Math.round((usersReturnedAfter7Days / totalUsers) * 100) : 0,
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
      
      <div className="grid grid-cols-2 gap-4">
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
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        This dashboard is for founder insight only and not visible to users.
      </p>
    </motion.div>
  );
}
