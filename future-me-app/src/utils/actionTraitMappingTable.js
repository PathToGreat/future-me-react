const ACTION_TRAIT_MAP = {
  SleepConsistencyImproved: {
    label: 'Sleep consistency improved',
    traits: [
      { traitId: 'resilience', weight: 0.4, polarity: 'positive' },
      { traitId: 'vitality', weight: 0.3, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.2, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.1, polarity: 'positive' }
    ],
    timeToEffect: 'medium',
    confidenceRule: 'requires_7day_sleep_variance_decrease'
  },
  SleepDurationImproved: {
    label: 'Sleep duration improved',
    traits: [
      { traitId: 'vitality', weight: 0.5, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.3, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_sleep_above_recent_avg'
  },
  StressDecompressionBlock: {
    label: 'Stress decompression',
    traits: [
      { traitId: 'emotionalStability', weight: 0.4, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.3, polarity: 'positive' },
      { traitId: 'confidence', weight: 0.15, polarity: 'positive' },
      { traitId: 'socialConnectedness', weight: 0.15, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_stress_below_recent_avg'
  },
  MorningMovement: {
    label: 'Morning movement',
    traits: [
      { traitId: 'vitality', weight: 0.5, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.3, polarity: 'positive' },
      { traitId: 'confidence', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_activity_above_3'
  },
  StrengthTraining: {
    label: 'Strength training',
    traits: [
      { traitId: 'vitality', weight: 0.4, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.3, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.2, polarity: 'positive' },
      { traitId: 'confidence', weight: 0.1, polarity: 'positive' }
    ],
    timeToEffect: 'medium',
    confidenceRule: 'requires_activity_4_or_above'
  },
  DailyWalk: {
    label: 'Daily walk',
    traits: [
      { traitId: 'vitality', weight: 0.3, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.3, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.2, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_activity_above_3'
  },
  NutritionStability: {
    label: 'Nutrition stability',
    traits: [
      { traitId: 'vitality', weight: 0.3, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.3, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.2, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'medium',
    confidenceRule: 'requires_nutrition_variance_low'
  },
  NutritionQuality: {
    label: 'Nutrition quality improved',
    traits: [
      { traitId: 'vitality', weight: 0.4, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.3, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.3, polarity: 'positive' }
    ],
    timeToEffect: 'medium',
    confidenceRule: 'requires_nutrition_above_recent_avg'
  },
  SocialConnectionTouchpoint: {
    label: 'Social connection touchpoint',
    traits: [
      { traitId: 'socialConnectedness', weight: 0.5, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.3, polarity: 'positive' },
      { traitId: 'purposeAlignment', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_social_zone_active'
  },
  FamilyConnectionBlock: {
    label: 'Family connection block',
    traits: [
      { traitId: 'socialConnectedness', weight: 0.4, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.3, polarity: 'positive' },
      { traitId: 'purposeAlignment', weight: 0.3, polarity: 'positive' }
    ],
    timeToEffect: 'short',
    confidenceRule: 'requires_family_zone_active'
  },
  FaithPracticeConsistency: {
    label: 'Faith practice consistency',
    traits: [
      { traitId: 'purposeAlignment', weight: 0.5, polarity: 'positive' },
      { traitId: 'emotionalStability', weight: 0.2, polarity: 'positive' },
      { traitId: 'discipline', weight: 0.2, polarity: 'positive' },
      { traitId: 'resilience', weight: 0.1, polarity: 'positive' }
    ],
    timeToEffect: 'long',
    confidenceRule: 'requires_faith_zone_active'
  },
  LoggingConsistency: {
    label: 'Logging consistency',
    traits: [
      { traitId: 'discipline', weight: 0.5, polarity: 'positive' },
      { traitId: 'confidence', weight: 0.3, polarity: 'positive' },
      { traitId: 'purposeAlignment', weight: 0.2, polarity: 'positive' }
    ],
    timeToEffect: 'medium',
    confidenceRule: 'requires_consecutive_logging_days'
  }
};

export function getActionMapping(actionKey) {
  return ACTION_TRAIT_MAP[actionKey] || null;
}

export function getAllActionKeys() {
  return Object.keys(ACTION_TRAIT_MAP);
}

export function getActionsForTrait(traitId) {
  return Object.entries(ACTION_TRAIT_MAP)
    .filter(([_, mapping]) => mapping.traits.some(t => t.traitId === traitId))
    .map(([key, mapping]) => ({
      actionKey: key,
      label: mapping.label,
      weight: mapping.traits.find(t => t.traitId === traitId)?.weight || 0,
      timeToEffect: mapping.timeToEffect
    }))
    .sort((a, b) => b.weight - a.weight);
}

export { ACTION_TRAIT_MAP };
