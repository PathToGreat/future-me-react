import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { calculateAvatarTraits } from '../utils/avatarTraitEngine';
import { computeAvatarEffects } from './avatar/AvatarEffectsEngine';
import { computeZoneInfluences, applyZoneInfluencesToEffects } from '../utils/zoneInfluenceEngine';
import { computeITECurrentAdapter } from '../utils/iteAvatarAdapter';

function hasRecentLogs(historyData) {
  if (!historyData || historyData.length === 0) return false;
  const lastLogDate = new Date(historyData[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastLogDate.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today - lastLogDate) / (1000 * 60 * 60 * 24));
  return daysSince <= 7;
}

function getSubtitle(historyData) {
  if (!historyData || historyData.length === 0) {
    return 'Log once to begin shaping your visual baseline.';
  }
  if (!hasRecentLogs(historyData)) {
    return 'Resume logging to update your reflection.';
  }
  const days = Math.min(historyData.length, 30);
  return `Based on your last ${days} day${days === 1 ? '' : 's'}.`;
}

export default function MiniAvatarPreview({ onNavigateToAvatar }) {
  const { liveProfile, habits, achievements, historyData, selectedGender } = useApp();

  const activity = liveProfile?.activity || 3;
  const nutrition = liveProfile?.nutrition || 3;
  const sleep = liveProfile?.sleep || 3;
  const stress = liveProfile?.stress || 3;
  const lifestyleScore = liveProfile?.lifestyleScore || 50;
  const lifeZones = liveProfile?.lifeZones;

  const habitStreaks = useMemo(() => (habits || []).map(h => h.streak || 0), [habits]);

  const lifeZoneScores = useMemo(() => {
    if (!lifeZones) return {};
    const scores = {};
    Object.entries(lifeZones).forEach(([key, value]) => {
      scores[key] = value?.score || 50;
    });
    return scores;
  }, [lifeZones]);

  const iteAdapter = useMemo(() => {
    return computeITECurrentAdapter(
      { activity, nutrition, sleep, stress },
      historyData,
      liveProfile?.baselineData || liveProfile?.onboardingBaseline || null,
      lifeZoneScores,
      habits
    );
  }, [activity, nutrition, sleep, stress, historyData, liveProfile?.baselineData, liveProfile?.onboardingBaseline, lifeZoneScores, habits]);

  const effectiveMetrics = useMemo(() => {
    if (iteAdapter.available && iteAdapter.adapted) return iteAdapter.adapted;
    return null;
  }, [iteAdapter]);

  const avatarTraits = useMemo(() => {
    if (effectiveMetrics) {
      return calculateAvatarTraits({
        dailyMetrics: effectiveMetrics.dailyMetrics,
        wellnessScore: effectiveMetrics.wellnessScore,
        lifeZones: lifeZoneScores,
        habitStreaks,
        achievements: achievements || []
      });
    }
    return calculateAvatarTraits({
      dailyMetrics: { activity, nutrition, sleep, stress },
      wellnessScore: lifestyleScore,
      lifeZones: lifeZoneScores,
      habitStreaks,
      achievements: achievements || []
    });
  }, [effectiveMetrics, activity, nutrition, sleep, stress, lifestyleScore, lifeZoneScores, habitStreaks, achievements]);

  const maxStreak = useMemo(() => habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0, [habitStreaks]);
  const consistencyScore = useMemo(() => {
    if (habitStreaks.length === 0) return 0.5;
    const total = habitStreaks.reduce((sum, s) => sum + s, 0);
    return Math.min(1, (total / habitStreaks.length) / 14);
  }, [habitStreaks]);
  const disciplineScore = useMemo(() => {
    if (effectiveMetrics) return effectiveMetrics.disciplineScore;
    const avgStreak = habitStreaks.length > 0
      ? habitStreaks.reduce((sum, s) => sum + s, 0) / habitStreaks.length
      : 0;
    return Math.min(5, 1 + (avgStreak / 10) * 4);
  }, [effectiveMetrics, habitStreaks]);

  const avatarEffects = useMemo(() => {
    const metricsInput = effectiveMetrics ? {
      activityScore: effectiveMetrics.activityScore,
      nutritionScore: effectiveMetrics.nutritionScore,
      sleepScore: effectiveMetrics.sleepScore,
      stressScore: effectiveMetrics.stressScore,
      disciplineScore: effectiveMetrics.disciplineScore,
      streakDays: maxStreak,
      consistencyScore,
      gender: selectedGender || 'male',
      baselineData: liveProfile?.baselineData || null
    } : {
      activityScore: activity,
      nutritionScore: nutrition,
      sleepScore: sleep,
      stressScore: stress,
      disciplineScore,
      streakDays: maxStreak,
      consistencyScore,
      gender: selectedGender || 'male',
      baselineData: liveProfile?.baselineData || null
    };
    const baseEffects = computeAvatarEffects(metricsInput);
    const zoneInfluences = computeZoneInfluences(lifeZoneScores);
    return applyZoneInfluencesToEffects(baseEffects, zoneInfluences);
  }, [effectiveMetrics, activity, nutrition, sleep, stress, disciplineScore, maxStreak, consistencyScore, selectedGender, liveProfile?.baselineData, lifeZoneScores]);

  const colors = useMemo(() => {
    const energyScore = avatarTraits.glowEnergy.score;
    if (energyScore >= 75) return { body: '#10b981', bg: 'from-emerald-50 to-slate-50' };
    if (energyScore >= 50) return { body: '#f59e0b', bg: 'from-amber-50 to-slate-50' };
    return { body: '#94a3b8', bg: 'from-slate-50 to-gray-50' };
  }, [avatarTraits.glowEnergy.score]);

  const postureY = useMemo(() => {
    const score = avatarTraits.posture.score;
    if (score >= 80) return -3;
    if (score >= 60) return -1;
    if (score >= 40) return 0;
    return 2;
  }, [avatarTraits.posture.score]);

  const mouthPath = useMemo(() => {
    const score = avatarTraits.facialExpression.score;
    if (score >= 80) return 'M 75 90 Q 100 102 125 90';
    if (score >= 60) return 'M 80 88 Q 100 96 120 88';
    if (score >= 40) return 'M 85 90 L 115 90';
    return 'M 80 94 Q 100 86 120 94';
  }, [avatarTraits.facialExpression.score]);

  const eyeShape = useMemo(() => {
    const score = avatarTraits.facialExpression.score;
    if (score >= 70) return { happy: true, squint: false };
    if (score >= 40) return { happy: false, squint: false };
    return { happy: false, squint: true };
  }, [avatarTraits.facialExpression.score]);

  const bodyWidth = useMemo(() => {
    const { torsoScale = 1 } = avatarEffects.bodyComposition || {};
    return Math.round(100 * torsoScale);
  }, [avatarEffects.bodyComposition]);

  const subtitle = useMemo(() => getSubtitle(historyData), [historyData]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onNavigateToAvatar && onNavigateToAvatar('avatar')}
      className={`w-full bg-gradient-to-r ${colors.bg} rounded-2xl border border-gray-100 p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-sm`}
    >
      <div className="w-16 h-20 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 300"
          className="w-full h-full"
          style={{ filter: avatarEffects.cssFilter }}
        >
          <g transform={`translate(0, ${postureY})`} style={{ transformOrigin: '100px 150px' }}>
            <ellipse cx="100" cy="70" rx="45" ry="50" fill={colors.body} />

            {eyeShape.squint ? (
              <>
                <line x1="75" y1="65" x2="95" y2="68" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                <line x1="105" y1="68" x2="125" y2="65" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="85" cy="65" rx="8" ry={eyeShape.happy ? 6 : 10} fill="white" />
                <ellipse cx="115" cy="65" rx="8" ry={eyeShape.happy ? 6 : 10} fill="white" />
                <circle cx="85" cy="67" r="5" fill="#1f2937" />
                <circle cx="115" cy="67" r="5" fill="#1f2937" />
                {eyeShape.happy && (
                  <>
                    <circle cx="87" cy="64" r="2" fill="white" />
                    <circle cx="117" cy="64" r="2" fill="white" />
                  </>
                )}
              </>
            )}

            <path d={mouthPath} stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />

            <rect x={(200 - bodyWidth) / 2} y="120" width={bodyWidth} height="100" rx="20" fill={colors.body} />
            <rect x="55" y="120" width="18" height="80" rx="10" fill={colors.body} />
            <rect x="127" y="120" width="18" height="80" rx="10" fill={colors.body} />
            <rect x="75" y="220" width="20" height="70" rx="10" fill={colors.body} />
            <rect x="105" y="220" width="20" height="70" rx="10" fill={colors.body} />
          </g>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800">Your Current Self</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>
      </div>

      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
