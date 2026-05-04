import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const getTodayUTC = () => new Date().toISOString().split('T')[0];
const getYesterdayUTC = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const prefsRef = (userId) => doc(db, 'users', userId, 'habitPrefs', 'defaults');

/**
 * Manages user-specific state for the prebuilt default habit library.
 *
 * Firestore path: users/{uid}/habitPrefs/defaults
 * Shape: { hidden: string[], completions: { [habitId]: { lastCompletedDate, streak } } }
 *
 * Habit *definitions* live in src/config/defaultHabits.js — not duplicated per user.
 */
export function useDefaultHabits(userId) {
  const [hiddenIds, setHiddenIds]     = useState([]);
  const [completions, setCompletions] = useState({});
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const ref = prefsRef(userId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHiddenIds(data.hidden || []);
          setCompletions(data.completions || {});
        } else {
          setHiddenIds([]);
          setCompletions({});
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [userId]);

  const hideDefault = async (habitId) => {
    const ref = prefsRef(userId);
    const newHidden = [...new Set([...hiddenIds, habitId])];
    await setDoc(ref, { hidden: newHidden }, { merge: true });
  };

  const restoreDefault = async (habitId) => {
    const ref = prefsRef(userId);
    const newHidden = hiddenIds.filter((id) => id !== habitId);
    await setDoc(ref, { hidden: newHidden }, { merge: true });
  };

  const completeDefault = async (habitId) => {
    const today     = getTodayUTC();
    const yesterday = getYesterdayUTC();
    const current   = completions[habitId] || { lastCompletedDate: null, streak: 0 };

    if (current.lastCompletedDate === today) {
      return { alreadyCompleted: true };
    }

    const newStreak =
      current.lastCompletedDate === yesterday
        ? (current.streak || 0) + 1
        : 1;

    const ref = prefsRef(userId);
    await setDoc(
      ref,
      {
        completions: {
          ...completions,
          [habitId]: { lastCompletedDate: today, streak: newStreak },
        },
      },
      { merge: true }
    );

    return { success: true, newStreak };
  };

  return { hiddenIds, completions, loading, hideDefault, restoreDefault, completeDefault };
}
