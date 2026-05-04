import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FutureSelfPreview from '../components/FutureSelfPreview';
import MicroSuggestionCard from '../components/MicroSuggestionCard';
import ReassessmentBanner from '../components/ReassessmentBanner';
import ProgressTimeline from '../components/ProgressTimeline';
import ConsistencyStreaks from '../components/ConsistencyStreaks';
import WeeklyReflectionPrompt from '../components/WeeklyReflectionPrompt';
import ProgressSnapshot from '../components/ProgressSnapshot';
import FirstMeaningfulWin from '../components/FirstMeaningfulWin';
import GentleCommitmentPrompt from '../components/GentleCommitmentPrompt';
import OperatingStyleCard from '../components/OperatingStyleCard';
import TodaysReflection from '../components/TodaysReflection';
import MiniAvatarPreview from '../components/MiniAvatarPreview';
import DirectionIndicator from '../components/DirectionIndicator';
import MonthlySnapshotCard from '../components/MonthlySnapshotCard';
import MonthlySnapshotScreen from '../components/MonthlySnapshotScreen';
import ProgressDetails from '../components/ProgressDetails';
import InsightsFeed from '../components/InsightsFeed';
import ReminderBanner from '../components/ReminderBanner';
import { detectPatterns, selectPatternForDisplay } from '../utils/trendPatternEngine';
import { checkNewPattern } from '../utils/reminderEngine';
import { trackPatternSurfaced, trackPatternDismissed, getLastShownPatterns, trackReturnAfterPattern } from '../utils/patternMetrics';
import { trackSilenceSession, trackPatternSession, trackPatternExpanded, trackPatternDismissedWithTiming, trackSessionReturn, trackReflectionResponse } from '../utils/patternValidation';
import { doc, updateDoc, setDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ─── Today's Signals strip ────────────────────────────────────────────────────
function TodaysSignals({ historyData }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry   = historyData?.[0];
  const yesterdayEntry = historyData?.[1];
  const loggedToday  = !!(todayEntry?.date?.slice?.(0, 10) === today);

  const SIGNALS = [
    { label: 'Sleep',      icon: '💤', key: 'sleep'     },
    { label: 'Movement',   icon: '💪', key: 'activity'  },
    { label: 'Nutrition',  icon: '🌱', key: 'nutrition' },
    { label: 'Stress',     icon: '⚖️', key: 'stress'    },
    { label: 'Reflection', icon: '📖', key: null        },
  ];

  // Which single metric shifted most since yesterday — carries a faint visual lift
  const mostChangedKey = useMemo(() => {
    if (!loggedToday || !yesterdayEntry) return null;
    const candidates = ['sleep', 'activity', 'nutrition', 'stress'].map(k => ({
      key: k,
      delta: Math.abs((todayEntry?.[k] ?? 3) - (yesterdayEntry?.[k] ?? 3)),
    }));
    candidates.sort((a, b) => b.delta - a.delta);
    return candidates[0]?.delta >= 0.5 ? candidates[0].key : null;
  }, [loggedToday, todayEntry, yesterdayEntry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white/55 rounded-xl border border-white/70 px-4 py-3"
    >
      {/* Header — pulsing dot when not yet logged, solid when logged */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          {loggedToday ? (
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
          ) : (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"
            />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Today's Signals
          </span>
        </div>
        {loggedToday ? (
          <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            ✓ Logged today
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Not yet logged</span>
        )}
      </div>

      {/* Signal chips — most-changed chip gets subtle elevation */}
      <div className="flex gap-1.5 flex-wrap">
        {SIGNALS.map(({ label, icon, key }) => {
          const active    = loggedToday && (key === null || todayEntry?.[key] !== undefined);
          const elevated  = active && key !== null && key === mostChangedKey;
          return (
            <motion.div
              key={label}
              initial={{ opacity: elevated ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={elevated ? { delay: 0.4, duration: 0.45 } : {}}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                elevated
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm ring-1 ring-indigo-300/50 scale-[1.03] font-semibold'
                  : active
                    ? 'bg-indigo-50/80 text-indigo-600 border-indigo-100 font-medium'
                    : 'bg-white/60 text-gray-300 border-gray-100/80 font-medium'
              }`}
            >
              <span className={active ? 'opacity-100' : 'opacity-30'}>{icon}</span>
              <span>{label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function HomeScreen({ onNavigate }) {
  const {
    liveProfile,
    habits,
    achievements,
    showReassessmentBanner,
    reassessmentAnalysis,
    dismissReassessmentBanner,
    historyData,
  } = useApp();
  const { user } = useAuth();
  
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showMonthlySnapshot, setShowMonthlySnapshot] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [patternChecked, setPatternChecked] = useState(false);

  useEffect(() => {
    const initClarityMetrics = async () => {
      if (!user?.uid) return;
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'clarity');
        const metricsSnap = await getDoc(metricsRef);
        if (!metricsSnap.exists()) {
          await setDoc(metricsRef, {
            whatThisMeansExpanded: 0,
            whatChangedViewed: 0,
            progressSnapshotViewed: 0,
            progressSnapshotShared: 0,
            returnAfterExplanation: 0,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {}
    };
    initClarityMetrics();
  }, [user?.uid]);

  useEffect(() => {
    const detectAndDisplayPattern = async () => {
      if (!user?.uid || !historyData || historyData.length < 7 || patternChecked) return;
      
      setPatternChecked(true);
      
      try {
        await trackReturnAfterPattern(user.uid);
        await trackSessionReturn(user.uid);
        
        const lastShown = await getLastShownPatterns(user.uid);
        const patterns = detectPatterns(historyData, liveProfile?.lifeZones);
        const selectedPattern = selectPatternForDisplay(patterns, lastShown, 2);
        
        if (selectedPattern) {
          setCurrentPattern(selectedPattern);
          await trackPatternSurfaced(user.uid, selectedPattern.type, selectedPattern);
          await trackPatternSession(user.uid, selectedPattern.type);
          await checkNewPattern(user.uid, selectedPattern.type);
        } else {
          await trackSilenceSession(user.uid);
        }
      } catch (error) {
        console.error('Error detecting patterns:', error);
      }
    };
    
    detectAndDisplayPattern();
  }, [user?.uid, historyData, liveProfile?.lifeZones, patternChecked]);

  const handlePatternDismiss = async (patternType, displayDurationMs) => {
    if (user?.uid) {
      await trackPatternDismissed(user.uid, patternType);
      await trackPatternDismissedWithTiming(user.uid, patternType, displayDurationMs);
    }
    setCurrentPattern(null);
  };

  const handlePatternExpand = async (patternType) => {
    if (user?.uid) {
      await trackPatternExpanded(user.uid, patternType);
    }
  };

  const handlePatternReflection = async (patternType, response) => {
    if (user?.uid) {
      await trackReflectionResponse(user.uid, patternType, response);
    }
  };

  const handleOpenSnapshot = async () => {
    setShowSnapshot(true);
    if (user?.uid) {
      try {
        const metricsRef = doc(db, 'users', user.uid, 'metrics', 'clarity');
        await updateDoc(metricsRef, {
          progressSnapshotViewed: increment(1),
          lastSnapshotView: new Date().toISOString()
        }).catch(() => {});
      } catch (error) {}
    }
  };

  // Lightweight direction proxy — drives directional atmosphere on background blobs
  const directionHint = useMemo(() => {
    if (!historyData || historyData.length < 7) return 'stable';
    const recent = historyData.slice(0, 3);
    const older  = historyData.slice(3, 7);
    const score  = arr => arr.reduce((s, d) => s + (d.activity||3) + (d.nutrition||3) + (d.sleep||3) - (d.stress||3), 0) / arr.length;
    const diff   = score(recent) - score(older);
    return diff > 0.6 ? 'strengthening' : diff < -0.6 ? 'declining' : 'stable';
  }, [historyData]);

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 relative">
      {/* Atmospheric background — top blob warms/cools with direction; barely perceptible */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full blur-[80px] transition-colors duration-[3000ms] ${
          directionHint === 'strengthening' ? 'bg-violet-200/22'
          : directionHint === 'declining'   ? 'bg-blue-300/18'
          :                                   'bg-indigo-200/25'
        }`} />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-blue-200/20 blur-[70px]" />
        <div className={`absolute bottom-24 -right-16 w-72 h-72 rounded-full blur-[60px] transition-colors duration-[3000ms] ${
          directionHint === 'strengthening' ? 'bg-amber-100/18'
          : directionHint === 'declining'   ? 'bg-slate-300/14'
          :                                   'bg-emerald-200/18'
        }`} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">Your Dashboard</h1>
        <p className="text-gray-400 text-xs mt-0.5">{dateLabel}</p>
      </motion.div>

      <ReminderBanner />

      {/* ── Top zone: unified "active system" panel ─────────────────
           motion.div gives the panel a subtle hover lift so it
           feels alive and clickable as a whole. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: '0 10px 32px rgba(99,102,241,0.12)' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-3xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white/60 border border-indigo-100/60 p-3 space-y-2.5 shadow-sm"
      >
        <MiniAvatarPreview onNavigateToAvatar={onNavigate} />
        <TodaysSignals historyData={historyData} />
      </motion.div>

      <TodaysReflection
        currentPattern={currentPattern}
        onPatternDismiss={handlePatternDismiss}
        onPatternExpand={handlePatternExpand}
        onPatternReflection={handlePatternReflection}
      />

      <DirectionIndicator />

      <WeeklyReflectionPrompt />

      <MonthlySnapshotCard onOpenSnapshot={() => setShowMonthlySnapshot(true)} />

      {/* CTA — intentional action point with stronger visual presence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-gradient-to-br from-indigo-100/80 via-blue-50/70 to-indigo-50/60 rounded-2xl border border-indigo-200/60 p-3 shadow-md"
      >
        <motion.button
          whileHover={{ y: -1, boxShadow: '0 6px 24px rgba(99,102,241,0.25)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate && onNavigate('metrics')}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-3"
        >
          <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-base flex-shrink-0">📊</span>
          <span className="text-[15px]">Log Today's Metrics</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
      >
        <ProgressDetails>
          <FutureSelfPreview 
            lifestyleScore={liveProfile.lifestyleScore || 50} 
            lifeZones={liveProfile.lifeZones}
            habits={habits}
            achievements={achievements}
          />

          <ReassessmentBanner
            isVisible={showReassessmentBanner}
            improvements={reassessmentAnalysis?.improvements || []}
            declines={reassessmentAnalysis?.declines || []}
            summary={reassessmentAnalysis?.summary}
            onDismiss={dismissReassessmentBanner}
          />

          <OperatingStyleCard />

          <MicroSuggestionCard 
            onViewInsights={() => {
              const insightsSection = document.querySelector('[data-section="insights"]');
              if (insightsSection) {
                insightsSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          />

          <ProgressTimeline />
          <ConsistencyStreaks />

          {historyData && historyData.length >= 3 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleOpenSnapshot}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-2 transition-colors"
              >
                View Progress Snapshot
              </button>
            </div>
          )}
        </ProgressDetails>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.30, duration: 0.4 }}
      >
        <InsightsFeed />
      </motion.div>

      <ProgressSnapshot 
        isOpen={showSnapshot} 
        onClose={() => setShowSnapshot(false)} 
      />

      <FirstMeaningfulWin />
      <GentleCommitmentPrompt />

      <MonthlySnapshotScreen
        isOpen={showMonthlySnapshot}
        onClose={() => setShowMonthlySnapshot(false)}
      />
    </div>
  );
}
