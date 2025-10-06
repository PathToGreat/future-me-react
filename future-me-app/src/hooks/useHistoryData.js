import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { analyzeTrends } from '../utils/analyzeTrends';

export function useHistoryData(userId, currentProfile) {
  const [historyData, setHistoryData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !currentProfile) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        console.log('📚 Fetching history data for user:', userId);
        
        const historyRef = collection(db, 'users', userId, 'history');
        const historyQuery = query(historyRef, orderBy('date', 'desc'), limit(7));
        const snapshot = await getDocs(historyQuery);
        
        const history = [];
        snapshot.forEach(doc => {
          history.push({ id: doc.id, ...doc.data() });
        });

        console.log(`📊 Retrieved ${history.length} historical snapshots`);
        setHistoryData(history);

        if (history.length > 0) {
          const analysis = analyzeTrends(history);
          setTrendAnalysis(analysis);
        } else {
          console.log('⚠️ No historical data found - creating first snapshot');
          await saveDailySnapshot(userId, currentProfile);
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching history data:', error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, currentProfile?.lifestyleScore]);

  return { historyData, trendAnalysis, loading };
}

export async function saveDailySnapshot(userId, profile) {
  if (!userId || !profile) {
    console.error('❌ Cannot save snapshot: missing user or profile data');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  
  const snapshot = {
    date: today,
    timestamp: new Date().toISOString(),
    activity: profile.activity || 3,
    nutrition: profile.nutrition || 3,
    sleep: profile.sleep || 3,
    stress: profile.stress || 3,
    lifestyleScore: profile.lifestyleScore || 50,
    age: profile.age,
    goals: profile.goals || []
  };

  try {
    const snapshotRef = doc(db, 'users', userId, 'history', today);
    await setDoc(snapshotRef, snapshot, { merge: true });
    console.log('💾 Daily snapshot saved successfully for:', today);
    console.log('📊 Snapshot data:', snapshot);
  } catch (error) {
    console.error('❌ Error saving daily snapshot:', error);
  }
}

export async function updateTodaySnapshot(userId, profile) {
  if (!userId || !profile) return;

  await saveDailySnapshot(userId, profile);
  console.log('🔄 Today\'s snapshot updated with latest data');
}
