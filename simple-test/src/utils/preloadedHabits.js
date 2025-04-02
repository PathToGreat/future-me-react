/**
 * Pre-loaded habits for the Future Me app
 * These habits are categorized to align with the core focus of the app
 */

export const CATEGORIES = {
  HEALTH: "Health & Wellness",
  FITNESS: "Physical Fitness & Mobility",
  SOCIAL: "Social & Human Connection",
  MENTAL: "Mental & Emotional Wellness",
  SPIRITUAL: "Faith & Spiritual Growth",
  FINANCIAL: "Financial & Productivity Habits"
};

export const preloadedHabits = [
  // Health & Wellness
  {
    title: 'Daily Hydration',
    description: 'Drink at least 64 oz of water',
    category: CATEGORIES.HEALTH,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Proper hydration improves cognition, energy levels, and skin health while reducing the risk of kidney stones and helping control body temperature.',
  },
  {
    title: 'Whole Food Nutrition',
    description: 'Eat a nutrient-dense meal',
    category: CATEGORIES.HEALTH,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Whole foods provide essential nutrients that support immune function, reduce inflammation, and lower the risk of chronic diseases like heart disease and diabetes.',
  },
  {
    title: 'Meal Preparation',
    description: 'Plan and prepare a healthy meal',
    category: CATEGORIES.HEALTH,
    frequency: [0, 3, 6], // Sunday, Wednesday, Saturday
    reminder: null,
    factDescription: 'Meal preparation reduces the likelihood of choosing unhealthy food options, saves money, and helps maintain consistent portion control.',
  },
  {
    title: 'Quality Sleep',
    description: 'Sleep for at least 7-9 hours',
    category: CATEGORIES.HEALTH,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Quality sleep strengthens memory formation, enhances immune function, and regulates metabolism, with consistent sleep schedules improving overall sleep quality.',
  },
  {
    title: 'Morning Sunlight',
    description: 'Get direct sunlight exposure within 30 minutes of waking',
    category: CATEGORIES.HEALTH,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Morning sunlight exposure helps regulate your circadian rhythm, improves mood, increases vitamin D production, and enhances alertness throughout the day.',
  },
  {
    title: 'Evening Wind Down',
    description: 'No screens 1 hour before bed',
    category: CATEGORIES.HEALTH,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Avoiding screens before bed prevents blue light exposure, which can interfere with melatonin production and make it harder to fall asleep.',
  },
  
  // Physical Fitness & Mobility
  {
    title: 'Daily Movement',
    description: 'Walk 10,000 steps or move for 30+ minutes',
    category: CATEGORIES.FITNESS,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Regular movement throughout the day improves cardiovascular health, regulates blood sugar levels, and may add years to your life expectancy.',
  },
  {
    title: 'Strength Training',
    description: 'Perform bodyweight or resistance training',
    category: CATEGORIES.FITNESS,
    frequency: [1, 3, 5], // Monday, Wednesday, Friday
    reminder: null,
    factDescription: 'Strength training increases bone density, improves joint function, boosts metabolism, and helps maintain muscle mass as you age.',
  },
  {
    title: 'Mobility & Stretching',
    description: 'Work on flexibility and joint health',
    category: CATEGORIES.FITNESS,
    frequency: [0, 2, 4, 6], // Sunday, Tuesday, Thursday, Saturday
    reminder: null,
    factDescription: 'Regular stretching improves range of motion, reduces injury risk, promotes better posture, and can help alleviate stress and tension in the body.',
  },
  {
    title: 'Deep Breathing & Relaxation',
    description: 'Activate the parasympathetic nervous system',
    category: CATEGORIES.FITNESS,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Deep breathing exercises reduce stress hormones, lower blood pressure, improve concentration, and help manage anxiety and pain.',
  },
  {
    title: 'Outdoor Time',
    description: 'Spend at least 15 minutes in nature',
    category: CATEGORIES.FITNESS,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Time spent in nature reduces stress hormones, improves mood, enhances creativity, and has been linked to improved immune function.',
  },
  
  // Social & Human Connection
  {
    title: 'Meaningful Conversation',
    description: 'Engage in deep, intentional discussions',
    category: CATEGORIES.SOCIAL,
    frequency: [1, 3, 5], // Monday, Wednesday, Friday
    reminder: null,
    factDescription: 'Meaningful conversations strengthen relationships, improve emotional well-being, and have been linked to greater life satisfaction and happiness.',
  },
  {
    title: 'Check-in with Loved Ones',
    description: 'Call or message a friend/family member',
    category: CATEGORIES.SOCIAL,
    frequency: [0, 2, 4], // Sunday, Tuesday, Thursday
    reminder: null,
    factDescription: 'Regular communication with loved ones reduces feelings of isolation, strengthens social bonds, and creates a support network for challenging times.',
  },
  {
    title: 'Acts of Kindness',
    description: 'Do one intentional act of kindness today',
    category: CATEGORIES.SOCIAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Performing acts of kindness releases oxytocin and endorphins, reduces stress, and creates a positive feedback loop that improves both your mood and others.',
  },
  {
    title: 'Community Engagement',
    description: 'Participate in a group, club, or local event',
    category: CATEGORIES.SOCIAL,
    frequency: [3, 6], // Wednesday, Saturday
    reminder: null,
    factDescription: 'Community involvement provides a sense of belonging, expands your social network, and has been linked to greater longevity and life satisfaction.',
  },
  {
    title: 'Quality Family Time',
    description: 'Spend uninterrupted time with family',
    category: CATEGORIES.SOCIAL,
    frequency: [0, 2, 4, 6], // Sunday, Tuesday, Thursday, Saturday
    reminder: null,
    factDescription: 'Quality family time builds stronger familial bonds, creates lasting memories, and provides emotional stability for both children and adults.',
  },
  
  // Mental & Emotional Wellness
  {
    title: 'Morning Gratitude',
    description: "Write down three things you're grateful for",
    category: CATEGORIES.MENTAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Practicing gratitude rewires the brain to notice positive experiences more frequently and has been shown to improve sleep, reduce depression, and increase happiness.',
  },
  {
    title: 'Journaling & Reflection',
    description: 'Reflect on your day, emotions, or progress',
    category: CATEGORIES.MENTAL,
    frequency: [0, 2, 4, 6], // Sunday, Tuesday, Thursday, Saturday
    reminder: null,
    factDescription: 'Regular journaling reduces stress, improves emotional processing, clarifies thoughts, and can help track patterns in your behavior and emotions.',
  },
  {
    title: 'Screen-Free Hour',
    description: 'Take a break from social media/screens',
    category: CATEGORIES.MENTAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Taking breaks from screens reduces eye strain, improves sleep quality, decreases anxiety, and often leads to more meaningful social interactions.',
  },
  {
    title: 'Breathing Exercises',
    description: 'Use controlled breathing techniques to manage stress',
    category: CATEGORIES.MENTAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Controlled breathing exercises can reduce blood pressure within minutes, decrease stress hormones, and improve mental clarity and focus.',
  },
  {
    title: 'Emotional Check-in',
    description: 'Assess how you feel and why',
    category: CATEGORIES.MENTAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Regular emotional check-ins improve emotional intelligence, help identify patterns in your emotional responses, and prevent emotional burnout.',
  },
  
  // Faith & Spiritual Growth
  {
    title: 'Daily Scripture Reading',
    description: 'Read and reflect on a passage',
    category: CATEGORIES.SPIRITUAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Regular scripture reading provides moral guidance, reduces anxiety, and creates a framework for interpreting life experiences through a spiritual lens.',
  },
  {
    title: 'Prayer & Meditation',
    description: 'Spend intentional time in prayer or stillness',
    category: CATEGORIES.SPIRITUAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Regular prayer and meditation increase feelings of peace, improve concentration, reduce blood pressure, and have been linked to greater resilience during difficulties.',
  },
  {
    title: 'Faith-Based Study',
    description: 'Study a concept, teaching, or wisdom principle',
    category: CATEGORIES.SPIRITUAL,
    frequency: [1, 3, 5], // Monday, Wednesday, Friday
    reminder: null,
    factDescription: 'Faith-based study deepens spiritual understanding, provides clarity on personal values, and strengthens your foundation for making difficult decisions.',
  },
  {
    title: 'Fellowship & Community',
    description: 'Engage with a faith-based group or discussion',
    category: CATEGORIES.SPIRITUAL,
    frequency: [0, 3], // Sunday, Wednesday
    reminder: null,
    factDescription: 'Spiritual community involvement provides social support, accountability, shared purpose, and opportunities for service that enhance overall well-being.',
  },
  
  // Financial & Productivity Habits
  {
    title: 'Daily Budget Check-in',
    description: 'Review spending and savings goals',
    category: CATEGORIES.FINANCIAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Daily budget awareness reduces impulsive spending, accelerates debt repayment, and helps build emergency savings that reduce financial stress.',
  },
  {
    title: 'Work on a Skill',
    description: 'Learn something new to improve career/business',
    category: CATEGORIES.FINANCIAL,
    frequency: [1, 2, 3, 4, 5], // Weekdays
    reminder: null,
    factDescription: 'Continuous skill development increases earning potential, makes you more valuable in your field, and provides mental stimulation that keeps your brain healthy.',
  },
  {
    title: 'Declutter & Organize',
    description: 'Spend 10+ minutes organizing your space',
    category: CATEGORIES.FINANCIAL,
    frequency: [1, 4], // Monday, Thursday
    reminder: null,
    factDescription: 'An organized environment reduces stress, improves focus, saves time looking for items, and can lead to financial savings by preventing duplicate purchases.',
  },
  {
    title: 'Limit Impulse Spending',
    description: 'Avoid unnecessary purchases today',
    category: CATEGORIES.FINANCIAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Avoiding impulse purchases can save the average person thousands of dollars per year and leads to greater satisfaction with the purchases you do make.',
  },
  {
    title: 'Review & Plan',
    description: 'Set priorities for the next day',
    category: CATEGORIES.FINANCIAL,
    frequency: [0, 1, 2, 3, 4, 5, 6], // every day
    reminder: null,
    factDescription: 'Planning the next day improves productivity by up to 25%, reduces decision fatigue, and helps ensure important tasks are completed before urgent ones take over.',
  },
];

/**
 * Get all preloaded habits
 * @returns {Array} - All preloaded habits
 */
export function getAllPreloadedHabits() {
  return preloadedHabits.map((habit, index) => ({
    ...habit,
    id: `preloaded-${index}`,
    streak: 0,
    completionRate: 0,
    logs: [],
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Get preloaded habits by category
 * @param {String} category - The category name
 * @returns {Array} - Preloaded habits for the specified category
 */
export function getPreloadedHabitsByCategory(category) {
  return preloadedHabits
    .filter(habit => habit.category === category)
    .map((habit, index) => ({
      ...habit,
      id: `preloaded-${category}-${index}`,
      streak: 0,
      completionRate: 0,
      logs: [],
      createdAt: new Date().toISOString(),
    }));
}