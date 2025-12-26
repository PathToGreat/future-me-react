import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function trackStyleSurfaced(userId, styleId, confidence) {
  if (!userId || !styleId) return false;
  
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const metricsSnap = await getDoc(metricsRef);

    const entry = {
      styleId,
      confidence,
      surfacedAt: Date.now()
    };

    if (metricsSnap.exists()) {
      await updateDoc(metricsRef, {
        surfacedStyles: arrayUnion(entry),
        lastSurfaced: Date.now(),
        totalSurfaced: (metricsSnap.data().totalSurfaced || 0) + 1
      });
    } else {
      await setDoc(metricsRef, {
        surfacedStyles: [entry],
        expandedStyles: [],
        reflections: [],
        milestones: [],
        totalSurfaced: 1,
        totalExpanded: 0,
        totalReflections: 0,
        lastSurfaced: Date.now(),
        createdAt: Date.now()
      });
    }

    console.log('📊 Operating style surfaced:', styleId);
    return true;
  } catch (error) {
    console.error('Error tracking style surfaced:', error);
    return false;
  }
}

export async function trackStyleExpanded(userId, styleId) {
  if (!userId || !styleId) return false;
  
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const metricsSnap = await getDoc(metricsRef);

    const entry = {
      styleId,
      expandedAt: Date.now()
    };

    if (metricsSnap.exists()) {
      await updateDoc(metricsRef, {
        expandedStyles: arrayUnion(entry),
        lastExpanded: Date.now(),
        totalExpanded: (metricsSnap.data().totalExpanded || 0) + 1
      });
    } else {
      await setDoc(metricsRef, {
        surfacedStyles: [],
        expandedStyles: [entry],
        reflections: [],
        milestones: [],
        totalSurfaced: 0,
        totalExpanded: 1,
        totalReflections: 0,
        lastExpanded: Date.now(),
        createdAt: Date.now()
      });
    }

    console.log('📊 Operating style expanded:', styleId);
    return true;
  } catch (error) {
    console.error('Error tracking style expanded:', error);
    return false;
  }
}

export async function trackStyleReflection(userId, styleId, response) {
  if (!userId || !styleId) return false;
  
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const metricsSnap = await getDoc(metricsRef);

    const entry = {
      styleId,
      response,
      timestamp: Date.now()
    };

    if (metricsSnap.exists()) {
      await updateDoc(metricsRef, {
        reflections: arrayUnion(entry),
        lastReflection: Date.now(),
        totalReflections: (metricsSnap.data().totalReflections || 0) + 1
      });
    } else {
      await setDoc(metricsRef, {
        surfacedStyles: [],
        expandedStyles: [],
        reflections: [entry],
        milestones: [],
        totalSurfaced: 0,
        totalExpanded: 0,
        totalReflections: 1,
        lastReflection: Date.now(),
        createdAt: Date.now()
      });
    }

    console.log('📊 Operating style reflection:', styleId, response);
    return true;
  } catch (error) {
    console.error('Error tracking style reflection:', error);
    return false;
  }
}

export async function trackStyleMilestone(userId, styleId, milestoneName) {
  if (!userId || !styleId || !milestoneName) return false;
  
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const metricsSnap = await getDoc(metricsRef);

    const entry = {
      styleId,
      milestone: milestoneName,
      achievedAt: Date.now()
    };

    if (metricsSnap.exists()) {
      const existingMilestones = metricsSnap.data().milestones || [];
      const alreadyAchieved = existingMilestones.some(
        m => m.styleId === styleId && m.milestone === milestoneName
      );

      if (!alreadyAchieved) {
        await updateDoc(metricsRef, {
          milestones: arrayUnion(entry)
        });
        console.log('📊 Operating style milestone:', styleId, milestoneName);
      }
    } else {
      await setDoc(metricsRef, {
        surfacedStyles: [],
        expandedStyles: [],
        reflections: [],
        milestones: [entry],
        totalSurfaced: 0,
        totalExpanded: 0,
        totalReflections: 0,
        createdAt: Date.now()
      });
      console.log('📊 Operating style milestone:', styleId, milestoneName);
    }

    return true;
  } catch (error) {
    console.error('Error tracking style milestone:', error);
    return false;
  }
}

export async function getOperatingStyleMetrics(userId) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'operatingStyle');
    const metricsSnap = await getDoc(metricsRef);

    if (!metricsSnap.exists()) {
      return {
        totalSurfaced: 0,
        totalExpanded: 0,
        totalReflections: 0,
        expansionRate: 0,
        reflectionPositiveRate: 0,
        milestonesReached: 0,
        stylesIdentified: []
      };
    }

    const data = metricsSnap.data();
    const surfaced = data.surfacedStyles || [];
    const expanded = data.expandedStyles || [];
    const reflections = data.reflections || [];
    const milestones = data.milestones || [];

    const uniqueStyles = [...new Set(surfaced.map(s => s.styleId))];
    const positiveReflections = reflections.filter(r => r.response === 'yes').length;

    return {
      totalSurfaced: data.totalSurfaced || surfaced.length,
      totalExpanded: data.totalExpanded || expanded.length,
      totalReflections: data.totalReflections || reflections.length,
      expansionRate: surfaced.length > 0 ? expanded.length / surfaced.length : 0,
      reflectionPositiveRate: reflections.length > 0 ? positiveReflections / reflections.length : 0,
      milestonesReached: milestones.length,
      stylesIdentified: uniqueStyles
    };
  } catch (error) {
    console.error('Error getting operating style metrics:', error);
    return null;
  }
}
