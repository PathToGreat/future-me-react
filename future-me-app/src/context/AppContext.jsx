import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useHistoryData, saveDailySnapshot } from '../hooks/useHistoryData';
import { projectFutureMetrics } from '../utils/futureAvatarModel';
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

  const { trendAnalysis, historyData } = useHistoryData(user?.uid, liveProfile);

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
    console.log('📊 Future metrics check - historyData length:', historyData?.length || 0);
    if (historyData && historyData.length >= 1 && liveProfile) {
      const projected = projectFutureMetrics(historyData, liveProfile, habits);
      console.log('📊 Future metrics projected:', projected);
      setFutureMetrics(projected);
    }
  }, [historyData, liveProfile, habits]);

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
    refreshHabits,
    refreshAchievements,
    handleAchievementsEarned,
    handleCloseNotification,
    dismissReassessmentBanner,
    handleGenderChange,
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
