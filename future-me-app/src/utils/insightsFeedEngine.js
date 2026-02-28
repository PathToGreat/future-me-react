import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function normalizeInsight({ type, category, headline, supporting, whyThisMatters, tryThis, date, metric }) {
  const id = `${type}-${date || new Date().toISOString().split('T')[0]}-${hashContent(headline)}`;
  return {
    id,
    type,
    category: category || mapTypeToCategory(type),
    headline,
    supporting,
    whyThisMatters: whyThisMatters || null,
    tryThis: tryThis || null,
    date: date || new Date().toISOString().split('T')[0],
    read: false,
    metric: metric || null,
    createdAt: new Date().toISOString()
  };
}

function mapTypeToCategory(type) {
  if (['pattern', 'multi_metric_correlation', 'stress_stability', 'sleep_recovery'].includes(type)) return 'pattern';
  if (['observation', 'change', 'baseline_shift'].includes(type)) return 'change';
  return 'reflection';
}

function hashContent(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).substr(0, 8);
}

export async function saveInsight(userId, insight) {
  if (!userId || !insight) return;
  try {
    const ref = doc(db, 'users', userId, 'insightsFeed', insight.id);
    const existing = await getDoc(ref);
    if (existing.exists()) return false;
    await setDoc(ref, insight);
    return true;
  } catch (error) {
    return false;
  }
}

export async function saveInsightsBatch(userId, insights) {
  if (!userId || !insights || insights.length === 0) return;
  let saved = 0;
  for (const insight of insights) {
    const result = await saveInsight(userId, insight);
    if (result) saved++;
  }
  return saved;
}

export async function markInsightRead(userId, insightId) {
  if (!userId || !insightId) return;
  try {
    const ref = doc(db, 'users', userId, 'insightsFeed', insightId);
    await updateDoc(ref, { read: true });
  } catch (error) {}
}

export async function loadRecentInsights(userId, dayLimit = 30) {
  if (!userId) return [];
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dayLimit);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    const colRef = collection(db, 'users', userId, 'insightsFeed');
    const q = query(colRef, where('date', '>=', cutoff), orderBy('date', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    return [];
  }
}

export function countUnreadRecent(insights, withinDays = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return insights.filter(i => !i.read && i.date >= cutoffStr).length;
}

export function isDuplicateInsight(existingInsights, newInsight) {
  return existingInsights.some(existing =>
    existing.headline === newInsight.headline &&
    existing.date === newInsight.date
  );
}

export function generateInsightsFromSources({ patterns, observations, dailyInsight, focusArea, explanationMap }) {
  const today = new Date().toISOString().split('T')[0];
  const insights = [];

  if (patterns && patterns.length > 0) {
    for (const pattern of patterns.slice(0, 3)) {
      const explanation = explanationMap?.pattern?.[pattern.type] || {};
      insights.push(normalizeInsight({
        type: 'pattern',
        category: 'pattern',
        headline: pattern.message,
        supporting: `Based on ${pattern.data?.days || 7}+ days of your logged data.`,
        whyThisMatters: explanation.why || null,
        tryThis: explanation.tryThis || null,
        date: today,
        metric: pattern.data?.metric || null
      }));
    }
  }

  if (observations && observations.length > 0) {
    for (const obs of observations.slice(0, 3)) {
      const explanation = explanationMap?.observation?.[obs.id] || {};
      insights.push(normalizeInsight({
        type: 'observation',
        category: 'change',
        headline: obs.headline,
        supporting: obs.supporting,
        whyThisMatters: explanation.why || null,
        tryThis: explanation.tryThis || null,
        date: today,
        metric: obs.metric || null
      }));
    }
  }

  if (dailyInsight) {
    const explanation = explanationMap?.insight?.[dailyInsight.category] || {};
    insights.push(normalizeInsight({
      type: 'daily',
      category: 'reflection',
      headline: dailyInsight.title,
      supporting: dailyInsight.message,
      whyThisMatters: explanation.why || null,
      tryThis: explanation.tryThis || null,
      date: today,
      metric: dailyInsight.category || null
    }));
  }

  if (focusArea) {
    const explanation = explanationMap?.focus?.[focusArea] || {};
    insights.push(normalizeInsight({
      type: 'focus',
      category: 'reflection',
      headline: `Current focus area: ${focusArea}.`,
      supporting: 'Based on the gap between your recent averages and your baseline.',
      whyThisMatters: explanation.why || null,
      tryThis: explanation.tryThis || null,
      date: today,
      metric: focusArea
    }));
  }

  return insights;
}
