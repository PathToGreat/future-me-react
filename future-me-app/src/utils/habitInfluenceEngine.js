/**
 * Habit Influence Engine
 *
 * Translates completed default habit rhythm into small, restrained identity
 * trait boosts.  The model: habit completed → rhythm score → trait delta.
 *
 * Design constraints (per spec):
 *   • Habit influence is at most ~10-20% of total trait signal.
 *   • A SINGLE completion has minimal effect; repeated rhythm accumulates.
 *   • No punishment for missing days — influence simply fades.
 *   • Max per-trait boost: 10 points (on a 0-100 scale).
 */

// ─── Trait influence map ────────────────────────────────────────────────────
// Keys = default habit IDs (from defaultHabits.js).
// Values = per-ITE-trait weights for that habit (weights sum to 1.0).
// ITE trait IDs: vitality | resilience | emotionalStability |
//                discipline | confidence | socialConnectedness | purposeAlignment
const HABIT_TRAIT_MAP = {
  'quality-sleep':       { vitality: 0.40, resilience: 0.35, emotionalStability: 0.25 },
  'morning-sunlight':    { vitality: 0.45, emotionalStability: 0.35, resilience: 0.20 },
  'evening-wind-down':   { emotionalStability: 0.45, resilience: 0.35, vitality: 0.20 },
  'daily-movement':      { vitality: 0.45, discipline: 0.30, confidence: 0.25 },
  'strength-training':   { vitality: 0.40, discipline: 0.35, confidence: 0.25 },
  'deep-breathing':      { emotionalStability: 0.55, resilience: 0.45 },
  'prayer-reflection':   { purposeAlignment: 0.40, emotionalStability: 0.35, discipline: 0.25 },
  'morning-gratitude':   { emotionalStability: 0.55, purposeAlignment: 0.45 },
  'check-in-loved-ones': { socialConnectedness: 0.55, emotionalStability: 0.45 },
  'acts-of-kindness':    { socialConnectedness: 0.50, purposeAlignment: 0.50 },
  'whole-food-meal':     { vitality: 0.60, discipline: 0.40 },
  'hydration':           { vitality: 1.00 },
  'financial-check-in':  { discipline: 0.50, confidence: 0.30, purposeAlignment: 0.20 },
  'reading-learning':    { discipline: 0.50, purposeAlignment: 0.30, confidence: 0.20 },
  'outdoor-time':        { vitality: 0.40, emotionalStability: 0.35, resilience: 0.25 },
};

// Max points any single habit can contribute (at full 7-day rhythm, today)
const MAX_SINGLE_HABIT_BOOST = 8;
// Hard cap per trait regardless of how many habits stack
const MAX_TRAIT_TOTAL_BOOST = 10;

// ─── Rhythm scoring ─────────────────────────────────────────────────────────
/**
 * Returns a 0-1 rhythm score for a single habit completion record.
 *   0   → no recent activity (> 7 days since last log, or never)
 *   1.0 → 7-day rhythm, completed today
 *
 * Factors:
 *   streakFactor  — capped at 7 days (min(streak, 7) / 7)
 *   recencyFactor — fades linearly over 7 days; missed today = 0.86, missed 7 = 0
 */
function computeRhythmScore(completion) {
  if (!completion?.lastCompletedDate) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSince = Math.max(
    0,
    Math.floor((new Date(todayStr) - new Date(completion.lastCompletedDate)) / msPerDay)
  );

  if (daysSince > 7) return 0;

  const recencyFactor = Math.max(0, 1 - daysSince * (1 / 7));
  const streakFactor  = Math.min(completion.streak || 1, 7) / 7;

  return streakFactor * recencyFactor;
}

// ─── Public: compute per-trait boosts ───────────────────────────────────────
/**
 * computeHabitTraitBoosts(defaultHabitCompletions)
 *
 * @param  {Object} defaultHabitCompletions
 *   Shape: { [habitId]: { lastCompletedDate: 'YYYY-MM-DD', streak: number } }
 *   (from users/{uid}/habitPrefs/defaults → completions)
 *
 * @returns {Object} { [traitId]: boost }   — boost values 0-10 points
 */
export function computeHabitTraitBoosts(defaultHabitCompletions) {
  if (!defaultHabitCompletions || Object.keys(defaultHabitCompletions).length === 0) {
    return {};
  }

  const boosts = {};

  for (const [habitId, traitWeights] of Object.entries(HABIT_TRAIT_MAP)) {
    const completion = defaultHabitCompletions[habitId];
    if (!completion) continue;

    const rhythmScore = computeRhythmScore(completion);
    if (rhythmScore <= 0) continue;

    const habitBoost = rhythmScore * MAX_SINGLE_HABIT_BOOST;

    for (const [traitId, weight] of Object.entries(traitWeights)) {
      boosts[traitId] = (boosts[traitId] || 0) + habitBoost * weight;
    }
  }

  // Hard cap per trait
  for (const traitId of Object.keys(boosts)) {
    boosts[traitId] = Math.min(boosts[traitId], MAX_TRAIT_TOTAL_BOOST);
  }

  return boosts;
}

// ─── Public: generate influence summary for VisualInfluences ────────────────

const TRAIT_DISPLAY_NAMES = {
  vitality:           'vitality',
  resilience:         'resilience',
  emotionalStability: 'emotional stability',
  discipline:         'discipline',
  confidence:         'confidence',
  socialConnectedness:'social connectedness',
  purposeAlignment:   'purpose alignment',
};

const HABIT_GROUPS = [
  {
    habitIds: ['quality-sleep', 'evening-wind-down', 'morning-sunlight'],
    label:    'Sleep and rest habits',
    traits:   ['vitality', 'emotionalStability'],
  },
  {
    habitIds: ['daily-movement', 'strength-training', 'outdoor-time'],
    label:    'Movement habits',
    traits:   ['vitality', 'discipline'],
  },
  {
    habitIds: ['prayer-reflection', 'morning-gratitude'],
    label:    'Reflection habits',
    traits:   ['purposeAlignment', 'emotionalStability'],
  },
  {
    habitIds: ['check-in-loved-ones', 'acts-of-kindness'],
    label:    'Connection habits',
    traits:   ['socialConnectedness', 'emotionalStability'],
  },
  {
    habitIds: ['whole-food-meal', 'hydration'],
    label:    'Nutrition habits',
    traits:   ['vitality', 'discipline'],
  },
  {
    habitIds: ['financial-check-in', 'reading-learning'],
    label:    'Learning and wealth habits',
    traits:   ['discipline', 'confidence'],
  },
  {
    habitIds: ['deep-breathing'],
    label:    'Breathing and relaxation',
    traits:   ['emotionalStability', 'resilience'],
  },
];

const MIN_RHYTHM_THRESHOLD = 0.14; // rhythm score ≥ this → group is "active"
const MIN_BOOST_THRESHOLD  = 1.2;  // trait boost ≥ this → worth mentioning

/**
 * generateHabitInfluenceSummary(defaultHabitCompletions)
 *
 * Returns an array of short observational strings describing how habit
 * rhythm is contributing to identity traits.  Empty array if no active habits.
 */
export function generateHabitInfluenceSummary(defaultHabitCompletions) {
  if (!defaultHabitCompletions) return [];

  const boosts = computeHabitTraitBoosts(defaultHabitCompletions);
  if (Object.keys(boosts).length === 0) return [];

  const sentences = [];

  for (const group of HABIT_GROUPS) {
    const hasActiveHabits = group.habitIds.some((id) => {
      const completion = defaultHabitCompletions[id];
      return computeRhythmScore(completion) >= MIN_RHYTHM_THRESHOLD;
    });
    if (!hasActiveHabits) continue;

    const activeTraits = group.traits
      .filter((t) => (boosts[t] || 0) >= MIN_BOOST_THRESHOLD)
      .map((t) => TRAIT_DISPLAY_NAMES[t] || t);

    if (activeTraits.length === 0) continue;

    const traitText =
      activeTraits.length === 1
        ? activeTraits[0]
        : activeTraits.slice(0, -1).join(', ') + ' and ' + activeTraits[activeTraits.length - 1];

    sentences.push(`${group.label} are contributing to ${traitText}.`);
  }

  return sentences;
}
