import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const WIN_TRIGGERS = {
  THREE_DAYS_LOGGING: 'three_days_logging',
  FIRST_NOTICING: 'first_noticing',
  CONSISTENT_FOCUS_ZONE: 'consistent_focus_zone'
};

const WIN_MESSAGES = {
  [WIN_TRIGGERS.THREE_DAYS_LOGGING]: {
    title: 'Patterns Are Emerging',
    message: 'You now have enough data for patterns to emerge. This is where clarity begins.',
    detail: 'With three days of observations, your baseline is becoming more accurate and trends are starting to form.'
  },
  [WIN_TRIGGERS.FIRST_NOTICING]: {
    title: 'Change Observed',
    message: 'Something has shifted since you started. Your awareness is working.',
    detail: 'The app has detected a meaningful change in your metrics compared to your starting baseline.'
  },
  [WIN_TRIGGERS.CONSISTENT_FOCUS_ZONE]: {
    title: 'Focus Is Taking Shape',
    message: 'Your attention has been consistent in one area. That kind of focus leads to change.',
    detail: 'When you consistently engage with one life zone, improvements tend to follow.'
  }
};

async function checkFirstWinStatus(userId) {
  if (!userId) return null;
  
  try {
    const docRef = doc(db, 'users', userId, 'milestones', 'firstWin');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.log('Error checking first win status:', error);
    return null;
  }
}

async function markFirstWinShown(userId, triggerType) {
  if (!userId) return;
  
  try {
    const docRef = doc(db, 'users', userId, 'milestones', 'firstWin');
    await setDoc(docRef, {
      shown: true,
      triggerType,
      shownAt: new Date().toISOString()
    });
  } catch (error) {
    console.log('Error marking first win:', error);
  }
}

function detectWinTrigger(historyData, noticingTriggered, focusZoneHistory) {
  if (!historyData) return null;

  if (historyData.length >= 3) {
    return WIN_TRIGGERS.THREE_DAYS_LOGGING;
  }

  if (noticingTriggered) {
    return WIN_TRIGGERS.FIRST_NOTICING;
  }

  if (focusZoneHistory && focusZoneHistory.length >= 2) {
    const zones = focusZoneHistory.slice(0, 2);
    if (zones[0] === zones[1]) {
      return WIN_TRIGGERS.CONSISTENT_FOCUS_ZONE;
    }
  }

  return null;
}

export default function FirstMeaningfulWin({ noticingTriggered = false }) {
  const { user } = useAuth();
  const { historyData, liveProfile } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [winData, setWinData] = useState(null);
  const [alreadyShown, setAlreadyShown] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchStatus = async () => {
      const existingWin = await checkFirstWinStatus(user.uid);
      setAlreadyShown(existingWin?.shown || false);
    };
    
    fetchStatus();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || alreadyShown === null || alreadyShown === true) return;

    const checkWin = async () => {
      const focusZoneHistory = liveProfile?.focusZoneHistory || [];
      const trigger = detectWinTrigger(historyData, noticingTriggered, focusZoneHistory);

      if (trigger) {
        setWinData(WIN_MESSAGES[trigger]);
        setIsVisible(true);
        await markFirstWinShown(user.uid, trigger);
        setAlreadyShown(true);
      }
    };

    const timer = setTimeout(checkWin, 1500);
    return () => clearTimeout(timer);
  }, [user?.uid, historyData, noticingTriggered, liveProfile, alreadyShown]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !winData) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-center">
            <span className="text-4xl mb-2 block">📈</span>
            <h2 className="text-white font-bold text-lg">{winData.title}</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-800 text-center mb-4 font-medium">
              {winData.message}
            </p>
            
            <p className="text-gray-500 text-sm text-center mb-6">
              {winData.detail}
            </p>

            <button
              onClick={handleDismiss}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
