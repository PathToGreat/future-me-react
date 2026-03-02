import { getTraitIds, getTraitMeta } from './identityTraits';

function classifyScore(score) {
  if (score >= 75) return 'high';
  if (score >= 55) return 'moderate';
  if (score >= 35) return 'low';
  return 'very_low';
}

function classifyShift(current, projected) {
  const diff = projected - current;
  if (diff > 10) return 'significant_gain';
  if (diff > 3) return 'gradual_gain';
  if (diff < -10) return 'significant_decline';
  if (diff < -3) return 'gradual_decline';
  return 'stable';
}

function getTopTraits(traitState, count, sortFn) {
  const entries = Object.entries(traitState)
    .filter(([_, t]) => t && t.currentScore != null)
    .sort(([, a], [, b]) => sortFn(a, b));
  return entries.slice(0, count).map(([id, t]) => ({ id, ...t }));
}

function getMovingTraits(traitState) {
  return Object.entries(traitState)
    .filter(([_, t]) => t && Math.abs(t.velocity) > 1.5)
    .sort(([, a], [, b]) => Math.abs(b.velocity) - Math.abs(a.velocity))
    .map(([id, t]) => ({ id, ...t }));
}

const TRAIT_NARRATIVE_FRAGMENTS = {
  vitality: {
    high: 'Physical energy capacity is well-established.',
    moderate: 'Physical energy is functional but has room to develop.',
    low: 'Physical energy reserves are limited.',
    rising: 'Your body is responding to increased demand — energy capacity is expanding.',
    falling: 'Physical recovery patterns are showing reduced output.',
    stable: 'Energy levels are holding steady.'
  },
  resilience: {
    high: 'Stress absorption capacity is strong.',
    moderate: 'Recovery patterns are developing.',
    low: 'Stress recovery is narrow.',
    rising: 'Your nervous system is showing improved recovery speed.',
    falling: 'Stress tolerance is compressing.',
    stable: 'Resilience patterns are consistent.'
  },
  emotionalStability: {
    high: 'Emotional regulation is consistent.',
    moderate: 'Emotional patterns are stabilizing.',
    low: 'Emotional variability is elevated.',
    rising: 'Emotional reactivity is trending downward.',
    falling: 'Emotional fluctuation is increasing.',
    stable: 'Emotional regulation is unchanged.'
  },
  discipline: {
    high: 'Behavioral reliability is well-established.',
    moderate: 'You are building behavioral reliability.',
    low: 'Behavioral follow-through is developing.',
    rising: 'Consistency patterns are strengthening.',
    falling: 'Follow-through frequency is decreasing.',
    stable: 'Discipline levels are holding.'
  },
  confidence: {
    high: 'Self-trust is reinforced by consistent action.',
    moderate: 'Confidence is accumulating from measurable progress.',
    low: 'Self-trust is still forming.',
    rising: 'Confidence is building from accumulated evidence of follow-through.',
    falling: 'Self-trust metrics are softening.',
    stable: 'Confidence levels are steady.'
  },
  socialConnectedness: {
    high: 'Social engagement patterns are deep and consistent.',
    moderate: 'Social connections are active.',
    low: 'Social engagement is minimal.',
    rising: 'Interpersonal engagement frequency is increasing.',
    falling: 'Social engagement patterns are contracting.',
    stable: 'Social connection levels are unchanged.'
  },
  purposeAlignment: {
    high: 'Daily actions are closely aligned with stated values.',
    moderate: 'Value alignment is developing.',
    low: 'Gap between actions and stated values is wide.',
    rising: 'Alignment between daily behavior and core values is tightening.',
    falling: 'Action-value alignment is loosening.',
    stable: 'Purpose alignment is holding.'
  }
};

function getTraitFragment(traitId, type) {
  return TRAIT_NARRATIVE_FRAGMENTS[traitId]?.[type] || '';
}

function getTrend(trait) {
  if (trait.velocity > 1.5) return 'rising';
  if (trait.velocity < -1.5) return 'falling';
  return 'stable';
}

export function generateIdentityNarrative(traitState, projections12Month, projections5Year) {
  const currentSummary = generateCurrentSummary(traitState);
  const projection12Summary = generate12MonthSummary(traitState, projections12Month);
  const projection5Summary = generate5YearSummary(traitState, projections5Year);

  return {
    currentSummary,
    projection12MonthSummary: projection12Summary,
    projection5YearSummary: projection5Summary,
    timestamp: new Date().toISOString()
  };
}

function generateCurrentSummary(traitState) {
  const strongest = getTopTraits(traitState, 2, (a, b) => b.currentScore - a.currentScore);
  const moving = getMovingTraits(traitState);

  const parts = [];

  if (strongest.length > 0) {
    const top = strongest[0];
    const meta = getTraitMeta(top.id);
    const level = classifyScore(top.currentScore);
    parts.push(getTraitFragment(top.id, level));
  }

  if (moving.length > 0) {
    const topMover = moving[0];
    const trend = getTrend(topMover);
    const fragment = getTraitFragment(topMover.id, trend);
    if (fragment && !parts.includes(fragment)) {
      parts.push(fragment);
    }
  }

  if (parts.length === 0) {
    parts.push('Your identity metrics are holding within a stable range.');
  }

  return parts.join(' ');
}

function generate12MonthSummary(traitState, projections) {
  if (!projections) return 'Insufficient data for 12-month projection.';

  const shifts = [];
  for (const traitId of getTraitIds()) {
    const current = traitState[traitId]?.currentScore ?? 50;
    const projected = projections[traitId] ?? current;
    const shift = classifyShift(current, projected);
    if (shift !== 'stable') {
      shifts.push({ traitId, current, projected, shift });
    }
  }

  if (shifts.length === 0) {
    return 'At current pace, your identity traits are projected to remain within their current range over the next 12 months.';
  }

  shifts.sort((a, b) => Math.abs(b.projected - b.current) - Math.abs(a.projected - a.current));
  const topShift = shifts[0];
  const meta = getTraitMeta(topShift.traitId);
  const direction = topShift.shift.includes('gain') ? 'strengthening' : 'softening';

  let narrative = `Over the next 12 months, ${meta.label.toLowerCase()} is projected to continue ${direction}.`;

  if (shifts.length > 1) {
    const secondMeta = getTraitMeta(shifts[1].traitId);
    const secondDir = shifts[1].shift.includes('gain') ? 'gains' : 'shifts';
    narrative += ` ${secondMeta.label} also shows projected ${secondDir}.`;
  }

  return narrative;
}

function generate5YearSummary(traitState, projections) {
  if (!projections) return 'Insufficient data for 5-year projection.';

  const traitIds = getTraitIds();
  let totalCurrent = 0;
  let totalProjected = 0;
  const majorShifts = [];

  for (const traitId of traitIds) {
    const current = traitState[traitId]?.currentScore ?? 50;
    const projected = projections[traitId] ?? current;
    totalCurrent += current;
    totalProjected += projected;

    const diff = projected - current;
    if (Math.abs(diff) > 5) {
      majorShifts.push({ traitId, diff, projected });
    }
  }

  const avgCurrent = totalCurrent / traitIds.length;
  const avgProjected = totalProjected / traitIds.length;
  const overallShift = avgProjected - avgCurrent;

  if (Math.abs(overallShift) < 2 && majorShifts.length === 0) {
    return 'Five-year projections suggest identity trait stability at current levels. Sustained changes in daily patterns would shift this trajectory.';
  }

  const overallDirection = overallShift > 0 ? 'upward' : 'downward';
  let narrative = `Five-year projections indicate a gradual ${overallDirection} trajectory across identity traits.`;

  if (majorShifts.length > 0) {
    majorShifts.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const top = majorShifts[0];
    const meta = getTraitMeta(top.traitId);
    const dir = top.diff > 0 ? 'the most significant projected growth' : 'the most notable projected shift';
    narrative += ` ${meta.label} shows ${dir}.`;
  }

  narrative += ' These projections assume continuation of current behavioral patterns.';

  return narrative;
}
