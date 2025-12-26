import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const OPERATING_STYLES = {
  recoverySensitive: {
    id: 'recoverySensitive',
    name: 'Recovery Sensitive',
    description: 'Your metrics tend to improve after periods of rest or reduced activity.',
    patterns: ['sleepRecovery', 'stressStability', 'restoreAfterDip'],
    explanation: 'This observation is based on patterns showing your wellness metrics respond positively to sleep improvements and stress reduction over multiple days.'
  },
  stressReactive: {
    id: 'stressReactive',
    name: 'Stress Reactive',
    description: 'Your metrics show the most variation following changes in stress levels.',
    patterns: ['stressStability', 'stressSleepLink', 'emotionalVolatility'],
    explanation: 'This observation is based on patterns showing your other metrics fluctuate most noticeably when stress levels change.'
  },
  consistencyResponder: {
    id: 'consistencyResponder',
    name: 'Consistency Responder',
    description: 'Your performance tends to improve with sustained, regular logging.',
    patterns: ['consistencyDecay', 'focusStability', 'momentum'],
    explanation: 'This observation is based on patterns showing your metrics stabilize and improve when you log consistently over time.'
  },
  movementBuffered: {
    id: 'movementBuffered',
    name: 'Movement Buffered',
    description: 'Physical activity appears to protect your other metrics during difficult periods.',
    patterns: ['movementBuffer', 'exerciseRecovery', 'activityMood'],
    explanation: 'This observation is based on patterns showing movement helps maintain stability in sleep, stress, and mood even when other factors fluctuate.'
  },
  nutritionAnchored: {
    id: 'nutritionAnchored',
    name: 'Nutrition Anchored',
    description: 'Your energy and mood metrics correlate closely with nutrition patterns.',
    patterns: ['nutritionEnergy', 'mealMood', 'dietStability'],
    explanation: 'This observation is based on patterns showing your energy and emotional metrics respond noticeably to changes in nutrition quality.'
  },
  sociallyRegulated: {
    id: 'sociallyRegulated',
    name: 'Socially Regulated',
    description: 'Your emotional metrics tend to stabilize with consistent social connection.',
    patterns: ['socialEmotional', 'connectionMood', 'isolationDip'],
    explanation: 'This observation is based on patterns showing your emotional wellness correlates with periods of social engagement.'
  },
  momentumDriven: {
    id: 'momentumDriven',
    name: 'Momentum Driven',
    description: 'Multiple metrics improve together when you maintain forward progress.',
    patterns: ['momentum', 'multiMetricCorrelation', 'upwardTrend'],
    explanation: 'This observation is based on patterns showing your metrics tend to rise or fall together, suggesting interconnected progress.'
  },
  equilibriumSeeker: {
    id: 'equilibriumSeeker',
    name: 'Equilibrium Seeker',
    description: 'Your metrics naturally return to stable levels after disruptions.',
    patterns: ['focusStability', 'baselineReturn', 'selfCorrection'],
    explanation: 'This observation is based on patterns showing your metrics tend to self-correct and return to baseline after temporary changes.'
  }
};

const CONFIDENCE_THRESHOLD = 0.7;
const MIN_PATTERNS_REQUIRED = 2;
const MIN_DATA_DAYS = 14;

export async function deriveOperatingStyle(userId) {
  try {
    const metricsRef = doc(db, 'users', userId, 'metrics', 'patternHistory');
    const validationRef = doc(db, 'users', userId, 'metrics', 'patternValidation');
    
    const [metricsSnap, validationSnap] = await Promise.all([
      getDoc(metricsRef),
      getDoc(validationRef)
    ]);

    if (!metricsSnap.exists()) {
      return { style: null, reason: 'insufficient_data' };
    }

    const metricsData = metricsSnap.data();
    const validationData = validationSnap.exists() ? validationSnap.data() : {};
    
    const surfacedPatterns = metricsData.surfacedPatterns || [];
    const trustScores = validationData.trustScores || {};
    
    if (surfacedPatterns.length < MIN_PATTERNS_REQUIRED) {
      return { style: null, reason: 'insufficient_patterns' };
    }

    const dataDays = calculateDataDays(metricsData);
    if (dataDays < MIN_DATA_DAYS) {
      return { style: null, reason: 'insufficient_history' };
    }

    const patternCounts = {};
    const patternConfidences = {};
    
    surfacedPatterns.forEach(p => {
      const type = p.type || p.patternType;
      patternCounts[type] = (patternCounts[type] || 0) + 1;
      
      if (p.confidence) {
        if (!patternConfidences[type]) {
          patternConfidences[type] = [];
        }
        patternConfidences[type].push(p.confidence);
      }
    });

    const styleScores = [];
    
    for (const [styleId, styleConfig] of Object.entries(OPERATING_STYLES)) {
      const matchingPatterns = styleConfig.patterns.filter(p => patternCounts[p] > 0);
      
      if (matchingPatterns.length >= MIN_PATTERNS_REQUIRED) {
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        matchingPatterns.forEach(patternType => {
          const confidences = patternConfidences[patternType] || [];
          if (confidences.length > 0) {
            totalConfidence += confidences.reduce((a, b) => a + b, 0) / confidences.length;
            confidenceCount++;
          }
          
          const trust = trustScores[patternType];
          if (trust && trust.total > 0) {
            const trustBonus = calculateTrustBonus(trust);
            totalConfidence += trustBonus;
            confidenceCount++;
          }
        });

        const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
        const patternCoverage = matchingPatterns.length / styleConfig.patterns.length;
        const finalScore = (avgConfidence * 0.7) + (patternCoverage * 0.3);

        if (finalScore >= CONFIDENCE_THRESHOLD) {
          styleScores.push({
            styleId,
            score: finalScore,
            matchingPatterns,
            patternCoverage
          });
        }
      }
    }

    if (styleScores.length === 0) {
      return { style: null, reason: 'no_confident_style' };
    }

    styleScores.sort((a, b) => b.score - a.score);
    const topStyle = styleScores[0];
    const styleConfig = OPERATING_STYLES[topStyle.styleId];

    return {
      style: {
        id: styleConfig.id,
        name: styleConfig.name,
        description: styleConfig.description,
        explanation: styleConfig.explanation,
        confidence: topStyle.score,
        matchingPatterns: topStyle.matchingPatterns,
        derivedAt: Date.now()
      },
      alternateStyles: styleScores.slice(1, 3).map(s => ({
        id: s.styleId,
        name: OPERATING_STYLES[s.styleId].name,
        confidence: s.score
      })),
      reason: 'derived'
    };
  } catch (error) {
    console.error('Error deriving operating style:', error);
    return { style: null, reason: 'error' };
  }
}

function calculateDataDays(metricsData) {
  const firstLog = metricsData.firstLogDate;
  if (!firstLog) return 0;
  
  const now = Date.now();
  const firstDate = typeof firstLog === 'number' ? firstLog : firstLog.toMillis?.() || Date.now();
  return Math.floor((now - firstDate) / (24 * 60 * 60 * 1000));
}

function calculateTrustBonus(trust) {
  const expansionRate = trust.total > 0 ? trust.expansions / trust.total : 0;
  const dismissalRate = trust.total > 0 ? trust.dismissals / trust.total : 0;
  const returnRate = trust.total > 0 ? trust.returns / trust.total : 0;
  
  let bonus = 0.5;
  bonus += expansionRate * 0.2;
  bonus -= dismissalRate * 0.1;
  bonus += returnRate * 0.2;
  
  return Math.max(0, Math.min(1, bonus));
}

export function getOperatingStyleById(styleId) {
  return OPERATING_STYLES[styleId] || null;
}

export function getAllOperatingStyles() {
  return Object.values(OPERATING_STYLES);
}
