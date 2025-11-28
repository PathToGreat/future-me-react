import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const DEVICE_METRICS = {
  SLEEP: 'device_sleep',
  ACTIVITY: 'device_activity',
  STRESS: 'device_stress',
  HEART_RATE: 'device_hr',
  HRV: 'device_hrv'
};

const PROVIDERS = {
  APPLE_HEALTH: 'apple_health',
  GOOGLE_FIT: 'google_fit',
  OURA: 'oura',
  GARMIN: 'garmin',
  WHOOP: 'whoop',
  MANUAL: 'manual'
};

function normalizeDeviceData(data) {
  return {
    date: data.date || new Date().toISOString().split('T')[0],
    source: data.source || PROVIDERS.MANUAL,
    value: data.value,
    metadata: {
      rawValue: data.rawValue,
      unit: data.unit,
      quality: data.quality,
      ...data.metadata
    }
  };
}

function createDeviceEntry(userId, normalizedData, metricType) {
  return {
    userId,
    metricType,
    ...normalizedData,
    timestamp: new Date().toISOString(),
    createdAt: serverTimestamp()
  };
}

export async function saveDeviceSleep(userId, data) {
  if (!userId || !data) {
    console.error('Missing userId or data for device sleep');
    return null;
  }

  const normalized = normalizeDeviceData({
    date: data.date,
    source: data.source,
    value: {
      duration: data.duration,
      quality: data.quality,
      deepSleep: data.deepSleep,
      remSleep: data.remSleep,
      lightSleep: data.lightSleep,
      awakeTime: data.awakeTime,
      sleepScore: data.sleepScore
    },
    unit: 'hours',
    metadata: data.metadata
  });

  const entry = createDeviceEntry(userId, normalized, DEVICE_METRICS.SLEEP);
  const docRef = doc(db, 'users', userId, DEVICE_METRICS.SLEEP, normalized.date);

  try {
    await setDoc(docRef, entry, { merge: true });
    console.log('💤 Device sleep data saved:', normalized.date);
    return entry;
  } catch (error) {
    console.error('Error saving device sleep:', error);
    throw error;
  }
}

export async function saveDeviceActivity(userId, data) {
  if (!userId || !data) {
    console.error('Missing userId or data for device activity');
    return null;
  }

  const normalized = normalizeDeviceData({
    date: data.date,
    source: data.source,
    value: {
      steps: data.steps,
      activeMinutes: data.activeMinutes,
      calories: data.calories,
      distance: data.distance,
      floors: data.floors,
      activityScore: data.activityScore
    },
    unit: 'mixed',
    metadata: data.metadata
  });

  const entry = createDeviceEntry(userId, normalized, DEVICE_METRICS.ACTIVITY);
  const docRef = doc(db, 'users', userId, DEVICE_METRICS.ACTIVITY, normalized.date);

  try {
    await setDoc(docRef, entry, { merge: true });
    console.log('💪 Device activity data saved:', normalized.date);
    return entry;
  } catch (error) {
    console.error('Error saving device activity:', error);
    throw error;
  }
}

export async function saveDeviceStress(userId, data) {
  if (!userId || !data) {
    console.error('Missing userId or data for device stress');
    return null;
  }

  const normalized = normalizeDeviceData({
    date: data.date,
    source: data.source,
    value: {
      stressLevel: data.stressLevel,
      recoveryScore: data.recoveryScore,
      bodyBattery: data.bodyBattery,
      stressScore: data.stressScore
    },
    unit: 'score',
    metadata: data.metadata
  });

  const entry = createDeviceEntry(userId, normalized, DEVICE_METRICS.STRESS);
  const docRef = doc(db, 'users', userId, DEVICE_METRICS.STRESS, normalized.date);

  try {
    await setDoc(docRef, entry, { merge: true });
    console.log('⚖️ Device stress data saved:', normalized.date);
    return entry;
  } catch (error) {
    console.error('Error saving device stress:', error);
    throw error;
  }
}

export async function saveDeviceHeartRate(userId, data) {
  if (!userId || !data) {
    console.error('Missing userId or data for device heart rate');
    return null;
  }

  const normalized = normalizeDeviceData({
    date: data.date,
    source: data.source,
    value: {
      restingHR: data.restingHR,
      averageHR: data.averageHR,
      maxHR: data.maxHR,
      minHR: data.minHR
    },
    unit: 'bpm',
    metadata: data.metadata
  });

  const entry = createDeviceEntry(userId, normalized, DEVICE_METRICS.HEART_RATE);
  const docRef = doc(db, 'users', userId, DEVICE_METRICS.HEART_RATE, normalized.date);

  try {
    await setDoc(docRef, entry, { merge: true });
    console.log('❤️ Device heart rate data saved:', normalized.date);
    return entry;
  } catch (error) {
    console.error('Error saving device heart rate:', error);
    throw error;
  }
}

export async function saveDeviceHRV(userId, data) {
  if (!userId || !data) {
    console.error('Missing userId or data for device HRV');
    return null;
  }

  const normalized = normalizeDeviceData({
    date: data.date,
    source: data.source,
    value: {
      avgHRV: data.avgHRV,
      rmssd: data.rmssd,
      sdnn: data.sdnn,
      hrvScore: data.hrvScore
    },
    unit: 'ms',
    metadata: data.metadata
  });

  const entry = createDeviceEntry(userId, normalized, DEVICE_METRICS.HRV);
  const docRef = doc(db, 'users', userId, DEVICE_METRICS.HRV, normalized.date);

  try {
    await setDoc(docRef, entry, { merge: true });
    console.log('📊 Device HRV data saved:', normalized.date);
    return entry;
  } catch (error) {
    console.error('Error saving device HRV:', error);
    throw error;
  }
}

export async function getDeviceDataForDate(userId, date, metricType) {
  if (!userId || !date || !metricType) return null;

  const docRef = doc(db, 'users', userId, metricType, date);
  const docSnap = await getDoc(docRef);

  return docSnap.exists() ? docSnap.data() : null;
}

export async function getDeviceDataHistory(userId, metricType, days = 30) {
  if (!userId || !metricType) return [];

  const collRef = collection(db, 'users', userId, metricType);
  const q = query(collRef, orderBy('date', 'desc'), limit(days));
  const snapshot = await getDocs(q);

  const history = [];
  snapshot.forEach(doc => {
    history.push({ id: doc.id, ...doc.data() });
  });

  return history;
}

export async function getAllDeviceDataForDate(userId, date) {
  if (!userId || !date) return {};

  const results = {};

  for (const [key, metricType] of Object.entries(DEVICE_METRICS)) {
    const data = await getDeviceDataForDate(userId, date, metricType);
    if (data) {
      results[key.toLowerCase()] = data;
    }
  }

  return results;
}

export async function getDeviceSyncStatus(userId) {
  if (!userId) return {};

  const status = {};

  for (const [key, metricType] of Object.entries(DEVICE_METRICS)) {
    try {
      const history = await getDeviceDataHistory(userId, metricType, 1);
      status[key.toLowerCase()] = {
        hasData: history.length > 0,
        lastSync: history.length > 0 ? history[0].timestamp : null,
        source: history.length > 0 ? history[0].source : null
      };
    } catch (error) {
      status[key.toLowerCase()] = { hasData: false, lastSync: null, source: null };
    }
  }

  return status;
}

export { DEVICE_METRICS, PROVIDERS };
