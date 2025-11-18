import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { analyzeTrends } from '../utils/analyzeTrends';

export function useHistoryData(userId, currentProfile) {
  const [historyData, setHistoryData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log('📚 Setting up real-time listener for daily data');
    
    // Use onSnapshot for real-time updates when user logs new metrics
    const dailyDataRef = collection(db, 'users', userId, 'dailyData');
    const dailyDataQuery = query(dailyDataRef, orderBy('timestamp', 'desc'), limit(30));
    
    const unsubscribe = onSnapshot(
      dailyDataQuery,
      (snapshot) => {
        const history = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          // Calculate lifestyleScore from daily metrics
          const lifestyleScore = ((data.activity + data.nutrition + data.sleep + (5 - data.stress)) / 16) * 100;
          history.push({ 
            id: docSnap.id,
            date: docSnap.id, // Document ID is the date (yyyy-mm-dd)
            activity: data.activity,
            nutrition: data.nutrition,
            sleep: data.sleep,
            stress: data.stress,
            lifestyleScore: lifestyleScore,
            timestamp: data.timestamp
          });
        });

        console.log(`📊 Real-time update: ${history.length} daily data entries`);
        setHistoryData(history);

        if (history.length > 0) {
          const analysis = analyzeTrends(history);
          setTrendAnalysis(analysis);
        } else {
          console.log('⚠️ No daily data found - user needs to log first day');
          setTrendAnalysis(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching daily data:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

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
