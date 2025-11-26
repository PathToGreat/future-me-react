import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, limit, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Habit Data Schema:
 * - title: string
 * - zoneId: string | null (health, socialEmotional, wealth, faith, family, community, or null for no zone)
 * - streak: number (current consecutive days completed)
 * - lastCompletedDate: string (YYYY-MM-DD format)
 * - createdAt: timestamp
 * - completionHistory: array of date strings
 */

const MAX_HABITS = 15;

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * Check if user has reached habit limit
 */
export const checkHabitLimit = async (userId) => {
  const habitsRef = collection(db, 'users', userId, 'habits');
  const snapshot = await getDocs(habitsRef);
  return snapshot.size >= MAX_HABITS;
};

/**
 * Create a new habit
 */
export const createHabit = async (userId, habitData) => {
  // Check limit first
  const limitReached = await checkHabitLimit(userId);
  if (limitReached) {
    throw new Error(`Maximum ${MAX_HABITS} habits allowed`);
  }

  const habitsRef = collection(db, 'users', userId, 'habits');
  
  const newHabit = {
    title: habitData.title.trim(),
    zoneId: habitData.zoneId || null, // Allow null for habits without a Life Zone
    streak: 0,
    lastCompletedDate: null,
    createdAt: serverTimestamp(),
    completionHistory: []
  };

  const docRef = await addDoc(habitsRef, newHabit);
  return docRef.id;
};

/**
 * Calculate new streak based on last completion date
 */
export const calculateStreak = (lastCompletedDate) => {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  if (!lastCompletedDate) {
    // First time completing - streak starts at 1
    return 1;
  }

  if (lastCompletedDate === today) {
    // Already completed today - don't change streak
    return null; // Signal that no update is needed
  }

  if (lastCompletedDate === yesterday) {
    // Continuing streak - increment
    return 'increment';
  }

  // Streak broken - reset to 1
  return 1;
};

/**
 * Complete a habit for today
 */
export const completeHabit = async (userId, habitId, currentStreak, lastCompletedDate) => {
  const today = getTodayDate();

  // Check if already completed today
  if (lastCompletedDate === today) {
    return { alreadyCompleted: true };
  }

  const streakUpdate = calculateStreak(lastCompletedDate);
  
  let newStreak;
  if (streakUpdate === 'increment') {
    newStreak = currentStreak + 1;
  } else if (streakUpdate === null) {
    newStreak = currentStreak; // No change
  } else {
    newStreak = streakUpdate;
  }

  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  
  // Use arrayUnion to append today's date to completionHistory without overwriting
  await updateDoc(habitRef, {
    streak: newStreak,
    lastCompletedDate: today,
    completionHistory: arrayUnion(today) // Appends today to existing array
  });

  return { 
    success: true, 
    newStreak,
    completedToday: true
  };
};

/**
 * Get all habits for a user
 */
export const getUserHabits = async (userId) => {
  const habitsRef = collection(db, 'users', userId, 'habits');
  const q = query(habitsRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * Calculate Life Zone bonus from habit streaks
 * Returns an object with zone bonuses: { health: 2.5, faith: 1.0, ... }
 */
export const calculateHabitZoneBonuses = (habits) => {
  const bonuses = {
    health: 0,
    socialEmotional: 0,
    wealth: 0,
    faith: 0,
    family: 0,
    community: 0
  };

  if (!habits || habits.length === 0) {
    return bonuses;
  }

  habits.forEach(habit => {
    const { zoneId, streak, lastCompletedDate } = habit;
    const today = getTodayDate();
    
    // Only count active streaks (completed today or yesterday)
    const yesterday = getYesterdayDate();
    const isActive = lastCompletedDate === today || lastCompletedDate === yesterday;
    
    if (isActive && streak > 0) {
      // Base bonus: 1 point per active habit
      // Streak bonus: +0.2 points per streak day (capped at +4)
      const streakBonus = Math.min(streak * 0.2, 4);
      const totalBonus = 1 + streakBonus;
      
      bonuses[zoneId] = (bonuses[zoneId] || 0) + totalBonus;
    }
  });

  return bonuses;
};

/**
 * Check if habit was completed today
 */
export const isCompletedToday = (lastCompletedDate) => {
  return lastCompletedDate === getTodayDate();
};

/**
 * Delete a habit
 */
export const deleteHabit = async (userId, habitId) => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await deleteDoc(habitRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};
