import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { getSuggestionIcon, categorizeSuggestionPriority } from '../utils/microSuggestionsEngine';

export default function MicroSuggestionCard({ suggestion, onViewInsights }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [storedSuggestion, setStoredSuggestion] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (suggestion) {
      setStoredSuggestion(suggestion);
    } else if (user?.uid) {
      loadStoredSuggestion();
    }
  }, [suggestion, user?.uid]);

  const loadStoredSuggestion = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const suggestionRef = doc(db, 'users', user.uid, 'microSuggestions', today);
      const suggestionSnap = await getDoc(suggestionRef);
      
      if (suggestionSnap.exists()) {
        const data = suggestionSnap.data();
        const hydrationPattern = /hydrat|water intake/i;
        if (data.summary && hydrationPattern.test(data.summary)) {
          data.summary = "Your metrics today are consistent with your patterns. Consistency supports long-term progress.";
        }
        if (data.details && Array.isArray(data.details)) {
          data.details = data.details.filter(d => !hydrationPattern.test(d.text || ''));
        }
        setStoredSuggestion(data);
      }
    } catch (error) {
      console.error('Error loading stored suggestion:', error);
    }
  };

  if (!storedSuggestion?.summary) return null;

  const priority = categorizeSuggestionPriority(storedSuggestion.rawResult);
  
  const priorityStyles = {
    attention: 'from-amber-50 to-orange-50 border-amber-200',
    positive: 'from-emerald-50 to-green-50 border-emerald-200',
    neutral: 'from-blue-50 to-indigo-50 border-blue-200'
  };

  const priorityIcons = {
    attention: '📊',
    positive: '📈',
    neutral: '💡'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border-2 p-4 bg-gradient-to-br ${priorityStyles[priority]} shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{priorityIcons[priority]}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-gray-700">Today's Insight</h4>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed">
            {storedSuggestion.summary}
          </p>
          
          {storedSuggestion.source && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {storedSuggestion.source}
            </p>
          )}

          {storedSuggestion.hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {isExpanded ? 'Show less' : 'More insights'}
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && storedSuggestion.details && storedSuggestion.details.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-3 border-t border-gray-200 pt-4"
          >
            {storedSuggestion.details.map((detail, index) => {
              if (!detail || typeof detail !== 'object') return null;
              if (index === 0 && detail.text === storedSuggestion.summary) return null;
              
              return (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-lg">{getSuggestionIcon(detail.type || 'combined')}</span>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {formatZoneName(detail.type || 'insight')}
                    </span>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {detail.text || 'No additional details available.'}
                    </p>
                    {detail.source && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {detail.source}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {onViewInsights && (
              <button
                onClick={onViewInsights}
                className="w-full mt-3 py-2 px-4 bg-white/50 hover:bg-white/80 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>📈</span>
                View Weekly & Monthly Insights
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatZoneName(type) {
  const names = {
    activity: 'Physical Activity',
    nutrition: 'Nutrition',
    sleep: 'Sleep',
    stress: 'Stress',
    faith: 'Faith & Purpose',
    emotional: 'Emotional Wellness',
    energy: 'Energy Level',
    routine: 'Evening Routine',
    combined: 'Combined Pattern',
    general: 'General Insight',
    insight: 'Insight'
  };
  return names[type] || 'Insight';
}

export function MicroSuggestionToast({ suggestion, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!suggestion?.summary) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-800">Quick Insight</h4>
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(onDismiss, 300);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {suggestion.summary}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
