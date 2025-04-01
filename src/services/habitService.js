import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { shouldTrackHabitOnDate } from '../utils/habitUtils';

import { getAllPreloadedHabits } from '../utils/preloadedHabits';

/**
 * Get all habits for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} Array of habit objects
 */
export const getAllHabits = async (userId) => {
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const snapshot = await getDocs(habitsRef);
    
    // If there are habits in Firestore, return them
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // If no habits found, return preloaded habits
    console.log('No habits found in Firestore, returning preloaded habits');
    return getAllPreloadedHabits();
  } catch (error) {
    console.error('Error getting habits:', error);
    // On error, fall back to preloaded habits
    console.warn('Falling back to preloaded habits due to error');
    return getAllPreloadedHabits();
  }
};

/**
 * Get a specific habit by ID
 * @param {String} userId - The user ID
 * @param {String} habitId - The habit ID
 * @returns {Promise<Object>} Habit object
 */
export const getHabitById = async (userId, habitId) => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    const habitDoc = await getDoc(habitRef);
    
    if (!habitDoc.exists()) {
      throw new Error('Habit not found');
    }
    
    return {
      id: habitDoc.id,
      ...habitDoc.data()
    };
  } catch (error) {
    console.error('Error getting habit:', error);
    throw error;
  }
};

/**
 * Add a new habit
 * @param {String} userId - The user ID
 * @param {Object} habitData - The habit data
 * @returns {Promise<Object>} New habit object with ID
 */
export const addHabit = async (userId, habitData) => {
  try {
    const habitsRef = collection(db, 'users', userId, 'habits');
    
    // Add createdAt and updatedAt timestamps
    const habitWithTimestamps = {
      ...habitData,
      createdAt: habitData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: {}
    };
    
    const docRef = await addDoc(habitsRef, habitWithTimestamps);
    
    return {
      id: docRef.id,
      ...habitWithTimestamps
    };
  } catch (error) {
    console.error('Error adding habit:', error);
    throw error;
  }
};

/**
 * Update an existing habit
 * @param {String} userId - The user ID
 * @param {String} habitId - The habit ID
 * @param {Object} habitData - The updated habit data
 * @returns {Promise<void>}
 */
export const updateHabit = async (userId, habitId, habitData) => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    
    // Add updatedAt timestamp
    const updatedHabit = {
      ...habitData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(habitRef, updatedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    throw error;
  }
};

/**
 * Delete a habit
 * @param {String} userId - The user ID
 * @param {String} habitId - The habit ID
 * @returns {Promise<void>}
 */
export const deleteHabit = async (userId, habitId) => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await deleteDoc(habitRef);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

/**
 * Get all habits that should be tracked today
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} Array of habit objects for today
 */
export const getDailyHabits = async (userId) => {
  try {
    const habits = await getAllHabits(userId);
    const today = new Date();
    
    // Filter habits that should be tracked today
    return habits.filter(habit => shouldTrackHabitOnDate(habit, today));
  } catch (error) {
    console.error('Error getting daily habits:', error);
    throw error;
  }
};

/**
 * Complete a habit for today
 * @param {String} userId - The user ID
 * @param {String} habitId - The habit ID
 * @returns {Promise<void>}
 */
export const completeHabitForToday = async (userId, habitId) => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    const habitDoc = await getDoc(habitRef);
    
    if (!habitDoc.exists()) {
      throw new Error('Habit not found');
    }
    
    const habit = habitDoc.data();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if the habit is already logged for today
    const logs = habit.logs || {};
    const isCompleted = logs[today] && logs[today].completed;
    
    // Toggle completion status
    const updatedLogs = {
      ...logs,
      [today]: {
        completed: !isCompleted,
        timestamp: new Date().toISOString()
      }
    };
    
    await updateDoc(habitRef, { logs: updatedLogs });
  } catch (error) {
    console.error('Error completing habit:', error);
    throw error;
  }
};

/**
 * Get habit logs for all habits in the last week
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Object with dates as keys and arrays of habit logs as values
 */
export const getHabitLogs = async (userId) => {
  try {
    const habits = await getAllHabits(userId);
    const result = {};
    
    // Get the last 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all habits that should be tracked on this date
      const relevantHabits = habits.filter(habit => shouldTrackHabitOnDate(habit, date));
      
      // Extract completion status for each habit on this date
      result[dateString] = relevantHabits.map(habit => {
        const logs = habit.logs || {};
        return {
          habitId: habit.id,
          habitName: habit.name,
          completed: logs[dateString] && logs[dateString].completed || false
        };
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error getting habit logs:', error);
    throw error;
  }
};

/**
 * Get statistics for all habits
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} Object with habit statistics
 */
export const getHabitStatistics = async (userId) => {
  try {
    const habits = await getAllHabits(userId);
    
    // Calculate overall completion rate
    const completionRates = habits.map(habit => {
      if (!habit.logs) return 0;
      
      const logEntries = Object.entries(habit.logs);
      if (logEntries.length === 0) return 0;
      
      const completedCount = logEntries.filter(([date, log]) => log.completed).length;
      return completedCount / logEntries.length;
    });
    
    const overallCompletionRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0;
    
    // Get habit counts by category
    const habitsByCategory = habits.reduce((acc, habit) => {
      const category = habit.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalHabits: habits.length,
      overallCompletionRate,
      habitsByCategory
    };
  } catch (error) {
    console.error('Error getting habit statistics:', error);
    throw error;
  }
};
