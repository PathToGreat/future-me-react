import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function FutureMeAvatar({ lifestyleScore, activity, nutrition, sleep, stress, images, trendAnalysis, predictions }) {
  const [showSvgAvatar, setShowSvgAvatar] = useState(!images || images.length === 0);
  
  console.log('🎨 FutureMeAvatar rendered with data:');
  console.log('  📊 Lifestyle Score:', lifestyleScore);
  console.log('  🏃 Activity:', activity);
  console.log('  🥗 Nutrition:', nutrition);
  console.log('  😴 Sleep:', sleep);
  console.log('  😰 Stress:', stress);
  console.log('  📸 Images:', images ? images.length : 0);
  
  if (images && images.length > 0) {
    console.log('🎨 Avatar updated from uploaded image');
  }

  useEffect(() => {
    if (trendAnalysis) {
      console.log('🌟 Avatar adapting to trend analysis:');
      console.log(`  - Direction: ${trendAnalysis.direction}`);
      console.log(`  - Change: ${trendAnalysis.changePercentage}%`);
      console.log(`  - Trend Score: ${trendAnalysis.trendScore.toFixed(2)}`);
    }
  }, [trendAnalysis]);

  useEffect(() => {
    if (predictions) {
      console.log('🌅 Avatar showing future growth outlook:');
      console.log(`  - 30-day: ${predictions[30].score} (${predictions[30].status})`);
      console.log(`  - 90-day: ${predictions[90].score} (${predictions[90].status})`);
      console.log(`  - 180-day: ${predictions[180].score} (${predictions[180].status})`);
    }
  }, [predictions]);

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

  const getTrendGlowEffect = () => {
    if (!trendAnalysis) {
      return {
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
        duration: 2
      };
    }

    if (trendAnalysis.direction === 'improving') {
      return {
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.7, 0.4],
        duration: 1.5
      };
    } else if (trendAnalysis.direction === 'declining') {
      return {
        scale: [1, 1.05, 1],
        opacity: [0.2, 0.3, 0.2],
        duration: 3
      };
    } else {
      return {
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
        duration: 2
      };
    }
  };

  const getTrendBrightnessFilter = () => {
    if (!trendAnalysis) return 1;
    
    if (trendAnalysis.direction === 'improving') {
      return 1.1;
    } else if (trendAnalysis.direction === 'declining') {
      return 0.85;
    }
    return 1;
  };

  const getPredictionAnimation = () => {
    if (!predictions) return {};

    const day180 = predictions[180];
    
    if (day180.direction === 'improving') {
      if (day180.score >= 80) {
        return {
          y: [0, -5, 0],
          duration: 2.5
        };
      } else {
        return {
          y: [0, -2, 0],
          duration: 3
        };
      }
    } else if (day180.direction === 'declining') {
      return {
        y: [0, 2, 0],
        duration: 3.5
      };
    }
    
    return {};
  };

  const getPredictionGlowColor = () => {
    if (!predictions) return colors.glow;

    const day30 = predictions[30];
    
    if (day30.direction === 'improving') {
      return '#10b981';
    }
    
    return colors.glow;
  };

  const glowEffect = getTrendGlowEffect();
  const brightnessFilter = getTrendBrightnessFilter();
  const predictionAnimation = getPredictionAnimation();
  const predictionGlowColor = getPredictionGlowColor();

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          ...predictionAnimation
        }}
        transition={{ 
          type: 'spring', 
          duration: 0.8,
          y: {
            duration: predictionAnimation.duration || 0,
            repeat: predictionAnimation.duration ? Infinity : 0,
            ease: 'easeInOut'
          }
        }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: glowEffect.scale,
            opacity: glowEffect.opacity,
          }}
          transition={{
            duration: glowEffect.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${predictionGlowColor} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />

        {!showSvgAvatar && images && images.length > 0 ? (
          <div className="relative z-10">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={images[images.length - 1]}
              alt="Your uploaded image"
              className="w-[200px] h-[300px] object-cover rounded-2xl shadow-2xl"
              style={{
                filter: `brightness(${(energyLevel > 0.7 ? 1.1 : energyLevel > 0.5 ? 1 : 0.9) * brightnessFilter}) saturate(${energyLevel > 0.7 ? 1.2 : energyLevel > 0.5 ? 1 : 0.8})`,
              }}
            />
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${colors.glow}20 0%, transparent 50%, ${colors.glow}10 100%)`,
                mixBlendMode: 'overlay'
              }}
            />
          </div>
        ) : (
          <svg
            width="200"
            height="300"
            viewBox="0 0 200 300"
            className="relative z-10"
            style={{
              filter: `brightness(${brightnessFilter})`
            }}
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
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center space-y-3"
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

        {images && images.length > 0 && (
          <button
            onClick={() => setShowSvgAvatar(!showSvgAvatar)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showSvgAvatar ? '📸 Show My Photo' : '🎨 Show Avatar'}
          </button>
        )}
      </motion.div>
    </div>
  );
}
