const SCENARIOS = {
  SleepConsistency14d: {
    key: 'SleepConsistency14d',
    label: 'Sleep consistency for 14 days',
    shortLabel: 'Sleep consistency',
    durationDays: 14,
    actionKeys: ['SleepConsistencyImproved', 'SleepDurationImproved'],
    direction: 'positive',
    confidenceMinHistory: 5,
    confidenceRequires: 'sleep_data'
  },
  DailyWalk14d: {
    key: 'DailyWalk14d',
    label: 'Daily walking for 14 days',
    shortLabel: 'Daily walk',
    durationDays: 14,
    actionKeys: ['DailyWalk'],
    direction: 'positive',
    confidenceMinHistory: 3,
    confidenceRequires: 'activity_data'
  },
  NutritionStability14d: {
    key: 'NutritionStability14d',
    label: 'Nutrition stability for 14 days',
    shortLabel: 'Nutrition stability',
    durationDays: 14,
    actionKeys: ['NutritionStability', 'NutritionQuality'],
    direction: 'positive',
    confidenceMinHistory: 5,
    confidenceRequires: 'nutrition_data'
  },
  StressDecompression10d: {
    key: 'StressDecompression10d',
    label: 'Stress decompression for 10 days',
    shortLabel: 'Stress decompression',
    durationDays: 10,
    actionKeys: ['StressDecompressionBlock'],
    direction: 'positive',
    confidenceMinHistory: 3,
    confidenceRequires: 'stress_data'
  },
  StrengthTraining14d: {
    key: 'StrengthTraining14d',
    label: 'Strength training for 14 days',
    shortLabel: 'Strength training',
    durationDays: 14,
    actionKeys: ['StrengthTraining', 'MorningMovement'],
    direction: 'positive',
    confidenceMinHistory: 5,
    confidenceRequires: 'activity_data'
  },
  SocialConnection7d: {
    key: 'SocialConnection7d',
    label: 'Social connection for 7 days',
    shortLabel: 'Social connection',
    durationDays: 7,
    actionKeys: ['SocialConnectionTouchpoint', 'FamilyConnectionBlock'],
    direction: 'positive',
    confidenceMinHistory: 3,
    confidenceRequires: 'social_data'
  },
  LoggingPause10d: {
    key: 'LoggingPause10d',
    label: 'Logging pause for 10 days',
    shortLabel: 'Logging pause',
    durationDays: 10,
    actionKeys: ['LoggingConsistency'],
    direction: 'negative',
    confidenceMinHistory: 3,
    confidenceRequires: null
  },
  LateNights7d: {
    key: 'LateNights7d',
    label: 'Late nights for 7 days',
    shortLabel: 'Late nights',
    durationDays: 7,
    actionKeys: ['SleepConsistencyImproved', 'SleepDurationImproved'],
    direction: 'negative',
    confidenceMinHistory: 3,
    confidenceRequires: 'sleep_data'
  }
};

export function getScenario(key) {
  return SCENARIOS[key] || null;
}

export function getAllScenarioKeys() {
  return Object.keys(SCENARIOS);
}

export function getPositiveScenarios() {
  return Object.values(SCENARIOS).filter(s => s.direction === 'positive');
}

export function getNegativeScenarios() {
  return Object.values(SCENARIOS).filter(s => s.direction === 'negative');
}

export function getEligibleScenarios(historyDepth) {
  return Object.values(SCENARIOS).filter(s => historyDepth >= s.confidenceMinHistory);
}

export function selectDefaultScenario(mostSensitiveTrait, strongestLever, historyDepth) {
  const eligible = getEligibleScenarios(historyDepth);
  if (eligible.length === 0) return null;

  const positiveEligible = eligible.filter(s => s.direction === 'positive');
  if (positiveEligible.length === 0) return eligible[0];

  const TRAIT_TO_SCENARIO = {
    vitality: 'DailyWalk14d',
    resilience: 'SleepConsistency14d',
    emotionalStability: 'StressDecompression10d',
    discipline: 'NutritionStability14d',
    confidence: 'StrengthTraining14d',
    socialConnectedness: 'SocialConnection7d',
    purposeAlignment: 'NutritionStability14d'
  };

  if (mostSensitiveTrait) {
    const traitId = Object.entries({
      'Vitality': 'vitality',
      'Resilience': 'resilience',
      'Emotional Stability': 'emotionalStability',
      'Discipline': 'discipline',
      'Confidence': 'confidence',
      'Social Connectedness': 'socialConnectedness',
      'Purpose Alignment': 'purposeAlignment'
    }).find(([label]) => label === mostSensitiveTrait)?.[1];

    if (traitId && TRAIT_TO_SCENARIO[traitId]) {
      const candidate = SCENARIOS[TRAIT_TO_SCENARIO[traitId]];
      if (candidate && historyDepth >= candidate.confidenceMinHistory) {
        return candidate;
      }
    }
  }

  return positiveEligible[0];
}

export { SCENARIOS };
