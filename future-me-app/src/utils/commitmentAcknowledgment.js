import { isCommitmentActive, getCommitmentProgress } from './commitmentIntentSystem';

const ACKNOWLEDGMENT_TEMPLATES = [
  "You're seeing changes consistent with what you chose to focus on.",
  "The data shows movement in the direction you set.",
  "What you're tracking aligns with your stated focus.",
  "There's consistency between your focus and recent observations."
];

const MIN_DAYS_FOR_ACKNOWLEDGMENT = 3;
const MAX_ACKNOWLEDGMENTS_PER_COMMITMENT = 3;

export function shouldShowAcknowledgment(commitment, userMetrics, acknowledgmentCount = 0) {
  if (!commitment || !isCommitmentActive(commitment)) {
    return false;
  }

  if (acknowledgmentCount >= MAX_ACKNOWLEDGMENTS_PER_COMMITMENT) {
    return false;
  }

  const progress = getCommitmentProgress(commitment);
  if (!progress || progress.daysElapsed < MIN_DAYS_FOR_ACKNOWLEDGMENT) {
    return false;
  }

  const hasRelevantProgress = checkProgressAlignment(commitment, userMetrics);
  
  return hasRelevantProgress;
}

function checkProgressAlignment(commitment, userMetrics) {
  if (!userMetrics || !commitment.scenarioId) {
    return false;
  }

  const scenarioMetricMap = {
    balanced: ['wellnessScore'],
    recovery: ['sleepQuality', 'stressLevel'],
    active: ['physicalActivity', 'consistency'],
    structured: ['consistency'],
    stress: ['stressLevel', 'sleepQuality']
  };

  const relevantMetrics = scenarioMetricMap[commitment.scenarioId] || [];
  
  if (relevantMetrics.length === 0) {
    return false;
  }

  let improvementCount = 0;
  
  for (const metric of relevantMetrics) {
    const current = userMetrics[metric]?.current;
    const baseline = userMetrics[metric]?.baseline;
    
    if (current === undefined || baseline === undefined) {
      continue;
    }

    const isStressMetric = metric === 'stressLevel';
    const improved = isStressMetric 
      ? current < baseline 
      : current > baseline;

    if (improved) {
      improvementCount++;
    }
  }

  return improvementCount > 0;
}

export function generateAcknowledgmentText(commitment, seed = Date.now()) {
  if (!commitment) {
    return null;
  }

  const index = seed % ACKNOWLEDGMENT_TEMPLATES.length;
  return ACKNOWLEDGMENT_TEMPLATES[index];
}

export function createAcknowledgmentCard(commitment, userMetrics) {
  if (!shouldShowAcknowledgment(commitment, userMetrics)) {
    return null;
  }

  const text = generateAcknowledgmentText(commitment);
  
  return {
    id: `ack_${commitment.id}_${Date.now()}`,
    type: 'commitment_acknowledgment',
    content: text,
    focusType: commitment.focusType,
    timestamp: new Date().toISOString(),
    isObservational: true,
    isNotCongratulatory: true,
    noStreaks: true,
    noBadges: true
  };
}

export function getCommitmentContextForAvatar(commitment) {
  if (!commitment || !isCommitmentActive(commitment)) {
    return null;
  }

  return {
    focusType: commitment.focusType,
    scenarioId: commitment.scenarioId,
    daysElapsed: getCommitmentProgress(commitment)?.daysElapsed || 0,
    isContextOnly: true,
    doesNotAffectVisuals: true,
    doesNotAffectConfidence: true,
    doesNotAffectBaselines: true
  };
}
