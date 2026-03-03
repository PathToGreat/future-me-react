const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const BODY_CONSTRAINTS = {
  shoulderWidth: { min: 0.35, max: 0.92 },
  chestSize: { min: 0.25, max: 0.85 },
  waistTaper: { min: 0.08, max: 0.82 },
  hipWidth: { min: 0.28, max: 0.72 },
  armThickness: { min: 0.2, max: 0.78 },
  legThickness: { min: 0.25, max: 0.72 },
  neckThickness: { min: 0.2, max: 0.68 },
  headScale: { min: 0.4, max: 0.58 }
};

const RELATIONAL_RULES = {
  shoulderMinOverNeck: 0.06,
  waistMaxOverHip: 0.15,
  armProportionToChest: { min: 0.5, max: 1.15 },
  legProportionToHip: { min: 0.55, max: 1.2 }
};

export function enforceBodyConstraints(params) {
  const p = { ...params };

  for (const [key, bounds] of Object.entries(BODY_CONSTRAINTS)) {
    if (p[key] != null) {
      p[key] = clamp(p[key], bounds.min, bounds.max);
    }
  }

  if (p.shoulderWidth != null && p.neckThickness != null) {
    const minShoulder = p.neckThickness + RELATIONAL_RULES.shoulderMinOverNeck;
    if (p.shoulderWidth < minShoulder) {
      p.shoulderWidth = clamp(minShoulder, BODY_CONSTRAINTS.shoulderWidth.min, BODY_CONSTRAINTS.shoulderWidth.max);
    }
  }

  if (p.waistTaper != null && p.hipWidth != null) {
    const effectiveWaist = 1 - p.waistTaper;
    const maxWaist = p.hipWidth + RELATIONAL_RULES.waistMaxOverHip;
    if (effectiveWaist > maxWaist) {
      p.waistTaper = clamp(1 - maxWaist, BODY_CONSTRAINTS.waistTaper.min, BODY_CONSTRAINTS.waistTaper.max);
    }
  }

  if (p.armThickness != null && p.chestSize != null) {
    const ratio = p.armThickness / Math.max(p.chestSize, 0.01);
    if (ratio < RELATIONAL_RULES.armProportionToChest.min) {
      p.armThickness = clamp(
        p.chestSize * RELATIONAL_RULES.armProportionToChest.min,
        BODY_CONSTRAINTS.armThickness.min,
        BODY_CONSTRAINTS.armThickness.max
      );
    } else if (ratio > RELATIONAL_RULES.armProportionToChest.max) {
      p.armThickness = clamp(
        p.chestSize * RELATIONAL_RULES.armProportionToChest.max,
        BODY_CONSTRAINTS.armThickness.min,
        BODY_CONSTRAINTS.armThickness.max
      );
    }
  }

  if (p.legThickness != null && p.hipWidth != null) {
    const ratio = p.legThickness / Math.max(p.hipWidth, 0.01);
    if (ratio < RELATIONAL_RULES.legProportionToHip.min) {
      p.legThickness = clamp(
        p.hipWidth * RELATIONAL_RULES.legProportionToHip.min,
        BODY_CONSTRAINTS.legThickness.min,
        BODY_CONSTRAINTS.legThickness.max
      );
    } else if (ratio > RELATIONAL_RULES.legProportionToHip.max) {
      p.legThickness = clamp(
        p.hipWidth * RELATIONAL_RULES.legProportionToHip.max,
        BODY_CONSTRAINTS.legThickness.min,
        BODY_CONSTRAINTS.legThickness.max
      );
    }
  }

  return p;
}

export function validateBodyModel(deps) {
  const { getPreset, getTierInterpolation, interpolatePresets } = deps.presets;
  const { normalizeParams } = deps.params;

  const tiers = ['Overweight', 'Soft', 'AverageFit', 'LeanAthletic', 'MuscularAthletic'];
  const genders = ['male', 'female'];
  const scores = [0, 25, 50, 75, 100];
  const results = [];

  for (const gender of genders) {
    for (const score of scores) {
      const { lowerTier, upperTier, t } = getTierInterpolation(score);
      const lower = getPreset(lowerTier, gender);
      const upper = getPreset(upperTier, gender);
      const blended = interpolatePresets(lower, upper, t);

      const withHighEmo = enforceBodyConstraints({
        ...blended,
        gender,
        postureLean: 0.6,
        facialTension: 0.1,
        vibrancy: 0.8,
        energyGlow: 0.7
      });

      const withLowEmo = enforceBodyConstraints({
        ...blended,
        gender,
        postureLean: -0.4,
        facialTension: 0.8,
        vibrancy: 0.3,
        energyGlow: 0.2
      });

      const bodyKeysToCompare = ['shoulderWidth', 'chestSize', 'waistTaper', 'hipWidth', 'armThickness', 'legThickness'];
      let bodyMatchesAcrossEmotion = true;
      for (const key of bodyKeysToCompare) {
        if (Math.abs(withHighEmo[key] - withLowEmo[key]) > 0.001) {
          bodyMatchesAcrossEmotion = false;
          break;
        }
      }

      const normalized = normalizeParams(withHighEmo);

      const checks = {
        gender,
        score,
        tiers: `${lowerTier} → ${upperTier} (t=${t.toFixed(3)})`,
        bodyUnchangedByEmotion: bodyMatchesAcrossEmotion,
        shoulderWiderThanNeck: normalized.shoulderWidth > normalized.neckThickness,
        armsProportional: normalized.armThickness >= normalized.chestSize * 0.4 && normalized.armThickness <= normalized.chestSize * 1.2,
        legsProportional: normalized.legThickness >= normalized.hipWidth * 0.5 && normalized.legThickness <= normalized.hipWidth * 1.25,
        headRealistic: normalized.headScale >= 0.4 && normalized.headScale <= 0.58,
        allInBounds: Object.entries(BODY_CONSTRAINTS).every(([key, bounds]) =>
          normalized[key] == null || (normalized[key] >= bounds.min && normalized[key] <= bounds.max)
        ),
        valid: true
      };

      checks.valid = checks.bodyUnchangedByEmotion &&
        checks.shoulderWiderThanNeck &&
        checks.armsProportional &&
        checks.legsProportional &&
        checks.headRealistic &&
        checks.allInBounds;

      results.push(checks);
    }
  }

  const allValid = results.every(r => r.valid);
  return { allValid, results };
}

export { BODY_CONSTRAINTS, RELATIONAL_RULES };
