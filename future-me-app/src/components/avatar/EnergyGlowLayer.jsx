import { motion, AnimatePresence } from 'framer-motion';

export const ENERGY_CONFIG = {
  vibrant: {
    rings: 3,
    baseOpacity: 0.4,
    pulseScale: 1.15,
    glowColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    particleCount: 6
  },
  active: {
    rings: 2,
    baseOpacity: 0.3,
    pulseScale: 1.1,
    glowColor: '#60a5fa',
    secondaryColor: '#3b82f6',
    particleCount: 4
  },
  steady: {
    rings: 1,
    baseOpacity: 0.2,
    pulseScale: 1.05,
    glowColor: '#34d399',
    secondaryColor: '#10b981',
    particleCount: 2
  },
  dormant: {
    rings: 0,
    baseOpacity: 0.1,
    pulseScale: 1.0,
    glowColor: '#9ca3af',
    secondaryColor: '#6b7280',
    particleCount: 0
  }
};

const PulsingRing = ({ delay, duration, color, opacity, scale, index }) => (
  <motion.div
    className="absolute inset-0 rounded-full pointer-events-none"
    style={{
      border: `2px solid ${color}`,
      opacity: 0
    }}
    animate={{
      scale: [1, scale, scale],
      opacity: [0, opacity, 0]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatDelay: duration * 0.2,
      ease: 'easeOut'
    }}
  />
);

const EnergyParticle = ({ index, total, color, duration, radius }) => {
  const angle = (index / total) * Math.PI * 2;
  const startX = Math.cos(angle) * radius;
  const startY = Math.sin(angle) * radius;
  const endX = Math.cos(angle) * (radius + 20);
  const endY = Math.sin(angle) * (radius + 20);
  
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: '4px',
        height: '4px',
        backgroundColor: color,
        left: '50%',
        top: '50%',
        marginLeft: '-2px',
        marginTop: '-2px'
      }}
      animate={{
        x: [startX, endX, startX],
        y: [startY, endY, startY],
        opacity: [0.6, 0.3, 0.6],
        scale: [1, 0.6, 1]
      }}
      transition={{
        duration: duration * 1.5,
        delay: index * 0.3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

const InnerGlow = ({ intensity, color, pulseSpeed }) => (
  <motion.div
    className="absolute inset-0 rounded-full pointer-events-none"
    style={{
      background: `radial-gradient(circle at center, ${color}40 0%, ${color}20 40%, transparent 70%)`,
      filter: `blur(${8 + intensity * 12}px)`
    }}
    animate={{
      opacity: [intensity * 0.6, intensity * 0.8, intensity * 0.6],
      scale: [1, 1.02, 1]
    }}
    transition={{
      duration: 2 / pulseSpeed,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  />
);

const EnergyGlowLayer = ({ energyPulse = {}, color }) => {
  const { 
    state = 'dormant', 
    pulseSpeed = 1, 
    pulseIntensity = 0, 
    glowRadius = 10,
    totalEnergy = 0 
  } = energyPulse;
  
  const config = ENERGY_CONFIG[state] || ENERGY_CONFIG.dormant;
  const glowColor = color || config.glowColor;
  
  if (state === 'dormant' || pulseIntensity < 0.1) {
    return null;
  }
  
  const baseDuration = 2.5 / pulseSpeed;
  
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 4 }}
    >
      <AnimatePresence>
        <motion.div
          key={state}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-[-20%] flex items-center justify-center"
        >
          <InnerGlow 
            intensity={pulseIntensity} 
            color={glowColor} 
            pulseSpeed={pulseSpeed}
          />
          
          {Array.from({ length: config.rings }).map((_, index) => (
            <PulsingRing
              key={`ring-${index}`}
              index={index}
              delay={index * (baseDuration / config.rings)}
              duration={baseDuration}
              color={index === 0 ? glowColor : config.secondaryColor}
              opacity={config.baseOpacity - (index * 0.1)}
              scale={config.pulseScale + (index * 0.05)}
            />
          ))}
          
          {config.particleCount > 0 && (
            <div className="absolute inset-0">
              {Array.from({ length: config.particleCount }).map((_, index) => (
                <EnergyParticle
                  key={`particle-${index}`}
                  index={index}
                  total={config.particleCount}
                  color={glowColor}
                  duration={baseDuration}
                  radius={glowRadius + 30}
                />
              ))}
            </div>
          )}
          
          {totalEnergy >= 0.7 && (
            <motion.div
              className="absolute inset-[-10%] rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${glowColor}30, transparent, ${glowColor}20, transparent)`,
                filter: 'blur(8px)'
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 8 / pulseSpeed,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EnergyGlowLayer;
