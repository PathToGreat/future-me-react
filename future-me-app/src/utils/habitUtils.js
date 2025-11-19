import { collection, doc, getDocs, getDoc, setDoc, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ZONE_OPTIONS = [
  { value: 'health', label: 'Health' },
  { value: 'socialEmotional', label: 'Social Emotional' },
  { value: 'wealth', label: 'Wealth' },
  { value: 'faith', label: 'Faith' },
  { value: 'family', label: 'Family' },
  { value: 'community', label: 'Community' }
];

const MAX_ACTIVE_HABITS = 3;

const HABIT_ZONE_BONUS = 3;

export { ZONE_OPTIONS, MAX_ACTIVE_HABITS, HABIT_ZONE_BONUS };

export async function getUserHabits(userId) {
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const habitsSnapshot = await getDocs(habitsRef);
    
    const habits = habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return habits.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
}

export async function getActiveHabits(userId) {
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const activeQuery = query(habitsRef, where('active', '==', true));
    const habitsSnapshot = await getDocs(activeQuery);
    
    return habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching active habits:', error);
    return [];
  }
}

export async function createHabit(userId, habitData) {
  try {
    const activeHabits = await getActiveHabits(userId);
    
    if (activeHabits.length >= MAX_ACTIVE_HABITS) {
      throw new Error(`You can only have ${MAX_ACTIVE_HABITS} active habits at a time`);
    }
    
    const habitsRef = collection(db, 'users', userId, 'habits');
    const newHabitRef = doc(habitsRef);
    
    const habit = {
      title: habitData.title.trim(),
      linkedZone: habitData.linkedZone,
      active: true,
      streak: 0,
      lastCompletedDate: null,
      createdAt: serverTimestamp()
    };
    
    await setDoc(newHabitRef, habit);
    
    return { id: newHabitRef.id, ...habit };
  } catch (error) {
    console.error('Error creating habit:', error);
    throw error;
  }
}

export async function completeHabit(userId, habitId, habitData) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    
    // CRITICAL: Fetch the latest habit state from Firestore to prevent double-completion
    const habitSnapshot = await getDoc(habitRef);
    
    if (!habitSnapshot.exists()) {
      throw new Error('Habit not found');
    }
    
    const currentHabitData = habitSnapshot.data();
    
    // Verify habit hasn't already been completed today (server-side check)
    if (currentHabitData.lastCompletedDate === today) {
      throw new Error('Habit already completed today');
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isConsecutive = currentHabitData.lastCompletedDate === yesterdayStr;
    const newStreak = isConsecutive ? (currentHabitData.streak || 0) + 1 : 1;
    
    await updateDoc(habitRef, {
      streak: newStreak,
      lastCompletedDate: today
    });
    
    return {
      newStreak,
      linkedZone: currentHabitData.linkedZone
    };
  } catch (error) {
    console.error('Error completing habit:', error);
    throw error;
  }
}

export async function toggleHabitActive(userId, habitId, currentActive) {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitRef, {
      active: !currentActive
    });
  } catch (error) {
    console.error('Error toggling habit:', error);
    throw error;
  }
}

export function getTodayCompletionStatus(habit) {
  const today = new Date().toISOString().split('T')[0];
  return habit.lastCompletedDate === today;
}

export function applyHabitBonusToZone(currentZoneScore, habitBonus = HABIT_ZONE_BONUS) {
  const newScore = (currentZoneScore || 50) + habitBonus;
  return Math.min(100, Math.max(0, newScore));
}
