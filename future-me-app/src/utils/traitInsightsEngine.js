import { getTraitMeta, getTraitIds } from './identityTraits';
import { getActionsForTrait } from './actionTraitMappingTable';
import { computeActionTraitImpact } from './traitImpactEngine';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function velocityLabel(magnitude) {
  if (magnitude === 'strong') return 'notably';
  if (magnitude === 'moderate') return 'gradually';
  return 'slightly';
}

function traitLabel(traitId) {
  const meta = getTraitMeta(traitId);
  return meta ? meta.label : traitId;
}

function confidenceFromData(historyData, velocityMagnitude) {
  const historyScore = clamp((historyData?.length || 0) / 14, 0, 1);
  const magnitudeScore = velocityMagnitude === 'strong' ? 1.0 : velocityMagnitude === 'moderate' ? 0.7 : 0.4;
  return clamp(historyScore * 0.6 + magnitudeScore * 0.4, 0, 1);
}

function getMovingTraits(iteResult, direction) {
  const { traits, velocity } = iteResult;
  return getTraitIds()
    .filter(id => velocity[id]?.direction === direction && velocity[id]?.magnitude !== 'low')
    .map(id => ({
      id,
      label: traitLabel(id),
      currentScore: traits[id]?.currentScore ?? 50,
      velocity: velocity[id]?.raw ?? 0,
      magnitude: velocity[id]?.magnitude ?? 'low',
      direction: velocity[id]?.direction ?? 'neutral'
    }))
    .sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity));
}

function getStrongestTraits(iteResult, count) {
  const { traits } = iteResult;
  return getTraitIds()
    .map(id => ({ id, label: traitLabel(id), score: traits[id]?.currentScore ?? 50 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function getWeakestTraits(iteResult, count) {
  const { traits } = iteResult;
  return getTraitIds()
    .map(id => ({ id, label: traitLabel(id), score: traits[id]?.currentScore ?? 50 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

function getProjectionShifts(iteResult) {
  const { traits, projection12Month } = iteResult;
  return getTraitIds()
    .map(id => ({
      id,
      label: traitLabel(id),
      current: traits[id]?.currentScore ?? 50,
      projected: projection12Month[id] ?? 50,
      diff: (projection12Month[id] ?? 50) - (traits[id]?.currentScore ?? 50)
    }))
    .filter(t => Math.abs(t.diff) > 2)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

const TRAIT_METRIC_CONTEXT = {
  vitality: ['activity', 'sleep'],
  resilience: ['stress', 'sleep'],
  emotionalStability: ['stress'],
  discipline: ['consistency', 'habits'],
  confidence: ['activity', 'consistency'],
  socialConnectedness: ['socialEmotional'],
  purposeAlignment: ['faith']
};

function metricContext(traitId) {
  const metrics = TRAIT_METRIC_CONTEXT[traitId];
  if (!metrics || metrics.length === 0) return '';
  const readable = metrics.map(m => {
    const labels = { activity: 'movement', sleep: 'sleep quality', stress: 'stress levels', consistency: 'daily consistency', habits: 'habit follow-through', socialEmotional: 'social engagement', faith: 'faith practices' };
    return labels[m] || m;
  });
  return readable.join(' and ');
}

function enrichTryThis(baseTryThis, traitId, currentTraitState) {
  const actions = getActionsForTrait(traitId);
  if (!actions || actions.length === 0) return { tryThis: baseTryThis, actionKey: null, consequence: null };
  const topAction = actions[0];
  const impact = computeActionTraitImpact(topAction.actionKey, currentTraitState);
  if (!impact) return { tryThis: baseTryThis, actionKey: null, consequence: null };
  return {
    tryThis: baseTryThis,
    actionKey: topAction.actionKey,
    consequence: impact.consequenceLine
  };
}

function generatePatternInsights(iteResult, historyData) {
  const insights = [];
  const rising = getMovingTraits(iteResult, 'positive');
  const falling = getMovingTraits(iteResult, 'negative');

  if (rising.length >= 2) {
    const top2 = rising.slice(0, 2);
    const conf = confidenceFromData(historyData, top2[0].magnitude);
    const enriched = enrichTryThis(
      `Maintain the routines contributing to ${metricContext(top2[0].id)} — these appear to be driving the shift.`,
      top2[0].id, iteResult.traits
    );
    insights.push({
      type: 'pattern',
      category: 'pattern',
      icon: '📈',
      label: 'Pattern Detected',
      headline: `${top2[0].label} and ${top2[1].label} are strengthening in parallel.`,
      supporting: `Your recent data shows both traits trending upward. This suggests a systemic shift rather than isolated improvement.`,
      whyThisMatters: `When multiple identity traits move together, it indicates that underlying behavioral patterns are reinforcing each other. Continued consistency will compound this effect.`,
      tryThis: enriched.tryThis,
      actionKey: enriched.actionKey,
      consequence: enriched.consequence,
      implicatedTraits: top2.map(t => t.id),
      confidence: conf
    });
  }

  if (rising.length === 1 && rising[0].magnitude === 'strong') {
    const t = rising[0];
    const conf = confidenceFromData(historyData, t.magnitude);
    insights.push({
      type: 'pattern',
      category: 'pattern',
      icon: '📈',
      label: 'Pattern Detected',
      headline: `${t.label} is ${velocityLabel(t.magnitude)} strengthening.`,
      supporting: `Your ${metricContext(t.id)} patterns are producing a measurable upward shift in this trait.`,
      whyThisMatters: `${traitLabel(t.id)} reflects ${getTraitMeta(t.id)?.description?.toLowerCase() || 'a core behavioral pattern'}. Sustained movement here reshapes how your system operates day to day.`,
      tryThis: null,
      implicatedTraits: [t.id],
      confidence: conf
    });
  }

  if (falling.length >= 1) {
    const t = falling[0];
    const conf = confidenceFromData(historyData, t.magnitude);
    if (t.magnitude !== 'low') {
      const baseTryThis = rising.length > 0 ? `The patterns driving ${rising[0].label} may also benefit ${t.label} if applied consistently.` : null;
      const enriched = enrichTryThis(baseTryThis, t.id, iteResult.traits);
      insights.push({
        type: 'pattern',
        category: 'pattern',
        icon: '📊',
        label: 'Pattern Detected',
        headline: `${t.label} is showing a downward trend.`,
        supporting: `Recent ${metricContext(t.id)} data is pulling this trait lower compared to your baseline.`,
        whyThisMatters: `This does not indicate failure. It indicates that current patterns are producing a different trajectory than earlier. The data is reflecting what is happening, not judging it.`,
        tryThis: enriched.tryThis,
        actionKey: enriched.actionKey,
        consequence: enriched.consequence,
        implicatedTraits: [t.id],
        confidence: conf
      });
    }
  }

  return insights;
}

function generateObservedChangeInsights(iteResult, historyData, baselineData) {
  const insights = [];
  const { traits } = iteResult;

  for (const traitId of getTraitIds()) {
    const trait = traits[traitId];
    if (!trait) continue;
    const baselineDiff = trait.currentScore - trait.baselineScore;
    if (Math.abs(baselineDiff) < 5) continue;

    const direction = baselineDiff > 0 ? 'above' : 'below';
    const shift = baselineDiff > 0 ? 'strengthened' : 'shifted lower';
    const conf = confidenceFromData(historyData, Math.abs(baselineDiff) > 10 ? 'strong' : 'moderate');

    insights.push({
      type: 'observation',
      category: 'change',
      icon: '📊',
      label: 'Observed Change',
      headline: `${traitLabel(traitId)} has ${shift} compared to your starting point.`,
      supporting: `Current ${traitLabel(traitId).toLowerCase()} is ${Math.abs(Math.round(baselineDiff))} points ${direction} your baseline. This reflects changes in ${metricContext(traitId)}.`,
      whyThisMatters: `Baseline shifts indicate that your daily patterns have produced a measurable structural change, not just a temporary fluctuation.`,
      tryThis: null,
      implicatedTraits: [traitId],
      confidence: conf
    });
  }

  insights.sort((a, b) => b.confidence - a.confidence);
  return insights.slice(0, 2);
}

function generateDailyInsight(iteResult, historyData) {
  const strongest = getStrongestTraits(iteResult, 1)[0];
  const weakest = getWeakestTraits(iteResult, 1)[0];
  const shifts = getProjectionShifts(iteResult);

  if (!strongest) return null;

  if (shifts.length > 0 && shifts[0].diff > 3) {
    const s = shifts[0];
    return {
      type: 'daily',
      category: 'reflection',
      icon: '➡️',
      label: 'Today',
      headline: `${s.label} is on a trajectory to strengthen over the coming months.`,
      supporting: `If current patterns hold, ${s.label.toLowerCase()} is projected to shift upward. This is based on your recent velocity and behavioral consistency.`,
      whyThisMatters: `Trajectory matters more than any single day. Your data shows a direction, and that direction shapes who you are becoming.`,
      tryThis: null,
      implicatedTraits: [s.id],
      confidence: confidenceFromData(historyData, 'moderate')
    };
  }

  if (strongest.score >= 65) {
    return {
      type: 'daily',
      category: 'reflection',
      icon: '📊',
      label: 'Today',
      headline: `${strongest.label} is currently your most established trait.`,
      supporting: `At ${Math.round(strongest.score)} points, this trait reflects consistent behavioral patterns in ${metricContext(strongest.id)}.`,
      whyThisMatters: `Strong traits act as anchors. They stabilize other areas even when those areas fluctuate.`,
      tryThis: null,
      implicatedTraits: [strongest.id],
      confidence: confidenceFromData(historyData, 'moderate')
    };
  }

  return {
    type: 'daily',
    category: 'reflection',
    icon: '📊',
    label: 'Today',
    headline: 'Your identity traits are within a developing range.',
    supporting: 'No single trait dominates yet. Continued tracking will reveal which areas respond most to your routines.',
    whyThisMatters: 'Early-stage data creates the foundation for trajectory detection. The picture will clarify as more days are logged.',
    tryThis: null,
    implicatedTraits: [],
    confidence: confidenceFromData(historyData, 'low')
  };
}

function generateFocusInsight(iteResult) {
  const weakest = getWeakestTraits(iteResult, 1)[0];
  const falling = getMovingTraits(iteResult, 'negative');
  const focusTrait = falling.length > 0 ? falling[0] : weakest;

  if (!focusTrait || focusTrait.score > 60) return null;

  const enriched = enrichTryThis(
    `Prioritize consistency in ${metricContext(focusTrait.id)} over intensity.`,
    focusTrait.id, iteResult.traits
  );

  return {
    type: 'focus',
    category: 'reflection',
    icon: '🎯',
    label: 'Current Focus',
    headline: `${focusTrait.label} would benefit most from consistent attention.`,
    supporting: `This trait is currently at ${Math.round(focusTrait.score || focusTrait.currentScore)} points. Small improvements in ${metricContext(focusTrait.id)} would produce the most visible trajectory shift here.`,
    whyThisMatters: `Focusing effort where the gap is widest produces the most measurable change per unit of effort.`,
    tryThis: enriched.tryThis,
    actionKey: enriched.actionKey,
    consequence: enriched.consequence,
    implicatedTraits: [focusTrait.id],
    confidence: 0.6
  };
}

export function generateTraitInsights(iteResult, historyData, baselineData) {
  if (!iteResult || !iteResult.traits) return { available: false, insights: [] };

  const patterns = generatePatternInsights(iteResult, historyData);
  const changes = generateObservedChangeInsights(iteResult, historyData, baselineData);
  const daily = generateDailyInsight(iteResult, historyData);
  const focus = generateFocusInsight(iteResult);

  const all = [...patterns, ...changes];
  if (daily) all.push(daily);
  if (focus) all.push(focus);

  return {
    available: true,
    insights: all,
    patterns,
    changes,
    daily,
    focus,
    narrative: iteResult.narrative || null
  };
}

export function selectBestTraitReflection(traitInsightResult) {
  if (!traitInsightResult || !traitInsightResult.available) return null;

  const { patterns, changes, daily, focus } = traitInsightResult;

  if (patterns && patterns.length > 0) return patterns[0];
  if (changes && changes.length > 0) return changes[0];
  if (daily) return daily;
  if (focus) return focus;

  return null;
}
