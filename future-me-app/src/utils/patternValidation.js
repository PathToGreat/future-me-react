import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function trackSilenceSession(userId) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    const entry = {
      timestamp: Date.now(),
      type: 'silence',
      returned: false
    };

    if (validationSnap.exists()) {
      await updateDoc(validationRef, {
        silenceSessions: arrayUnion(entry),
        totalSilenceSessions: increment(1),
        lastSilenceSession: Date.now()
      });
    } else {
      await setDoc(validationRef, {
        silenceSessions: [entry],
        patternSessions: [],
        totalSilenceSessions: 1,
        totalPatternSessions: 0,
        silenceReturns: 0,
        patternReturns: 0,
        trustScores: {},
        reflectionResponses: [],
        createdAt: new Date().toISOString()
      });
    }

    console.log('📊 Silence session tracked');
    return true;
  } catch (error) {
    console.error('Error tracking silence session:', error);
    return false;
  }
}

export async function trackPatternSession(userId, patternType) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    const entry = {
      timestamp: Date.now(),
      type: 'pattern',
      patternType,
      expanded: false,
      dismissed: false,
      dismissedImmediately: false,
      returnedWithin48h: false
    };

    if (validationSnap.exists()) {
      await updateDoc(validationRef, {
        patternSessions: arrayUnion(entry),
        totalPatternSessions: increment(1),
        lastPatternSession: Date.now()
      });
    } else {
      await setDoc(validationRef, {
        silenceSessions: [],
        patternSessions: [entry],
        totalSilenceSessions: 0,
        totalPatternSessions: 1,
        silenceReturns: 0,
        patternReturns: 0,
        trustScores: {},
        reflectionResponses: [],
        createdAt: new Date().toISOString()
      });
    }

    console.log('📊 Pattern session tracked:', patternType);
    return true;
  } catch (error) {
    console.error('Error tracking pattern session:', error);
    return false;
  }
}

export async function trackPatternExpanded(userId, patternType) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    if (validationSnap.exists()) {
      const data = validationSnap.data();
      const sessions = data.patternSessions || [];
      
      const updatedSessions = sessions.map(s => {
        if (s.patternType === patternType && !s.expanded && 
            Date.now() - s.timestamp < 24 * 60 * 60 * 1000) {
          return { ...s, expanded: true, expandedAt: Date.now() };
        }
        return s;
      });

      const trustScores = data.trustScores || {};
      if (!trustScores[patternType]) {
        trustScores[patternType] = { expansions: 0, dismissals: 0, immediateDismissals: 0, returns: 0, total: 0 };
      }
      trustScores[patternType].expansions = (trustScores[patternType].expansions || 0) + 1;
      trustScores[patternType].total = (trustScores[patternType].total || 0) + 1;

      await updateDoc(validationRef, {
        patternSessions: updatedSessions,
        trustScores,
        lastExpansion: Date.now()
      });

      console.log('📊 Pattern expansion tracked:', patternType);
    }
    return true;
  } catch (error) {
    console.error('Error tracking pattern expansion:', error);
    return false;
  }
}

export async function trackPatternDismissedWithTiming(userId, patternType, displayDurationMs) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    const isImmediate = displayDurationMs < 3000;
    
    if (validationSnap.exists()) {
      const data = validationSnap.data();
      const sessions = data.patternSessions || [];
      
      const updatedSessions = sessions.map(s => {
        if (s.patternType === patternType && !s.dismissed && 
            Date.now() - s.timestamp < 24 * 60 * 60 * 1000) {
          return { 
            ...s, 
            dismissed: true, 
            dismissedAt: Date.now(),
            dismissedImmediately: isImmediate,
            displayDurationMs 
          };
        }
        return s;
      });

      const trustScores = data.trustScores || {};
      if (!trustScores[patternType]) {
        trustScores[patternType] = { expansions: 0, dismissals: 0, immediateDismissals: 0, returns: 0, total: 0 };
      }
      trustScores[patternType].dismissals = (trustScores[patternType].dismissals || 0) + 1;
      if (isImmediate) {
        trustScores[patternType].immediateDismissals = (trustScores[patternType].immediateDismissals || 0) + 1;
      }

      await updateDoc(validationRef, {
        patternSessions: updatedSessions,
        trustScores,
        lastDismissal: Date.now()
      });

      console.log('📊 Pattern dismissal tracked:', patternType, isImmediate ? '(immediate)' : '');
    }
    return true;
  } catch (error) {
    console.error('Error tracking pattern dismissal:', error);
    return false;
  }
}

export async function trackSessionReturn(userId) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    if (validationSnap.exists()) {
      const data = validationSnap.data();
      const now = Date.now();
      const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);
      
      const silenceSessions = data.silenceSessions || [];
      const patternSessions = data.patternSessions || [];
      const trustScores = { ...(data.trustScores || {}) };
      
      let silenceReturnCount = 0;
      let patternReturnCount = 0;
      
      const updatedSilence = silenceSessions.map(s => {
        if (!s.returned && s.timestamp > fortyEightHoursAgo && s.timestamp < now - (60 * 60 * 1000)) {
          silenceReturnCount++;
          return { ...s, returned: true, returnedAt: now };
        }
        return s;
      });
      
      const updatedPatterns = patternSessions.map(s => {
        if (!s.returnedWithin48h && s.timestamp > fortyEightHoursAgo && s.timestamp < now - (60 * 60 * 1000)) {
          patternReturnCount++;
          
          if (s.patternType && trustScores[s.patternType]) {
            trustScores[s.patternType] = {
              ...trustScores[s.patternType],
              returns: (trustScores[s.patternType].returns || 0) + 1
            };
          }
          
          return { ...s, returnedWithin48h: true, returnedAt: now };
        }
        return s;
      });

      await updateDoc(validationRef, {
        silenceSessions: updatedSilence,
        patternSessions: updatedPatterns,
        trustScores,
        silenceReturns: (data.silenceReturns || 0) + silenceReturnCount,
        patternReturns: (data.patternReturns || 0) + patternReturnCount,
        lastReturn: now
      });

      if (silenceReturnCount > 0 || patternReturnCount > 0) {
        console.log('📊 Session return tracked - Silence:', silenceReturnCount, 'Pattern:', patternReturnCount);
      }
    }
    return true;
  } catch (error) {
    console.error('Error tracking session return:', error);
    return false;
  }
}

export async function trackReflectionResponse(userId, patternType, response) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    const entry = {
      patternType,
      response,
      timestamp: Date.now()
    };

    if (validationSnap.exists()) {
      await updateDoc(validationRef, {
        reflectionResponses: arrayUnion(entry),
        lastReflection: Date.now()
      });
    } else {
      await setDoc(validationRef, {
        silenceSessions: [],
        patternSessions: [],
        totalSilenceSessions: 0,
        totalPatternSessions: 0,
        silenceReturns: 0,
        patternReturns: 0,
        trustScores: {},
        reflectionResponses: [entry],
        createdAt: new Date().toISOString()
      });
    }

    console.log('📊 Reflection response tracked:', patternType, response);
    return true;
  } catch (error) {
    console.error('Error tracking reflection response:', error);
    return false;
  }
}

export async function getValidationMetrics(userId) {
  try {
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    const validationSnap = await getDoc(validationRef);
    
    if (validationSnap.exists()) {
      const data = validationSnap.data();
      
      const silenceReturnRate = data.totalSilenceSessions > 0 
        ? Math.round((data.silenceReturns / data.totalSilenceSessions) * 100) 
        : 0;
      const patternReturnRate = data.totalPatternSessions > 0 
        ? Math.round((data.patternReturns / data.totalPatternSessions) * 100) 
        : 0;

      const trustScores = data.trustScores || {};
      const patternAnalysis = Object.entries(trustScores).map(([type, scores]) => {
        const total = scores.total || 1;
        const expansionRate = Math.round((scores.expansions / total) * 100);
        const dismissalRate = Math.round((scores.dismissals / total) * 100);
        const immediateDismissalRate = Math.round((scores.immediateDismissals / total) * 100);
        const returnRate = Math.round((scores.returns / total) * 100);
        
        const trustScore = Math.round(
          (expansionRate * 0.3) + 
          (returnRate * 0.4) + 
          ((100 - dismissalRate) * 0.2) + 
          ((100 - immediateDismissalRate) * 0.1)
        );

        return {
          type,
          expansionRate,
          dismissalRate,
          immediateDismissalRate,
          returnRate,
          trustScore,
          needsLanguageReview: dismissalRate > 40 && expansionRate < 10
        };
      });

      const topExpanded = [...patternAnalysis]
        .sort((a, b) => b.expansionRate - a.expansionRate)
        .slice(0, 5);
      const mostDismissed = [...patternAnalysis]
        .sort((a, b) => b.dismissalRate - a.dismissalRate)
        .slice(0, 3);

      const reflectionResponses = data.reflectionResponses || [];
      const yesResponses = reflectionResponses.filter(r => r.response === 'yes').length;
      const notQuiteResponses = reflectionResponses.filter(r => r.response === 'not_quite').length;

      return {
        totalSilenceSessions: data.totalSilenceSessions || 0,
        totalPatternSessions: data.totalPatternSessions || 0,
        silenceReturns: data.silenceReturns || 0,
        patternReturns: data.patternReturns || 0,
        silenceReturnRate,
        patternReturnRate,
        silenceVsPatternRetention: silenceReturnRate >= patternReturnRate ? 'silence_equal_or_better' : 'patterns_better',
        patternAnalysis,
        topExpanded,
        mostDismissed,
        patternsNeedingReview: patternAnalysis.filter(p => p.needsLanguageReview),
        reflectionSummary: {
          total: reflectionResponses.length,
          yes: yesResponses,
          notQuite: notQuiteResponses,
          positiveRate: reflectionResponses.length > 0 
            ? Math.round((yesResponses / reflectionResponses.length) * 100) 
            : 0
        }
      };
    }
    
    return {
      totalSilenceSessions: 0,
      totalPatternSessions: 0,
      silenceReturns: 0,
      patternReturns: 0,
      silenceReturnRate: 0,
      patternReturnRate: 0,
      silenceVsPatternRetention: 'no_data',
      patternAnalysis: [],
      topExpanded: [],
      mostDismissed: [],
      patternsNeedingReview: [],
      reflectionSummary: { total: 0, yes: 0, notQuite: 0, positiveRate: 0 }
    };
  } catch (error) {
    console.error('Error getting validation metrics:', error);
    return null;
  }
}
