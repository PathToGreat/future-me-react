import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function FutureAvatar({ futureMetrics, images }) {
  const [showSvgAvatar, setShowSvgAvatar] = useState(!images || images.length === 0);

  useEffect(() => {
    if (images && images.length > 0) {
      setShowSvgAvatar(false);
    }
  }, [images]);

  if (!futureMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500 text-sm">Future projection not available yet. Track habits for a few days to unlock.</p>
      </div>
    );
  }

  const getAvatarColor = () => {
    const score = futureMetrics.lifestyleScore;
    if (score >= 75) return { body: '#10b981', glow: '#34d399' };
    if (score >= 50) return { body: '#f59e0b', glow: '#fbbf24' };
    return { body: '#ef4444', glow: '#f87171' };
  };

  const getPosture = () => {
    const activity = futureMetrics.activity;
    return activity >= 4 ? 'translateY(-10px)' : activity >= 2 ? 'translateY(0px)' : 'translateY(10px)';
  };

  const getFaceExpression = () => {
    const stress = futureMetrics.stress;
    const sleep = futureMetrics.sleep;
    const wellnessIndicator = (5 - stress) + sleep;
    
    if (wellnessIndicator >= 7) return 'M8,12 Q10,14 12,12'; // Happy
    if (wellnessIndicator >= 5) return 'M8,12 L12,12'; // Neutral
    return 'M8,14 Q10,12 12,14'; // Stressed
  };

  const colors = getAvatarColor();
  const bodyWidth = futureMetrics.avatarWidth;
  const posture = getPosture();
  const mouthPath = getFaceExpression();

  console.log('🔮 FutureAvatar rendered with projected data:');
  console.log('  - Lifestyle Score:', futureMetrics.lifestyleScore);
  console.log('  - Body Width:', bodyWidth);
  console.log('  - Activity:', futureMetrics.activity);
  console.log('  - Stress:', futureMetrics.stress);

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />

        {/* Avatar Container */}
        <div className="relative z-10" style={{ transform: posture }}>
          {showSvgAvatar ? (
            <svg width="200" height="280" viewBox="0 0 200 280" className="drop-shadow-lg">
              {/* Head */}
              <circle cx="100" cy="60" r="35" fill={colors.body} />
              
              {/* Eyes */}
              <circle cx="90" cy="55" r="4" fill="#1f2937" />
              <circle cx="110" cy="55" r="4" fill="#1f2937" />
              
              {/* Mouth */}
              <path 
                d={mouthPath} 
                stroke="#1f2937" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round"
                transform="translate(88, 63)"
              />
              
              {/* Neck */}
              <rect x="90" y="92" width="20" height="15" fill={colors.body} rx="3" />
              
              {/* Torso */}
              <rect
                x={100 - bodyWidth / 2}
                y="105"
                width={bodyWidth}
                height="90"
                fill={colors.body}
                rx="15"
              />
              
              {/* Arms */}
              <motion.rect
                x="55"
                y="110"
                width="15"
                height="70"
                fill={colors.body}
                rx="8"
                animate={{
                  rotate: futureMetrics.activity >= 4 ? [0, -5, 0] : 0
                }}
                transition={{
                  duration: 2,
                  repeat: futureMetrics.activity >= 4 ? Infinity : 0,
                  ease: 'easeInOut'
                }}
                style={{ transformOrigin: '62.5px 110px' }}
              />
              <motion.rect
                x="130"
                y="110"
                width="15"
                height="70"
                fill={colors.body}
                rx="8"
                animate={{
                  rotate: futureMetrics.activity >= 4 ? [0, 5, 0] : 0
                }}
                transition={{
                  duration: 2,
                  repeat: futureMetrics.activity >= 4 ? Infinity : 0,
                  ease: 'easeInOut'
                }}
                style={{ transformOrigin: '137.5px 110px' }}
              />
              
              {/* Legs */}
              <rect x="80" y="195" width="18" height="75" fill={colors.body} rx="9" />
              <rect x="102" y="195" width="18" height="75" fill={colors.body} rx="9" />
              
              {/* Energy particles for high projected energy */}
              {futureMetrics.lifestyleScore >= 75 && (
                <>
                  <motion.circle
                    cx="70"
                    cy="140"
                    r="3"
                    fill={colors.glow}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0,
                    }}
                  />
                  <motion.circle
                    cx="130"
                    cy="140"
                    r="3"
                    fill={colors.glow}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.5,
                    }}
                  />
                </>
              )}
            </svg>
          ) : (
            <div className="w-[200px] h-[280px] flex items-center justify-center">
              <img
                src={images[0]}
                alt="Future avatar based on uploaded image"
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{
                  filter: `brightness(${futureMetrics.lifestyleScore >= 75 ? 1.1 : futureMetrics.lifestyleScore >= 50 ? 1 : 0.85})`
                }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Future indicator badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-lg"
      >
        🔮 90-Day Projection
      </motion.div>
    </div>
  );
}
