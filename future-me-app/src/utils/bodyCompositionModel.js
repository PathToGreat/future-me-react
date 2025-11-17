/**
 * Body Composition Model
 * 
 * Calculates a composite body composition score from multiple lifestyle inputs.
 * This score influences the avatar's body shape to reflect overall health.
 * 
 * Inputs: activity (1-5), nutrition (1-5), sleep (1-5), stress (1-5)
 * Output: Body composition score (0-100) where higher = healthier/more toned
 */

export function calculateBodyComposition(activity, nutrition, sleep, stress) {
  // Weighted factors (total = 100%)
  const weights = {
    activity: 0.35,    // 35% - Physical activity is primary driver
    nutrition: 0.30,   // 30% - Nutrition is crucial for body composition
    sleep: 0.20,       // 20% - Sleep affects recovery and metabolism
    stress: 0.15       // 15% - Stress impacts cortisol and body composition
  };

  // Normalize inputs to 0-100 scale
  const normalizedActivity = ((activity - 1) / 4) * 100;
  const normalizedNutrition = ((nutrition - 1) / 4) * 100;
  const normalizedSleep = ((sleep - 1) / 4) * 100;
  const normalizedStress = ((5 - stress) / 4) * 100; // Inverted: lower stress = better

  // Calculate weighted composite score
  const compositeScore = 
    normalizedActivity * weights.activity +
    normalizedNutrition * weights.nutrition +
    normalizedSleep * weights.sleep +
    normalizedStress * weights.stress;

  return Math.round(compositeScore);
}

/**
 * Get avatar body width based on body composition score
 * 
 * Logic:
 * - Poor body composition (low score) = wider avatar
 * - Good body composition (high score) = normalized/toned avatar
 * 
 * @param {number} compositionScore - Body composition score (0-100)
 * @returns {number} Avatar body width in pixels
 */
export function getAvatarBodyWidth(compositionScore) {
  const baseWidth = 120; // Normal width at optimal composition
  const maxDeviation = 30; // Maximum width increase from base

  // Lower composition score = wider body
  // Higher composition score = more toned/normal body
  // Formula: as score goes from 0 to 100, width goes from 150 to 105
  const widthAdjustment = maxDeviation * (1 - compositionScore / 100);
  
  return Math.round(baseWidth + widthAdjustment - 15);
}

/**
 * Get body composition description for UI display
 * 
 * @param {number} compositionScore - Body composition score (0-100)
 * @returns {string} Human-readable description
 */
export function getBodyCompositionDescription(compositionScore) {
  if (compositionScore >= 80) {
    return "Excellent - highly toned and healthy";
  } else if (compositionScore >= 65) {
    return "Good - maintaining healthy composition";
  } else if (compositionScore >= 50) {
    return "Fair - room for improvement";
  } else if (compositionScore >= 35) {
    return "Needs attention - focus on lifestyle inputs";
  } else {
    return "Poor - significant lifestyle changes needed";
  }
}
