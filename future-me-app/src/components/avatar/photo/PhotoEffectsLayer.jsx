import React from 'react';
import { motion } from 'framer-motion';

const EFFECT_THRESHOLDS = {
  tiredness: {
    min: 0.3,
    maxOpacity: 0.25
  },
  stress: {
    min: 0.4,
    maxOpacity: 0.15
  },
  positiveGlow: {
    min: 0.5,
    maxOpacity: 0.2
  },
  clarity: {
    min: 0.6,
    contrastBoost: 1.05,
    brightnessBoost: 1.02
  },
  vignette: {
    sleepThreshold: 0.4,
    maxOpacity: 0.15
  }
};

const UnderEyeShadow = ({ tirednessLevel }) => {
  const opacity = Math.min(tirednessLevel * 0.35, EFFECT_THRESHOLDS.tiredness.maxOpacity);
  
  if (opacity < 0.02) return null;
  
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ pointerEvents: 'none' }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ filter: 'blur(4px)' }}
      >
        <defs>
          <radialGradient id="underEyeGradient" cx="50%" cy="30%" r="25%" fx="50%" fy="30%">
            <stop offset="0%" stopColor="rgba(100, 80, 120, 0.6)" />
            <stop offset="60%" stopColor="rgba(80, 60, 100, 0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <ellipse
          cx="35"
          cy="28"
          rx="10"
          ry="4"
          fill="url(#underEyeGradient)"
          opacity={opacity}
        />
        <ellipse
          cx="65"
          cy="28"
          rx="10"
          ry="4"
          fill="url(#underEyeGradient)"
          opacity={opacity}
        />
      </svg>
    </motion.div>
  );
};

const StressTint = ({ stressLevel }) => {
  const opacity = Math.min(stressLevel * 0.2, EFFECT_THRESHOLDS.stress.maxOpacity);
  
  if (opacity < 0.02) return null;
  
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.6 }}
      style={{
        background: 'linear-gradient(180deg, rgba(120, 130, 150, 0.08) 0%, rgba(100, 110, 130, 0.12) 50%, rgba(90, 100, 120, 0.08) 100%)',
        mixBlendMode: 'color',
        pointerEvents: 'none'
      }}
    />
  );
};

const PositiveGlow = ({ energyLevel, activityLevel }) => {
  const combinedEnergy = (energyLevel + activityLevel) / 2;
  
  if (combinedEnergy < EFFECT_THRESHOLDS.positiveGlow.min) return null;
  
  const intensity = (combinedEnergy - EFFECT_THRESHOLDS.positiveGlow.min) / (1 - EFFECT_THRESHOLDS.positiveGlow.min);
  const opacity = Math.min(intensity * 0.3, EFFECT_THRESHOLDS.positiveGlow.maxOpacity);
  
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '60%',
          background: `linear-gradient(to top, 
            rgba(255, 200, 120, ${opacity}) 0%, 
            rgba(255, 180, 100, ${opacity * 0.6}) 30%, 
            rgba(255, 160, 80, ${opacity * 0.3}) 60%, 
            transparent 100%)`,
          filter: 'blur(20px)',
          transform: 'translateY(20%)'
        }}
      />
    </motion.div>
  );
};

const ClarityFilter = ({ sleepQuality }) => {
  if (sleepQuality < EFFECT_THRESHOLDS.clarity.min) return null;
  
  const clarityIntensity = (sleepQuality - EFFECT_THRESHOLDS.clarity.min) / (1 - EFFECT_THRESHOLDS.clarity.min);
  const contrastBoost = 1 + (clarityIntensity * 0.05);
  const brightnessBoost = 1 + (clarityIntensity * 0.02);
  
  return (
    <div
      className="absolute inset-0"
      style={{
        backdropFilter: `contrast(${contrastBoost}) brightness(${brightnessBoost})`,
        WebkitBackdropFilter: `contrast(${contrastBoost}) brightness(${brightnessBoost})`,
        pointerEvents: 'none'
      }}
    />
  );
};

const LowLightVignette = ({ fatigueLevel }) => {
  if (fatigueLevel < 0.5) return null;
  
  const vignetteIntensity = (fatigueLevel - 0.5) / 0.5;
  const opacity = Math.min(vignetteIntensity * 0.25, EFFECT_THRESHOLDS.vignette.maxOpacity);
  
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      style={{
        background: `radial-gradient(ellipse at center, 
          transparent 40%, 
          rgba(20, 20, 30, ${opacity * 0.5}) 70%, 
          rgba(10, 10, 20, ${opacity}) 100%)`,
        pointerEvents: 'none'
      }}
    />
  );
};

const PhotoEffectsLayer = ({ effects = {} }) => {
  const {
    darknessOverlay = 0,
    glowIntensity = 0,
    blurAmount = 0,
    saturationLevel = 1,
    facialOverlays = {},
    bodyComposition = {},
    energyPulse = {}
  } = effects;

  const {
    eyeBlur = 0,
    stressDesaturation = 0,
    energyGlow = 0
  } = facialOverlays;

  const tirednessLevel = Math.max(eyeBlur, darknessOverlay * 0.8, blurAmount);
  
  const stressLevel = Math.max(stressDesaturation, 1 - saturationLevel);
  
  const sleepQuality = 1 - blurAmount;
  
  const energyLevel = Math.max(glowIntensity, energyGlow, (energyPulse.totalEnergy || 0));
  const activityLevel = (bodyComposition.fitnessScore || 0.5);
  
  const fatigueLevel = Math.max(darknessOverlay * 1.5, 1 - sleepQuality);

  return (
    <div 
      className="absolute inset-0 overflow-hidden rounded-2xl"
      style={{ 
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <LowLightVignette fatigueLevel={fatigueLevel} />
      
      <UnderEyeShadow tirednessLevel={tirednessLevel} />
      
      <StressTint stressLevel={stressLevel} />
      
      <ClarityFilter sleepQuality={sleepQuality} />
      
      <PositiveGlow energyLevel={energyLevel} activityLevel={activityLevel} />
    </div>
  );
};

export default PhotoEffectsLayer;
