import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useHistoryData, saveDailySnapshot } from '../hooks/useHistoryData';
import { projectFutureMetrics } from '../utils/futureAvatarModel';
import { predictFutureState } from '../utils/predictFutureState';
import { getMetricTrend } from '../utils/analyzeTrends';
import { calculateCurrentMeMetrics } from '../utils/currentMeAvatarModel';
import { analyzeReassessmentNeed } from '../utils/reassessmentAnalyzer';
import { getUserHabits, calculateHabitZoneBonuses } from '../utils/habitHelpers';
import { getUserAchievements } from '../utils/achievementEngine';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [liveProfile, setLiveProfile] = useState(null);
  const [showFutureAvatar, setShowFutureAvatar] = useState(false);
  const [futureMetrics, setFutureMetrics] = useState(null);
  const [habits, setHabits] = useState([]);
  const [habitBonuses, setHabitBonuses] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [newAchievementNotification, setNewAchievementNotification] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [currentMeMetrics, setCurrentMeMetrics] = useState(null);
  const [reassessmentAnalysis, setReassessmentAnalysis] = useState(null);
  const [showReassessmentBanner, setShowReassessmentBanner] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughCompleted, setWalkthroughCompleted] = useState(false);

  const { trendAnalysis, historyData } = useHistoryData(user?.uid, liveProfile);

  useEffect(() => {
    if (user?.uid && liveProfile) {
      const walkthroughKey = `walkthrough_completed_${user.uid}`;
      const completedTimestamp = localStorage.getItem(walkthroughKey);
      const wasCompleted = !!completedTimestamp;
      setWalkthroughCompleted(wasCompleted);
      
      if (wasCompleted) {
        return;
      }
      
      const shouldShowWalkthrough = () => {
        if (!historyData || historyData.length === 0) return true;
        
        if (historyData.length > 0) {
          const lastLog = historyData[0];
          if (lastLog?.date) {
            const lastLogDate = new Date(lastLog.date);
            const today = new Date();
            const daysSinceLastLog = Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
            if (daysSinceLastLog > 7) return true;
          }
        }
        return true;
      };
      
      if (shouldShowWalkthrough()) {
        const timer = setTimeout(() => {
          setShowWalkthrough(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.uid, liveProfile, historyData]);

  useEffect(() => {
    if (liveProfile && historyData) {
      const metrics = calculateCurrentMeMetrics(liveProfile, historyData);
      setCurrentMeMetrics(metrics);
    }
  }, [liveProfile, historyData]);

  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        setLiveProfile(profileData);
        
        if (profileData.gender) {
          setSelectedGender(profileData.gender);
        } else if (profileData.onboardingBaseline?.gender) {
          setSelectedGender(profileData.onboardingBaseline.gender);
        } else {
          setSelectedGender('male');
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    
    const loadHabits = async () => {
      try {
        const userHabits = await getUserHabits(user.uid);
        setHabits(userHabits);
        
        if (userHabits.length > 0) {
          const bonuses = calculateHabitZoneBonuses(userHabits);
          setHabitBonuses(bonuses);
        }
      } catch (error) {
        console.error('Error loading habits:', error);
      }
    };
    
    loadHabits();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    
    const loadAchievements = async () => {
      try {
        const userAchievements = await getUserAchievements(user.uid);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    };
    
    loadAchievements();
  }, [user?.uid]);

  useEffect(() => {
    if (trendAnalysis && liveProfile?.lifestyleScore && historyData) {
      const metricTrends = historyData.length >= 2 ? {
        activity: getMetricTrend(historyData, 'activity'),
        nutrition: getMetricTrend(historyData, 'nutrition'),
        sleep: getMetricTrend(historyData, 'sleep'),
        stress: getMetricTrend(historyData, 'stress')
      } : null;

      const futureProjections = predictFutureState(
        liveProfile.lifestyleScore,
        trendAnalysis.trendSlope,
        {
          lifeZones: liveProfile.lifeZones || null,
          habits: habits,
          metricTrends: metricTrends
        }
      );
      setPredictions(futureProjections);
      console.log('📊 Predictions calculated:', futureProjections ? 'success' : 'null');
    }
  }, [trendAnalysis, liveProfile?.lifestyleScore, liveProfile?.lifeZones, habits, historyData]);

  useEffect(() => {
    if (liveProfile && historyData && predictions && historyData.length >= 2) {
      const projected = projectFutureMetrics(liveProfile, historyData, predictions, 90);
      setFutureMetrics(projected);
      console.log('📊 Future Avatar Metrics calculated:', projected ? 'success' : 'null');
    }
  }, [liveProfile, historyData, predictions]);

  useEffect(() => {
    if (historyData && historyData.length >= 14 && liveProfile?.onboardingBaseline) {
      const analysis = analyzeReassessmentNeed(historyData, liveProfile.onboardingBaseline);
      setReassessmentAnalysis(analysis);
      
      if (analysis.shouldReassess && !sessionStorage.getItem('reassessmentBannerDismissed')) {
        setShowReassessmentBanner(true);
      }
    }
  }, [historyData, liveProfile?.onboardingBaseline]);

  useEffect(() => {
    if (liveProfile && historyData && user?.uid) {
      saveDailySnapshot(user.uid, liveProfile, historyData);
    }
  }, [liveProfile, historyData, user?.uid]);

  const refreshHabits = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userHabits = await getUserHabits(user.uid);
      setHabits(userHabits);
      if (userHabits.length > 0) {
        const bonuses = calculateHabitZoneBonuses(userHabits);
        setHabitBonuses(bonuses);
      }
    } catch (error) {
      console.error('Error refreshing habits:', error);
    }
  }, [user?.uid]);

  const refreshAchievements = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userAchievements = await getUserAchievements(user.uid);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error refreshing achievements:', error);
    }
  }, [user?.uid]);

  const handleAchievementsEarned = useCallback((newAchievements) => {
    if (newAchievements && newAchievements.length > 0) {
      setNewAchievementNotification(newAchievements[0]);
      refreshAchievements();
    }
  }, [refreshAchievements]);

  const handleCloseNotification = useCallback(() => {
    setNewAchievementNotification(null);
  }, []);

  const dismissReassessmentBanner = useCallback(() => {
    setShowReassessmentBanner(false);
    sessionStorage.setItem('reassessmentBannerDismissed', 'true');
  }, []);

  const handleGenderChange = useCallback((gender) => {
    setSelectedGender(gender);
  }, []);

  const completeWalkthrough = useCallback(() => {
    if (user?.uid) {
      const walkthroughKey = `walkthrough_completed_${user.uid}`;
      localStorage.setItem(walkthroughKey, 'true');
      setWalkthroughCompleted(true);
    }
    setShowWalkthrough(false);
  }, [user?.uid]);

  const dismissWalkthrough = useCallback(() => {
    setShowWalkthrough(false);
  }, []);

  const replayWalkthrough = useCallback(() => {
    setShowWalkthrough(true);
  }, []);

  const value = {
    liveProfile,
    showFutureAvatar,
    setShowFutureAvatar,
    futureMetrics,
    habits,
    habitBonuses,
    achievements,
    newAchievementNotification,
    selectedGender,
    currentMeMetrics,
    reassessmentAnalysis,
    showReassessmentBanner,
    trendAnalysis,
    historyData,
    showWalkthrough,
    walkthroughCompleted,
    refreshHabits,
    refreshAchievements,
    handleAchievementsEarned,
    handleCloseNotification,
    dismissReassessmentBanner,
    handleGenderChange,
    completeWalkthrough,
    dismissWalkthrough,
    replayWalkthrough,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
