import { runIdentityTrajectoryEngine } from './identityTrajectoryEngine';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function traitToMetricScale(score) {
  return clamp(1 + (score / 100) * 4, 1, 5);
}

function traitToStressScale(score) {
  return clamp(5 - (score / 100) * 4, 1, 5);
}

function applyVisualDeltaOffset(base, delta, scale = 1) {
  return clamp(base + delta * scale, 0, 100);
}

function canRunITE(historyData, baselineData) {
  if (!historyData || historyData.length < 3) return false;
  if (!baselineData) return false;
  return true;
}

function buildRawMetrics(dailyMetrics, lifeZones, habits) {
  return {
    activity: dailyMetrics?.activity ?? 3,
    nutrition: dailyMetrics?.nutrition ?? 3,
    sleep: dailyMetrics?.sleep ?? 3,
    stress: dailyMetrics?.stress ?? 3,
    lifeZones: lifeZones || {},
    habits: habits || []
  };
}

function traitStateToAvatarTraitInput(traits, visualDelta) {
  const vd = visualDelta || {};

  const vitality = applyVisualDeltaOffset(traits.vitality?.currentScore ?? 50, (vd.energyIntensity || 0) * 100);
  const resilience = traits.resilience?.currentScore ?? 50;
  const emotionalStability = applyVisualDeltaOffset(traits.emotionalStability?.currentScore ?? 50, (vd.facialBrightness || 0) * 100);
  const discipline = traits.discipline?.currentScore ?? 50;
  const confidence = traits.confidence?.currentScore ?? 50;
  const socialConnectedness = traits.socialConnectedness?.currentScore ?? 50;
  const purposeAlignment = traits.purposeAlignment?.currentScore ?? 50;

  const activityProxy = traitToMetricScale((vitality * 0.6 + discipline * 0.4));
  const nutritionProxy = traitToMetricScale((vitality * 0.4 + discipline * 0.3 + resilience * 0.3));
  const sleepProxy = traitToMetricScale((resilience * 0.4 + emotionalStability * 0.4 + vitality * 0.2));
  const stressProxy = traitToStressScale((emotionalStability * 0.5 + resilience * 0.3 + socialConnectedness * 0.2));
  const disciplineProxy = traitToMetricScale((discipline * 0.6 + confidence * 0.2 + purposeAlignment * 0.2));

  const wellnessProxy = clamp(
    (vitality * 0.25 + resilience * 0.15 + emotionalStability * 0.2 + discipline * 0.15 + confidence * 0.1 + socialConnectedness * 0.05 + purposeAlignment * 0.1),
    0, 100
  );

  return {
    dailyMetrics: {
      activity: activityProxy,
      nutrition: nutritionProxy,
      sleep: sleepProxy,
      stress: stressProxy
    },
    wellnessScore: wellnessProxy,
    disciplineScore: disciplineProxy,
    activityScore: activityProxy,
    nutritionScore: nutritionProxy,
    sleepScore: sleepProxy,
    stressScore: stressProxy
  };
}

function projectedStateToAvatarTraitInput(traits, projections, visualDelta, horizon) {
  const vd = visualDelta || {};
  const proj = projections || {};

  const vitality = applyVisualDeltaOffset(proj.vitality ?? 50, (vd.energyIntensity || 0) * 200);
  const resilience = applyVisualDeltaOffset(proj.resilience ?? 50, (vd.postureAngle || 0) * 200);
  const emotionalStability = applyVisualDeltaOffset(proj.emotionalStability ?? 50, (vd.facialBrightness || 0) * 200);
  const discipline = proj.discipline ?? 50;
  const confidence = applyVisualDeltaOffset(proj.confidence ?? 50, (vd.shoulderAlignment || 0) * 200);
  const socialConnectedness = proj.socialConnectedness ?? 50;
  const purposeAlignment = proj.purposeAlignment ?? 50;

  let scaleFactor = 1.0;
  if (horizon === '90day') {
    scaleFactor = 0.25;
    const current = traits || {};
    const blend = (traitId, projVal) => {
      const curr = current[traitId]?.currentScore ?? 50;
      return curr + (projVal - curr) * scaleFactor;
    };
    return traitStateToAvatarTraitInputFromScores({
      vitality: blend('vitality', vitality),
      resilience: blend('resilience', resilience),
      emotionalStability: blend('emotionalStability', emotionalStability),
      discipline: blend('discipline', discipline),
      confidence: blend('confidence', confidence),
      socialConnectedness: blend('socialConnectedness', socialConnectedness),
      purposeAlignment: blend('purposeAlignment', purposeAlignment)
    });
  }

  return traitStateToAvatarTraitInputFromScores({
    vitality, resilience, emotionalStability, discipline,
    confidence, socialConnectedness, purposeAlignment
  });
}

function traitStateToAvatarTraitInputFromScores(scores) {
  const { vitality, resilience, emotionalStability, discipline, confidence, socialConnectedness, purposeAlignment } = scores;

  const activityProxy = traitToMetricScale((vitality * 0.6 + discipline * 0.4));
  const nutritionProxy = traitToMetricScale((vitality * 0.4 + discipline * 0.3 + resilience * 0.3));
  const sleepProxy = traitToMetricScale((resilience * 0.4 + emotionalStability * 0.4 + vitality * 0.2));
  const stressProxy = traitToStressScale((emotionalStability * 0.5 + resilience * 0.3 + socialConnectedness * 0.2));
  const disciplineProxy = traitToMetricScale((discipline * 0.6 + confidence * 0.2 + purposeAlignment * 0.2));

  const wellnessProxy = clamp(
    (vitality * 0.25 + resilience * 0.15 + emotionalStability * 0.2 + discipline * 0.15 + confidence * 0.1 + socialConnectedness * 0.05 + purposeAlignment * 0.1),
    0, 100
  );

  return {
    dailyMetrics: {
      activity: activityProxy,
      nutrition: nutritionProxy,
      sleep: sleepProxy,
      stress: stressProxy
    },
    wellnessScore: wellnessProxy,
    disciplineScore: disciplineProxy,
    activityScore: activityProxy,
    nutritionScore: nutritionProxy,
    sleepScore: sleepProxy,
    stressScore: stressProxy
  };
}

export function computeITECurrentAdapter(rawMetrics, historyData, baselineData, lifeZones, habits) {
  const metrics = buildRawMetrics(rawMetrics, lifeZones, habits);

  if (!canRunITE(historyData, baselineData)) {
    return { available: false, iteResult: null, adapted: null };
  }

  const iteResult = runIdentityTrajectoryEngine(metrics, historyData, baselineData);
  const adapted = traitStateToAvatarTraitInput(iteResult.traits, iteResult.visualDelta);

  return { available: true, iteResult, adapted };
}

export function computeITEFutureAdapter(rawMetrics, historyData, baselineData, lifeZones, habits, horizon) {
  const metrics = buildRawMetrics(rawMetrics, lifeZones, habits);

  if (!canRunITE(historyData, baselineData)) {
    return { available: false, iteResult: null, adapted: null };
  }

  const iteResult = runIdentityTrajectoryEngine(metrics, historyData, baselineData);

  const projections = horizon === '5year' ? iteResult.projection5Year : iteResult.projection12Month;
  const adapted = projectedStateToAvatarTraitInput(
    iteResult.traits, projections, iteResult.visualDelta, horizon || '90day'
  );

  return { available: true, iteResult, adapted };
}

export { canRunITE };
