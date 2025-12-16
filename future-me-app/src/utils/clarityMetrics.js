import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function initializeClarityMetrics(userId) {
  if (!userId) return;

  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'clarity');
    const metricsSnap = await getDoc(metricsRef);

    if (!metricsSnap.exists()) {
      await setDoc(metricsRef, {
        whatThisMeansExpanded: 0,
        whatChangedViewed: 0,
        progressSnapshotViewed: 0,
        progressSnapshotShared: 0,
        returnAfterExplanation: 0,
        lastExpanded: null,
        lastWhatChangedView: null,
        lastSnapshotView: null,
        createdAt: new Date().toISOString()
      });
      console.log('📊 Clarity metrics initialized');
    }
  } catch (error) {
    console.error('Error initializing clarity metrics:', error);
  }
}

export async function trackClarityEvent(userId, eventType) {
  if (!userId) return;

  const validEvents = [
    'whatThisMeansExpanded',
    'whatChangedViewed',
    'progressSnapshotViewed',
    'progressSnapshotShared',
    'returnAfterExplanation'
  ];

  if (!validEvents.includes(eventType)) {
    console.warn('Invalid clarity event type:', eventType);
    return;
  }

  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'clarity');
    await updateDoc(metricsRef, {
      [eventType]: increment(1),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    try {
      await initializeClarityMetrics(userId);
      const metricsRef = doc(db, 'users', userId, 'metrics', 'clarity');
      await updateDoc(metricsRef, {
        [eventType]: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } catch (retryError) {
      console.error('Error tracking clarity event:', retryError);
    }
  }
}

export async function getClarityConfidenceScore(userId) {
  if (!userId) return null;

  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'clarity');
    const metricsSnap = await getDoc(metricsRef);

    if (!metricsSnap.exists()) {
      return {
        whatThisMeansExpandedRate: 0,
        snapshotEngagementRate: 0,
        returnAfterExplanationRate: 0,
        overallClarityScore: 0
      };
    }

    const data = metricsSnap.data();

    const totalInteractions = (data.whatThisMeansExpanded || 0) +
      (data.whatChangedViewed || 0) +
      (data.progressSnapshotViewed || 0);

    const whatThisMeansExpandedRate = data.whatThisMeansExpanded || 0;
    const snapshotEngagementRate = ((data.progressSnapshotViewed || 0) + (data.whatChangedViewed || 0));
    const returnAfterExplanationRate = data.returnAfterExplanation || 0;

    const overallClarityScore = Math.min(100, Math.round(
      (whatThisMeansExpandedRate * 0.3) +
      (snapshotEngagementRate * 0.4) +
      (returnAfterExplanationRate * 0.3)
    ));

    return {
      whatThisMeansExpandedRate,
      snapshotEngagementRate,
      returnAfterExplanationRate,
      overallClarityScore,
      totalInteractions,
      raw: data
    };
  } catch (error) {
    console.error('Error getting clarity confidence score:', error);
    return null;
  }
}

export async function getFounderClarityMetrics() {
  return {
    description: 'Clarity Confidence Score - Internal Founder Metrics',
    metrics: [
      {
        name: 'whatThisMeansExpandRate',
        description: 'How often users expand "What This Means" panel'
      },
      {
        name: 'snapshotViewRate',
        description: 'How often ProgressSnapshot is viewed or shared'
      },
      {
        name: 'returnAfterExplanation',
        description: 'Whether users return after viewing an explanation'
      }
    ],
    purpose: 'Measures whether clarity increases retention without pushing behavior'
  };
}
