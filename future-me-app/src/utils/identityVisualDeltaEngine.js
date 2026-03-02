import { getTraitIds } from './identityTraits';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function scoreToDelta(current, projected, scale = 0.1) {
  const diff = projected - current;
  const normalized = diff / 100;
  return clamp(normalized * scale * 2, -scale, scale);
}

export function computeVisualDelta(traitState, projections12Month) {
  const traits = traitState || {};
  const proj = projections12Month || {};

  const vitality = traits.vitality;
  const resilience = traits.resilience;
  const emotionalStability = traits.emotionalStability;
  const discipline = traits.discipline;
  const confidence = traits.confidence;
  const socialConnectedness = traits.socialConnectedness;
  const purposeAlignment = traits.purposeAlignment;

  const vitalityDelta = vitality ? scoreToDelta(vitality.currentScore, proj.vitality ?? vitality.currentScore) : 0;
  const resilienceDelta = resilience ? scoreToDelta(resilience.currentScore, proj.resilience ?? resilience.currentScore) : 0;
  const emotionalDelta = emotionalStability ? scoreToDelta(emotionalStability.currentScore, proj.emotionalStability ?? emotionalStability.currentScore) : 0;
  const disciplineDelta = discipline ? scoreToDelta(discipline.currentScore, proj.discipline ?? discipline.currentScore) : 0;
  const confidenceDelta = confidence ? scoreToDelta(confidence.currentScore, proj.confidence ?? confidence.currentScore) : 0;
  const socialDelta = socialConnectedness ? scoreToDelta(socialConnectedness.currentScore, proj.socialConnectedness ?? socialConnectedness.currentScore) : 0;
  const purposeDelta = purposeAlignment ? scoreToDelta(purposeAlignment.currentScore, proj.purposeAlignment ?? purposeAlignment.currentScore) : 0;

  const postureAngle = clamp(
    (resilienceDelta * 0.4) + (disciplineDelta * 0.3) + (confidenceDelta * 0.3),
    -0.1, 0.1
  );

  const shoulderAlignment = clamp(
    (confidenceDelta * 0.4) + (resilienceDelta * 0.3) + (vitalityDelta * 0.3),
    -0.1, 0.1
  );

  const jawTension = clamp(
    (emotionalDelta * -0.5) + (resilienceDelta * -0.3) + (socialDelta * -0.2),
    -0.1, 0.1
  );

  const facialBrightness = clamp(
    (vitalityDelta * 0.3) + (emotionalDelta * 0.3) + (purposeDelta * 0.2) + (socialDelta * 0.2),
    -0.1, 0.1
  );

  const eyeOpenness = clamp(
    (vitalityDelta * 0.3) + (emotionalDelta * 0.3) + (confidenceDelta * 0.2) + (purposeDelta * 0.2),
    -0.1, 0.1
  );

  const energyIntensity = clamp(
    (vitalityDelta * 0.4) + (disciplineDelta * 0.3) + (resilienceDelta * 0.3),
    -0.1, 0.1
  );

  const stanceWidth = clamp(
    (confidenceDelta * 0.4) + (resilienceDelta * 0.3) + (disciplineDelta * 0.3),
    -0.1, 0.1
  );

  return {
    postureAngle,
    shoulderAlignment,
    jawTension,
    facialBrightness,
    eyeOpenness,
    energyIntensity,
    stanceWidth,
    _meta: {
      basedOn: '12month_projection',
      traitDeltas: {
        vitality: vitalityDelta,
        resilience: resilienceDelta,
        emotionalStability: emotionalDelta,
        discipline: disciplineDelta,
        confidence: confidenceDelta,
        socialConnectedness: socialDelta,
        purposeAlignment: purposeDelta
      }
    }
  };
}
