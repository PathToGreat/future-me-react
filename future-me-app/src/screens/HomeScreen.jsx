import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FutureSelfPreview from '../components/FutureSelfPreview';
import MicroSuggestionCard from '../components/MicroSuggestionCard';
import ReassessmentBanner from '../components/ReassessmentBanner';
import ProgressTimeline from '../components/ProgressTimeline';
import ConsistencyStreaks from '../components/ConsistencyStreaks';
import WeeklyReflectionPrompt from '../components/WeeklyReflectionPrompt';
import ProgressSnapshot from '../components/ProgressSnapshot';
import FirstMeaningfulWin from '../components/FirstMeaningfulWin';
import GentleCommitmentPrompt from '../components/GentleCommitmentPrompt';
import OperatingStyleCard from '../components/OperatingStyleCard';
import TodaysReflection from '../components/TodaysReflection';
import MiniAvatarPreview from '../components/MiniAvatarPreview';
import DirectionIndicator from '../components/DirectionIndicator';
import MonthlySnapshotCard from '../components/MonthlySnapshotCard';
import MonthlySnapshotScreen from '../components/MonthlySnapshotScreen';
import ProgressDetails from '../components/ProgressDetails';
import InsightsFeed from '../components/InsightsFeed';
import ReminderBanner from '../components/ReminderBanner';
import { detectPatterns, selectPatternForDisplay } from '../utils/trendPatternEngine';
import { checkNewPattern } from '../utils/reminderEngine';
import { trackPatternSurfaced, trackPatternDismissed, getLastShownPatterns, trackReturnAfterPattern } from '../utils/patternMetrics';
import { trackSilenceSession, trackPatternSession, trackPatternExpanded, trackPatternDismissedWithTiming, trackSessionReturn, trackReflectionResponse } from '../utils/patternValidation';
import { doc, updateDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ onNavigate }) {
  const {
    liveProfile,
    habits,
    achievements,
    showReassessmentBanner,
    reassessmentAnalysis,
    dismissReassessmentBanner,
    historyData,
  } = useApp();
  const { user } = useAuth();
  
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showMonthlySnapshot, setShowMonthlySnapshot] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [patternChecked, setPatternChecked] = useState(false);

  useEffect(() => {
    const initClarityMetrics = async () => {
      if (!user?.uid) return;
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'clarity');
        const metricsSnap = await getDoc(metricsRef);
        if (!metricsSnap.exists()) {
          await setDoc(metricsRef, {
            whatThisMeansExpanded: 0,
            whatChangedViewed: 0,
            progressSnapshotViewed: 0,
            progressSnapshotShared: 0,
            returnAfterExplanation: 0,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {}
    };
    initClarityMetrics();
  }, [user?.uid]);

  useEffect(() => {
    const detectAndDisplayPattern = async () => {
      if (!user?.uid || !historyData || historyData.length < 7 || patternChecked) return;
      
      setPatternChecked(true);
      
      try {
        await trackReturnAfterPattern(user.uid);
        await trackSessionReturn(user.uid);
        
        const lastShown = await getLastShownPatterns(user.uid);
        const patterns = detectPatterns(historyData, liveProfile?.lifeZones);
        const selectedPattern = selectPatternForDisplay(patterns, lastShown, 2);
        
        if (selectedPattern) {
          setCurrentPattern(selectedPattern);
          await trackPatternSurfaced(user.uid, selectedPattern.type, selectedPattern);
          await trackPatternSession(user.uid, selectedPattern.type);
          await checkNewPattern(user.uid, selectedPattern.type);
        } else {
          await trackSilenceSession(user.uid);
        }
      } catch (error) {
        console.error('Error detecting patterns:', error);
      }
    };
    
    detectAndDisplayPattern();
  }, [user?.uid, historyData, liveProfile?.lifeZones, patternChecked]);

  const handlePatternDismiss = async (patternType, displayDurationMs) => {
    if (user?.uid) {
      await trackPatternDismissed(user.uid, patternType);
      await trackPatternDismissedWithTiming(user.uid, patternType, displayDurationMs);
    }
    setCurrentPattern(null);
  };

  const handlePatternExpand = async (patternType) => {
    if (user?.uid) {
      await trackPatternExpanded(user.uid, patternType);
    }
  };

  const handlePatternReflection = async (patternType, response) => {
    if (user?.uid) {
      await trackReflectionResponse(user.uid, patternType, response);
    }
  };

  const handleOpenSnapshot = async () => {
    setShowSnapshot(true);
    if (user?.uid) {
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'clarity');
        await updateDoc(metricsRef, {
          progressSnapshotViewed: increment(1),
          lastSnapshotView: new Date().toISOString()
        }).catch(() => {});
      } catch (error) {}
    }
  };

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Your Dashboard</h1>
        <p className="text-gray-500 text-sm">Daily overview</p>
      </div>

      <ReminderBanner />

      <MiniAvatarPreview onNavigateToAvatar={onNavigate} />

      <TodaysReflection
        currentPattern={currentPattern}
        onPatternDismiss={handlePatternDismiss}
        onPatternExpand={handlePatternExpand}
        onPatternReflection={handlePatternReflection}
      />

      <DirectionIndicator />

      <WeeklyReflectionPrompt />

      <MonthlySnapshotCard onOpenSnapshot={() => setShowMonthlySnapshot(true)} />

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => onNavigate && onNavigate('metrics')}
        className="w-full py-4 px-6 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md hover:from-slate-800 hover:to-slate-900 transition-all flex items-center justify-center gap-2"
      >
        <span className="text-lg">📊</span>
        <span>Log Today's Metrics</span>
      </motion.button>

      <ProgressDetails>
        <FutureSelfPreview 
          lifestyleScore={liveProfile.lifestyleScore || 50} 
          lifeZones={liveProfile.lifeZones}
          habits={habits}
          achievements={achievements}
        />

        <ReassessmentBanner
          isVisible={showReassessmentBanner}
          improvements={reassessmentAnalysis?.improvements || []}
          declines={reassessmentAnalysis?.declines || []}
          summary={reassessmentAnalysis?.summary}
          onDismiss={dismissReassessmentBanner}
        />

        <OperatingStyleCard />

        <MicroSuggestionCard 
          onViewInsights={() => {
            const insightsSection = document.querySelector('[data-section="insights"]');
            if (insightsSection) {
              insightsSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        <ProgressTimeline />
        <ConsistencyStreaks />

        {historyData && historyData.length >= 3 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleOpenSnapshot}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-2 transition-colors"
            >
              View Progress Snapshot
            </button>
          </div>
        )}
      </ProgressDetails>

      <InsightsFeed />

      <ProgressSnapshot 
        isOpen={showSnapshot} 
        onClose={() => setShowSnapshot(false)} 
      />

      <FirstMeaningfulWin />
      <GentleCommitmentPrompt />

      <MonthlySnapshotScreen
        isOpen={showMonthlySnapshot}
        onClose={() => setShowMonthlySnapshot(false)}
      />
    </div>
  );
}
