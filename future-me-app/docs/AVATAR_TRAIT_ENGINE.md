# Avatar Trait Map Engine Documentation

## Overview

The Avatar Trait Map Engine is a modular system that converts user data (metrics, habits, Life Zones, achievements, wellness scores) into structured avatar visual traits. Each trait has a **numeric score (0-100)** and a **descriptive label** that can be used by avatar rendering components.

**Important:** This engine does NOT modify avatar graphics directly. It only provides the data structure that avatar components can use to adjust visual appearance.

---

## Trait System

The engine calculates **6 core traits** that represent different aspects of the user's avatar:

### 1. **Posture**
- **Description:** How upright or slouched the avatar stands
- **Influenced by:** 
  - Activity level (40% weight)
  - Sleep quality (30% weight)
  - Stress level (30% weight, inverted)
  - Habit streaks (bonus up to +15 points)
- **Range:** 0-100
- **Labels:**
  - 80-100: "upright and confident"
  - 60-79: "upright posture"
  - 40-59: "moderate posture"
  - 20-39: "slightly slouched"
  - 0-19: "slouched posture"

**Logic:**
- Higher activity = better posture
- Better sleep = improved posture
- Higher stress = worse posture
- Active habit streaks add bonus points (0.5 points per total streak day)

---

### 2. **Body Shape**
- **Description:** Overall fitness level of the avatar's body
- **Influenced by:**
  - Wellness score (50% weight)
  - Nutrition level (25% weight)
  - Activity level (25% weight)
- **Range:** 0-100
- **Labels:**
  - 80-100: "very fit"
  - 60-79: "fit and healthy"
  - 40-59: "moderate fitness"
  - 20-39: "developing fitness"
  - 0-19: "low fitness"

**Logic:**
- Wellness score is the primary driver
- Good nutrition and activity support body shape
- All three factors combine for overall fitness representation

---

### 3. **Facial Expression**
- **Description:** Emotional state reflected in the avatar's face
- **Influenced by:**
  - Stress level (50% weight, inverted)
  - Social Emotional Life Zone score (50% weight)
  - Achievements (bonus up to +10 points)
- **Range:** 0-100
- **Labels:**
  - 80-100: "joyful and peaceful"
  - 60-79: "calm and happy"
  - 40-59: "neutral expression"
  - 20-39: "slightly tense"
  - 0-19: "stressed expression"

**Logic:**
- Lower stress = happier expression
- Higher emotional wellness = calmer face
- Achievements boost positive expression (1 point per achievement)

---

### 4. **Glow/Energy**
- **Description:** Visual radiance or energy aura around the avatar
- **Influenced by:**
  - Wellness score (40% weight)
  - Average Life Zone scores (40% weight)
  - Habit streaks (bonus up to +20 points)
- **Range:** 0-100
- **Labels:**
  - 80-100: "radiant energy"
  - 60-79: "strong vitality"
  - 40-59: "moderate energy"
  - 20-39: "low energy"
  - 0-19: "depleted energy"

**Logic:**
- Overall wellness drives base energy level
- Balanced Life Zones contribute to vitality
- Active streaks amplify glow (0.3 points per total streak day)

---

### 5. **Movement/Animation Level**
- **Description:** How dynamic or static the avatar's movement is
- **Influenced by:**
  - Activity level (60% weight)
  - Habit streaks (up to +40 points bonus)
- **Range:** 0-100
- **Labels:**
  - 80-100: "very dynamic"
  - 60-79: "active movement"
  - 40-59: "moderate movement"
  - 20-39: "minimal movement"
  - 0-19: "static pose"

**Logic:**
- Higher activity = more dynamic animation
- Long habit streaks increase animation momentum (1.5 points per total streak day)

---

### 6. **Aura/Presence**
- **Description:** Overall strength and balance of the avatar's presence
- **Influenced by:**
  - Life Zone balance (40% weight) - measures how evenly distributed zones are
  - Wellness score (30% weight)
  - Achievements (bonus up to +25 points)
- **Range:** 0-100
- **Labels:**
  - 80-100: "powerful presence"
  - 60-79: "strong presence"
  - 40-59: "balanced presence"
  - 20-39: "developing presence"
  - 0-19: "weak presence"

**Logic:**
- More balanced Life Zones = stronger presence
- Higher wellness contributes to overall strength
- Achievements significantly boost presence (2 points per achievement)

---

## Input Data Structure

The engine accepts a single `userData` object with the following structure:

```javascript
{
  dailyMetrics: {
    sleep: 3,      // 1-5 scale
    activity: 4,   // 1-5 scale
    nutrition: 3,  // 1-5 scale
    stress: 2      // 1-5 scale
  },
  wellnessScore: 72,  // 0-100
  lifeZones: {
    health: 75,
    socialEmotional: 68,
    wealth: 60,
    faith: 70,
    family: 65,
    community: 58
  },
  habitStreaks: [12, 8, 5],  // Array of current streak lengths
  achievements: [...]  // Array of earned achievement objects
}
```

---

## Output Data Structure

The engine returns a comprehensive trait map:

```javascript
{
  posture: {
    score: 72,
    label: "upright posture",
    influences: { activity: 4, sleep: 3, stress: 3, streakBonus: 12.5 }
  },
  bodyShape: {
    score: 68,
    label: "fit and healthy",
    influences: { wellness: 72, nutrition: 3, activity: 4 }
  },
  facialExpression: {
    score: 75,
    label: "calm and happy",
    influences: { stress: 3, emotionalWellness: 68, achievementBonus: 8 }
  },
  glowEnergy: {
    score: 77,
    label: "strong vitality",
    influences: { wellness: 72, lifeZoneAverage: 66, streakBonus: 7.5 }
  },
  movementLevel: {
    score: 85,
    label: "very dynamic",
    influences: { activity: 4, totalStreaks: 25, streakBonus: 37.5 }
  },
  auraPresence: {
    score: 81,
    label: "powerful presence",
    influences: { lifeZoneBalance: 92, wellness: 72, achievementBonus: 16 }
  },
  timestamp: "2025-11-20T12:45:00.000Z",
  summary: {
    overallScore: 76,
    dominantTraits: [
      { trait: "movementLevel", label: "very dynamic", score: 85 },
      { trait: "auraPresence", label: "powerful presence", score: 81 },
      { trait: "glowEnergy", label: "strong vitality", score: 77 }
    ]
  }
}
```

---

## Example Scenarios

### Scenario 1: High Performer
**Profile:**
- Consistently high metrics (sleep: 4, activity: 5, nutrition: 4, stress: 2)
- Wellness score: 85
- Balanced Life Zones (70-80 across all zones)
- Strong habit streaks [15, 22, 8]
- 10 achievements earned

**Resulting Traits:**
- **Posture:** 90 - "upright and confident"
- **Body Shape:** 83 - "very fit"
- **Facial Expression:** 84 - "joyful and peaceful"
- **Glow/Energy:** 94 - "radiant energy"
- **Movement Level:** 96 - "very dynamic"
- **Aura/Presence:** 95 - "powerful presence"

**Avatar Appearance:** Tall, energetic, glowing avatar with confident posture and happy expression

---

### Scenario 2: Struggling Individual
**Profile:**
- Low metrics (sleep: 2, activity: 1, nutrition: 2, stress: 5)
- Wellness score: 35
- Imbalanced Life Zones (20-40 range)
- Minimal streaks [0, 2, 0]
- Only 2 achievements

**Resulting Traits:**
- **Posture:** 22 - "slightly slouched"
- **Body Shape:** 28 - "developing fitness"
- **Facial Expression:** 15 - "stressed expression"
- **Glow/Energy:** 21 - "low energy"
- **Movement Level:** 15 - "static pose"
- **Aura/Presence:** 28 - "developing presence"

**Avatar Appearance:** Dimmer, less energetic avatar with slouched posture and tense expression

---

### Scenario 3: Balanced Beginner
**Profile:**
- Average metrics (sleep: 3, activity: 3, nutrition: 3, stress: 3)
- Wellness score: 50
- Perfectly balanced Life Zones (all at 50)
- Growing streaks [5, 5, 0]
- 4 achievements

**Resulting Traits:**
- **Posture:** 53 - "moderate posture"
- **Body Shape:** 50 - "moderate fitness"
- **Facial Expression:** 54 - "neutral expression"
- **Glow/Energy:** 53 - "moderate energy"
- **Movement Level:** 52 - "moderate movement"
- **Aura/Presence:** 62 - "strong presence"

**Avatar Appearance:** Balanced avatar with room for growth, showing steady progress

---

## Integration Guide

### Using the Engine in Components

```javascript
import calculateAvatarTraits from '../utils/avatarTraitEngine';

// In your component
const avatarTraits = calculateAvatarTraits({
  dailyMetrics: user.currentMetrics,
  wellnessScore: user.wellnessScore,
  lifeZones: user.lifeZones,
  habitStreaks: user.habits.map(h => h.streak),
  achievements: user.achievements
});

// Use trait scores to adjust avatar appearance
const avatarColor = getColorFromEnergy(avatarTraits.glowEnergy.score);
const avatarPosture = getPostureTransform(avatarTraits.posture.score);
const facialMood = getFacialExpression(avatarTraits.facialExpression.score);
```

### Example Avatar Rendering Adjustments

```javascript
// Posture: Adjust Y-position based on score
const postureY = traits.posture.score >= 70 ? -10 : 
                 traits.posture.score >= 40 ? 0 : 10;

// Body Shape: Adjust width/scale
const bodyScale = 0.8 + (traits.bodyShape.score / 100) * 0.4; // 0.8-1.2 range

// Facial Expression: Choose mouth path
const mouthPath = traits.facialExpression.score >= 70 ? 'M8,12 Q10,14 12,12' : // Happy
                  traits.facialExpression.score >= 40 ? 'M8,12 L12,12' :        // Neutral
                  'M8,14 Q10,12 12,14';                                         // Sad

// Glow/Energy: Adjust glow opacity and color
const glowOpacity = traits.glowEnergy.score / 100;
const glowColor = traits.glowEnergy.score >= 70 ? '#10b981' : 
                  traits.glowEnergy.score >= 40 ? '#f59e0b' : '#ef4444';

// Movement: Animation duration
const animationSpeed = 3 - (traits.movementLevel.score / 100) * 2; // 1-3 seconds

// Aura: Background effect intensity
const auraBlur = (traits.auraPresence.score / 100) * 30; // 0-30px blur
```

---

## Future Expansion Possibilities

The trait engine is designed to be modular and extensible. Future enhancements could include:

1. **Additional Traits:**
   - Skin tone (based on health metrics)
   - Clothing style (based on wealth zone)
   - Accessories (based on achievements)
   - Facial details (wrinkles, eye bags from sleep)

2. **Advanced Calculations:**
   - Time-of-day variations
   - Weather-based mood adjustments
   - Social interactions reflected in expression
   - Goal progress visualization

3. **Historical Trends:**
   - Track trait changes over time
   - Show improvement arrows
   - Celebrate milestone trait scores

4. **Customization:**
   - User-adjustable trait weights
   - Custom trait formulas
   - Personalized appearance preferences

---

## Technical Notes

### Score Normalization
- All input metrics (1-5 scale) are normalized to 0-100
- Stress is inverted (higher stress = lower score contribution)
- Bonuses are capped to prevent unrealistic values
- Final scores are always bounded to 0-100 range

### Life Zone Balance Calculation
Balance is measured using standard deviation:
- Lower variance = more balanced zones = higher score
- Assumes max standard deviation of 30 for worst case
- Perfect balance (all zones equal) = 100 score

### Trait Labeling
Labels use 5-tier system based on score thresholds:
- 0-19: Very Low / Negative
- 20-39: Low
- 40-59: Medium / Neutral
- 60-79: High / Positive
- 80-100: Very High / Excellent

---

## Testing

The engine includes built-in example scenarios via `getExampleTraits()`:

```javascript
import { getExampleTraits } from '../utils/avatarTraitEngine';

const examples = getExampleTraits();
console.log('High Performer:', examples.highPerformer);
console.log('Struggling:', examples.struggling);
console.log('Beginner:', examples.beginner);
```

This generates three complete trait maps for testing avatar rendering with different user profiles.

---

## Maintenance

When updating the trait engine:

1. **Preserve backward compatibility** - existing components depend on the output structure
2. **Document all changes** - update this file when adding new traits or modifying calculations
3. **Test edge cases** - verify behavior with missing data, extreme values, and default states
4. **Keep it grounded** - use practical, human-centered language aligned with branding guidelines
