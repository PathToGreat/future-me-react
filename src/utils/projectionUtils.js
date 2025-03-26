/**
 * Utility functions for projecting habit data into the future
 */

/**
 * Categorize habits by their impact areas
 * @param {Array} habits - Array of habit objects
 * @returns {Object} Object with categories as keys and arrays of habits as values
 */
export const categorizeHabits = (habits) => {
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

/**
 * Generate projected impact data for a set of habits in a particular category
 * @param {Array} habits - Array of habit objects in a category
 * @param {Number} timeFrameDays - Number of days to project into the future
 * @returns {Object} Object with impact score and effects
 */
export const getProjectedImpact = (habits, timeFrameDays = 90) => {
  if (!habits || !Array.isArray(habits) || habits.length === 0) {
    return { score: 0, effects: [] };
  }
  
  // Calculate average completion rate for habits in this category
  const completionRates = habits.map(habit => {
    if (!habit.logs || Object.keys(habit.logs).length === 0) {
      return 0;
    }
    
    const logs = habit.logs;
    const logEntries = Object.entries(logs);
    const completedCount = logEntries.filter(([date, log]) => log.completed).length;
    
    return completedCount / logEntries.length;
  });
  
  const avgCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
  const impactScore = Math.round(avgCompletionRate * 100);
  
  // Generate impacts based on category and completion rate
  const impacts = getCategoryImpacts(habits[0].category, avgCompletionRate, timeFrameDays);
  
  return {
    score: impactScore,
    effects: impacts
  };
};

/**
 * Get specific impact projections based on habit category
 * @param {String} category - The habit category
 * @param {Number} completionRate - The average completion rate (0-1)
 * @param {Number} timeFrameDays - Number of days to project into the future
 * @returns {Array} Array of impact objects with label, value, and icon
 */
const getCategoryImpacts = (category, completionRate, timeFrameDays) => {
  // Convert timeframe to months for easier calculation
  const timeFrameMonths = timeFrameDays / 30;
  
  // Scale factor based on timeframe (more impact over longer timeframes)
  const timeFactor = Math.sqrt(timeFrameMonths / 3); // Square root to model diminishing returns
  
  // Base impact multiplier based on completion rate
  const impactMultiplier = completionRate * timeFactor;
  
  switch (category) {
    case 'health':
      return [
        {
          label: 'Energy Level',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'battery'
        },
        {
          label: 'Sleep Quality',
          value: `+${Math.round(impactMultiplier * 25)}%`,
          icon: 'moon'
        },
        {
          label: 'Stress Reduction',
          value: `${Math.round(impactMultiplier * 20)}% less`,
          icon: 'heart'
        },
        {
          label: 'Overall Health',
          value: completionRate > 0.7 ? 'Excellent' : completionRate > 0.4 ? 'Good' : 'Needs Work',
          icon: 'activity'
        }
      ];
    
    case 'fitness':
      return [
        {
          label: 'Strength Gain',
          value: `+${Math.round(impactMultiplier * 25)}%`,
          icon: 'trending-up'
        },
        {
          label: 'Endurance',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'activity'
        },
        {
          label: 'Recovery Time',
          value: `${Math.round(impactMultiplier * 20)}% faster`,
          icon: 'refresh-cw'
        },
        {
          label: 'Fitness Level',
          value: completionRate > 0.7 ? 'Athletic' : completionRate > 0.4 ? 'Active' : 'Sedentary',
          icon: 'award'
        }
      ];
    
    case 'learning':
      return [
        {
          label: 'Knowledge Depth',
          value: `+${Math.round(impactMultiplier * 35)}%`,
          icon: 'book'
        },
        {
          label: 'Skill Mastery',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'award'
        },
        {
          label: 'Learn Rate',
          value: `${Math.round(impactMultiplier * 25)}% faster`,
          icon: 'trending-up'
        },
        {
          label: 'Expertise Level',
          value: completionRate > 0.7 ? 'Expert' : completionRate > 0.4 ? 'Proficient' : 'Beginner',
          icon: 'star'
        }
      ];
    
    case 'career':
      return [
        {
          label: 'Productivity',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'trending-up'
        },
        {
          label: 'Networking',
          value: `+${Math.round(impactMultiplier * 25)} contacts`,
          icon: 'users'
        },
        {
          label: 'Skills Growth',
          value: `+${Math.round(impactMultiplier * 28)}%`,
          icon: 'briefcase'
        },
        {
          label: 'Career Trajectory',
          value: completionRate > 0.7 ? 'Advancing' : completionRate > 0.4 ? 'Stable' : 'Stagnant',
          icon: 'arrow-up-right'
        }
      ];
    
    case 'finance':
      return [
        {
          label: 'Savings Rate',
          value: `+${Math.round(impactMultiplier * 25)}%`,
          icon: 'dollar-sign'
        },
        {
          label: 'Budget Adherence',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'pie-chart'
        },
        {
          label: 'Financial Literacy',
          value: `+${Math.round(impactMultiplier * 28)}%`,
          icon: 'book'
        },
        {
          label: 'Financial Health',
          value: completionRate > 0.7 ? 'Excellent' : completionRate > 0.4 ? 'Stable' : 'At Risk',
          icon: 'trending-up'
        }
      ];
    
    case 'relationships':
      return [
        {
          label: 'Connection Quality',
          value: `+${Math.round(impactMultiplier * 35)}%`,
          icon: 'heart'
        },
        {
          label: 'Communication',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'message-circle'
        },
        {
          label: 'Quality Time',
          value: `+${Math.round(impactMultiplier * 40)}%`,
          icon: 'clock'
        },
        {
          label: 'Relationship Health',
          value: completionRate > 0.7 ? 'Thriving' : completionRate > 0.4 ? 'Growing' : 'Needs Attention',
          icon: 'users'
        }
      ];
    
    case 'mindfulness':
      return [
        {
          label: 'Stress Reduction',
          value: `${Math.round(impactMultiplier * 35)}% less`,
          icon: 'smile'
        },
        {
          label: 'Mental Clarity',
          value: `+${Math.round(impactMultiplier * 40)}%`,
          icon: 'sun'
        },
        {
          label: 'Focus Duration',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'target'
        },
        {
          label: 'Well-being',
          value: completionRate > 0.7 ? 'Excellent' : completionRate > 0.4 ? 'Good' : 'Needs Work',
          icon: 'sunset'
        }
      ];
    
    case 'productivity':
      return [
        {
          label: 'Task Completion',
          value: `+${Math.round(impactMultiplier * 35)}%`,
          icon: 'check-square'
        },
        {
          label: 'Focus Time',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'clock'
        },
        {
          label: 'Efficiency',
          value: `+${Math.round(impactMultiplier * 28)}%`,
          icon: 'trending-up'
        },
        {
          label: 'Productivity Level',
          value: completionRate > 0.7 ? 'Highly Productive' : completionRate > 0.4 ? 'Productive' : 'Distracted',
          icon: 'zap'
        }
      ];
    
    default: // For 'other' category or any unlisted categories
      return [
        {
          label: 'Progress Rate',
          value: `+${Math.round(impactMultiplier * 30)}%`,
          icon: 'trending-up'
        },
        {
          label: 'Consistency',
          value: `+${Math.round(impactMultiplier * 35)}%`,
          icon: 'check-circle'
        },
        {
          label: 'Overall Impact',
          value: completionRate > 0.7 ? 'Significant' : completionRate > 0.4 ? 'Moderate' : 'Minimal',
          icon: 'bar-chart-2'
        }
      ];
  }
};

/**
 * Get projected data for a specific habit
 * @param {Object} habit - The habit object
 * @param {Number} completionRate - Current completion rate
 * @returns {Array} Array of projection objects
 */
export const getProjectedData = (habit, completionRate) => {
  if (!habit || !habit.category) {
    return [];
  }
  
  // Default projections for any habit
  const defaultProjections = [
    {
      title: '30 Day Outlook',
      value: completionRate > 0.7 ? 'Strong Progress' : completionRate > 0.4 ? 'Steady Progress' : 'Needs Attention',
      icon: 'trending-up'
    },
    {
      title: 'Consistency',
      value: `${Math.round(completionRate * 100)}%`,
      icon: 'check-circle'
    }
  ];
  
  // Category-specific projections
  const categoryProjections = getCategorySpecificProjection(habit.category, completionRate);
  
  return [...defaultProjections, ...categoryProjections];
};

/**
 * Get category-specific projection items
 * @param {String} category - The habit category
 * @param {Number} completionRate - Current completion rate (0-1)
 * @returns {Array} Array of projection objects
 */
const getCategorySpecificProjection = (category, completionRate) => {
  const impactMultiplier = completionRate;
  
  switch (category) {
    case 'health':
      return [
        {
          title: 'Energy Level',
          value: completionRate > 0.7 ? 'High Energy' : completionRate > 0.4 ? 'Moderate Energy' : 'Low Energy',
          icon: 'battery'
        },
        {
          title: 'Overall Health',
          value: completionRate > 0.7 ? 'Improving' : completionRate > 0.4 ? 'Maintaining' : 'Declining',
          icon: 'activity'
        }
      ];
    
    case 'fitness':
      return [
        {
          title: 'Fitness Goal',
          value: completionRate > 0.7 ? 'On Track' : completionRate > 0.4 ? 'Progressing' : 'Off Track',
          icon: 'target'
        },
        {
          title: 'Physical Condition',
          value: completionRate > 0.7 ? 'Improving' : completionRate > 0.4 ? 'Maintaining' : 'Declining',
          icon: 'activity'
        }
      ];
    
    case 'learning':
      return [
        {
          title: 'Skill Development',
          value: completionRate > 0.7 ? 'Rapid Growth' : completionRate > 0.4 ? 'Steady Growth' : 'Minimal Growth',
          icon: 'book'
        },
        {
          title: 'Mastery Timeline',
          value: completionRate > 0.7 ? 'Accelerated' : completionRate > 0.4 ? 'On Schedule' : 'Delayed',
          icon: 'clock'
        }
      ];
      
    case 'career':
      return [
        {
          title: 'Career Growth',
          value: completionRate > 0.7 ? 'Accelerated' : completionRate > 0.4 ? 'Steady' : 'Stagnant',
          icon: 'briefcase'
        },
        {
          title: 'Skill Development',
          value: completionRate > 0.7 ? 'Rapid' : completionRate > 0.4 ? 'Steady' : 'Minimal',
          icon: 'trending-up'
        }
      ];
    
    case 'finance':
      return [
        {
          title: 'Financial Health',
          value: completionRate > 0.7 ? 'Improving' : completionRate > 0.4 ? 'Stable' : 'At Risk',
          icon: 'dollar-sign'
        },
        {
          title: 'Savings Goal',
          value: completionRate > 0.7 ? 'On Track' : completionRate > 0.4 ? 'Making Progress' : 'Off Track',
          icon: 'target'
        }
      ];
      
    case 'relationships':
      return [
        {
          title: 'Connection Quality',
          value: completionRate > 0.7 ? 'Strengthening' : completionRate > 0.4 ? 'Maintaining' : 'Weakening',
          icon: 'heart'
        },
        {
          title: 'Social Circle',
          value: completionRate > 0.7 ? 'Expanding' : completionRate > 0.4 ? 'Stable' : 'Shrinking',
          icon: 'users'
        }
      ];
      
    case 'mindfulness':
      return [
        {
          title: 'Mental Clarity',
          value: completionRate > 0.7 ? 'Highly Focused' : completionRate > 0.4 ? 'Clear' : 'Scattered',
          icon: 'sun'
        },
        {
          title: 'Stress Levels',
          value: completionRate > 0.7 ? 'Decreasing' : completionRate > 0.4 ? 'Managed' : 'Increasing',
          icon: 'trending-down'
        }
      ];
      
    case 'productivity':
      return [
        {
          title: 'Task Completion',
          value: completionRate > 0.7 ? 'Highly Efficient' : completionRate > 0.4 ? 'Steady' : 'Falling Behind',
          icon: 'check-square'
        },
        {
          title: 'Time Management',
          value: completionRate > 0.7 ? 'Optimized' : completionRate > 0.4 ? 'Improving' : 'Poor',
          icon: 'clock'
        }
      ];
      
    default: // other or any unlisted category
      return [
        {
          title: 'Progress Trend',
          value: completionRate > 0.7 ? 'Strong Progress' : completionRate > 0.4 ? 'Moderate Progress' : 'Minimal Progress',
          icon: 'trending-up'
        },
        {
          title: 'Future Outlook',
          value: completionRate > 0.7 ? 'Very Positive' : completionRate > 0.4 ? 'Positive' : 'Needs Improvement',
          icon: 'sun'
        }
      ];
  }
};
