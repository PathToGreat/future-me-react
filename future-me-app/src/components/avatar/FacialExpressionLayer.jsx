import { motion, AnimatePresence } from 'framer-motion';
import { 
  EMOTION_STATES, 
  getFacialGlowStyle, 
  getEyeBlurStyle, 
  getFaceShadowStyle 
} from './AvatarEffectsEngine';

export { EMOTION_STATES };

export const EXPRESSION_CONFIG = {
  transitionDuration: 0.45,
  defaultOpacity: 0.85
};

const EXPRESSION_PRESETS = {
  [EMOTION_STATES.HAPPY]: {
    eyeScale: 1.1,
    eyeY: -2,
    browAngle: -5,
    mouthCurve: 12,
    mouthWidth: 1.15,
    cheekOpacity: 0.4
  },
  [EMOTION_STATES.CONTENT]: {
    eyeScale: 1.0,
    eyeY: 0,
    browAngle: -2,
    mouthCurve: 6,
    mouthWidth: 1.0,
    cheekOpacity: 0.2
  },
  [EMOTION_STATES.NEUTRAL]: {
    eyeScale: 1.0,
    eyeY: 0,
    browAngle: 0,
    mouthCurve: 0,
    mouthWidth: 1.0,
    cheekOpacity: 0
  },
  [EMOTION_STATES.TIRED]: {
    eyeScale: 0.85,
    eyeY: 2,
    browAngle: 3,
    mouthCurve: -3,
    mouthWidth: 0.9,
    cheekOpacity: 0
  },
  [EMOTION_STATES.STRESSED]: {
    eyeScale: 0.9,
    eyeY: 0,
    browAngle: 8,
    mouthCurve: -6,
    mouthWidth: 0.85,
    cheekOpacity: 0
  }
};

export default function FacialExpressionLayer({
  emotionState = EMOTION_STATES.NEUTRAL,
  facialOverlays = {},
  color = '#10b981',
  opacity = EXPRESSION_CONFIG.defaultOpacity
}) {
  const preset = EXPRESSION_PRESETS[emotionState] || EXPRESSION_PRESETS[EMOTION_STATES.NEUTRAL];
  const { stressDesaturation = 0, energyGlow = 0, eyeBlur = 0, faceShadow = 0 } = facialOverlays;

  console.log(`😊 FacialExpressionLayer: ${emotionState}`, {
    preset: preset,
    overlays: { stressDesaturation, energyGlow, eyeBlur, faceShadow }
  });

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 2,
        opacity
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={emotionState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXPRESSION_CONFIG.transitionDuration }}
          className="absolute inset-0"
        >
          <div style={getFacialGlowStyle(energyGlow, color)} />
          
          <div style={getEyeBlurStyle(eyeBlur)} />
          
          <div style={getFaceShadowStyle(faceShadow)} />
          
          <svg
            viewBox="0 0 200 300"
            className="absolute inset-0 w-full h-full"
            style={{
              filter: stressDesaturation > 0.1 
                ? `saturate(${1 - stressDesaturation})` 
                : 'none'
            }}
          >
            <defs>
              <filter id="expressionBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
              </filter>
            </defs>

            <motion.g
              animate={{
                y: preset.eyeY,
                scale: preset.eyeScale
              }}
              transition={{ 
                duration: EXPRESSION_CONFIG.transitionDuration,
                ease: 'easeOut'
              }}
              style={{ transformOrigin: '100px 65px' }}
            >
              <motion.line
                x1="70"
                y1="52"
                x2="82"
                y2="52"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.6}
                animate={{
                  rotate: preset.browAngle,
                  y: preset.browAngle > 0 ? 2 : 0
                }}
                style={{ transformOrigin: '76px 52px' }}
              />
              <motion.line
                x1="118"
                y1="52"
                x2="130"
                y2="52"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.6}
                animate={{
                  rotate: -preset.browAngle,
                  y: preset.browAngle > 0 ? 2 : 0
                }}
                style={{ transformOrigin: '124px 52px' }}
              />
            </motion.g>

            {preset.cheekOpacity > 0 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: preset.cheekOpacity, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <ellipse cx="68" cy="78" rx="10" ry="6" fill="#fca5a5" opacity={preset.cheekOpacity * 0.6} />
                <ellipse cx="132" cy="78" rx="10" ry="6" fill="#fca5a5" opacity={preset.cheekOpacity * 0.6} />
              </motion.g>
            )}

            <motion.g
              animate={{
                scaleX: preset.mouthWidth
              }}
              transition={{ duration: EXPRESSION_CONFIG.transitionDuration }}
              style={{ transformOrigin: '100px 90px' }}
            >
              <motion.path
                d={`M 80 88 Q 100 ${88 + preset.mouthCurve} 120 88`}
                stroke={preset.mouthCurve >= 6 ? '#10b981' : preset.mouthCurve >= 0 ? color : '#f59e0b'}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                filter="url(#expressionBlur)"
                opacity={0.7}
              />
            </motion.g>

            {emotionState === EMOTION_STATES.TIRED && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
              >
                <ellipse cx="85" cy="72" rx="10" ry="4" fill="rgba(0,0,0,0.15)" />
                <ellipse cx="115" cy="72" rx="10" ry="4" fill="rgba(0,0,0,0.15)" />
              </motion.g>
            )}

            {emotionState === EMOTION_STATES.STRESSED && (
              <motion.g
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <line x1="92" y1="45" x2="90" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                <line x1="100" y1="43" x2="100" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                <line x1="108" y1="45" x2="110" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
              </motion.g>
            )}

            {emotionState === EMOTION_STATES.HAPPY && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: 1
                }}
                transition={{
                  opacity: { duration: 2, repeat: Infinity },
                  scale: { duration: 0.3 }
                }}
              >
                <circle cx="55" cy="50" r="3" fill={color} opacity="0.4" />
                <circle cx="145" cy="50" r="3" fill={color} opacity="0.4" />
                <circle cx="50" cy="65" r="2" fill={color} opacity="0.3" />
                <circle cx="150" cy="65" r="2" fill={color} opacity="0.3" />
              </motion.g>
            )}
          </svg>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
