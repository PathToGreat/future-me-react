import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const REMINDER_TYPES = {
  DIRECTION_CHANGE: 'direction_change',
  NEW_PATTERN: 'new_pattern',
  MONTHLY_SNAPSHOT: 'monthly_snapshot',
  BASELINE_SHIFT: 'baseline_shift'
};

const REMINDER_MESSAGES = {
  direction_change_strengthening: 'Your direction has shifted to Strengthening. Review your reflection.',
  direction_change_declining: 'Your direction has shifted. Review your reflection.',
  direction_change_stable: 'Your direction has stabilized. Review your reflection.',
  new_pattern: 'A new pattern was detected in your recent data.',
  monthly_snapshot: 'Your monthly snapshot is ready.',
  baseline_shift: 'A meaningful change was observed in your baseline data.'
};

function generateReminderId(type, context) {
  const dateKey = new Date().toISOString().split('T')[0];
  const contextKey = context || '';
  return `${type}-${dateKey}-${contextKey}`.replace(/[^a-zA-Z0-9-]/g, '');
}

export async function loadReminderPreferences(userId) {
  if (!userId) return getDefaultPreferences();
  try {
    const ref = doc(db, 'users', userId, 'settings', 'reminders');
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    return getDefaultPreferences();
  } catch (error) {
    return getDefaultPreferences();
  }
}

export async function saveReminderPreferences(userId, preferences) {
  if (!userId) return;
  try {
    const ref = doc(db, 'users', userId, 'settings', 'reminders');
    await setDoc(ref, { ...preferences, updatedAt: new Date().toISOString() });
  } catch (error) {}
}

function getDefaultPreferences() {
  return {
    enabled: false,
    directionChanges: true,
    newPatterns: true,
    monthlySnapshot: true
  };
}

export async function createReminder(userId, type, message, context) {
  if (!userId) return null;

  const prefs = await loadReminderPreferences(userId);
  if (!prefs.enabled) return null;

  if (type === REMINDER_TYPES.DIRECTION_CHANGE && !prefs.directionChanges) return null;
  if (type === REMINDER_TYPES.NEW_PATTERN && !prefs.newPatterns) return null;
  if (type === REMINDER_TYPES.MONTHLY_SNAPSHOT && !prefs.monthlySnapshot) return null;

  const id = generateReminderId(type, context);

  try {
    const ref = doc(db, 'users', userId, 'reminders', id);
    const existing = await getDoc(ref);
    if (existing.exists()) return null;

    const reminder = {
      id,
      type,
      message,
      context: context || null,
      dismissed: false,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    await setDoc(ref, reminder);
    return reminder;
  } catch (error) {
    return null;
  }
}

export async function loadActiveReminders(userId) {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'reminders');
    const q = query(colRef, where('dismissed', '==', false), orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    return [];
  }
}

export async function dismissReminder(userId, reminderId) {
  if (!userId || !reminderId) return;
  try {
    const ref = doc(db, 'users', userId, 'reminders', reminderId);
    await updateDoc(ref, { dismissed: true, dismissedAt: new Date().toISOString() });
  } catch (error) {}
}

export async function checkDirectionChange(userId, currentDirection, previousDirection) {
  if (!currentDirection || !previousDirection) return null;
  if (currentDirection === previousDirection) return null;

  const messageKey = `direction_change_${currentDirection}`;
  const message = REMINDER_MESSAGES[messageKey] || REMINDER_MESSAGES.direction_change_stable;

  return createReminder(userId, REMINDER_TYPES.DIRECTION_CHANGE, message, currentDirection);
}

export async function checkNewPattern(userId, patternType) {
  if (!patternType) return null;
  return createReminder(userId, REMINDER_TYPES.NEW_PATTERN, REMINDER_MESSAGES.new_pattern, patternType);
}

export async function checkMonthlySnapshot(userId) {
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  return createReminder(userId, REMINDER_TYPES.MONTHLY_SNAPSHOT, REMINDER_MESSAGES.monthly_snapshot, monthKey);
}

export async function checkBaselineShift(userId, shiftMetric) {
  if (!shiftMetric) return null;
  return createReminder(userId, REMINDER_TYPES.BASELINE_SHIFT, REMINDER_MESSAGES.baseline_shift, shiftMetric);
}

export { REMINDER_TYPES };
