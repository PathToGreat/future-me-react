import { motion } from 'framer-motion';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function PhotoTransformLayer({ overlayState, isFuture = false }) {
  if (!overlayState) return null;

  const {
    saturation = 1,
    brightness = 1,
    contrast = 1,
    warmth = 0,
    vignetteIntensity = 0,
    skinGlow = 0,
    underEyeIntensity = 0
  } = overlayState;

  const filterParts = [];
  if (Math.abs(saturation - 1) > 0.01) filterParts.push(`saturate(${saturation.toFixed(3)})`);
  if (Math.abs(brightness - 1) > 0.01) filterParts.push(`brightness(${brightness.toFixed(3)})`);
  if (Math.abs(contrast - 1) > 0.01) filterParts.push(`contrast(${contrast.toFixed(3)})`);
  const cssFilter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  const warmthColor = warmth > 0
    ? `rgba(255, 180, 80, ${clamp(warmth * 0.18, 0, 0.10)})`
    : `rgba(120, 150, 200, ${clamp(Math.abs(warmth) * 0.15, 0, 0.08)})`;

  const uniqueId = isFuture ? 'futureUnderEye' : 'currentUnderEye';

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl"
      style={{ pointerEvents: 'none', zIndex: 6 }}
    >
      {cssFilter !== 'none' && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: cssFilter,
            WebkitBackdropFilter: cssFilter
          }}
        />
      )}

      {Math.abs(warmth) > 0.01 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            background: warmthColor,
            mixBlendMode: 'overlay'
          }}
        />
      )}

      {skinGlow > 0.02 && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 35%, rgba(255, 220, 180, ${clamp(skinGlow, 0, 0.22)}) 0%, transparent 100%)`,
            mixBlendMode: 'soft-light'
          }}
        />
      )}

      {vignetteIntensity > 0.02 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(20, 20, 30, ${clamp(vignetteIntensity, 0, 0.20)}) 100%)`
          }}
        />
      )}

      {underEyeIntensity > 0.02 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'blur(5px)' }}
        >
          <defs>
            <radialGradient id={uniqueId} cx="50%" cy="30%" r="20%">
              <stop offset="0%" stopColor="rgba(90, 70, 110, 0.5)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <ellipse cx="36" cy="29" rx="8" ry="3" fill={`url(#${uniqueId})`} opacity={underEyeIntensity} />
          <ellipse cx="64" cy="29" rx="8" ry="3" fill={`url(#${uniqueId})`} opacity={underEyeIntensity} />
        </svg>
      )}
    </div>
  );
}

export function getPhotoFramingStyle(overlayState) {
  if (!overlayState) return {};
  const { framingScale = 1, framingTranslateY = 0, framingRotate = 0 } = overlayState;
  const hasFraming = Math.abs(framingScale - 1) > 0.002 ||
    Math.abs(framingTranslateY) > 0.1 ||
    Math.abs(framingRotate) > 0.05;
  if (!hasFraming) return {};
  return {
    transform: `scale(${framingScale.toFixed(4)}) translateY(${framingTranslateY.toFixed(2)}%) rotate(${framingRotate.toFixed(2)}deg)`,
    transformOrigin: 'center center'
  };
}
