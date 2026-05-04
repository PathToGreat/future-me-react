import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { calculateAvatarTraits } from '../utils/avatarTraitEngine';
import { computeAvatarEffects } from './avatar/AvatarEffectsEngine';
import { computeZoneInfluences, applyZoneInfluencesToEffects } from '../utils/zoneInfluenceEngine';
import { computeITECurrentAdapter } from '../utils/iteAvatarAdapter';
import HumanAvatarRenderer from '../avatar/HumanAvatarRenderer';
import { mapFromAvatarEffects } from '../avatar/mapTraitsToAvatarParams';
import { loadSkinTone, loadHairStyle, loadHairColor } from './SkinToneSelector';

const USE_HUMAN_AVATAR_V2 = true;

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

  const resolvedSkinTone = loadSkinTone();
  const resolvedHairStyle = loadHairStyle();
  const resolvedHairColor = loadHairColor();

  const humanAvatarParams = useMemo(() => {
    if (!USE_HUMAN_AVATAR_V2) return null;
    const params = mapFromAvatarEffects(avatarEffects, avatarTraits, selectedGender || 'male', resolvedSkinTone);
    params.hairStyle = resolvedHairStyle;
    params.hairColor = resolvedHairColor;
    return params;
  }, [avatarEffects, avatarTraits, selectedGender, resolvedSkinTone, resolvedHairStyle, resolvedHairColor]);

  const subtitle = useMemo(() => getSubtitle(historyData), [historyData]);

  const energyScore = avatarTraits.glowEnergy.score;
  const statusLabel  = energyScore >= 75 ? 'Active'   : energyScore >= 50 ? 'Building' : 'Baseline';
  const statusColor  = energyScore >= 75
    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
    : energyScore >= 50
      ? 'text-amber-600 bg-amber-50 border-amber-100'
      : 'text-slate-500 bg-slate-50 border-slate-100';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(99,102,241,0.10)' }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.3 }}
      onClick={() => onNavigateToAvatar && onNavigateToAvatar('avatar')}
      className={`w-full bg-gradient-to-br ${colors.bg} to-indigo-50/30 rounded-2xl border border-blue-100/60 shadow-sm p-5 flex items-center gap-5 text-left`}
    >
      {/* Avatar — larger */}
      <div className="w-20 h-28 flex-shrink-0 flex items-end justify-center">
        {USE_HUMAN_AVATAR_V2 && humanAvatarParams ? (
          <HumanAvatarRenderer
            params={humanAvatarParams}
            color={colors.body}
            className="w-full h-full"
            mini={true}
          />
        ) : (
          <svg
            viewBox="0 0 200 300"
            className="w-full h-full"
            style={{ filter: avatarEffects.cssFilter }}
          >
            <g transform={`translate(0, ${avatarTraits.posture.score >= 80 ? -3 : avatarTraits.posture.score >= 60 ? -1 : 0})`}>
              <ellipse cx="100" cy="70" rx="45" ry="50" fill={colors.body} />
              <ellipse cx="85" cy="65" rx="8" ry="6" fill="white" />
              <ellipse cx="115" cy="65" rx="8" ry="6" fill="white" />
              <circle cx="85" cy="67" r="5" fill="#1f2937" />
              <circle cx="115" cy="67" r="5" fill="#1f2937" />
              <path d="M 85 90 L 115 90" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              <rect x="50" y="120" width="100" height="100" rx="20" fill={colors.body} />
              <rect x="55" y="120" width="18" height="80" rx="10" fill={colors.body} />
              <rect x="127" y="120" width="18" height="80" rx="10" fill={colors.body} />
              <rect x="75" y="220" width="20" height="70" rx="10" fill={colors.body} />
              <rect x="105" y="220" width="20" height="70" rx="10" fill={colors.body} />
            </g>
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Your Current Self</p>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
      </div>

      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
