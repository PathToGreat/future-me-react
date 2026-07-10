import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { calculateAvatarTraits } from '../utils/avatarTraitEngine';
import { 
  computeAvatarEffects, 
  getDarknessOverlayStyle, 
  getGlowOverlayStyle 
} from './avatar/AvatarEffectsEngine';
import { computeZoneInfluences, applyZoneInfluencesToEffects } from '../utils/zoneInfluenceEngine';
import { computeITEFutureAdapter } from '../utils/iteAvatarAdapter';
import PostureLayer from './avatar/posture/PostureLayer';
import FacialExpressionLayer from './avatar/FacialExpressionLayer';
import BodyCompositionLayer from './avatar/BodyCompositionLayer';
import EnergyGlowLayer from './avatar/EnergyGlowLayer';
import AvatarViewToggle, { VIEW_MODES } from './avatar/AvatarViewToggle';
import HumanAvatarRenderer from '../avatar/HumanAvatarRenderer';
import { mapFromAvatarEffectsProjected, computePhotoOverlayState } from '../avatar/mapTraitsToAvatarParams';
import PhotoTransformLayer, { getPhotoFramingStyle } from './avatar/photo/PhotoTransformLayer';
import { loadSkinTone, loadHairStyle, loadHairColor } from './SkinToneSelector';
import AvatarDiagnosticsPanel from './AvatarDiagnosticsPanel';
import { useAuth } from '../context/AuthContext';

const USE_HUMAN_AVATAR_V2 = true;

export default function FutureAvatar({ 
  futureMetrics, 
  images,
  habits = [],
  achievements = [],
  lifeZones = null,
  gender = 'male',
  baselineData = null,
  historyData = null,
  skinTone = null,
  hairStyle = null,
  hairColor = null,
  defaultHabitCompletions = null,
  amplifyContrast = false
}) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.PHOTO);
  const hasImages = images && images.length > 0;
  const { user } = useAuth();
  const debugAvatar = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugAvatar') === '1';

  useEffect(() => {
    if (!hasImages) {
      setViewMode(VIEW_MODES.AVATAR);
    }
  }, [hasImages]);

  const dailyMetrics = useMemo(() => ({
    activity: futureMetrics?.activity || 3,
    nutrition: futureMetrics?.nutrition || 3,
    sleep: futureMetrics?.sleep || 3,
    stress: futureMetrics?.stress || 3
  }), [futureMetrics]);

  const habitStreaks = useMemo(() => 
    habits.map(h => h.streak || 0), [habits]
  );

  const lifeZoneScores = useMemo(() => {
    if (!lifeZones) return {};
    const scores = {};
    Object.entries(lifeZones).forEach(([key, value]) => {
      scores[key] = value?.score || 50;
    });
    return scores;
  }, [lifeZones]);

  const iteAdapter = useMemo(() => {
    return computeITEFutureAdapter(
      { activity: dailyMetrics.activity, nutrition: dailyMetrics.nutrition, sleep: dailyMetrics.sleep, stress: dailyMetrics.stress },
      historyData,
      baselineData,
      lifeZoneScores,
      habits,
      '90day',
      defaultHabitCompletions
    );
  }, [dailyMetrics, historyData, baselineData, lifeZoneScores, habits, defaultHabitCompletions]);

  const effectiveMetrics = useMemo(() => {
    if (iteAdapter.available && iteAdapter.adapted) {
      return iteAdapter.adapted;
    }
    return null;
  }, [iteAdapter]);

  const avatarTraits = useMemo(() => {
    if (effectiveMetrics) {
      return calculateAvatarTraits({
        dailyMetrics: effectiveMetrics.dailyMetrics,
        wellnessScore: effectiveMetrics.wellnessScore,
        lifeZones: lifeZoneScores,
        habitStreaks,
        achievements
      });
    }
    return calculateAvatarTraits({
      dailyMetrics,
      wellnessScore: futureMetrics?.lifestyleScore || 50,
      lifeZones: lifeZoneScores,
      habitStreaks,
      achievements
    });
  }, [effectiveMetrics, dailyMetrics, futureMetrics?.lifestyleScore, lifeZoneScores, habitStreaks, achievements]);

  const disciplineScore = useMemo(() => {
    if (effectiveMetrics) return effectiveMetrics.disciplineScore;
    const avgStreak = habitStreaks.length > 0 
      ? habitStreaks.reduce((sum, s) => sum + s, 0) / habitStreaks.length 
      : 0;
    return Math.min(5, 1 + (avgStreak / 10) * 4);
  }, [effectiveMetrics, habitStreaks]);

  const maxStreak = useMemo(() => {
    return habitStreaks.length > 0 ? Math.max(...habitStreaks) : 0;
  }, [habitStreaks]);

  const consistencyScore = useMemo(() => {
    if (habitStreaks.length === 0) return 0.5;
    const totalStreak = habitStreaks.reduce((sum, s) => sum + s, 0);
    const avgStreak = totalStreak / habitStreaks.length;
    return Math.min(1, avgStreak / 14);
  }, [habitStreaks]);

  const avatarEffects = useMemo(() => {
    const metricsInput = effectiveMetrics ? {
      activityScore: effectiveMetrics.activityScore,
      nutritionScore: effectiveMetrics.nutritionScore,
      sleepScore: effectiveMetrics.sleepScore,
      stressScore: effectiveMetrics.stressScore,
      disciplineScore: effectiveMetrics.disciplineScore,
      streakDays: maxStreak,
      consistencyScore: consistencyScore,
      gender: gender,
      baselineData: baselineData
    } : {
      activityScore: dailyMetrics.activity,
      nutritionScore: dailyMetrics.nutrition,
      sleepScore: dailyMetrics.sleep,
      stressScore: dailyMetrics.stress,
      disciplineScore: disciplineScore,
      streakDays: maxStreak,
      consistencyScore: consistencyScore,
      gender: gender,
      baselineData: baselineData
    };
    const baseEffects = computeAvatarEffects(metricsInput);
    const zoneInfluences = computeZoneInfluences(lifeZoneScores);
    return applyZoneInfluencesToEffects(baseEffects, zoneInfluences);
  }, [effectiveMetrics, dailyMetrics, disciplineScore, maxStreak, consistencyScore, gender, baselineData, lifeZoneScores]);

  const resolvedSkinTone = skinTone || loadSkinTone();
  const resolvedHairStyle = hairStyle || loadHairStyle();
  const resolvedHairColor = hairColor || loadHairColor();

  const humanAvatarParams = useMemo(() => {
    if (!USE_HUMAN_AVATAR_V2) return null;
    const iteResult = iteAdapter.available ? iteAdapter.iteResult : null;
    const params = mapFromAvatarEffectsProjected(avatarEffects, avatarTraits, iteResult, gender, resolvedSkinTone, historyData, { amplifyContrast });
    params.hairStyle = resolvedHairStyle;
    params.hairColor = resolvedHairColor;
    return params;
  }, [avatarEffects, avatarTraits, iteAdapter, gender, resolvedSkinTone, resolvedHairStyle, resolvedHairColor, historyData, amplifyContrast]);

  const photoOverlayState = useMemo(() => {
    const iteResult = iteAdapter.available ? iteAdapter.iteResult : null;
    const rawMetrics = {
      activity: effectiveMetrics?.activityScore ?? futureMetrics?.activity ?? 3,
      nutrition: effectiveMetrics?.nutritionScore ?? futureMetrics?.nutrition ?? 3,
      sleep: effectiveMetrics?.sleepScore ?? futureMetrics?.sleep ?? 3,
      stress: effectiveMetrics?.stressScore ?? futureMetrics?.stress ?? 3
    };
    const pl = humanAvatarParams?.postureLean ?? 0;
    return computePhotoOverlayState(iteResult, true, rawMetrics, pl);
  }, [iteAdapter, effectiveMetrics, futureMetrics, humanAvatarParams?.postureLean]);

  if (!futureMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm">
          Future projection not available yet. Track habits for a few days to unlock.
        </p>
      </div>
    );
  }

  const getAvatarColor = () => {
    const energyScore = avatarTraits.glowEnergy.score;
    if (energyScore >= 75) return { body: '#10b981', glow: '#34d399', accent: '#6ee7b7' };
    if (energyScore >= 50) return { body: '#f59e0b', glow: '#fbbf24', accent: '#fcd34d' };
    return { body: '#ef4444', glow: '#f87171', accent: '#fca5a5' };
  };

  const getPostureTransform = () => {
    const postureScore = avatarTraits.posture.score;
    if (postureScore >= 80) return { y: -12, rotate: -2 };
    if (postureScore >= 60) return { y: -6, rotate: 0 };
    if (postureScore >= 40) return { y: 0, rotate: 0 };
    return { y: 8, rotate: 2 };
  };

  const getMouthPath = () => {
    const expressionScore = avatarTraits.facialExpression.score;
    if (expressionScore >= 80) return 'M 75 90 Q 100 105 125 90';
    if (expressionScore >= 60) return 'M 80 88 Q 100 98 120 88';
    if (expressionScore >= 40) return 'M 85 90 L 115 90';
    return 'M 80 95 Q 100 85 120 95';
  };

  const getEyeShape = () => {
    const expressionScore = avatarTraits.facialExpression.score;
    if (expressionScore >= 70) return { happy: true, squint: false };
    if (expressionScore >= 40) return { happy: false, squint: false };
    return { happy: false, squint: true };
  };

  const getBodyWidth = () => {
    const { torsoScale = 1 } = avatarEffects.bodyComposition || {};
    const baseWidth = 100;
    return Math.round(baseWidth * torsoScale);
  };

  const getGlowAnimation = () => {
    const energyScore = avatarTraits.glowEnergy.score;
    if (energyScore >= 80) return { scale: [1, 1.25, 1], opacity: [0.5, 0.8, 0.5], duration: 1.2 };
    if (energyScore >= 60) return { scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4], duration: 1.8 };
    if (energyScore >= 40) return { scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25], duration: 2.5 };
    return { scale: [1, 1.03, 1], opacity: [0.15, 0.25, 0.15], duration: 3.5 };
  };

  const getArmAnimation = () => {
    const movementScore = avatarTraits.movementLevel.score;
    if (movementScore >= 70) return { rotate: [-15, 15, -15], duration: 1.2 };
    if (movementScore >= 50) return { rotate: [-8, 8, -8], duration: 1.8 };
    return { rotate: [0, 0, 0], duration: 0 };
  };

  const getBreathingAnimation = () => {
    const energyScore = avatarTraits.glowEnergy.score;
    const rate = energyScore >= 70 ? 1.5 : energyScore >= 50 ? 2 : 2.8;
    const intensity = energyScore >= 70 ? 4 : energyScore >= 50 ? 2 : 1;
    return { rate, intensity };
  };

  const getParticleCount = () => {
    const energyScore = avatarTraits.glowEnergy.score;
    if (energyScore >= 80) return 8;
    if (energyScore >= 60) return 5;
    if (energyScore >= 40) return 3;
    return 0;
  };

  const getAuraConfig = () => {
    const auraScore = avatarTraits.auraPresence.score;
    if (auraScore >= 80) return { size: 2, opacity: 0.3, rings: 3 };
    if (auraScore >= 60) return { size: 1.5, opacity: 0.2, rings: 2 };
    if (auraScore >= 40) return { size: 1.2, opacity: 0.1, rings: 1 };
    return { size: 0, opacity: 0, rings: 0 };
  };

  const colors = getAvatarColor();
  const posture = getPostureTransform();
  const bodyWidth = getBodyWidth();
  const glowAnim = getGlowAnimation();
  const armAnim = getArmAnimation();
  const breathing = getBreathingAnimation();
  const particleCount = getParticleCount();
  const aura = getAuraConfig();
  const mouthPath = getMouthPath();
  const eyeShape = getEyeShape();

  const showSvgAvatar = viewMode === VIEW_MODES.AVATAR;


  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: futureMetrics.lifestyleScore >= 70 ? [0, -5, 0] : [0, 0, 0]
        }}
        transition={{ 
          type: 'spring', 
          duration: 0.8,
          y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="relative"
      >
        {!USE_HUMAN_AVATAR_V2 && aura.rings > 0 && (
          <>
            {[...Array(aura.rings)].map((_, i) => (
              <motion.div
                key={`aura-${i}`}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${colors.glow}${Math.round(aura.opacity * 100 * (1 - i * 0.3)).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                  transform: `scale(${aura.size + i * 0.3})`,
                }}
                animate={{
                  opacity: [aura.opacity * (1 - i * 0.2), aura.opacity * 0.5 * (1 - i * 0.2), aura.opacity * (1 - i * 0.2)],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}

        {!USE_HUMAN_AVATAR_V2 && (
          <motion.div
            animate={{
              scale: glowAnim.scale,
              opacity: glowAnim.opacity,
            }}
            transition={{
              duration: glowAnim.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              transform: 'scale(1.5)',
            }}
          />
        )}

        {!USE_HUMAN_AVATAR_V2 && (
          <>
            <PostureLayer 
              postureState={avatarEffects.postureState}
              color={colors.body}
            />
            {showSvgAvatar && (
              <FacialExpressionLayer
                emotionState={avatarEffects.emotionState}
                facialOverlays={avatarEffects.facialOverlays}
                color={colors.body}
              />
            )}
            {showSvgAvatar && (
              <EnergyGlowLayer
                energyPulse={avatarEffects.energyPulse}
                color={colors.glow}
              />
            )}
            {showSvgAvatar && (
              <BodyCompositionLayer
                bodyComposition={avatarEffects.bodyComposition}
                color={colors.body}
              />
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          {!showSvgAvatar && hasImages ? (
            <motion.div
              key="photo-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative z-10 overflow-hidden rounded-2xl"
            >
              <motion.img
                src={images[images.length - 1]}
                alt="Your future self projection"
                className="w-full max-w-[200px] aspect-[2/3] object-cover rounded-2xl shadow-2xl"
                style={getPhotoFramingStyle(photoOverlayState)}
              />
              <PhotoTransformLayer overlayState={photoOverlayState} isFuture={true} />
            </motion.div>
          ) : (
            <motion.div
              key="avatar-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative z-10"
            >
              {!USE_HUMAN_AVATAR_V2 && <div style={getGlowOverlayStyle(avatarEffects.glowIntensity, colors.glow)} />}
              {USE_HUMAN_AVATAR_V2 && humanAvatarParams ? (
                <HumanAvatarRenderer
                  params={humanAvatarParams}
                  color={colors.body}
                />
              ) : (
                <svg
                  className="w-full max-w-[200px] h-auto"
                  viewBox="0 0 200 300"
                  style={{ filter: avatarEffects.cssFilter }}
                >
                  <motion.g
                    animate={{
                      y: posture.y,
                      rotate: posture.rotate,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: '100px 150px' }}
                  >
                    <motion.ellipse
                      cx="100"
                      cy="70"
                      rx="45"
                      ry="50"
                      fill={colors.body}
                      animate={{
                        ry: [50, 50 + breathing.intensity, 50],
                      }}
                      transition={{
                        duration: breathing.rate,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    <motion.g 
                      animate={eyeShape.happy ? { y: [0, -2, 0] } : {}} 
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {eyeShape.squint ? (
                        <>
                          <line x1="75" y1="65" x2="95" y2="68" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                          <line x1="105" y1="68" x2="125" y2="65" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                        </>
                      ) : (
                        <>
                          <ellipse cx="85" cy="65" rx="8" ry={eyeShape.happy ? 6 : 10} fill="white" />
                          <ellipse cx="115" cy="65" rx="8" ry={eyeShape.happy ? 6 : 10} fill="white" />
                          <motion.circle 
                            cx="85" 
                            cy="67" 
                            r="5" 
                            fill="#1f2937"
                            animate={eyeShape.happy ? { cy: [67, 65, 67] } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          <motion.circle 
                            cx="115" 
                            cy="67" 
                            r="5" 
                            fill="#1f2937"
                            animate={eyeShape.happy ? { cy: [67, 65, 67] } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          {eyeShape.happy && (
                            <>
                              <circle cx="87" cy="64" r="2" fill="white" />
                              <circle cx="117" cy="64" r="2" fill="white" />
                            </>
                          )}
                        </>
                      )}
                    </motion.g>

                    <motion.path
                      d={mouthPath}
                      stroke="#1f2937"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {avatarTraits.facialExpression.score >= 75 && (
                      <>
                        <circle cx="65" cy="80" r="6" fill="#fca5a5" opacity="0.5" />
                        <circle cx="135" cy="80" r="6" fill="#fca5a5" opacity="0.5" />
                      </>
                    )}

                    <motion.rect
                      x={(200 - bodyWidth) / 2}
                      y="120"
                      width={bodyWidth}
                      height="100"
                      rx="20"
                      fill={colors.body}
                      animate={{
                        height: [100, 100 + breathing.intensity, 100],
                      }}
                      transition={{
                        duration: breathing.rate,
                        repeat: Infinity,
                      }}
                    />

                    <motion.rect
                      x="55"
                      y="120"
                      width="18"
                      height="80"
                      rx="10"
                      fill={colors.body}
                      animate={{
                        rotate: armAnim.rotate,
                      }}
                      transition={{
                        duration: armAnim.duration,
                        repeat: armAnim.duration > 0 ? Infinity : 0,
                      }}
                      style={{ transformOrigin: '64px 120px' }}
                    />

                    <motion.rect
                      x="127"
                      y="120"
                      width="18"
                      height="80"
                      rx="10"
                      fill={colors.body}
                      animate={{
                        rotate: armAnim.rotate.map(r => -r),
                      }}
                      transition={{
                        duration: armAnim.duration,
                        repeat: armAnim.duration > 0 ? Infinity : 0,
                      }}
                      style={{ transformOrigin: '136px 120px' }}
                    />

                    <rect x="75" y="220" width="20" height="70" rx="10" fill={colors.body} />
                    <rect x="105" y="220" width="20" height="70" rx="10" fill={colors.body} />
                  </motion.g>

                  {particleCount > 0 && (
                    <>
                      {[...Array(particleCount)].map((_, i) => (
                        <motion.circle
                          key={`particle-${i}`}
                          cx={100 + Math.cos((i * 360 / particleCount) * Math.PI / 180) * 90}
                          cy={150 + Math.sin((i * 360 / particleCount) * Math.PI / 180) * 90}
                          r={3 + (avatarTraits.glowEnergy.score / 50)}
                          fill={colors.accent}
                          animate={{
                            scale: [0, 1.2, 0],
                            opacity: [0, 0.9, 0],
                          }}
                          transition={{
                            duration: 1.5 + (i % 3) * 0.3,
                            repeat: Infinity,
                            delay: i * (1.5 / particleCount),
                          }}
                        />
                      ))}
                    </>
                  )}

                  {avatarTraits.auraPresence.score >= 70 && (
                    <motion.ellipse
                      cx="100"
                      cy="150"
                      rx="95"
                      ry="140"
                      fill="none"
                      stroke={colors.glow}
                      strokeWidth="2"
                      strokeDasharray="10 5"
                      opacity="0.3"
                      animate={{
                        strokeDashoffset: [0, -30, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}
                </svg>
              )}
              {!USE_HUMAN_AVATAR_V2 && <div 
                style={getDarknessOverlayStyle(avatarEffects.darknessOverlay)} 
                className="absolute inset-0 rounded-2xl pointer-events-none" 
              />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-lg"
      >
        ➡️ 90-Day Projection
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.body }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: glowAnim.duration,
              repeat: Infinity,
            }}
          />
          <span className="font-semibold text-gray-700">
            {futureMetrics.lifestyleScore >= 75 ? 'Thriving' : futureMetrics.lifestyleScore >= 50 ? 'Improving' : 'Needs Attention'}
          </span>
          <span className="text-purple-600 font-bold">{Math.round(futureMetrics.lifestyleScore)}%</span>
        </div>

        {avatarTraits.summary.dominantTraits && avatarTraits.summary.dominantTraits.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {avatarTraits.summary.dominantTraits.slice(0, 2).map((trait, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
              >
                {trait.label}
              </span>
            ))}
          </div>
        )}

        {hasImages && (
          <AvatarViewToggle
            currentMode={viewMode}
            onModeChange={setViewMode}
            className="mt-4"
          />
        )}
      </motion.div>
      {debugAvatar && (
        <AvatarDiagnosticsPanel
          avatarEffects={avatarEffects}
          humanAvatarParams={humanAvatarParams}
          iteAdapter={iteAdapter}
          userId={user?.uid}
          rawMetrics={dailyMetrics}
        />
      )}
    </div>
  );
}
