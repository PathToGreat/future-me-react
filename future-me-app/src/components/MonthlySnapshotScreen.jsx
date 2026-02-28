import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateMonthlySnapshot, loadAllSnapshotKeys, loadSnapshot, getCurrentMonthKey } from '../utils/monthlySnapshotEngine';

function MiniAvatar({ avatarData, label }) {
  const getColor = (energy) => {
    if (energy >= 75) return '#10b981';
    if (energy >= 50) return '#f59e0b';
    return '#94a3b8';
  };

  const getPostureY = (posture) => {
    if (posture >= 80) return -3;
    if (posture >= 60) return -1;
    if (posture >= 40) return 0;
    return 2;
  };

  const getMouth = (expression) => {
    if (expression >= 80) return 'M 75 90 Q 100 102 125 90';
    if (expression >= 60) return 'M 80 88 Q 100 96 120 88';
    if (expression >= 40) return 'M 85 90 L 115 90';
    return 'M 80 94 Q 100 86 120 94';
  };

  const getEyeShape = (expression) => {
    if (expression >= 70) return { happy: true, squint: false };
    if (expression >= 40) return { happy: false, squint: false };
    return { happy: false, squint: true };
  };

  const color = getColor(avatarData.energy);
  const postureY = getPostureY(avatarData.posture);
  const mouth = getMouth(avatarData.expression);
  const eyes = getEyeShape(avatarData.expression);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-20 h-24 flex items-center justify-center">
        <svg viewBox="0 0 200 300" className="w-full h-full">
          <g transform={`translate(0, ${postureY})`} style={{ transformOrigin: '100px 150px' }}>
            <ellipse cx="100" cy="70" rx="45" ry="50" fill={color} />
            {eyes.squint ? (
              <>
                <line x1="75" y1="65" x2="95" y2="68" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                <line x1="105" y1="68" x2="125" y2="65" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="85" cy="65" rx="8" ry={eyes.happy ? 6 : 10} fill="white" />
                <ellipse cx="115" cy="65" rx="8" ry={eyes.happy ? 6 : 10} fill="white" />
                <circle cx="85" cy="67" r="5" fill="#1f2937" />
                <circle cx="115" cy="67" r="5" fill="#1f2937" />
                {eyes.happy && (
                  <>
                    <circle cx="87" cy="64" r="2" fill="white" />
                    <circle cx="117" cy="64" r="2" fill="white" />
                  </>
                )}
              </>
            )}
            <path d={mouth} stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
            <rect x="50" y="120" width="100" height="100" rx="20" fill={color} />
            <rect x="55" y="120" width="18" height="80" rx="10" fill={color} />
            <rect x="127" y="120" width="18" height="80" rx="10" fill={color} />
            <rect x="75" y="220" width="20" height="70" rx="10" fill={color} />
            <rect x="105" y="220" width="20" height="70" rx="10" fill={color} />
          </g>
        </svg>
      </div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

function ShiftDescription({ topShift }) {
  if (!topShift) return <p className="text-sm text-gray-500">Your patterns stayed steady this month.</p>;

  if (topShift.direction === 'improved' && topShift.label) {
    return <p className="text-sm text-gray-500">{topShift.label} became more consistent compared to your baseline this month.</p>;
  }

  if (topShift.direction === 'softened') {
    return <p className="text-sm text-gray-500">Some patterns softened compared to your baseline this month.</p>;
  }

  return <p className="text-sm text-gray-500">Your patterns stayed steady this month.</p>;
}

export default function MonthlySnapshotScreen({ isOpen, onClose }) {
  const { liveProfile, historyData, habits, achievements } = useApp();
  const { user } = useAuth();
  const [pastSnapshots, setPastSnapshots] = useState([]);
  const [viewingMonth, setViewingMonth] = useState(null);
  const [viewingSnapshot, setViewingSnapshot] = useState(null);
  const [showPastList, setShowPastList] = useState(false);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  const currentSnapshot = useMemo(() => {
    if (!historyData) return null;
    return generateMonthlySnapshot(historyData, liveProfile, habits, achievements, currentMonthKey);
  }, [historyData, liveProfile, habits, achievements, currentMonthKey]);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadAllSnapshotKeys(user.uid).then(keys => {
        setPastSnapshots(keys.filter(k => k.monthKey !== currentMonthKey));
      });
      setViewingMonth(null);
      setViewingSnapshot(null);
      setShowPastList(false);
    }
  }, [isOpen, user?.uid, currentMonthKey]);

  const handleViewPast = async (monthKey) => {
    if (!user?.uid) return;
    const snap = await loadSnapshot(user.uid, monthKey);
    if (snap) {
      setViewingMonth(monthKey);
      setViewingSnapshot(snap);
      setShowPastList(false);
    }
  };

  const handleBackToCurrent = () => {
    setViewingMonth(null);
    setViewingSnapshot(null);
  };

  const activeSnapshot = viewingSnapshot || currentSnapshot;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Monthly Snapshot</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSnapshot?.label || 'Loading...'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {viewingMonth && (
              <button
                onClick={handleBackToCurrent}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to current month
              </button>
            )}

            {activeSnapshot && !activeSnapshot.available && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  Log {activeSnapshot.logsNeeded} more day{activeSnapshot.logsNeeded === 1 ? '' : 's'} this month to generate a snapshot.
                </p>
              </div>
            )}

            {activeSnapshot && activeSnapshot.available && (
              <>
                <div className="bg-slate-50 rounded-xl p-5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Avatar Comparison</p>
                  <div className="flex items-center justify-center gap-8">
                    <MiniAvatar avatarData={activeSnapshot.startAvatar} label="Start of Month" />
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-xs text-slate-300">{activeSnapshot.totalLogs} days</span>
                    </div>
                    <MiniAvatar avatarData={activeSnapshot.endAvatar} label="End of Month" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Top Pattern Shift</p>
                    <ShiftDescription topShift={activeSnapshot.topShift} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Zone Summary</p>
                    <div className="space-y-1.5">
                      {activeSnapshot.zoneSummary.strongest ? (
                        <p className="text-sm text-gray-500">
                          <span className="text-gray-700 font-medium">Most Stable:</span> {activeSnapshot.zoneSummary.strongest.label}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Not enough zone data yet.</p>
                      )}
                      {activeSnapshot.zoneSummary.sensitive ? (
                        <p className="text-sm text-gray-500">
                          <span className="text-gray-700 font-medium">Most Sensitive Right Now:</span> {activeSnapshot.zoneSummary.sensitive.label}
                        </p>
                      ) : activeSnapshot.zoneSummary.strongest ? (
                        <p className="text-sm text-gray-400">Other zones are holding close together.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Monthly Summary</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{activeSnapshot.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">
                      Direction: {activeSnapshot.direction === 'strengthening' ? 'Strengthening' :
                                  activeSnapshot.direction === 'declining' ? 'Declining' : 'Stable'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {pastSnapshots.length > 0 && (
              <div className="border-t border-gray-50 pt-4">
                <button
                  onClick={() => setShowPastList(!showPastList)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <motion.svg
                    animate={{ rotate: showPastList ? 90 : 0 }}
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                  Previous months ({pastSnapshots.length})
                </button>
                <AnimatePresence>
                  {showPastList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {pastSnapshots.map(snap => (
                          <button
                            key={snap.monthKey}
                            onClick={() => handleViewPast(snap.monthKey)}
                            className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <span className="text-sm text-gray-700 font-medium">{snap.label}</span>
                              <span className="text-xs text-slate-400 ml-2">{snap.totalLogs} days logged</span>
                            </div>
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
