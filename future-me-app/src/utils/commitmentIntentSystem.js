const COMMITMENT_DURATION_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' }
];

const SCENARIO_TO_FOCUS_TYPE = {
  balanced: 'Balanced wellness across areas',
  recovery: 'Rest and recovery focus',
  active: 'Consistent movement and activity',
  structured: 'Routine and consistency',
  stress: 'Stress reduction and calm',
  custom: 'Personal focus area'
};

export function createCommitmentIntent(scenarioId, durationDays, userId) {
  if (!scenarioId || !durationDays || !userId) {
    return null;
  }

  const validDuration = COMMITMENT_DURATION_OPTIONS.find(opt => opt.days === durationDays);
  if (!validDuration) {
    return null;
  }

  const focusType = SCENARIO_TO_FOCUS_TYPE[scenarioId] || SCENARIO_TO_FOCUS_TYPE.custom;

  return {
    id: `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    scenarioId,
    focusType,
    durationDays,
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isIntentOnly: true,
    noEnforcement: true,
    noPenalties: true,
    noRewards: true
  };
}

export function isCommitmentActive(commitment) {
  if (!commitment || commitment.status !== 'active') {
    return false;
  }

  const now = new Date();
  const endsAt = new Date(commitment.endsAt);
  
  return now < endsAt;
}

export function getCommitmentDaysRemaining(commitment) {
  if (!isCommitmentActive(commitment)) {
    return 0;
  }

  const now = new Date();
  const endsAt = new Date(commitment.endsAt);
  const msRemaining = endsAt - now;
  
  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
}

export function getCommitmentProgress(commitment) {
  if (!commitment) {
    return null;
  }

  const startedAt = new Date(commitment.startedAt);
  const endsAt = new Date(commitment.endsAt);
  const now = new Date();

  const totalDuration = endsAt - startedAt;
  const elapsed = Math.min(now - startedAt, totalDuration);
  
  return {
    daysElapsed: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
    totalDays: commitment.durationDays,
    percentComplete: Math.min(100, Math.round((elapsed / totalDuration) * 100))
  };
}

export function dismissCommitment(commitment, reason = 'user_dismissed') {
  if (!commitment) {
    return null;
  }

  return {
    ...commitment,
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
    dismissReason: reason
  };
}

export function completeCommitment(commitment) {
  if (!commitment) {
    return null;
  }

  return {
    ...commitment,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
}

export function getCommitmentContextLabel(commitment) {
  if (!commitment || !isCommitmentActive(commitment)) {
    return null;
  }

  return commitment.focusType;
}

export function shouldAutoComplete(commitment) {
  if (!commitment || commitment.status !== 'active') {
    return false;
  }

  const now = new Date();
  const endsAt = new Date(commitment.endsAt);
  
  return now >= endsAt;
}

export { COMMITMENT_DURATION_OPTIONS, SCENARIO_TO_FOCUS_TYPE };
