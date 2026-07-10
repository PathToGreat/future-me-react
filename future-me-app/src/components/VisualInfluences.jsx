import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeZoneInfluences } from '../utils/zoneInfluenceEngine';
import SkinToneSelector from './SkinToneSelector';

const ZONE_DESCRIPTIONS = {
  Health: 'reflected in posture and physical tone',
  'Social Emotional': 'reflected in facial expression and warmth',
  Wealth: 'reflected in grounding and posture',
  Faith: 'reflected in steadiness and centeredness',
  'Family & Community': 'reflected in openness and expression'
};

export default function VisualInfluences({ lifeZones, onAppearanceChange, habitInfluenceSummary = [] }) {
  const [expanded, setExpanded] = useState(false);

  const lifeZoneScores = useMemo(() => {
    if (!lifeZones) return {};
    const scores = {};
    Object.entries(lifeZones).forEach(([key, value]) => {
      scores[key] = value?.score || 50;
    });
    return scores;
  }, [lifeZones]);

  const influences = useMemo(() => {
    return computeZoneInfluences(lifeZoneScores);
  }, [lifeZoneScores]);

  const activeInfluences = influences.activeInfluences.filter(i => i.active);

  const hasSocialInfluence = activeInfluences.some(
    i => i.zone === 'Social Emotional' || i.zone === 'Family & Community'
  );
  const hasPurposeInfluence = activeInfluences.some(i => i.zone === 'Faith');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-sm font-medium text-slate-500">Appearance & Influences</span>
        </div>
        <motion.svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4">
              <SkinToneSelector
                onSkinToneChange={(tone) => onAppearanceChange && onAppearanceChange({ skinTone: tone })}
                onHairStyleChange={(style) => onAppearanceChange && onAppearanceChange({ hairStyle: style })}
                onHairColorChange={(color) => onAppearanceChange && onAppearanceChange({ hairColor: color })}
              />

              {activeInfluences.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-slate-500">Zone Influences</p>
                  {activeInfluences.map((influence, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <span className="text-slate-600 font-medium">{influence.zone}</span>
                        {': '}
                        {ZONE_DESCRIPTIONS[influence.zone] || influence.target}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {habitInfluenceSummary.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-slate-500">Core habit rhythm</p>
                  {habitInfluenceSummary.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-slate-500 leading-relaxed">{line}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-slate-500">What's shaping this figure</p>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Logged movement and rest patterns are reflected in energy and posture.
                  </p>
                </div>
                {habitInfluenceSummary.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your habit rhythm is reflected in steadiness and consistency.
                    </p>
                  </div>
                )}
                {hasSocialInfluence && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Connection-related inputs are softening expression and openness.
                    </p>
                  </div>
                )}
                {hasPurposeInfluence && (
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Purpose-related inputs are contributing to steadiness and centeredness.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                These inputs are reflected in how your figure appears. Health remains the primary signal.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
