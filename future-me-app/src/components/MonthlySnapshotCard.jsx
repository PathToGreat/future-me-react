import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateMonthlySnapshot, saveSnapshot, getCurrentMonthKey } from '../utils/monthlySnapshotEngine';

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
    }
  }, [historyData, liveProfile, habits, achievements, currentMonthKey, user?.uid]);

  if (!snapshotStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
    >
      <button
        onClick={() => snapshotStatus.available && onOpenSnapshot && onOpenSnapshot()}
        disabled={!snapshotStatus.available}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Snapshot</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {snapshotStatus.available
                ? `View ${snapshotStatus.label} snapshot`
                : `Log ${snapshotStatus.logsNeeded} more day${snapshotStatus.logsNeeded === 1 ? '' : 's'} this month to generate a snapshot`
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
