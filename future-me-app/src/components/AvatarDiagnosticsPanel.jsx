import { useMemo } from 'react';
import { computePhysicalCompositionScore, diagnosticAvatarProfile } from '../avatar/mapTraitsToAvatarParams';

export default function AvatarDiagnosticsPanel({ avatarEffects, humanAvatarParams, iteAdapter, userId, rawMetrics }) {
  const diagnostics = useMemo(() => {
    if (!avatarEffects) return null;

    const actRaw = avatarEffects.activityScore;
    const nutRaw = avatarEffects.nutritionScore;
    const slpRaw = avatarEffects.sleepScore;
    const strRaw = avatarEffects.stressScore;
    const conRaw = avatarEffects.consistencyScore;

    const actDefined = actRaw !== undefined && actRaw !== null;
    const nutDefined = nutRaw !== undefined && nutRaw !== null;
    const slpDefined = slpRaw !== undefined && slpRaw !== null;
    const strDefined = strRaw !== undefined && strRaw !== null;
    const conDefined = conRaw !== undefined && conRaw !== null;

    const act = actDefined ? actRaw : 3;
    const nut = nutDefined ? nutRaw : 3;
    const slp = slpDefined ? slpRaw : 3;
    const con = conDefined ? conRaw : 0.5;

    const physScore = computePhysicalCompositionScore({ activity: act, nutrition: nut, sleep: slp, consistency: con });

    let tier = 'AverageFit';
    if (physScore < 30) tier = 'Overweight';
    else if (physScore < 50) tier = 'Soft';
    else if (physScore < 70) tier = 'AverageFit';
    else if (physScore < 85) tier = 'LeanAthletic';
    else tier = 'MuscularAthletic';

    const interpFactor = (() => {
      const boundaries = [0, 30, 50, 70, 85, 100];
      const tiers = ['Overweight', 'Soft', 'AverageFit', 'LeanAthletic', 'MuscularAthletic'];
      for (let i = 0; i < boundaries.length - 1; i++) {
        if (physScore < boundaries[i + 1] || i === boundaries.length - 2) {
          return (physScore - boundaries[i]) / (boundaries[i + 1] - boundaries[i]);
        }
      }
      return 1;
    })();

    const undefinedFields = [];
    if (!actDefined) undefinedFields.push('activity');
    if (!nutDefined) undefinedFields.push('nutrition');
    if (!slpDefined) undefinedFields.push('sleep');
    if (!strDefined) undefinedFields.push('stress');
    if (!conDefined) undefinedFields.push('consistency');

    return {
      sources: {
        hasITECurrentTraits: !!(iteAdapter?.available && iteAdapter?.iteResult?.traits),
        hasFallbackMetrics: actDefined || nutDefined,
        usingLegacyAvatarEffectsBridge: false,
      },
      rawScores: {
        activityRaw: act,
        nutritionRaw: nut,
        sleepRaw: slp,
        stressRaw: strRaw ?? 3,
        consistencyRaw: con,
      },
      physical: {
        PhysicalCompositionScore: Math.round(physScore * 10) / 10,
        SelectedTier: tier,
        InterpolationFactor: Math.round(interpFactor * 1000) / 1000,
      },
      bodyParams: humanAvatarParams ? {
        shoulderWidth: humanAvatarParams.shoulderWidth,
        chestSize: humanAvatarParams.chestSize,
        waistTaper: humanAvatarParams.waistTaper,
        hipWidth: humanAvatarParams.hipWidth,
        armThickness: humanAvatarParams.armThickness,
        legThickness: humanAvatarParams.legThickness,
        postureLean: humanAvatarParams.postureLean,
        facialTension: humanAvatarParams.facialTension,
      } : null,
      undefinedFields,
      userId: userId || 'unknown',
    };
  }, [avatarEffects, humanAvatarParams, iteAdapter, userId, rawMetrics]);

  if (!diagnostics) return null;

  const s = diagnostics;
  const label = 'text-[10px] text-gray-400 font-mono';
  const val = 'text-[10px] text-gray-700 font-mono font-bold';
  const warn = 'text-[10px] text-red-500 font-mono font-bold';

  return (
    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-left space-y-2 max-w-sm mx-auto">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Avatar Diagnostics</div>

      <div>
        <span className={label}>User: </span>
        <span className={val}>{s.userId}</span>
      </div>

      <div className="border-t border-gray-100 pt-1">
        <div className="text-[10px] text-gray-400 uppercase mb-0.5">Sources</div>
        <div><span className={label}>ITE Traits: </span><span className={s.sources.hasITECurrentTraits ? val : warn}>{String(s.sources.hasITECurrentTraits)}</span></div>
        <div><span className={label}>Fallback Metrics: </span><span className={val}>{String(s.sources.hasFallbackMetrics)}</span></div>
      </div>

      <div className="border-t border-gray-100 pt-1">
        <div className="text-[10px] text-gray-400 uppercase mb-0.5">Raw Scores (1-5)</div>
        <div className="grid grid-cols-3 gap-x-2">
          <div><span className={label}>act: </span><span className={val}>{s.rawScores.activityRaw}</span></div>
          <div><span className={label}>nut: </span><span className={val}>{s.rawScores.nutritionRaw}</span></div>
          <div><span className={label}>slp: </span><span className={val}>{s.rawScores.sleepRaw}</span></div>
          <div><span className={label}>str: </span><span className={val}>{s.rawScores.stressRaw}</span></div>
          <div><span className={label}>con: </span><span className={val}>{s.rawScores.consistencyRaw}</span></div>
        </div>
        {s.undefinedFields.length > 0 && (
          <div className="mt-0.5">
            <span className={warn}>Defaulted: {s.undefinedFields.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-1">
        <div className="text-[10px] text-gray-400 uppercase mb-0.5">Physical Composition</div>
        <div><span className={label}>Score: </span><span className={val}>{s.physical.PhysicalCompositionScore}</span></div>
        <div><span className={label}>Tier: </span><span className={val}>{s.physical.SelectedTier}</span></div>
        <div><span className={label}>Interp: </span><span className={val}>{s.physical.InterpolationFactor}</span></div>
      </div>

      {s.bodyParams && (
        <div className="border-t border-gray-100 pt-1">
          <div className="text-[10px] text-gray-400 uppercase mb-0.5">Body Params (geometry)</div>
          <div className="grid grid-cols-2 gap-x-2">
            <div><span className={label}>shoulder: </span><span className={val}>{s.bodyParams.shoulderWidth?.toFixed(3)}</span></div>
            <div><span className={label}>chest: </span><span className={val}>{s.bodyParams.chestSize?.toFixed(3)}</span></div>
            <div><span className={label}>waist: </span><span className={val}>{s.bodyParams.waistTaper?.toFixed(3)}</span></div>
            <div><span className={label}>hip: </span><span className={val}>{s.bodyParams.hipWidth?.toFixed(3)}</span></div>
            <div><span className={label}>arm: </span><span className={val}>{s.bodyParams.armThickness?.toFixed(3)}</span></div>
            <div><span className={label}>leg: </span><span className={val}>{s.bodyParams.legThickness?.toFixed(3)}</span></div>
            <div><span className={label}>posture: </span><span className={val}>{s.bodyParams.postureLean?.toFixed(3)}</span></div>
            <div><span className={label}>tension: </span><span className={val}>{s.bodyParams.facialTension?.toFixed(3)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
