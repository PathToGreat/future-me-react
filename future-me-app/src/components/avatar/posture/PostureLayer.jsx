/**
 * PostureLayer Component
 * 
 * Phase 2 Avatar Upgrade - Posture Overlay System
 * 
 * Displays a silhouette overlay representing the user's current posture state.
 * Uses Framer Motion for smooth transitions between posture states.
 * 
 * This is a modular component that can be extended for future overlay systems
 * (body composition outlines, facial expression layers, etc.)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

import UprightSVG from './upright.svg';
import NeutralSVG from './neutral.svg';
import SlumpSVG from './slump.svg';

const POSTURE_STATES = {
  upright: 'upright',
  neutral: 'neutral',
  slump: 'slump'
};

const POSTURE_CONFIG = {
  upright: {
    svg: UprightSVG,
    scale: 1.02,
    color: '#10b981',
    label: 'Confident posture'
  },
  neutral: {
    svg: NeutralSVG,
    scale: 1.0,
    color: '#f59e0b',
    label: 'Neutral posture'
  },
  slump: {
    svg: SlumpSVG,
    scale: 0.98,
    color: '#ef4444',
    label: 'Fatigued posture'
  }
};

const DEFAULT_OPACITY = 0.3;
const TRANSITION_DURATION = 0.45;

export default function PostureLayer({ 
  postureState = 'neutral',
  opacity = DEFAULT_OPACITY,
  className = '',
  color = null
}) {
  const config = useMemo(() => {
    const state = POSTURE_STATES[postureState] || POSTURE_STATES.neutral;
    return POSTURE_CONFIG[state];
  }, [postureState]);

  const effectiveColor = color || config.color;

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      opacity: opacity,
      scale: config.scale,
      transition: {
        duration: TRANSITION_DURATION,
        ease: 'easeInOut'
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: TRANSITION_DURATION * 0.8,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
      aria-label={config.label}
      role="img"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={postureState}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full h-full flex items-center justify-center"
          style={{ color: effectiveColor }}
        >
          <motion.img
            src={config.svg}
            alt={config.label}
            className="w-full h-full object-contain"
            style={{
              filter: `drop-shadow(0 0 8px ${effectiveColor}40)`,
              color: effectiveColor
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: TRANSITION_DURATION }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { POSTURE_STATES, POSTURE_CONFIG, DEFAULT_OPACITY };
