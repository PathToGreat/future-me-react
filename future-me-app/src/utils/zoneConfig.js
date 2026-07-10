/**
 * Life Zone Configuration
 * 
 * Defines unique inputs, labels, and scoring weights for each Life Zone.
 * Each zone has its own daily log fields and scoring formula.
 */

export const ZONE_CONFIG = {
  health: {
    id: 'health',
    title: 'Health',
    icon: '❤️',
    description: 'A deeper periodic check-in on your physical foundation — strength, mobility, recovery, and fuel',
    color: 'red',
    inputs: [
      {
        key: 'strength',
        label: 'Strength Training',
        description: 'Did you challenge your muscles today?',
        minLabel: 'None',
        maxLabel: 'Full Session',
        color: 'red',
        weight: 0.20
      },
      {
        key: 'mobility',
        label: 'Mobility & Stretching',
        description: 'Did you move through your full range of motion?',
        minLabel: 'Stiff',
        maxLabel: 'Very Mobile',
        color: 'orange',
        weight: 0.15
      },
      {
        key: 'hydration',
        label: 'Hydration & Minerals',
        description: 'Were you well hydrated and mineralized?',
        minLabel: 'Depleted',
        maxLabel: 'Well Hydrated',
        color: 'blue',
        weight: 0.15
      },
      {
        key: 'protein',
        label: 'Protein & Whole Foods',
        description: 'Did you eat enough protein and whole foods?',
        minLabel: 'Poor',
        maxLabel: 'Excellent',
        color: 'green',
        weight: 0.15
      },
      {
        key: 'outdoor',
        label: 'Outdoor Time & Sunlight',
        description: 'Did you spend time outdoors in daylight?',
        minLabel: 'None',
        maxLabel: 'Plenty',
        color: 'amber',
        weight: 0.15
      },
      {
        key: 'recovery',
        label: 'Recovery Practice',
        description: 'Did you rest and let your body recover?',
        minLabel: 'None',
        maxLabel: 'Full Recovery',
        color: 'teal',
        weight: 0.10
      },
      {
        key: 'bodyTension',
        label: 'Body Tension / Pain',
        description: 'How much physical tension or pain did you feel?',
        minLabel: 'None',
        maxLabel: 'Significant',
        color: 'purple',
        weight: 0.10,
        inverted: true
      }
    ]
  },

  socialEmotional: {
    id: 'socialEmotional',
    title: 'Social Emotional',
    icon: '🤲',
    description: 'Monitor your emotional balance, mood, and mindfulness practices',
    color: 'pink',
    inputs: [
      {
        key: 'mood',
        label: 'Overall Mood',
        description: 'How was your overall mood today?',
        minLabel: 'Very Low',
        maxLabel: 'Excellent',
        color: 'pink',
        weight: 0.35
      },
      {
        key: 'stress',
        label: 'Stress Level',
        description: 'How stressed did you feel?',
        minLabel: 'Calm',
        maxLabel: 'Very Stressed',
        color: 'orange',
        weight: 0.25,
        inverted: true
      },
      {
        key: 'reflection',
        label: 'Self-Reflection',
        description: 'Did you take time for self-reflection?',
        minLabel: 'None',
        maxLabel: 'Deep Reflection',
        color: 'indigo',
        weight: 0.20
      },
      {
        key: 'breathingHabit',
        label: 'Calming Practice',
        description: 'Did you practice breathing or calming exercises?',
        minLabel: 'None',
        maxLabel: 'Extended Practice',
        color: 'teal',
        weight: 0.20
      }
    ]
  },

  family: {
    id: 'family',
    title: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Strengthen family bonds through quality time and communication',
    color: 'amber',
    inputs: [
      {
        key: 'connectionTime',
        label: 'Quality Time',
        description: 'How much quality time did you spend with family?',
        minLabel: 'None',
        maxLabel: 'Extended Time',
        color: 'amber',
        weight: 0.30
      },
      {
        key: 'communicationQuality',
        label: 'Communication Quality',
        description: 'How was your communication with family?',
        minLabel: 'Poor',
        maxLabel: 'Excellent',
        color: 'blue',
        weight: 0.30
      },
      {
        key: 'patience',
        label: 'Patience & Self-Control',
        description: 'How patient were you with family members?',
        minLabel: 'Impatient',
        maxLabel: 'Very Patient',
        color: 'green',
        weight: 0.20
      },
      {
        key: 'conflictLevel',
        label: 'Conflict Level',
        description: 'How much conflict occurred today?',
        minLabel: 'None',
        maxLabel: 'Significant',
        color: 'red',
        weight: 0.20,
        inverted: true
      }
    ]
  },

  community: {
    id: 'community',
    title: 'Community',
    icon: '🏘️',
    description: 'Build meaningful connections and contribute to your community',
    color: 'cyan',
    inputs: [
      {
        key: 'connectionsMade',
        label: 'New Connections',
        description: 'Did you connect with others in your community?',
        minLabel: 'None',
        maxLabel: 'Many',
        color: 'cyan',
        weight: 0.25
      },
      {
        key: 'conversations',
        label: 'Meaningful Conversations',
        description: 'Did you have meaningful conversations?',
        minLabel: 'None',
        maxLabel: 'Several Deep Talks',
        color: 'blue',
        weight: 0.25
      },
      {
        key: 'supportGiven',
        label: 'Support Given',
        description: 'Did you help or support others?',
        minLabel: 'None',
        maxLabel: 'Significant Help',
        color: 'green',
        weight: 0.30
      },
      {
        key: 'communityEvents',
        label: 'Community Participation',
        description: 'Did you participate in community activities?',
        minLabel: 'None',
        maxLabel: 'Active Participation',
        color: 'purple',
        weight: 0.20
      }
    ]
  },

  wealth: {
    id: 'wealth',
    title: 'Wealth',
    icon: '💰',
    description: 'Track financial habits, career growth, and skill development',
    color: 'emerald',
    inputs: [
      {
        key: 'saving',
        label: 'Saving Behavior',
        description: 'Did you save money or avoid unnecessary spending?',
        minLabel: 'Overspent',
        maxLabel: 'Saved Well',
        color: 'emerald',
        weight: 0.25
      },
      {
        key: 'workProgress',
        label: 'Work Progress',
        description: 'How productive were you at work?',
        minLabel: 'Unproductive',
        maxLabel: 'Very Productive',
        color: 'blue',
        weight: 0.25
      },
      {
        key: 'skillsDeveloped',
        label: 'Skills Development',
        description: 'Did you learn or develop new skills?',
        minLabel: 'None',
        maxLabel: 'Significant Learning',
        color: 'purple',
        weight: 0.20
      },
      {
        key: 'moneyHabits',
        label: 'Financial Discipline',
        description: 'How disciplined were your spending habits?',
        minLabel: 'Poor',
        maxLabel: 'Excellent',
        color: 'green',
        weight: 0.20
      },
      {
        key: 'spending',
        label: 'Spending Control',
        description: 'How well did you control spending urges?',
        minLabel: 'Overspent',
        maxLabel: 'Well Controlled',
        color: 'amber',
        weight: 0.10
      }
    ]
  },

  faith: {
    id: 'faith',
    title: 'Faith',
    icon: '📖',
    description: 'Nurture your spiritual growth through scripture, prayer, and gratitude',
    color: 'violet',
    inputs: [
      {
        key: 'scripturePractice',
        label: 'Scripture Reading',
        description: 'Did you read or study Scripture today?',
        minLabel: 'None',
        maxLabel: 'Extended Study',
        color: 'violet',
        weight: 0.30
      },
      {
        key: 'prayer',
        label: 'Prayer Time',
        description: 'How was your prayer life today?',
        minLabel: 'None',
        maxLabel: 'Deep Prayer',
        color: 'indigo',
        weight: 0.25
      },
      {
        key: 'gratitude',
        label: 'Gratitude Practice',
        description: 'Did you practice gratitude today?',
        minLabel: 'None',
        maxLabel: 'Deep Gratitude',
        color: 'amber',
        weight: 0.20
      },
      {
        key: 'appliedInsights',
        label: 'Applied Insights',
        description: 'Did you apply spiritual insights to your day?',
        minLabel: 'None',
        maxLabel: 'Actively Applied',
        color: 'green',
        weight: 0.25
      }
    ]
  }
};

export function getZoneConfig(zoneId) {
  return ZONE_CONFIG[zoneId] || null;
}

export function getZoneInputDefaults(zoneId) {
  const config = ZONE_CONFIG[zoneId];
  if (!config) return {};
  
  const defaults = {};
  config.inputs.forEach(input => {
    defaults[input.key] = 3;
  });
  return defaults;
}

export function getAllZoneIds() {
  return Object.keys(ZONE_CONFIG);
}

export function getZoneColor(zoneId) {
  const colorMap = {
    health: { bg: 'from-red-500 to-pink-500', light: 'bg-red-50', border: 'border-red-200' },
    socialEmotional: { bg: 'from-pink-500 to-purple-500', light: 'bg-pink-50', border: 'border-pink-200' },
    family: { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', border: 'border-amber-200' },
    community: { bg: 'from-cyan-500 to-blue-500', light: 'bg-cyan-50', border: 'border-cyan-200' },
    wealth: { bg: 'from-emerald-500 to-green-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
    faith: { bg: 'from-violet-500 to-indigo-500', light: 'bg-violet-50', border: 'border-violet-200' }
  };
  return colorMap[zoneId] || { bg: 'from-gray-500 to-gray-600', light: 'bg-gray-50', border: 'border-gray-200' };
}
