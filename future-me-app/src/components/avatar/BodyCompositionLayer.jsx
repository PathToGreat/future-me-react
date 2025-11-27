import { motion } from 'framer-motion';
import { useMemo } from 'react';

const BODY_STATE_CONFIG = {
  soft: {
    description: 'Low tone, softer shape',
    opacity: 0.22
  },
  balanced: {
    description: 'Normal proportions',
    opacity: 0.2
  },
  fit: {
    description: 'Athletic, leaner shape',
    opacity: 0.25
  }
};

const generateBodyPath = (params) => {
  const {
    shoulderWidth,
    waistWidth,
    hipWidth,
    armWidth,
    chestDepth,
    gender
  } = params;
  
  const centerX = 60;
  const shoulderY = 48;
  const chestY = 65;
  const waistY = 95;
  const hipY = 115;
  const legStartY = 125;
  
  const shoulderHalf = shoulderWidth / 2;
  const waistHalf = waistWidth / 2;
  const hipHalf = hipWidth / 2;
  
  const shoulderCurve = gender === 'female' ? 3 : 5;
  const chestCurve = gender === 'female' ? chestDepth * 0.6 : chestDepth * 0.4;
  const waistCurve = gender === 'female' ? -3 : -1;
  const hipCurve = gender === 'female' ? 5 : 2;
  
  return {
    torso: `
      M ${centerX - shoulderHalf} ${shoulderY}
      Q ${centerX - shoulderHalf - shoulderCurve} ${shoulderY + 8} ${centerX - shoulderHalf + 2} ${chestY - 5}
      Q ${centerX - shoulderHalf + chestCurve} ${chestY + 5} ${centerX - waistHalf + waistCurve} ${waistY}
      Q ${centerX - waistHalf - 2} ${waistY + 10} ${centerX - hipHalf + hipCurve} ${hipY}
      L ${centerX - hipHalf + 5} ${legStartY}
      L ${centerX + hipHalf - 5} ${legStartY}
      L ${centerX + hipHalf - hipCurve} ${hipY}
      Q ${centerX + waistHalf + 2} ${waistY + 10} ${centerX + waistHalf - waistCurve} ${waistY}
      Q ${centerX + shoulderHalf - chestCurve} ${chestY + 5} ${centerX + shoulderHalf - 2} ${chestY - 5}
      Q ${centerX + shoulderHalf + shoulderCurve} ${shoulderY + 8} ${centerX + shoulderHalf} ${shoulderY}
      Z
    `,
    leftArm: `
      M ${centerX - shoulderHalf - 2} ${shoulderY + 2}
      Q ${centerX - shoulderHalf - 12} ${shoulderY + 10} ${centerX - shoulderHalf - 15} ${shoulderY + 30}
      L ${centerX - shoulderHalf - 18} ${shoulderY + 55}
      Q ${centerX - shoulderHalf - 20} ${shoulderY + 60} ${centerX - shoulderHalf - 15} ${shoulderY + 62}
      L ${centerX - shoulderHalf - 8} ${shoulderY + 60}
      Q ${centerX - shoulderHalf - 4} ${shoulderY + 55} ${centerX - shoulderHalf - 6} ${shoulderY + 40}
      L ${centerX - shoulderHalf - 3} ${shoulderY + 20}
      Q ${centerX - shoulderHalf} ${shoulderY + 10} ${centerX - shoulderHalf + 3} ${shoulderY + 5}
      Z
    `,
    rightArm: `
      M ${centerX + shoulderHalf + 2} ${shoulderY + 2}
      Q ${centerX + shoulderHalf + 12} ${shoulderY + 10} ${centerX + shoulderHalf + 15} ${shoulderY + 30}
      L ${centerX + shoulderHalf + 18} ${shoulderY + 55}
      Q ${centerX + shoulderHalf + 20} ${shoulderY + 60} ${centerX + shoulderHalf + 15} ${shoulderY + 62}
      L ${centerX + shoulderHalf + 8} ${shoulderY + 60}
      Q ${centerX + shoulderHalf + 4} ${shoulderY + 55} ${centerX + shoulderHalf + 6} ${shoulderY + 40}
      L ${centerX + shoulderHalf + 3} ${shoulderY + 20}
      Q ${centerX + shoulderHalf} ${shoulderY + 10} ${centerX + shoulderHalf - 3} ${shoulderY + 5}
      Z
    `,
    chest: gender === 'female' 
      ? `M ${centerX - 12} ${chestY - 2} Q ${centerX} ${chestY + 8} ${centerX + 12} ${chestY - 2} Q ${centerX} ${chestY + 2} ${centerX - 12} ${chestY - 2} Z`
      : `M ${centerX - 15} ${chestY - 5} Q ${centerX} ${chestY} ${centerX + 15} ${chestY - 5} Q ${centerX} ${chestY - 2} ${centerX - 15} ${chestY - 5} Z`
  };
};

const GenderedBodySVG = ({ bodyComposition, color }) => {
  const {
    state = 'balanced',
    gender = 'male',
    shoulderWidth = 1,
    waistScale = 1,
    hipWidth = 1,
    armDefinition = 0.5,
    morphProgress = 0.5
  } = bodyComposition;
  
  const baseParams = useMemo(() => {
    const maleBase = { shoulder: 58, waist: 38, hip: 40, arm: 10, chest: 48 };
    const femaleBase = { shoulder: 48, waist: 34, hip: 46, arm: 8, chest: 42 };
    return gender === 'female' ? femaleBase : maleBase;
  }, [gender]);
  
  const params = useMemo(() => ({
    shoulderWidth: baseParams.shoulder * shoulderWidth,
    waistWidth: baseParams.waist * waistScale,
    hipWidth: baseParams.hip * hipWidth,
    armWidth: baseParams.arm * (0.8 + armDefinition * 0.4),
    chestDepth: baseParams.chest * (0.9 + armDefinition * 0.2),
    gender
  }), [baseParams, shoulderWidth, waistScale, hipWidth, armDefinition, gender]);
  
  const paths = useMemo(() => generateBodyPath(params), [params]);
  
  const config = BODY_STATE_CONFIG[state] || BODY_STATE_CONFIG.balanced;
  
  const muscleDefinitionOpacity = useMemo(() => {
    if (state === 'fit') return 0.1 + (morphProgress * 0.1);
    if (state === 'balanced') return 0.05 + (morphProgress * 0.05);
    return 0.02;
  }, [state, morphProgress]);

  return (
    <svg
      viewBox="0 0 120 160"
      className="w-full h-full"
      style={{ color }}
    >
      <defs>
        <linearGradient id="bodyGradientMorph" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="40%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
        
        <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
        
        <linearGradient id="muscleHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        
        <filter id="bodyBlurMorph" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>
        
        <filter id="muscleBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
      </defs>
      
      <g filter="url(#bodyBlurMorph)">
        <ellipse
          cx="60"
          cy="28"
          rx="16"
          ry="20"
          fill="url(#bodyGradientMorph)"
        />
        
        <motion.path
          d={paths.torso}
          fill="url(#bodyGradientMorph)"
          initial={false}
          animate={{ d: paths.torso }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        <motion.path
          d={paths.leftArm}
          fill="url(#armGradient)"
          initial={false}
          animate={{ d: paths.leftArm }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        <motion.path
          d={paths.rightArm}
          fill="url(#armGradient)"
          initial={false}
          animate={{ d: paths.rightArm }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        {state === 'fit' && (
          <g filter="url(#muscleBlur)" opacity={muscleDefinitionOpacity}>
            <line x1="55" y1="68" x2="52" y2="90" stroke="currentColor" strokeWidth="1" />
            <line x1="65" y1="68" x2="68" y2="90" stroke="currentColor" strokeWidth="1" />
            
            <ellipse cx="48" cy="75" rx="4" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <ellipse cx="72" cy="75" rx="4" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
            
            <line x1="56" y1="95" x2="54" y2="110" stroke="currentColor" strokeWidth="0.6" />
            <line x1="64" y1="95" x2="66" y2="110" stroke="currentColor" strokeWidth="0.6" />
          </g>
        )}
        
        <motion.path
          d={paths.chest}
          fill="currentColor"
          fillOpacity={0.08}
          initial={false}
          animate={{ d: paths.chest }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </g>
    </svg>
  );
};

const BodyCompositionLayer = ({ bodyComposition = {}, color = '#6366f1' }) => {
  const { state = 'balanced' } = bodyComposition;
  const config = BODY_STATE_CONFIG[state] || BODY_STATE_CONFIG.balanced;
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ 
          opacity: config.opacity,
          scale: 1
        }}
        transition={{ 
          duration: 0.5,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-full h-full max-w-[85%] max-h-[95%] mx-auto">
          <GenderedBodySVG bodyComposition={bodyComposition} color={color} />
        </div>
      </motion.div>
    </div>
  );
};

export default BodyCompositionLayer;

export { BODY_STATE_CONFIG };
