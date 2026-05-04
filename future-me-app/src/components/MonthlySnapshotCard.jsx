import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateMonthlySnapshot, saveSnapshot, getCurrentMonthKey } from '../utils/monthlySnapshotEngine';
import { checkMonthlySnapshot } from '../utils/reminderEngine';

export default function MonthlySnapshotCard({ onOpenSnapshot }) {
  const { liveProfile, historyData, habits, achievements } = useApp();
  const { user } = useAuth();
  const [snapshotStatus, setSnapshotStatus] = useState(null);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  useEffect(() => {
    if (!historyData || historyData.length === 0) return;

    const snapshot = generateMonthlySnapshot(historyData, liveProfile, habits, achievements, currentMonthKey);
    setSnapshotStatus(snapshot);

    if (snapshot.available && user?.uid) {
      saveSnapshot(user.uid, snapshot);
      checkMonthlySnapshot(user.uid);
    }
  }, [historyData, liveProfile, habits, achievements, currentMonthKey, user?.uid]);

  if (!snapshotStatus) return null;

  const isForming = !snapshotStatus.available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`rounded-2xl border shadow-sm px-5 py-4 border-l-4 ${
        isForming
          ? 'bg-gradient-to-r from-emerald-100/80 via-emerald-50/50 to-white/80 border-emerald-100/60 border-l-emerald-400'
          : 'bg-gradient-to-r from-indigo-50/50 to-white border-indigo-100/60 border-l-indigo-300'
      }`}
    >
      <button
        onClick={() => snapshotStatus.available && onOpenSnapshot && onOpenSnapshot()}
        disabled={!snapshotStatus.available}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-base">{isForming ? '🌱' : '📊'}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Snapshot</span>
              {isForming && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium border border-emerald-100">
                  Forming
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {snapshotStatus.available
                ? `View ${snapshotStatus.label} snapshot`
                : `Log ${snapshotStatus.logsNeeded} more day${snapshotStatus.logsNeeded === 1 ? '' : 's'} this month to complete the snapshot`
              }
            </p>
          </div>
        </div>

        {snapshotStatus.available && (
          <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}
