import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FutureSelfPreview from '../components/FutureSelfPreview';
import DailyInsight from '../components/DailyInsight';
import JourneyMeter from '../components/JourneyMeter';
import MicroSuggestionCard from '../components/MicroSuggestionCard';
import ReassessmentBanner from '../components/ReassessmentBanner';
import InsightsPanel from '../components/InsightsPanel';
import ProgressTimeline from '../components/ProgressTimeline';
import FocusZoneIndicator from '../components/FocusZoneIndicator';
import ConsistencyStreaks from '../components/ConsistencyStreaks';
import WeeklyReflectionPrompt from '../components/WeeklyReflectionPrompt';
import NoticingCard from '../components/NoticingCard';
import ProgressSnapshot from '../components/ProgressSnapshot';
import DailyReasonToReturn from '../components/DailyReasonToReturn';
import FirstMeaningfulWin from '../components/FirstMeaningfulWin';
import GentleCommitmentPrompt from '../components/GentleCommitmentPrompt';
import HowPeopleUseThis from '../components/HowPeopleUseThis';
import PatternCard from '../components/PatternCard';
import { detectPatterns, selectPatternForDisplay } from '../utils/trendPatternEngine';
import { trackPatternSurfaced, trackPatternDismissed, getLastShownPatterns, trackReturnAfterPattern } from '../utils/patternMetrics';
import { doc, updateDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
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
  const [noticingTriggered, setNoticingTriggered] = useState(false);
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
        
        const lastShown = await getLastShownPatterns(user.uid);
        const patterns = detectPatterns(historyData, liveProfile?.lifeZones);
        const selectedPattern = selectPatternForDisplay(patterns, lastShown, 2);
        
        if (selectedPattern) {
          setCurrentPattern(selectedPattern);
          await trackPatternSurfaced(user.uid, selectedPattern.type, selectedPattern);
          console.log('📊 Pattern detected and displayed:', selectedPattern.type);
        }
      } catch (error) {
        console.error('Error detecting patterns:', error);
      }
    };
    
    detectAndDisplayPattern();
  }, [user?.uid, historyData, liveProfile?.lifeZones, patternChecked]);

  const handlePatternDismiss = async (patternType) => {
    if (user?.uid) {
      await trackPatternDismissed(user.uid, patternType);
    }
    setCurrentPattern(null);
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
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600">Your daily overview</p>
      </div>

      <DailyReasonToReturn />

      <FocusZoneIndicator />

      <HowPeopleUseThis />

      <NoticingCard onNoticingTriggered={setNoticingTriggered} />

      {currentPattern && (
        <PatternCard 
          pattern={currentPattern} 
          onDismiss={handlePatternDismiss} 
        />
      )}

      <WeeklyReflectionPrompt />

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

      <MicroSuggestionCard 
        onViewInsights={() => {
          const insightsSection = document.querySelector('[data-section="insights"]');
          if (insightsSection) {
            insightsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <ProgressTimeline />
        <ConsistencyStreaks />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DailyInsight
          activity={liveProfile.activity}
          nutrition={liveProfile.nutrition}
          sleep={liveProfile.sleep}
          stress={liveProfile.stress}
        />
        <JourneyMeter onboardingCompleted={liveProfile.onboardingCompleted} />
      </div>

      <div data-section="insights">
        <InsightsPanel 
          profile={liveProfile}
          historyData={historyData}
        />
      </div>

      {historyData && historyData.length >= 3 && (
        <div className="flex justify-center">
          <button
            onClick={handleOpenSnapshot}
            className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-2"
          >
            📊 View Progress Snapshot
          </button>
        </div>
      )}

      <ProgressSnapshot 
        isOpen={showSnapshot} 
        onClose={() => setShowSnapshot(false)} 
      />

      <FirstMeaningfulWin noticingTriggered={noticingTriggered} />
      <GentleCommitmentPrompt />
    </div>
  );
}
