import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook to fetch zone-specific daily log history from Firestore
 * Path: users/{uid}/zoneLogs/{zoneId}/daily/{YYYY-MM-DD}
 */
export function useZoneHistoryData(userId, zoneId, maxDays = 30) {
  const [zoneHistory, setZoneHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !zoneId) {
      setZoneHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const zoneLogsRef = collection(db, 'users', userId, 'zoneLogs', zoneId, 'daily');
    const zoneQuery = query(zoneLogsRef, orderBy('timestamp', 'desc'), limit(maxDays));

    const unsubscribe = onSnapshot(
      zoneQuery,
      (snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logs.push({
            id: docSnap.id,
            date: docSnap.id,
            ...data
          });
        });
        setZoneHistory(logs);
        setLoading(false);
        console.log(`📊 Loaded ${logs.length} logs for zone: ${zoneId}`);
      },
      (err) => {
        console.error(`Error loading ${zoneId} zone logs:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, zoneId, maxDays]);

  return { zoneHistory, loading, error };
}

/**
 * Fetch all zone histories at once for dashboard calculations
 */
export async function fetchAllZoneHistories(userId, maxDays = 30) {
  const zoneIds = ['health', 'socialEmotional', 'family', 'community', 'wealth', 'faith'];
  const histories = {};

  const promises = zoneIds.map(async (zoneId) => {
    try {
      const zoneLogsRef = collection(db, 'users', userId, 'zoneLogs', zoneId, 'daily');
      const zoneQuery = query(zoneLogsRef, orderBy('timestamp', 'desc'), limit(maxDays));
      const snapshot = await getDocs(zoneQuery);
      
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({
          id: docSnap.id,
          date: docSnap.id,
          ...docSnap.data()
        });
      });
      
      return { zoneId, logs };
    } catch (err) {
      console.error(`Error fetching ${zoneId} history:`, err);
      return { zoneId, logs: [] };
    }
  });

  const results = await Promise.all(promises);
  
  results.forEach(({ zoneId, logs }) => {
    histories[zoneId] = logs;
  });

  console.log('📊 Fetched all zone histories:', Object.fromEntries(
    Object.entries(histories).map(([k, v]) => [k, v.length])
  ));

  return histories;
}

/**
 * Migrate legacy dailyData to health zone logs (one-time migration)
 */
export async function migrateLegacyDailyData(userId) {
  try {
    const legacyRef = collection(db, 'users', userId, 'dailyData');
    const legacyQuery = query(legacyRef, orderBy('timestamp', 'desc'), limit(30));
    const snapshot = await getDocs(legacyQuery);

    if (snapshot.empty) {
      console.log('No legacy data to migrate');
      return false;
    }

    const { doc, setDoc } = await import('firebase/firestore');
    
    let migratedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const date = docSnap.id;

      const healthLog = {
        date,
        timestamp: data.timestamp || new Date().toISOString(),
        activity: data.activity || 3,
        nutrition: data.nutrition || 3,
        sleep: data.sleep || 3,
        stress: data.stress || 3,
        migratedFrom: 'dailyData'
      };

      const healthLogRef = doc(db, 'users', userId, 'zoneLogs', 'health', 'daily', date);
      await setDoc(healthLogRef, healthLog, { merge: true });
      migratedCount++;
    }

    console.log(`✅ Migrated ${migratedCount} legacy logs to health zone`);
    return true;
  } catch (err) {
    console.error('Migration error:', err);
    return false;
  }
}
