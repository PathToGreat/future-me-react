/**
 * Utility functions for handling habit data and calculations
 */

/**
 * Gets the last 7 days (including today) with formatted labels
 * @returns {Array} Array of objects with date info
 */
export const getLastWeekDates = () => {
  const result = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Short day name (e.g., "Mon", "Tue")
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    result.push({
      dateString,
      label: dayName,
      date
    });
  }
  
  return result;
};

/**
 * Calculate the number of days since a habit was created
 * @param {Object} habit - The habit object
 * @returns {Number} Days since creation
 */
export const getDaysSinceCreation = (habit) => {
  if (!habit || !habit.createdAt) return 0;
  
  const creationDate = new Date(habit.createdAt);
  const today = new Date();
  
  // Calculate the difference in milliseconds
  const diffMs = today - creationDate;
  
  // Convert to days (round down)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculate the overall completion rate for a habit
 * @param {Object} habit - The habit object with logs
 * @returns {Number} Completion rate from 0-1
 */
export const getCompletionRate = (habit) => {
  if (!habit || !habit.logs || Object.keys(habit.logs).length === 0) {
    return 0;
  }
  
  const logs = habit.logs;
  const logEntries = Object.entries(logs);
  
  // Count completed entries
  const completedCount = logEntries.filter(([date, log]) => log.completed).length;
  
  // Calculate completion rate
  return completedCount / logEntries.length;
};

/**
 * Check if a habit should be tracked on a specific day
 * @param {Object} habit - The habit object
 * @param {Date} date - The date to check
 * @returns {Boolean} Whether the habit should be tracked on this day
 */
export const shouldTrackHabitOnDate = (habit, date) => {
  if (!habit || !habit.frequency) {
    return false;
  }
  
  const { type, days } = habit.frequency;
  
  // Daily habits should be tracked every day
  if (type === 'daily') {
    return true;
  }
  
  // Weekly habits should be tracked on specific days
  if (type === 'weekly' && Array.isArray(days)) {
    // Get day of week (0 = Monday, 6 = Sunday)
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return days.includes(dayOfWeek);
  }
  
  return false;
};

/**
 * Calculate the current streak for a habit
 * @param {Object} habit - The habit object with logs
 * @returns {Number} Current streak in days
 */
export const getCurrentStreak = (habit) => {
  if (!habit || !habit.logs || Object.keys(habit.logs).length === 0) {
    return 0;
  }
  
  const logs = habit.logs;
  const today = new Date();
  let streak = 0;
  
  // Check each day starting from today going backwards
  for (let i = 0; i < 100; i++) { // Limit to 100 days to avoid infinite loop
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // If habit should be tracked on this day
    if (shouldTrackHabitOnDate(habit, date)) {
      // If completed, increment streak
      if (logs[dateString] && logs[dateString].completed) {
        streak++;
      } else {
        // Break the streak if a day was missed
        break;
      }
    }
  }
  
  return streak;
};

/**
 * Group habits by category
 * @param {Array} habits - Array of habit objects
 * @returns {Object} Object with categories as keys and arrays of habits as values
 */
export const groupHabitsByCategory = (habits) => {
  if (!habits || !Array.isArray(habits)) {
    return {};
  }
  
  return habits.reduce((acc, habit) => {
    const category = habit.category || 'other';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(habit);
    return acc;
  }, {});
};
