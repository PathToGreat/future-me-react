/**
 * useStaleZoneCheck
 *
 * Detects which life zones have not been checked in for >= STALE_THRESHOLD_DAYS.
 * Returns a single zone to prompt the user about — the stalest one that is not
 * currently in cooldown. Cooldown is stored in localStorage (no extra Firestore
 * writes). Does NOT change any scores.
 *
 * Cooldown: 3 days after "Not now" dismissal.
 * Threshold: 14 days without a zone log → stale.
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const ZONE_IDS = ['health', 'socialEmotional', 'family', 'community', 'wealth', 'faith'];

const ZONE_LABELS = {
  health:          'Health',
  socialEmotional: 'Social Emotional',
  family:          'Family',
  community:       'Community',
  wealth:          'Wealth',
  faith:           'Faith',
};

const ZONE_ICONS = {
  health:          '❤️',
  socialEmotional: '🤲',
  family:          '❤️',
  community:       '🌱',
  wealth:          '📈',
  faith:           '📖',
};

const STALE_THRESHOLD_DAYS = 14;
const COOLDOWN_DAYS        = 3;

function cooldownKey(uid, zoneId) {
  return `futureme_stale_cooldown_${uid}_${zoneId}`;
}

function isInCooldown(uid, zoneId) {
  try {
    const stored = localStorage.getItem(cooldownKey(uid, zoneId));
    if (!stored) return false;
    const dismissedAt = parseInt(stored, 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

function writeCooldown(uid, zoneId) {
  try {
    localStorage.setItem(cooldownKey(uid, zoneId), String(Date.now()));
  } catch {
    // ignore private-browsing write failures
  }
}

/**
 * Fetch the timestamp of the most recent daily log for a single zone.
 * Returns null if no logs exist.
 */
async function fetchLastLogTimestamp(userId, zoneId) {
  try {
    const ref = collection(db, 'users', userId, 'zoneLogs', zoneId, 'daily');
    const q   = query(ref, orderBy('timestamp', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const ts = snap.docs[0].data().timestamp;
    return ts ? new Date(ts).getTime() : null;
  } catch {
    return null;
  }
}

/**
 * Main hook.
 * @param {string|null} userId   - Firebase UID (null until auth resolves)
 * @param {object|null} lifeZones - liveProfile.lifeZones from AppContext
 * @returns {{ staleZone: object|null, dismissStaleZone: function }}
 */
export function useStaleZoneCheck(userId, lifeZones) {
  const [staleZone, setStaleZone] = useState(null);
  const [checked,   setChecked]   = useState(false);

  useEffect(() => {
    if (!userId || checked) return;

    let cancelled = false;

    async function run() {
      const now = Date.now();

      // Fetch last-log timestamps for all 6 zones in parallel
      const results = await Promise.all(
        ZONE_IDS.map(async zoneId => {
          const lastTs   = await fetchLastLogTimestamp(userId, zoneId);
          const daysSince = lastTs
            ? (now - lastTs) / (1000 * 60 * 60 * 24)
            : 999; // never logged → maximally stale
          const score = lifeZones?.[zoneId]?.score ?? 50;
          return { zoneId, daysSince, score };
        })
      );

      if (cancelled) return;

      // Filter to stale zones not in cooldown
      const staleZones = results
        .filter(z => z.daysSince >= STALE_THRESHOLD_DAYS)
        .filter(z => !isInCooldown(userId, z.zoneId));

      if (staleZones.length === 0) {
        setChecked(true);
        return;
      }

      // Sort: stalest first; break ties by lowest score (most in need of review)
      staleZones.sort((a, b) => {
        if (Math.abs(b.daysSince - a.daysSince) > 1) return b.daysSince - a.daysSince;
        return a.score - b.score;
      });

      const best = staleZones[0];

      setStaleZone({
        zoneId:     best.zoneId,
        label:      ZONE_LABELS[best.zoneId],
        icon:       ZONE_ICONS[best.zoneId],
        score:      best.score,
        daysSince:  Math.round(best.daysSince),
      });
      setChecked(true);
    }

    run();
    return () => { cancelled = true; };
  }, [userId, checked, lifeZones]);

  const dismissStaleZone = useCallback((zoneId) => {
    if (userId && zoneId) writeCooldown(userId, zoneId);
    setStaleZone(null);
  }, [userId]);

  return { staleZone, dismissStaleZone };
}
