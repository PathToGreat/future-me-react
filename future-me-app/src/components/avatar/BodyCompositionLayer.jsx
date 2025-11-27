import { motion, AnimatePresence } from 'framer-motion';

export const BODY_CONFIG = {
  athletic: {
    shoulderScale: 1.15,
    torsoScale: 1.08,
    armWidth: 1.12,
    chestDepth: 1.1,
    opacity: 0.25,
    color: 'currentColor'
  },
  fit: {
    shoulderScale: 1.08,
    torsoScale: 1.04,
    armWidth: 1.06,
    chestDepth: 1.05,
    opacity: 0.2,
    color: 'currentColor'
  },
  average: {
    shoulderScale: 1.0,
    torsoScale: 1.0,
    armWidth: 1.0,
    chestDepth: 1.0,
    opacity: 0.15,
    color: 'currentColor'
  },
  sedentary: {
    shoulderScale: 0.92,
    torsoScale: 0.95,
    armWidth: 0.94,
    chestDepth: 0.95,
    opacity: 0.2,
    color: 'currentColor'
  }
};

const BodyCompositionSVG = ({ config, color }) => {
  const { shoulderScale, torsoScale, armWidth, chestDepth } = config;
  
  const shoulderWidth = 60 * shoulderScale;
  const torsoWidth = 40 * torsoScale;
  const armThickness = 8 * armWidth;
  const chestWidth = 50 * chestDepth;
  
  return (
    <svg
      viewBox="0 0 120 180"
      className="w-full h-full"
      style={{ color }}
    >
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
        
        <filter id="bodyBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>
      
      <g filter="url(#bodyBlur)">
        <ellipse
          cx="60"
          cy="25"
          rx="18"
          ry="22"
          fill="url(#bodyGradient)"
        />
        
        <path
          d={`
            M ${60 - shoulderWidth/2} 50
            Q ${60 - shoulderWidth/2 - 5} 55 ${60 - shoulderWidth/2} 60
            L ${60 - torsoWidth/2} 90
            Q ${60 - torsoWidth/2 - 2} 110 ${60 - torsoWidth/2 + 5} 130
            L ${60 + torsoWidth/2 - 5} 130
            Q ${60 + torsoWidth/2 + 2} 110 ${60 + torsoWidth/2} 90
            L ${60 + shoulderWidth/2} 60
            Q ${60 + shoulderWidth/2 + 5} 55 ${60 + shoulderWidth/2} 50
            Z
          `}
          fill="url(#bodyGradient)"
        />
        
        <ellipse
          cx="60"
          cy="70"
          rx={chestWidth / 2}
          ry="15"
          fill="currentColor"
          fillOpacity="0.1"
        />
        
        <path
          d={`
            M ${60 - shoulderWidth/2 - 2} 52
            Q ${60 - shoulderWidth/2 - 15} 55 ${60 - shoulderWidth/2 - 18} 70
            L ${60 - shoulderWidth/2 - 20} 100
            Q ${60 - shoulderWidth/2 - 22} 105 ${60 - shoulderWidth/2 - 18} 110
            L ${60 - shoulderWidth/2 - 10} 112
            Q ${60 - shoulderWidth/2 - 5} 108 ${60 - shoulderWidth/2 - 8} 100
            L ${60 - shoulderWidth/2 - 5} 65
            Q ${60 - shoulderWidth/2 - 2} 58 ${60 - shoulderWidth/2 + 2} 52
            Z
          `}
          fill="url(#bodyGradient)"
          style={{ transform: `scaleX(${armWidth})`, transformOrigin: 'left center' }}
        />
        
        <path
          d={`
            M ${60 + shoulderWidth/2 + 2} 52
            Q ${60 + shoulderWidth/2 + 15} 55 ${60 + shoulderWidth/2 + 18} 70
            L ${60 + shoulderWidth/2 + 20} 100
            Q ${60 + shoulderWidth/2 + 22} 105 ${60 + shoulderWidth/2 + 18} 110
            L ${60 + shoulderWidth/2 + 10} 112
            Q ${60 + shoulderWidth/2 + 5} 108 ${60 + shoulderWidth/2 + 8} 100
            L ${60 + shoulderWidth/2 + 5} 65
            Q ${60 + shoulderWidth/2 + 2} 58 ${60 + shoulderWidth/2 - 2} 52
            Z
          `}
          fill="url(#bodyGradient)"
          style={{ transform: `scaleX(${armWidth})`, transformOrigin: 'right center' }}
        />
      </g>
    </svg>
  );
};

const BodyCompositionLayer = ({ bodyComposition = {}, color = '#6366f1' }) => {
  const { state = 'average', shoulderWidth = 1, torsoScale = 1, armDefinition = 0.5 } = bodyComposition;
  
  const config = BODY_CONFIG[state] || BODY_CONFIG.average;
  
  const dynamicConfig = {
    ...config,
    shoulderScale: shoulderWidth,
    torsoScale: torsoScale,
    armWidth: 0.9 + (armDefinition * 0.2)
  };
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ 
            opacity: config.opacity,
            scale: 1
          }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ 
            duration: 0.5,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-full h-full max-w-[80%] max-h-[90%] mx-auto">
            <BodyCompositionSVG config={dynamicConfig} color={color} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BodyCompositionLayer;
