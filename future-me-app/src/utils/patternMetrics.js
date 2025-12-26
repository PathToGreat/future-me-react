import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function trackPatternSurfaced(userId, patternType, patternData) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patterns');
    const metricsSnap = await getDoc(metricsRef);
    
    const entry = {
      type: patternType,
      timestamp: Date.now(),
      confidence: patternData.confidence,
      dismissed: false,
      revisited: false,
      returnedAfter: false
    };

    if (metricsSnap.exists()) {
      await updateDoc(metricsRef, {
        surfaced: arrayUnion(entry),
        totalSurfaced: (metricsSnap.data().totalSurfaced || 0) + 1,
        lastSurfaced: Date.now()
      });
    } else {
      await setDoc(metricsRef, {
        surfaced: [entry],
        totalSurfaced: 1,
        totalDismissed: 0,
        totalRevisited: 0,
        returnsAfterPattern: 0,
        lastSurfaced: Date.now(),
        createdAt: new Date().toISOString()
      });
    }

    console.log('📊 Pattern surfaced tracked:', patternType);
    return true;
  } catch (error) {
    console.error('Error tracking pattern surfaced:', error);
    return false;
  }
}

export async function trackPatternDismissed(userId, patternType) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patterns');
    const metricsSnap = await getDoc(metricsRef);
    
    if (metricsSnap.exists()) {
      const data = metricsSnap.data();
      const surfaced = data.surfaced || [];
      
      const updatedSurfaced = surfaced.map(p => {
        if (p.type === patternType && !p.dismissed) {
          return { ...p, dismissed: true, dismissedAt: Date.now() };
        }
        return p;
      });

      await updateDoc(metricsRef, {
        surfaced: updatedSurfaced,
        totalDismissed: (data.totalDismissed || 0) + 1,
        lastDismissed: Date.now()
      });

      console.log('📊 Pattern dismissed tracked:', patternType);
    }
    return true;
  } catch (error) {
    console.error('Error tracking pattern dismissed:', error);
    return false;
  }
}

export async function trackPatternRevisited(userId, patternType) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patterns');
    const metricsSnap = await getDoc(metricsRef);
    
    if (metricsSnap.exists()) {
      const data = metricsSnap.data();
      const surfaced = data.surfaced || [];
      
      const updatedSurfaced = surfaced.map(p => {
        if (p.type === patternType && p.dismissed && !p.revisited) {
          return { ...p, revisited: true, revisitedAt: Date.now() };
        }
        return p;
      });

      await updateDoc(metricsRef, {
        surfaced: updatedSurfaced,
        totalRevisited: (data.totalRevisited || 0) + 1,
        lastRevisited: Date.now()
      });

      console.log('📊 Pattern revisited tracked:', patternType);
    }
    return true;
  } catch (error) {
    console.error('Error tracking pattern revisited:', error);
    return false;
  }
}

export async function trackReturnAfterPattern(userId) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patterns');
    const metricsSnap = await getDoc(metricsRef);
    
    if (metricsSnap.exists()) {
      const data = metricsSnap.data();
      const lastSurfaced = data.lastSurfaced;
      
      if (lastSurfaced) {
        const hoursSince = (Date.now() - lastSurfaced) / (1000 * 60 * 60);
        
        if (hoursSince >= 1 && hoursSince <= 48) {
          await updateDoc(metricsRef, {
            returnsAfterPattern: (data.returnsAfterPattern || 0) + 1,
            lastReturn: Date.now()
          });
          console.log('📊 Return after pattern tracked');
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error tracking return after pattern:', error);
    return false;
  }
}

export async function getPatternMetrics(userId) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patterns');
    const metricsSnap = await getDoc(metricsRef);
    
    if (metricsSnap.exists()) {
      const data = metricsSnap.data();
      
      const surfacedRate = data.totalSurfaced || 0;
      const dismissRate = data.totalSurfaced > 0 
        ? (data.totalDismissed / data.totalSurfaced) * 100 
        : 0;
      const revisitRate = data.totalDismissed > 0 
        ? (data.totalRevisited / data.totalDismissed) * 100 
        : 0;
      const returnRate = data.totalSurfaced > 0 
        ? (data.returnsAfterPattern / data.totalSurfaced) * 100 
        : 0;

      return {
        totalSurfaced: data.totalSurfaced || 0,
        totalDismissed: data.totalDismissed || 0,
        totalRevisited: data.totalRevisited || 0,
        returnsAfterPattern: data.returnsAfterPattern || 0,
        surfacedRate,
        dismissRate: Math.round(dismissRate),
        revisitRate: Math.round(revisitRate),
        returnRate: Math.round(returnRate),
        lastSurfaced: data.lastSurfaced,
        surfaced: data.surfaced || []
      };
    }
    
    return {
      totalSurfaced: 0,
      totalDismissed: 0,
      totalRevisited: 0,
      returnsAfterPattern: 0,
      surfacedRate: 0,
      dismissRate: 0,
      revisitRate: 0,
      returnRate: 0,
      surfaced: []
    };
  } catch (error) {
    console.error('Error getting pattern metrics:', error);
    return null;
  }
}

export async function getLastShownPatterns(userId) {
  try {
    const metrics = await getPatternMetrics(userId);
    if (!metrics) return [];
    
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return (metrics.surfaced || []).filter(p => p.timestamp > oneWeekAgo);
  } catch (error) {
    console.error('Error getting last shown patterns:', error);
    return [];
  }
}
