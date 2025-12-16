import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function InsightsHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current');
  const [currentInsights, setCurrentInsights] = useState(null);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadInsights();
    }
  }, [user?.uid]);

  const loadInsights = async () => {
    try {
      const insightsRef = doc(db, 'users', user.uid, 'insights', 'current');
      const insightsSnap = await getDoc(insightsRef);
      
      if (insightsSnap.exists()) {
        setCurrentInsights(insightsSnap.data());
      }

      const historyRef = collection(db, 'users', user.uid, 'insights', 'history', 'monthly');
      const historyQuery = query(historyRef, orderBy('createdAt', 'desc'), limit(12));
      const historySnap = await getDocs(historyQuery);
      
      const history = [];
      historySnap.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setMonthlyHistory(history);
    } catch (error) {
      console.error('Error loading insights history:', error);
    } finally {
      setLoading(false);
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return { text: 'High Priority', color: 'bg-red-100 text-red-700' };
      case 2: return { text: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
      default: return { text: 'Info', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-100 rounded"></div>
            <div className="h-40 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">All Insights</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'current'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {currentInsights?.dailyInsight && (
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{getCategoryIcon(currentInsights.dailyInsight.category)}</span>
                    <h3 className="font-semibold text-gray-800">Today's Insight</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityLabel(currentInsights.dailyInsight.priority).color}`}>
                      {getPriorityLabel(currentInsights.dailyInsight.priority).text}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-700 mb-2">{currentInsights.dailyInsight.title}</h4>
                  <p className="text-gray-600">{currentInsights.dailyInsight.message}</p>
                </div>
              )}

              {!currentInsights?.dailyInsight && (
                <div className="card p-5 text-center">
                  <p className="text-gray-500">Log today's metrics to see your daily insight.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'weekly' && (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {currentInsights?.weeklyBundle?.insights?.length > 0 ? (
                <>
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>📈</span> This Week's Summary
                      </h3>
                      <span className="text-xs text-gray-500">
                        {currentInsights.weeklyBundle.summary?.daysLogged || 0} days logged
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {currentInsights.weeklyBundle.insights.map((insight, idx) => (
                        <div 
                          key={idx}
                          className={`p-4 rounded-lg ${
                            insight.subtype === 'highlight' ? 'bg-green-50 border-l-4 border-l-green-500' :
                            insight.subtype === 'opportunity' ? 'bg-orange-50 border-l-4 border-l-orange-500' :
                            'bg-blue-50 border-l-4 border-l-blue-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getCategoryIcon(insight.category)}</span>
                            <h4 className="font-medium text-gray-800">{insight.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600">{insight.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentInsights.weeklyBundle.summary?.averages && (
                    <div className="card p-5">
                      <h4 className="font-medium text-gray-700 mb-3">Weekly Averages</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(currentInsights.weeklyBundle.summary.averages).map(([metric, value]) => (
                          value !== null && (
                            <div key={metric} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600 capitalize">{metric}</span>
                              <span className="font-medium text-gray-800">{value?.toFixed(1) || '-'}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-5 text-center">
                  <p className="text-gray-500">Log at least 3 days this week to see weekly insights.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'monthly' && (
            <motion.div
              key="monthly"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {currentInsights?.monthlyBundle ? (
                <>
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>🎯</span> Monthly Review
                      </h3>
                      <span className="text-xs text-gray-500">
                        {currentInsights.monthlyBundle.summary?.daysLogged || 0} days logged
                      </span>
                    </div>

                    {currentInsights.monthlyBundle.emergingPattern && (
                      <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-l-purple-500 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getCategoryIcon(currentInsights.monthlyBundle.emergingPattern.category)}</span>
                          <h4 className="font-medium text-gray-800">{currentInsights.monthlyBundle.emergingPattern.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{currentInsights.monthlyBundle.emergingPattern.message}</p>
                      </div>
                    )}

                    {currentInsights.monthlyBundle.keystoneRecommendation && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🔑</span>
                          <h4 className="font-medium text-gray-800">{currentInsights.monthlyBundle.keystoneRecommendation.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{currentInsights.monthlyBundle.keystoneRecommendation.message}</p>
                      </div>
                    )}
                  </div>

                  {currentInsights.monthlyBundle.consistencyRanking?.length > 0 && (
                    <div className="card p-5">
                      <h4 className="font-medium text-gray-700 mb-3">Consistency Ranking</h4>
                      <div className="space-y-2">
                        {currentInsights.monthlyBundle.consistencyRanking.map((item, idx) => (
                          <div key={item.metric} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">{item.metric}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  item.label === 'Excellent' ? 'bg-green-100 text-green-700' :
                                  item.label === 'Good' ? 'bg-blue-100 text-blue-700' :
                                  item.label === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.label}
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.score > 80 ? 'bg-green-500' :
                                    item.score > 60 ? 'bg-blue-500' :
                                    item.score > 40 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-5 text-center">
                  <p className="text-gray-500">Log at least 14 days to see monthly insights.</p>
                </div>
              )}

              {monthlyHistory.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-medium text-gray-700 mb-3">Previous Months</h4>
                  <div className="space-y-3">
                    {monthlyHistory.map((bundle) => (
                      <div key={bundle.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(bundle.period?.start)} - {formatDate(bundle.period?.end)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {bundle.summary?.daysLogged || 0} days
                          </span>
                        </div>
                        {bundle.keystoneRecommendation && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {bundle.keystoneRecommendation.title}: {bundle.keystoneRecommendation.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-gray-400 text-center mt-6 pb-4">
          Insights reflect patterns, not diagnoses or predictions.
        </p>
      </div>
    </div>
  );
}
