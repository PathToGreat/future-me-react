import { motion } from 'framer-motion';

export default function FutureMeAvatar({ lifestyleScore, activity, nutrition, sleep, stress }) {
  console.log('🎨 FutureMeAvatar rendered with data:');
  console.log('  📊 Lifestyle Score:', lifestyleScore);
  console.log('  🏃 Activity:', activity);
  console.log('  🥗 Nutrition:', nutrition);
  console.log('  😴 Sleep:', sleep);
  console.log('  😰 Stress:', stress);

  const getAvatarColor = () => {
    if (lifestyleScore >= 75) return { body: '#10b981', glow: '#34d399' };
    if (lifestyleScore >= 50) return { body: '#f59e0b', glow: '#fbbf24' };
    return { body: '#ef4444', glow: '#f87171' };
  };

  const getPosture = () => {
    return activity >= 4 ? 'translateY(-10px)' : activity >= 2 ? 'translateY(0px)' : 'translateY(10px)';
  };

  const getBodyWidth = () => {
    const base = 120;
    const nutritionFactor = (nutrition - 3) * 10;
    return base + nutritionFactor;
  };

  const getEnergyLevel = () => {
    return (activity + nutrition + sleep + (5 - stress)) / 16;
  };

  const colors = getAvatarColor();
  const bodyWidth = getBodyWidth();
  const energyLevel = getEnergyLevel();

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />

        <svg
          width="200"
          height="300"
          viewBox="0 0 200 300"
          className="relative z-10"
        >
          <motion.ellipse
            cx="100"
            cy="70"
            rx="45"
            ry="50"
            fill={colors.body}
            animate={{
              ry: [50, 52, 50],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ellipse cx="85" cy="65" rx="8" ry="10" fill="white" />
            <ellipse cx="115" cy="65" rx="8" ry="10" fill="white" />
            <circle cx="85" cy="67" r="5" fill="#1f2937" />
            <circle cx="115" cy="67" r="5" fill="#1f2937" />
          </motion.g>

          <motion.path
            d={`M 75 85 Q 100 ${stress > 3 ? 85 : 95} 125 85`}
            stroke={stress > 3 ? '#ef4444' : '#10b981'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          <motion.g
            animate={{
              y: getPosture(),
            }}
            transition={{ duration: 0.5 }}
          >
            <motion.rect
              x={(200 - bodyWidth) / 2}
              y="120"
              width={bodyWidth}
              height="100"
              rx="20"
              fill={colors.body}
              animate={{
                height: [100, 102, 100],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            <motion.rect
              x="60"
              y="120"
              width="15"
              height="80"
              rx="10"
              fill={colors.body}
              animate={{
                rotate: activity >= 4 ? [0, -10, 0] : [0, 0, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              style={{ transformOrigin: '67px 120px' }}
            />

            <motion.rect
              x="125"
              y="120"
              width="15"
              height="80"
              rx="10"
              fill={colors.body}
              animate={{
                rotate: activity >= 4 ? [0, 10, 0] : [0, 0, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              style={{ transformOrigin: '132px 120px' }}
            />
          </motion.g>

          <motion.rect
            x="75"
            y="220"
            width="20"
            height="70"
            rx="10"
            fill={colors.body}
          />
          <motion.rect
            x="105"
            y="220"
            width="20"
            height="70"
            rx="10"
            fill={colors.body}
          />

          {energyLevel > 0.7 && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.circle
                  key={i}
                  cx={100 + Math.cos(i * 72 * Math.PI / 180) * 80}
                  cy={150 + Math.sin(i * 72 * Math.PI / 180) * 80}
                  r="4"
                  fill={colors.glow}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </>
          )}
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.body }}
          />
          <span className="font-semibold text-gray-700">
            {lifestyleScore >= 75 ? 'Thriving' : lifestyleScore >= 50 ? 'Improving' : 'Needs Attention'}
          </span>
          <span className="text-primary-600 font-bold">{Math.round(lifestyleScore)}%</span>
        </div>
      </motion.div>
    </div>
  );
}
