/**
 * Daily Signal Boosts
 *
 * Bounded, additive trait adjustments derived from the newer whole-person daily
 * signals (energy, mood, sleep duration) and the deeper physical-detail signals
 * (strength, mobility, hydration, protein, outdoor, recovery, body tension).
 *
 * These are NOT added as weighted sources in the trait mapping table on purpose:
 *   - validateMappingTable requires each trait's weights to sum to 1.0, so adding
 *     a source would force a rebalance that shifts every existing user's scores.
 *   - historical source maps only carry the four core metrics, so new sources
 *     would corrupt the 7/30-day averages and velocity.
 *
 * Instead we mirror the established habit-boost pattern: a small additive nudge,
 * clamped per trait, applied ONLY to the current score (never to historical
 * averages). Signals already represented by core metrics (sleep quality,
 * movement, nutrition, stress) are intentionally excluded here — they already
 * flow through the health.* sources.
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// value 1..5 -> deviation from neutral (3) in [-1, +1]. Inverted flips polarity.
function deviation(value, inverted = false) {
  const v = Number(value);
  if (isNaN(v)) return null;
  const dev = (v - 3) / 2;
  return inverted ? -dev : dev;
}

/**
 * Which traits each new signal nudges, following the ITE extension intent.
 * Keep this restrained — every contribution is scaled small and the per-trait
 * total is clamped, so new signals can never overpower the core metrics.
 */
const DAILY_SIGNAL_TRAIT_MAP = {
  // Daily Quick Log signals
  sleepDuration: { traits: ['vitality', 'resilience', 'emotionalStability'] },
  energy:        { traits: ['vitality', 'confidence'] },
  mood:          { traits: ['emotionalStability', 'confidence'] },
  // Deeper physical-detail signals (present only when a Health Detail exists)
  strength:      { traits: ['vitality', 'discipline', 'confidence'] },
  mobility:      { traits: ['resilience', 'vitality'] },
  hydration:     { traits: ['vitality'] },
  protein:       { traits: ['vitality', 'discipline'] },
  outdoor:       { traits: ['vitality', 'emotionalStability'] },
  recovery:      { traits: ['resilience', 'emotionalStability'] },
  bodyTension:   { traits: ['resilience', 'vitality', 'emotionalStability'], inverted: true }
};

const PER_SIGNAL_COEFFICIENT = 1.2;
const MAX_ABS_BOOST_PER_TRAIT = 3;

/**
 * Compute per-trait additive boosts from the supplied signals object.
 * Null-safe: any absent signal simply contributes nothing, and callers that
 * pass no new signals get an empty object (zero boost everywhere).
 *
 * @param {Object} signals - flat object that may contain energy, mood,
 *   sleepDuration, strength, mobility, hydration, protein, outdoor, recovery,
 *   bodyTension (each 1-5, or absent).
 * @returns {Object} traitId -> boost (clamped to +/- MAX_ABS_BOOST_PER_TRAIT)
 */
export function computeDailySignalBoosts(signals) {
  const boosts = {};
  if (!signals || typeof signals !== 'object') return boosts;

  for (const [key, cfg] of Object.entries(DAILY_SIGNAL_TRAIT_MAP)) {
    if (signals[key] == null) continue;
    const dev = deviation(signals[key], cfg.inverted);
    if (dev == null) continue;

    const contribution = dev * PER_SIGNAL_COEFFICIENT;
    for (const trait of cfg.traits) {
      boosts[trait] = (boosts[trait] || 0) + contribution;
    }
  }

  for (const trait of Object.keys(boosts)) {
    boosts[trait] = clamp(boosts[trait], -MAX_ABS_BOOST_PER_TRAIT, MAX_ABS_BOOST_PER_TRAIT);
  }

  return boosts;
}

export default computeDailySignalBoosts;
