import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSkinToneById } from './avatarParams';
import { getHairColors } from '../components/SkinToneSelector';

const lerp = (a, b, t) => a + (b - a) * t;

function resolveSkinColor(skinToneId, vibrancy) {
  if (skinToneId) {
    const tone = getSkinToneById(skinToneId);
    if (tone) {
      const glow = vibrancy > 0.5 ? 1 + (vibrancy - 0.5) * 0.12 : 1 - (0.5 - vibrancy) * 0.08;
      return {
        base: tone.base,
        shadow: tone.shadow,
        brightnessMod: glow
      };
    }
  }
  const base = vibrancy > 0.6 ? '#e8c4a0' : vibrancy > 0.3 ? '#d4a882' : '#c49878';
  const shadow = vibrancy > 0.6 ? '#d4aa80' : vibrancy > 0.3 ? '#c09468' : '#b08860';
  return { base, shadow, brightnessMod: 1 };
}

function computeBodyGeometry(params) {
  const {
    gender,
    shoulderWidth,
    chestSize,
    waistTaper,
    hipWidth,
    armThickness,
    legThickness,
    neckThickness,
    postureLean,
    headScale
  } = params;

  const cx = 100;
  const isMale = gender !== 'female';

  const headRx = lerp(22, 28, headScale);
  const headRy = lerp(26, 32, headScale);
  const headCy = 52;

  const neckW = lerp(8, 16, neckThickness);
  const neckTop = headCy + headRy - 4;
  const neckBottom = neckTop + 18;

  const shoulderY = neckBottom - 2;
  const shoulderHalf = lerp(28, 55, shoulderWidth);
  const chestY = shoulderY + lerp(18, 28, chestSize);

  const waistY = chestY + 32;
  const taperFactor = lerp(0.95, 0.55, waistTaper);
  const waistHalf = shoulderHalf * taperFactor;

  const hipY = waistY + 18;
  const hipHalf = lerp(22, 48, hipWidth);

  const crotchY = hipY + 12;

  const armW = lerp(7, 18, armThickness);
  const armLen = lerp(60, 75, 0.5);

  const legW = lerp(10, 22, legThickness);
  const legLen = 80;

  const postureOffset = postureLean * -4;
  const postureRotate = postureLean * -2.5;

  return {
    cx, headRx, headRy, headCy,
    neckW, neckTop, neckBottom,
    shoulderY, shoulderHalf, chestY, chestSize,
    waistY, waistHalf,
    hipY, hipHalf, crotchY,
    armW, armLen,
    legW, legLen,
    postureOffset, postureRotate,
    isMale
  };
}

function buildTorsoPath(g) {
  const { cx, shoulderHalf, shoulderY, chestY, chestSize, waistHalf, waistY, hipHalf, hipY, crotchY, isMale } = g;

  const chestBulge = isMale ? lerp(0, 4, chestSize) : lerp(0, 6, chestSize);
  const shoulderRound = isMale ? 6 : 3;

  return `
    M ${cx - shoulderHalf} ${shoulderY}
    Q ${cx - shoulderHalf - shoulderRound} ${shoulderY + 6} ${cx - shoulderHalf + 1} ${(shoulderY + chestY) / 2}
    Q ${cx - shoulderHalf + chestBulge} ${chestY} ${cx - waistHalf} ${waistY}
    Q ${cx - waistHalf - 1} ${(waistY + hipY) / 2} ${cx - hipHalf} ${hipY}
    L ${cx - hipHalf + 4} ${crotchY}
    L ${cx + hipHalf - 4} ${crotchY}
    L ${cx + hipHalf} ${hipY}
    Q ${cx + waistHalf + 1} ${(waistY + hipY) / 2} ${cx + waistHalf} ${waistY}
    Q ${cx + shoulderHalf - chestBulge} ${chestY} ${cx + shoulderHalf - 1} ${(shoulderY + chestY) / 2}
    Q ${cx + shoulderHalf + shoulderRound} ${shoulderY + 6} ${cx + shoulderHalf} ${shoulderY}
    Z
  `;
}

function buildArmPath(g, side) {
  const { cx, shoulderHalf, shoulderY, armW, armLen } = g;
  const sign = side === 'left' ? -1 : 1;
  const sx = cx + sign * shoulderHalf;
  const sy = shoulderY + 3;
  const hw = armW / 2;

  const elbowY = sy + armLen * 0.45;
  const wristY = sy + armLen;
  const handY = wristY + 8;

  const elbowOut = sign * 6;
  const handShrink = hw * 0.7;

  return `
    M ${sx - hw} ${sy}
    Q ${sx - hw + elbowOut * 0.3} ${(sy + elbowY) / 2} ${sx - hw + elbowOut} ${elbowY}
    L ${sx - handShrink + elbowOut * 0.5} ${wristY}
    Q ${sx + elbowOut * 0.3} ${handY + 2} ${sx + handShrink + elbowOut * 0.5} ${wristY}
    L ${sx + hw + elbowOut} ${elbowY}
    Q ${sx + hw + elbowOut * 0.3} ${(sy + elbowY) / 2} ${sx + hw} ${sy}
    Z
  `;
}

function buildLegPath(g, side) {
  const { cx, hipHalf, crotchY, legW, legLen } = g;
  const sign = side === 'left' ? -1 : 1;
  const legCx = cx + sign * (hipHalf * 0.45);
  const hw = legW / 2;
  const topY = crotchY - 2;
  const kneeY = topY + legLen * 0.48;
  const ankleY = topY + legLen;
  const footY = ankleY + 6;

  const kneeBulge = 2;

  return `
    M ${legCx - hw} ${topY}
    Q ${legCx - hw - 1} ${(topY + kneeY) / 2} ${legCx - hw + kneeBulge} ${kneeY}
    L ${legCx - hw * 0.85} ${ankleY}
    Q ${legCx - hw * 0.5} ${footY + 2} ${legCx + hw * 0.9} ${footY}
    L ${legCx + hw * 0.85} ${ankleY}
    L ${legCx + hw - kneeBulge} ${kneeY}
    Q ${legCx + hw + 1} ${(topY + kneeY) / 2} ${legCx + hw} ${topY}
    Z
  `;
}

function buildNeckPath(g) {
  const { cx, neckW, neckTop, neckBottom } = g;
  const hw = neckW / 2;
  return `
    M ${cx - hw} ${neckTop}
    Q ${cx - hw - 1} ${(neckTop + neckBottom) / 2} ${cx - hw + 1} ${neckBottom}
    L ${cx + hw - 1} ${neckBottom}
    Q ${cx + hw + 1} ${(neckTop + neckBottom) / 2} ${cx + hw} ${neckTop}
    Z
  `;
}

function LongHairBackLayer({ g, hairColors }) {
  const { cx, headCy, headRx, headRy, neckBottom, shoulderY } = g;
  const hairColor = hairColors?.base || '#3a2a1a';
  const hairHighlight = hairColors?.highlight || '#5a4a3a';
  const shoulderLevel = shoulderY || neckBottom + 10;
  const hairBottom = shoulderLevel + 15;

  return (
    <g>
      <path
        d={`
          M ${cx - headRx - 2} ${headCy - headRy * 0.2}
          Q ${cx - headRx - 4} ${headCy + headRy * 0.3} ${cx - headRx - 5} ${neckBottom}
          Q ${cx - headRx - 5} ${shoulderLevel} ${cx - headRx * 0.7} ${hairBottom}
          Q ${cx - headRx * 0.4} ${hairBottom + 5} ${cx} ${hairBottom + 3}
          Q ${cx + headRx * 0.4} ${hairBottom + 5} ${cx + headRx * 0.7} ${hairBottom}
          Q ${cx + headRx + 5} ${shoulderLevel} ${cx + headRx + 5} ${neckBottom}
          Q ${cx + headRx + 4} ${headCy + headRy * 0.3} ${cx + headRx + 2} ${headCy - headRy * 0.2}
          Q ${cx + headRx + 1} ${headCy - headRy * 0.6} ${cx + headRx} ${headCy - headRy * 0.8}
          L ${cx - headRx} ${headCy - headRy * 0.8}
          Q ${cx - headRx - 1} ${headCy - headRy * 0.6} ${cx - headRx - 2} ${headCy - headRy * 0.2}
          Z
        `}
        fill={hairColor}
      />
      <path
        d={`
          M ${cx - headRx - 2} ${headCy + headRy * 0.3}
          Q ${cx - headRx - 3} ${neckBottom - 5} ${cx - headRx - 2} ${shoulderLevel}
        `}
        stroke={hairHighlight}
        strokeWidth="0.8"
        fill="none"
        opacity="0.12"
      />
      <path
        d={`
          M ${cx + headRx + 2} ${headCy + headRy * 0.3}
          Q ${cx + headRx + 3} ${neckBottom - 5} ${cx + headRx + 2} ${shoulderLevel}
        `}
        stroke={hairHighlight}
        strokeWidth="0.8"
        fill="none"
        opacity="0.12"
      />
    </g>
  );
}

function HairLayer({ g, hairStyle, hairColors }) {
  if (!hairStyle || hairStyle === 'none') return null;
  const { cx, headCy, headRx, headRy, neckBottom, shoulderY } = g;
  const hairColor = hairColors?.base || '#3a2a1a';
  const hairHighlight = hairColors?.highlight || '#5a4a3a';

  if (hairStyle === 'short') {
    const topY = headCy - headRy;
    const hairlineY = headCy - headRy * 0.45;
    return (
      <g>
        <path
          d={`
            M ${cx - headRx * 0.85} ${hairlineY}
            Q ${cx - headRx * 0.9} ${topY + 2} ${cx - headRx * 0.5} ${topY - 3}
            Q ${cx} ${topY - 7} ${cx + headRx * 0.5} ${topY - 3}
            Q ${cx + headRx * 0.9} ${topY + 2} ${cx + headRx * 0.85} ${hairlineY}
            Q ${cx + headRx * 0.6} ${hairlineY + 3} ${cx} ${hairlineY + 4}
            Q ${cx - headRx * 0.6} ${hairlineY + 3} ${cx - headRx * 0.85} ${hairlineY}
            Z
          `}
          fill={hairColor}
        />
        <path
          d={`
            M ${cx - headRx * 0.5} ${topY - 1}
            Q ${cx} ${topY - 5} ${cx + headRx * 0.3} ${topY}
          `}
          stroke={hairHighlight}
          strokeWidth="1.2"
          fill="none"
          opacity="0.3"
        />
      </g>
    );
  }

  if (hairStyle === 'medium') {
    const topY = headCy - headRy;
    const hairlineY = headCy - headRy * 0.45;
    const sideBottom = headCy + headRy * 0.35;
    return (
      <g>
        <path
          d={`
            M ${cx - headRx - 2} ${sideBottom}
            Q ${cx - headRx - 3} ${headCy - headRy * 0.2} ${cx - headRx - 1} ${topY + 4}
            Q ${cx - headRx * 0.5} ${topY - 6} ${cx} ${topY - 8}
            Q ${cx + headRx * 0.5} ${topY - 6} ${cx + headRx + 1} ${topY + 4}
            Q ${cx + headRx + 3} ${headCy - headRy * 0.2} ${cx + headRx + 2} ${sideBottom}
            Q ${cx + headRx * 0.8} ${sideBottom - 2} ${cx + headRx * 0.6} ${hairlineY + 2}
            Q ${cx + headRx * 0.3} ${hairlineY + 5} ${cx} ${hairlineY + 6}
            Q ${cx - headRx * 0.3} ${hairlineY + 5} ${cx - headRx * 0.6} ${hairlineY + 2}
            Q ${cx - headRx * 0.8} ${sideBottom - 2} ${cx - headRx - 2} ${sideBottom}
            Z
          `}
          fill={hairColor}
        />
        <path
          d={`
            M ${cx - headRx * 0.4} ${topY}
            Q ${cx} ${topY - 5} ${cx + headRx * 0.4} ${topY}
          `}
          stroke={hairHighlight}
          strokeWidth="1.5"
          fill="none"
          opacity="0.25"
        />
        <path
          d={`
            M ${cx - headRx - 1} ${headCy - headRy * 0.1}
            Q ${cx - headRx} ${sideBottom - 4} ${cx - headRx + 1} ${sideBottom}
          `}
          stroke={hairHighlight}
          strokeWidth="0.8"
          fill="none"
          opacity="0.15"
        />
        <path
          d={`
            M ${cx + headRx + 1} ${headCy - headRy * 0.1}
            Q ${cx + headRx} ${sideBottom - 4} ${cx + headRx - 1} ${sideBottom}
          `}
          stroke={hairHighlight}
          strokeWidth="0.8"
          fill="none"
          opacity="0.15"
        />
      </g>
    );
  }

  if (hairStyle === 'long') {
    const topY = headCy - headRy;
    const hairlineY = headCy - headRy * 0.45;
    return (
      <g>
        <path
          d={`
            M ${cx - headRx * 0.85} ${hairlineY}
            Q ${cx - headRx * 0.9} ${topY + 2} ${cx - headRx * 0.5} ${topY - 5}
            Q ${cx} ${topY - 9} ${cx + headRx * 0.5} ${topY - 5}
            Q ${cx + headRx * 0.9} ${topY + 2} ${cx + headRx * 0.85} ${hairlineY}
            Q ${cx + headRx * 0.6} ${hairlineY + 3} ${cx} ${hairlineY + 4}
            Q ${cx - headRx * 0.6} ${hairlineY + 3} ${cx - headRx * 0.85} ${hairlineY}
            Z
          `}
          fill={hairColor}
        />
        <path
          d={`
            M ${cx - headRx * 0.4} ${topY - 2}
            Q ${cx} ${topY - 7} ${cx + headRx * 0.4} ${topY - 2}
          `}
          stroke={hairHighlight}
          strokeWidth="1.5"
          fill="none"
          opacity="0.2"
        />
      </g>
    );
  }

  return null;
}

function FaceFeatures({ g, facialTension, skinColors }) {
  const { cx, headCy, headRx } = g;
  const eyeY = headCy - 3;
  const eyeSpacing = headRx * 0.42;
  const browY = eyeY - 7;

  const tension = facialTension || 0;
  const browAngle = tension * 3;
  const eyeOpenness = lerp(5, 3.8, tension);
  const mouthY = headCy + 10;

  const mouthCurve = lerp(2.5, -1.5, tension);

  return (
    <g>
      <line
        x1={cx - eyeSpacing - 5} y1={browY + browAngle * 0.4}
        x2={cx - eyeSpacing + 5} y2={browY - browAngle * 0.4}
        stroke="#5a4a3a" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"
      />
      <line
        x1={cx + eyeSpacing - 5} y1={browY - browAngle * 0.4}
        x2={cx + eyeSpacing + 5} y2={browY + browAngle * 0.4}
        stroke="#5a4a3a" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"
      />

      <ellipse cx={cx - eyeSpacing} cy={eyeY} rx="4" ry={eyeOpenness} fill="white" />
      <ellipse cx={cx + eyeSpacing} cy={eyeY} rx="4" ry={eyeOpenness} fill="white" />
      <circle cx={cx - eyeSpacing} cy={eyeY + 0.5} r="2.2" fill="#3a3028" />
      <circle cx={cx + eyeSpacing} cy={eyeY + 0.5} r="2.2" fill="#3a3028" />
      <circle cx={cx - eyeSpacing + 0.8} cy={eyeY - 0.8} r="0.8" fill="white" opacity="0.8" />
      <circle cx={cx + eyeSpacing + 0.8} cy={eyeY - 0.8} r="0.8" fill="white" opacity="0.8" />

      <path
        d={`M ${cx - 5} ${mouthY} Q ${cx} ${mouthY + mouthCurve} ${cx + 5} ${mouthY}`}
        stroke="#7a5a4a" strokeWidth="1.5" fill="none" strokeLinecap="round"
      />

      <ellipse cx={cx} cy={eyeY + 3} rx="2" ry="1.5" fill={skinColors.shadow} opacity="0.4" />
    </g>
  );
}


function AnatomicalDepthLayer({ g }) {
  const { cx, shoulderHalf, shoulderY, neckBottom, waistY, armW, armLen } = g;
  const collarboneY = neckBottom + 2;
  const shoulderPlaneY = shoulderY + 4;
  const hw = (armW || 12) / 2;

  const leftArmInnerX = cx - shoulderHalf + hw * 0.3;
  const rightArmInnerX = cx + shoulderHalf - hw * 0.3;
  const armTopY = shoulderY + 3;
  const armMidY = armTopY + (armLen || 67) * 0.5;

  return (
    <g>
      <path
        d={`
          M ${cx - shoulderHalf * 0.6} ${shoulderPlaneY}
          Q ${cx} ${shoulderPlaneY - 3} ${cx + shoulderHalf * 0.6} ${shoulderPlaneY}
        `}
        stroke="white"
        strokeWidth="1"
        fill="none"
        opacity="0.07"
        strokeLinecap="round"
      />

      <path
        d={`
          M ${cx - shoulderHalf * 0.35} ${collarboneY}
          Q ${cx - shoulderHalf * 0.15} ${collarboneY + 2} ${cx} ${collarboneY + 3}
          Q ${cx + shoulderHalf * 0.15} ${collarboneY + 2} ${cx + shoulderHalf * 0.35} ${collarboneY}
        `}
        stroke="black"
        strokeWidth="0.8"
        fill="none"
        opacity="0.06"
        strokeLinecap="round"
      />

      <ellipse
        cx={cx}
        cy={(shoulderY + waistY) / 2}
        rx={shoulderHalf * 0.25}
        ry={(waistY - shoulderY) * 0.35}
        fill="white"
        opacity="0.04"
      />

      <line
        x1={leftArmInnerX} y1={armTopY + 5}
        x2={leftArmInnerX + 2} y2={armMidY}
        stroke="black" strokeWidth="0.6" opacity="0.05" strokeLinecap="round"
      />
      <line
        x1={rightArmInnerX} y1={armTopY + 5}
        x2={rightArmInnerX - 2} y2={armMidY}
        stroke="black" strokeWidth="0.6" opacity="0.05" strokeLinecap="round"
      />
    </g>
  );
}

function GlowLayer({ g, energyGlow, color }) {
  if (energyGlow < 0.4) return null;
  const { cx } = g;
  const intensity = (energyGlow - 0.4) / 0.6;
  const glowOpacity = lerp(0, 0.12, intensity);
  const glowRadius = lerp(25, 45, intensity);

  return (
    <ellipse
      cx={cx} cy={140}
      rx={glowRadius} ry={glowRadius * 1.2}
      fill={color}
      opacity={glowOpacity}
      filter="url(#avatarGlow)"
    />
  );
}

export default function HumanAvatarRenderer({ params, color = '#6366f1', className = '', mini = false }) {
  const p = params || {};

  const g = useMemo(() => computeBodyGeometry(p), [
    p.gender, p.shoulderWidth, p.chestSize, p.waistTaper, p.hipWidth,
    p.armThickness, p.legThickness, p.neckThickness, p.postureLean, p.headScale
  ]);

  const torsoPath = useMemo(() => buildTorsoPath(g), [g]);
  const leftArmPath = useMemo(() => buildArmPath(g, 'left'), [g]);
  const rightArmPath = useMemo(() => buildArmPath(g, 'right'), [g]);
  const leftLegPath = useMemo(() => buildLegPath(g, 'left'), [g]);
  const rightLegPath = useMemo(() => buildLegPath(g, 'right'), [g]);
  const neckPath = useMemo(() => buildNeckPath(g), [g]);

  const vibrancy = p.vibrancy ?? 0.5;
  const energyGlow = p.energyGlow ?? 0.4;
  const facialTension = p.facialTension ?? 0.15;
  const hairStyle = p.hairStyle || 'none';
  const resolvedHairColors = useMemo(() => getHairColors(p.hairColor), [p.hairColor]);

  const skinColors = useMemo(() => resolveSkinColor(p.skinTone, vibrancy), [p.skinTone, vibrancy]);
  const bodyFill = color;

  const glowId = mini ? 'miniGlow' : 'avatarGlow';
  const skinGradId = mini ? 'miniSkinGrad' : 'skinGrad';
  const bodyGradId = mini ? 'miniBodyGrad' : 'bodyGrad';

  const skinFilterStyle = skinColors.brightnessMod !== 1
    ? { filter: `brightness(${skinColors.brightnessMod.toFixed(3)})` }
    : {};

  if (mini) {
    return (
      <svg viewBox="0 0 200 300" className={className}>
        <defs>
          <linearGradient id={skinGradId} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={skinColors.base} stopOpacity="1" />
            <stop offset="100%" stopColor={skinColors.base} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={bodyGradId} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={bodyFill} stopOpacity="0.9" />
            <stop offset="100%" stopColor={bodyFill} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <g transform={`translate(0, ${g.postureOffset})`} style={{ transformOrigin: '100px 150px' }}>
          <path d={leftLegPath} fill={`url(#${bodyGradId})`} />
          <path d={rightLegPath} fill={`url(#${bodyGradId})`} />
          <path d={torsoPath} fill={`url(#${bodyGradId})`} />
          <path d={leftArmPath} fill={`url(#${bodyGradId})`} />
          <path d={rightArmPath} fill={`url(#${bodyGradId})`} />
          <AnatomicalDepthLayer g={g} />
          {hairStyle === 'long' && <LongHairBackLayer g={g} hairColors={resolvedHairColors} />}
          <g style={skinFilterStyle}>
            <path d={neckPath} fill={`url(#${skinGradId})`} />
            <ellipse cx={g.cx} cy={g.headCy} rx={g.headRx} ry={g.headRy} fill={`url(#${skinGradId})`} />
          </g>
          <HairLayer g={g} hairStyle={hairStyle} hairColors={resolvedHairColors} />
          <FaceFeatures g={g} facialTension={facialTension} skinColors={skinColors} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 300"
      className={`w-full max-w-[200px] h-auto ${className}`}
    >
      <defs>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
        <linearGradient id={skinGradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={skinColors.base} stopOpacity="1" />
          <stop offset="100%" stopColor={skinColors.base} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={bodyGradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={bodyFill} stopOpacity="0.9" />
          <stop offset="60%" stopColor={bodyFill} stopOpacity="0.75" />
          <stop offset="100%" stopColor={bodyFill} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <motion.g
        animate={{ y: g.postureOffset, rotate: g.postureRotate }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: '100px 150px' }}
      >
        <GlowLayer g={g} energyGlow={energyGlow} color={bodyFill} />

        <motion.path d={leftLegPath} fill={`url(#${bodyGradId})`} />
        <motion.path d={rightLegPath} fill={`url(#${bodyGradId})`} />

        <motion.path d={torsoPath} fill={`url(#${bodyGradId})`} />

        <motion.path d={leftArmPath} fill={`url(#${bodyGradId})`} />
        <motion.path d={rightArmPath} fill={`url(#${bodyGradId})`} />

        <AnatomicalDepthLayer g={g} />

        {hairStyle === 'long' && <LongHairBackLayer g={g} hairColors={resolvedHairColors} />}

        <g style={skinFilterStyle}>
          <path d={neckPath} fill={`url(#${skinGradId})`} />
          <ellipse
            cx={g.cx} cy={g.headCy}
            rx={g.headRx} ry={g.headRy}
            fill={`url(#${skinGradId})`}
          />
        </g>

        <HairLayer g={g} hairStyle={hairStyle} hairColors={resolvedHairColors} />

        <FaceFeatures g={g} facialTension={facialTension} skinColors={skinColors} />
      </motion.g>
    </svg>
  );
}
