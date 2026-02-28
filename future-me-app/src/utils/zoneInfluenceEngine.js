const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const ZONE_NEUTRAL = 50;
const MAX_OFFSET = 0.08;

function zoneDeviation(score) {
  if (score == null || isNaN(score)) return 0;
  return clamp((score - ZONE_NEUTRAL) / ZONE_NEUTRAL, -1, 1);
}

function scaleOffset(deviation, strength = MAX_OFFSET) {
  return clamp(deviation * strength, -strength, strength);
}

export function computeZoneInfluences(lifeZoneScores = {}) {
  const health = lifeZoneScores.health;
  const wealth = lifeZoneScores.wealth;
  const socialEmotional = lifeZoneScores.socialEmotional;
  const family = lifeZoneScores.family;
  const community = lifeZoneScores.community;
  const faith = lifeZoneScores.faith;

  const hasAny = Object.keys(lifeZoneScores).length > 0;
  if (!hasAny) return getEmptyInfluences();

  const wealthDev = zoneDeviation(wealth);
  const seDev = zoneDeviation(socialEmotional);
  const familyDev = zoneDeviation(family);
  const communityDev = zoneDeviation(community);
  const faithDev = zoneDeviation(faith);
  const relationalDev = (familyDev + communityDev) / 2;

  const postureOffset = scaleOffset(
    wealthDev * 0.4 + relationalDev * 0.3 + faithDev * 0.3
  );

  const expressionOffset = scaleOffset(
    seDev * 0.6 + relationalDev * 0.4
  );

  const brightnessOffset = scaleOffset(
    faithDev * 0.3 + seDev * 0.3 + relationalDev * 0.2 + wealthDev * 0.2,
    0.05
  );

  const saturationOffset = scaleOffset(
    seDev * 0.4 + relationalDev * 0.3 + faithDev * 0.3,
    0.05
  );

  const stabilityOffset = scaleOffset(
    faithDev * 0.5 + wealthDev * 0.3 + relationalDev * 0.2,
    0.06
  );

  const activeInfluences = buildActiveInfluences(lifeZoneScores);

  return {
    postureOffset,
    expressionOffset,
    brightnessOffset,
    saturationOffset,
    stabilityOffset,
    activeInfluences,
    _zoneScores: lifeZoneScores
  };
}

function buildActiveInfluences(scores) {
  const influences = [];

  if (scores.health != null) {
    influences.push({
      zone: 'Health',
      target: 'posture and physical tone',
      active: true
    });
  }

  if (scores.socialEmotional != null) {
    influences.push({
      zone: 'Social Emotional',
      target: 'facial expression',
      active: true
    });
  }

  if (scores.wealth != null) {
    influences.push({
      zone: 'Wealth',
      target: 'grounding and posture',
      active: true
    });
  }

  if (scores.faith != null) {
    influences.push({
      zone: 'Faith',
      target: 'steadiness and clarity',
      active: true
    });
  }

  if (scores.family != null || scores.community != null) {
    influences.push({
      zone: 'Family & Community',
      target: 'openness and expression',
      active: scores.family != null || scores.community != null
    });
  }

  return influences;
}

function getEmptyInfluences() {
  return {
    postureOffset: 0,
    expressionOffset: 0,
    brightnessOffset: 0,
    saturationOffset: 0,
    stabilityOffset: 0,
    activeInfluences: [],
    _zoneScores: {}
  };
}

export function applyZoneInfluencesToEffects(effects, zoneInfluences) {
  if (!zoneInfluences || !effects) return effects;

  const modified = { ...effects };

  const postureScore =
    effects.postureState === 'upright' ? 0.8 :
    effects.postureState === 'neutral' ? 0.5 : 0.2;

  const adjustedPosture = postureScore + zoneInfluences.postureOffset;
  if (adjustedPosture >= 0.7) modified.postureState = 'upright';
  else if (adjustedPosture >= 0.4) modified.postureState = 'neutral';
  else modified.postureState = 'slump';

  const emotionRank = { happy: 4, content: 3, neutral: 2, tired: 1, stressed: 0 };
  const reverseRank = ['stressed', 'tired', 'neutral', 'content', 'happy'];
  const currentRank = emotionRank[effects.emotionState] ?? 2;
  const shift = zoneInfluences.expressionOffset > 0.03 ? 1 :
                zoneInfluences.expressionOffset < -0.03 ? -1 : 0;
  const newRank = clamp(currentRank + shift, 0, 4);
  modified.emotionState = reverseRank[newRank];

  modified.brightnessLevel = clamp(
    effects.brightnessLevel + zoneInfluences.brightnessOffset,
    0.5, 1.2
  );

  modified.saturationLevel = clamp(
    effects.saturationLevel + zoneInfluences.saturationOffset,
    0.4, 1.2
  );

  if (modified.facialOverlays) {
    modified.facialOverlays = { ...effects.facialOverlays };
    const tensionReduction = clamp(zoneInfluences.expressionOffset * 0.5, -0.1, 0.1);
    modified.facialOverlays.stressDesaturation = clamp(
      effects.facialOverlays.stressDesaturation - tensionReduction,
      0, 0.5
    );
  }

  if (modified.energyPulse) {
    modified.energyPulse = { ...effects.energyPulse };
    modified.energyPulse.pulseIntensity = clamp(
      effects.energyPulse.pulseIntensity + zoneInfluences.stabilityOffset * 0.5,
      0, 1
    );
  }

  const { brightnessLevel, contrastLevel, saturationLevel, blurAmount } = modified;
  const filters = [
    `brightness(${brightnessLevel.toFixed(2)})`,
    `contrast(${(contrastLevel || effects.contrastLevel).toFixed(2)})`,
    `saturate(${saturationLevel.toFixed(2)})`
  ];
  if ((blurAmount || 0) > 0.01) {
    filters.push(`blur(${(blurAmount * 3).toFixed(1)}px)`);
  }
  modified.cssFilter = filters.join(' ');

  modified.zoneInfluences = zoneInfluences;

  return modified;
}
