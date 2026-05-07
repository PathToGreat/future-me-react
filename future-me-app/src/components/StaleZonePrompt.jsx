/**
 * StaleZonePrompt
 *
 * A calm, non-naggy card that appears when a life zone has not been
 * checked in for 14+ days. Shows one zone at a time.
 *
 * Actions:
 *  - "Check in"  → opens LifeZoneDetailsModal for that zone
 *  - "Not now"   → dismisses + applies 3-day cooldown via the hook
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LifeZoneDetailsModal from './LifeZoneDetailsModal';
import { useApp } from '../context/AppContext';

function prompt(label, daysSince) {
  if (daysSince >= 30) {
    return `Your ${label} score is based on older inputs. Check in if this area has shifted.`;
  }
  if (daysSince >= 21) {
    return `${label} has not been checked in for a while. Review it if your current life no longer matches the score.`;
  }
  return `${label} has not been checked in for ${daysSince} days. Has anything changed?`;
}

export default function StaleZonePrompt({ staleZone, onDismiss }) {
  const { liveProfile } = useApp();
  const [showModal, setShowModal] = useState(false);

  if (!staleZone) return null;

  const { zoneId, label, icon, daysSince } = staleZone;
  const zone = liveProfile?.lifeZones?.[zoneId] ?? null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={`stale-${zoneId}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white/70 rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5"
        >
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Zone icon badge */}
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-base mt-0.5">
              {icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Zone Check-in
              </p>
              <p className="text-sm text-gray-700 leading-snug">
                {prompt(label, daysSince)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3 pl-12">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              Check in
            </button>
            <button
              onClick={() => onDismiss(zoneId)}
              className="px-4 py-1.5 rounded-lg bg-transparent text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Zone detail modal — same one used on the Metrics screen */}
      <LifeZoneDetailsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // After checking in, dismiss the prompt so it doesn't resurface immediately
          onDismiss(zoneId);
        }}
        zone={zone}
        zoneId={zoneId}
      />
    </>
  );
}
