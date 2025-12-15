import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LOCAL_STORAGE_KEY = 'futureme_commitment_shown';

function getLocalCommitmentStatus(userId) {
  try {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    return stored === 'true';
  } catch {
    return false;
  }
}

function setLocalCommitmentStatus(userId) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, 'true');
  } catch {
    // localStorage not available
  }
}

async function getCommitmentStatus(userId) {
  if (!userId) return null;
  
  if (getLocalCommitmentStatus(userId)) {
    return { promptShown: true };
  }
  
  try {
    const docRef = doc(db, 'users', userId, 'milestones', 'commitment');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data()?.promptShown) {
      setLocalCommitmentStatus(userId);
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.warn('Error checking commitment status:', error.message);
    return null;
  }
}

async function saveCommitmentChoice(userId, choice) {
  if (!userId) return false;
  
  setLocalCommitmentStatus(userId);
  
  try {
    const docRef = doc(db, 'users', userId, 'milestones', 'commitment');
    await setDoc(docRef, {
      promptShown: true,
      choice,
      chosenAt: new Date().toISOString(),
      commitmentEndDate: choice === '30_day' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null
    });
    return true;
  } catch (error) {
    console.warn('Error saving commitment choice to Firestore:', error.message);
    return false;
  }
}

function countInteractionDays(historyData) {
  if (!historyData || historyData.length === 0) return 0;
  
  const uniqueDays = new Set();
  historyData.forEach(log => {
    const date = new Date(log.date);
    uniqueDays.add(date.toDateString());
  });
  
  return uniqueDays.size;
}

export default function GentleCommitmentPrompt() {
  const { user } = useAuth();
  const { historyData } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [alreadyShown, setAlreadyShown] = useState(null);
  const [statusFetched, setStatusFetched] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    
    let mounted = true;
    
    const fetchStatus = async () => {
      const existingCommitment = await getCommitmentStatus(user.uid);
      if (mounted) {
        setAlreadyShown(existingCommitment?.promptShown || false);
        setStatusFetched(true);
      }
    };
    
    fetchStatus();
    
    return () => { mounted = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !statusFetched || alreadyShown) return;

    const interactionDays = countInteractionDays(historyData);
    
    if (interactionDays >= 7) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, historyData, statusFetched, alreadyShown]);

  const handleChoice = async (choice) => {
    setAlreadyShown(true);
    setIsVisible(false);
    await saveCommitmentChoice(user?.uid, choice);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-5 text-center">
            <span className="text-4xl mb-2 block">🎯</span>
            <h2 className="text-white font-bold text-lg">You've Been Consistent</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-800 text-center mb-2">
              Seven days of awareness is meaningful.
            </p>
            
            <p className="text-gray-500 text-sm text-center mb-6">
              Would you like to make this a longer-term practice?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleChoice('30_day')}
                className="w-full py-3 px-4 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
              >
                Commit to 30 days
              </button>
              
              <button
                onClick={() => handleChoice('casual')}
                className="w-full py-3 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Continue casually
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Either choice is valid. This is about your intention.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
