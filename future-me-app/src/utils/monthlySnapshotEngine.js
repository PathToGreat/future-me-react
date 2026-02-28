import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateAvatarTraits } from './avatarTraitEngine';

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getLogsForMonth(historyData, monthKey) {
  if (!historyData || historyData.length === 0) return [];
  return historyData.filter(d => d.date && d.date.startsWith(monthKey));
}

function computeAvatarSnapshot(dayLog, lifeZones, habits, achievements) {
  const activity = dayLog.activity || 3;
  const nutrition = dayLog.nutrition || 3;
  const sleep = dayLog.sleep || 3;
  const stress = dayLog.stress || 3;
  const lifestyleScore = dayLog.lifestyleScore || 50;

  const habitStreaks = (habits || []).map(h => h.streak || 0);
  const lifeZoneScores = {};
  if (lifeZones) {
    Object.entries(lifeZones).forEach(([key, value]) => {
      lifeZoneScores[key] = value?.score || 50;
    });
  }

  const traits = calculateAvatarTraits({
    dailyMetrics: { activity, nutrition, sleep, stress },
    wellnessScore: lifestyleScore,
    lifeZones: lifeZoneScores,
    habitStreaks,
    achievements: achievements || []
  });

  return {
    metrics: { activity, nutrition, sleep, stress },
    lifestyleScore,
    posture: traits.posture?.score || 50,
    expression: traits.facialExpression?.score || 50,
    energy: traits.glowEnergy?.score || 50,
    bodyShape: traits.bodyShape?.score || 50
  };
}

function computeTopShift(monthLogs, baseline) {
  if (!monthLogs || monthLogs.length < 5) return null;

  const avg = (arr, key) => {
    const vals = arr.map(d => d[key]).filter(v => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const metrics = [
    { key: 'sleep', label: 'Sleep consistency', higherBetter: true },
    { key: 'activity', label: 'Activity level', higherBetter: true },
    { key: 'nutrition', label: 'Nutrition consistency', higherBetter: true },
    { key: 'stress', label: 'Stress baseline', higherBetter: false }
  ];

  let bestShift = null;
  let bestMagnitude = 0;

  for (const metric of metrics) {
    const monthAvg = avg(monthLogs, metric.key);
    const baselineVal = baseline?.[metric.key];
    if (monthAvg === null || baselineVal == null) continue;

    let delta = monthAvg - baselineVal;
    if (!metric.higherBetter) delta = -delta;

    if (delta > bestMagnitude) {
      bestMagnitude = delta;
      bestShift = {
        metric: metric.key,
        label: metric.label,
        direction: 'improved',
        magnitude: delta
      };
    }
  }

  if (bestShift && bestMagnitude > 0.2) {
    return bestShift;
  }

  const totalDelta = metrics.reduce((sum, m) => {
    const monthAvg = avg(monthLogs, m.key);
    const baselineVal = baseline?.[m.key];
    if (monthAvg === null || baselineVal == null) return sum;
    let d = monthAvg - baselineVal;
    if (!m.higherBetter) d = -d;
    return sum + d;
  }, 0);

  if (totalDelta < -0.3) {
    return { metric: null, label: null, direction: 'softened', magnitude: Math.abs(totalDelta) };
  }

  return { metric: null, label: null, direction: 'steady', magnitude: 0 };
}

function computeZoneSummary(lifeZones) {
  if (!lifeZones || Object.keys(lifeZones).length === 0) {
    return { strongest: null, sensitive: null };
  }

  const ZONE_LABELS = {
    health: 'Health',
    socialEmotional: 'Social Emotional',
    wealth: 'Wealth',
    faith: 'Faith',
    family: 'Family',
    community: 'Community'
  };

  const scored = Object.entries(lifeZones)
    .filter(([, val]) => val && typeof val.score === 'number' && val.score > 0)
    .map(([key, val]) => ({ key, score: val.score, label: ZONE_LABELS[key] || key }));

  if (scored.length === 0) return { strongest: null, sensitive: null };

  scored.sort((a, b) => b.score - a.score);

  const strongest = scored[0];
  const sensitive = scored.length > 1 ? scored[scored.length - 1] : null;

  if (sensitive && sensitive.score >= strongest.score - 5) {
    return { strongest, sensitive: null };
  }

  return { strongest, sensitive };
}

function generateSummary(topShift, zoneSummary, direction) {
  const parts = [];

  if (topShift) {
    if (topShift.direction === 'improved' && topShift.label) {
      parts.push(`${topShift.label} became more consistent this month.`);
    } else if (topShift.direction === 'softened') {
      parts.push('Some patterns softened compared to baseline this month.');
    } else {
      parts.push('Your patterns stayed steady this month.');
    }
  } else {
    parts.push('Your patterns stayed steady this month.');
  }

  if (zoneSummary.strongest) {
    parts.push(`${zoneSummary.strongest.label} remained your most stable zone.`);
  }

  return parts.join(' ');
}

export function generateMonthlySnapshot(historyData, liveProfile, habits, achievements, monthKey) {
  const targetMonth = monthKey || getMonthKey(new Date());
  const monthLogs = getLogsForMonth(historyData, targetMonth);

  if (monthLogs.length < 7) {
    return { available: false, monthKey: targetMonth, label: getMonthLabel(targetMonth), logsNeeded: 7 - monthLogs.length };
  }

  const sorted = [...monthLogs].sort((a, b) => a.date.localeCompare(b.date));
  const firstLog = sorted[0];
  const lastLog = sorted[sorted.length - 1];

  const baseline = liveProfile?.onboardingBaseline || {};

  const startAvatar = computeAvatarSnapshot(firstLog, liveProfile?.lifeZones, habits, achievements);
  const endAvatar = computeAvatarSnapshot(lastLog, liveProfile?.lifeZones, habits, achievements);

  const topShift = computeTopShift(monthLogs, baseline);
  const zoneSummary = computeZoneSummary(liveProfile?.lifeZones);

  const avg = (arr, key) => {
    const vals = arr.map(d => d[key]).filter(v => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const monthAvgSleep = avg(monthLogs, 'sleep');
  const monthAvgStress = avg(monthLogs, 'stress');
  const monthAvgActivity = avg(monthLogs, 'activity');
  const baselineSleep = baseline?.sleep;
  const baselineStress = baseline?.stress;
  const baselineActivity = baseline?.activity;

  let direction = 'steady';
  let directionDelta = 0;
  const deltas = [];
  if (monthAvgSleep != null && baselineSleep != null) deltas.push(monthAvgSleep - baselineSleep);
  if (monthAvgStress != null && baselineStress != null) deltas.push(-(monthAvgStress - baselineStress));
  if (monthAvgActivity != null && baselineActivity != null) deltas.push(monthAvgActivity - baselineActivity);
  if (deltas.length > 0) {
    directionDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (directionDelta >= 0.3) direction = 'strengthening';
    else if (directionDelta <= -0.3) direction = 'declining';
  }

  const summary = generateSummary(topShift, zoneSummary, direction);

  return {
    available: true,
    monthKey: targetMonth,
    label: getMonthLabel(targetMonth),
    totalLogs: monthLogs.length,
    startAvatar,
    endAvatar,
    topShift,
    zoneSummary,
    direction,
    summary,
    generatedAt: new Date().toISOString()
  };
}

export async function saveSnapshot(userId, snapshot) {
  if (!userId || !snapshot || !snapshot.available) return;
  try {
    const ref = doc(db, 'users', userId, 'monthlySnapshots', snapshot.monthKey);
    await setDoc(ref, snapshot);
  } catch (error) {
    console.log('Monthly snapshot save failed:', error.message);
  }
}

export async function loadSnapshot(userId, monthKey) {
  if (!userId || !monthKey) return null;
  try {
    const ref = doc(db, 'users', userId, 'monthlySnapshots', monthKey);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    return null;
  }
}

export async function loadAllSnapshotKeys(userId) {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'monthlySnapshots');
    const q = query(colRef, orderBy('monthKey', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ monthKey: d.id, label: d.data().label, totalLogs: d.data().totalLogs }));
  } catch (error) {
    return [];
  }
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date());
}
