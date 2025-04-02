/**
 * Avatar Transformation Utilities
 * 
 * Functions for transforming user images based on habit progress and projections
 */

/**
 * Calculate physical appearance changes based on habits
 * @param {Array} habits - User's habits
 * @param {Number} timeFrameDays - Number of days in future
 * @returns {Object} Physical transformation parameters
 */
export const calculatePhysicalChanges = (habits, timeFrameDays) => {
  // Default transformation values
  const changes = {
    weightChange: 0,      // Percentage change in body weight (-10 to +5)
    toneChange: 0,        // Muscle tone improvement (0 to 10)
    postureChange: 0,     // Posture improvement (0 to 10)
    skinChange: 0,        // Skin health improvement (0 to 10)
    energyChange: 0,      // Energy level change (0 to 10)
    stressReduction: 0,   // Stress reduction (0 to 10)
  };
  
  if (!habits || !Array.isArray(habits) || habits.length === 0) {
    return changes;
  }
  
  // Timeframe factor - longer timeframe = more dramatic changes
  // Using square root to model diminishing returns
  const timeframeFactor = Math.sqrt(timeFrameDays / 30) / 2;
  
  // Group habits by category
  const habitsByCategory = habits.reduce((acc, habit) => {
    const category = habit.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(habit);
    return acc;
  }, {});
  
  // Calculate completion rates by category
  const completionRatesByCategory = {};
  
  Object.keys(habitsByCategory).forEach(category => {
    const categoryHabits = habitsByCategory[category];
    const completionRates = categoryHabits.map(habit => {
      if (!habit.logs || Object.keys(habit.logs).length === 0) {
        return 0;
      }
      
      const logs = habit.logs;
      const logEntries = Object.entries(logs);
      const completedCount = logEntries.filter(([date, log]) => log.completed).length;
      
      return completedCount / logEntries.length;
    });
    
    const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    completionRatesByCategory[category] = avgCompletionRate;
  });
  
  // Calculate physical changes based on category completion rates
  
  // Health & Wellness impacts
  if (completionRatesByCategory["Health & Wellness"]) {
    const healthRate = completionRatesByCategory["Health & Wellness"];
    changes.weightChange -= 5 * healthRate * timeframeFactor; // Weight loss with good health habits
    changes.skinChange += 5 * healthRate * timeframeFactor;   // Skin improvement
    changes.energyChange += 6 * healthRate * timeframeFactor; // Energy improvement
  }
  
  // Physical Fitness impacts
  if (completionRatesByCategory["Physical Fitness & Mobility"]) {
    const fitnessRate = completionRatesByCategory["Physical Fitness & Mobility"];
    changes.weightChange -= 3 * fitnessRate * timeframeFactor; // Additional weight loss
    changes.toneChange += 8 * fitnessRate * timeframeFactor;   // Muscle tone improvement
    changes.postureChange += 7 * fitnessRate * timeframeFactor; // Posture improvement
  }
  
  // Mental & Emotional Wellness impacts
  if (completionRatesByCategory["Mental & Emotional Wellness"]) {
    const mentalRate = completionRatesByCategory["Mental & Emotional Wellness"];
    changes.stressReduction += 8 * mentalRate * timeframeFactor; // Stress reduction
    changes.energyChange += 4 * mentalRate * timeframeFactor;    // Energy from mental well-being
  }
  
  // Sleep impacts
  const sleepHabit = habits.find(h => h.title?.toLowerCase().includes('sleep'));
  if (sleepHabit && sleepHabit.logs) {
    const sleepLogs = Object.values(sleepHabit.logs);
    const completedCount = sleepLogs.filter(log => log.completed).length;
    const sleepRate = sleepLogs.length > 0 ? completedCount / sleepLogs.length : 0;
    
    changes.skinChange += 5 * sleepRate * timeframeFactor;  // Sleep improves skin
    changes.energyChange += 5 * sleepRate * timeframeFactor; // Sleep improves energy
  }
  
  // Nutrition impacts
  const nutritionHabit = habits.find(h => 
    h.title?.toLowerCase().includes('nutrition') || 
    h.title?.toLowerCase().includes('food')
  );
  if (nutritionHabit && nutritionHabit.logs) {
    const nutritionLogs = Object.values(nutritionHabit.logs);
    const completedCount = nutritionLogs.filter(log => log.completed).length;
    const nutritionRate = nutritionLogs.length > 0 ? completedCount / nutritionLogs.length : 0;
    
    changes.weightChange -= 2 * nutritionRate * timeframeFactor; // Nutrition affects weight
    changes.skinChange += 5 * nutritionRate * timeframeFactor;   // Nutrition improves skin
  }
  
  // Cap all values to reasonable ranges
  changes.weightChange = Math.max(-10, Math.min(5, changes.weightChange));
  changes.toneChange = Math.max(0, Math.min(10, changes.toneChange));
  changes.postureChange = Math.max(0, Math.min(10, changes.postureChange));
  changes.skinChange = Math.max(0, Math.min(10, changes.skinChange));
  changes.energyChange = Math.max(0, Math.min(10, changes.energyChange));
  changes.stressReduction = Math.max(0, Math.min(10, changes.stressReduction));
  
  return changes;
};

/**
 * Generate description of physical changes
 * @param {Object} changes - Physical changes object
 * @returns {Array} Array of descriptions
 */
export const getPhysicalChangeDescriptions = (changes) => {
  const descriptions = [];
  
  if (changes.weightChange <= -5) {
    descriptions.push('Significant healthy weight reduction');
  } else if (changes.weightChange < 0) {
    descriptions.push('Moderate weight optimization');
  }
  
  if (changes.toneChange >= 7) {
    descriptions.push('Notable increase in muscle definition');
  } else if (changes.toneChange >= 3) {
    descriptions.push('Improved muscle tone');
  }
  
  if (changes.postureChange >= 7) {
    descriptions.push('Excellent posture improvement');
  } else if (changes.postureChange >= 3) {
    descriptions.push('Better posture and alignment');
  }
  
  if (changes.skinChange >= 7) {
    descriptions.push('Radiant, healthier skin');
  } else if (changes.skinChange >= 3) {
    descriptions.push('Improved skin clarity');
  }
  
  if (changes.energyChange >= 7) {
    descriptions.push('Significantly higher energy levels');
  } else if (changes.energyChange >= 3) {
    descriptions.push('Increased daily energy');
  }
  
  if (changes.stressReduction >= 7) {
    descriptions.push('Dramatically reduced stress response');
  } else if (changes.stressReduction >= 3) {
    descriptions.push('Lower stress and tension');
  }
  
  return descriptions;
};

/**
 * Get color for avatar glow based on overall health impact
 * @param {Object} changes - Physical changes object
 * @returns {String} CSS color value
 */
export const getAvatarGlowColor = (changes) => {
  // Calculate overall health score from changes
  const totalPossible = 50; // Sum of max values for all positive metrics
  const total = 
    changes.toneChange + 
    changes.postureChange + 
    changes.skinChange + 
    changes.energyChange + 
    changes.stressReduction -
    changes.weightChange; // Weight change is negative for improvement
  
  const score = total / totalPossible;
  
  if (score > 0.7) return '#4caf50'; // Green - excellent
  if (score > 0.4) return '#2196f3'; // Blue - good
  if (score > 0.2) return '#ff9800'; // Orange - fair
  return '#f44336'; // Red - needs improvement
};

/**
 * Get avatar transformation operations for image manipulation
 * @param {Object} changes - Physical changes object
 * @returns {Array} Array of transformation operations
 */
export const getAvatarTransformations = (changes) => {
  const operations = [];
  
  // Weight change transformation (adjusts width)
  if (changes.weightChange !== 0) {
    const widthPercent = 100 + changes.weightChange;
    operations.push({
      resize: {
        width: widthPercent,
        height: undefined
      }
    });
  }
  
  // Posture improvement (subtle vertical stretch)
  if (changes.postureChange > 5) {
    operations.push({
      resize: {
        width: undefined,
        height: 102 // Slight height increase
      }
    });
  }
  
  return operations;
};

/**
 * Generate avatar motivation messages based on habit progress
 * @param {Object} changes - Physical changes object
 * @param {Number} timeFrameDays - Days in future
 * @returns {Array} Array of motivation messages
 */
export const getAvatarMotivationMessages = (changes, timeFrameDays) => {
  const messages = [];
  
  // Time period for messages
  const timePeriod = 
    timeFrameDays <= 30 ? 'month' :
    timeFrameDays <= 90 ? '3 months' :
    timeFrameDays <= 180 ? '6 months' : 'year';
  
  // Overall health improvement
  const totalPossible = 50;
  const total = 
    changes.toneChange + 
    changes.postureChange + 
    changes.skinChange + 
    changes.energyChange + 
    changes.stressReduction -
    changes.weightChange;
    
  const score = total / totalPossible;
  
  if (score > 0.7) {
    messages.push(`In just one ${timePeriod}, your habits have created significant improvements in your overall health.`);
  } else if (score > 0.4) {
    messages.push(`Keep up these habits for another ${timePeriod} to see even greater results.`);
  } else if (score > 0.2) {
    messages.push(`You're making progress, but increasing consistency could transform your results.`);
  } else {
    messages.push(`Small changes now will create noticeable differences in your future self.`);
  }
  
  // Specific improvements
  if (changes.weightChange < -5) {
    messages.push('Your healthy weight management habits are paying off.');
  }
  
  if (changes.toneChange > 7) {
    messages.push('Your strength and exercise habits are visibly improving your physique.');
  }
  
  if (changes.energyChange > 7) {
    messages.push('Your sleep and nutrition choices have dramatically increased your energy.');
  }
  
  return messages;
};

/**
 * Calculate overall health score based on habit categories
 * @param {Object} categoryCompletionRates - Object with category names and completion rates
 * @returns {Number} Overall health score (0-100)
 */
export const calculateOverallHealthScore = (categoryCompletionRates) => {
  if (!categoryCompletionRates || Object.keys(categoryCompletionRates).length === 0) {
    return 0;
  }
  
  // Category weights for overall score
  const weights = {
    "Health & Wellness": 0.25,
    "Physical Fitness & Mobility": 0.25,
    "Mental & Emotional Wellness": 0.2,
    "Social & Human Connection": 0.1,
    "Faith & Spiritual Growth": 0.1,
    "Financial & Productivity Habits": 0.1
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.entries(categoryCompletionRates).forEach(([category, rate]) => {
    const weight = weights[category] || 0.1; // Default weight if category unknown
    weightedSum += weight * rate;
    totalWeight += weight;
  });
  
  // Calculate weighted average and convert to 0-100 scale
  return Math.round((weightedSum / totalWeight) * 100);
};