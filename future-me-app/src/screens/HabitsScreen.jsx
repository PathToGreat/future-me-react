import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { DEFAULT_HABITS } from '../config/defaultHabits';
import { useDefaultHabits } from '../hooks/useDefaultHabits';
import DefaultHabitCard from '../components/DefaultHabitCard';
import HabitCard from '../components/HabitCard';
import HabitCreationModal from '../components/HabitCreationModal';

// ─── Insight banner shown after a default habit is completed ────────────────
function InsightBanner({ insight, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 9000);
    return () => clearTimeout(t);
  }, [insight, onDismiss]);

  return (
    <motion.div
      key={insight}
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-3 mb-3">
        <span className="text-indigo-400 mt-0.5 flex-shrink-0">📖</span>
        <p className="text-[12px] text-indigo-800 leading-relaxed flex-1">{insight}</p>
        <button
          onClick={onDismiss}
          className="text-indigo-300 hover:text-indigo-500 flex-shrink-0 mt-0.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title, count, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Available habits restore panel ─────────────────────────────────────────
function AvailableHabitsPanel({ hiddenHabits, onRestore }) {
  const [open, setOpen] = useState(false);
  if (hiddenHabits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/40 rounded-xl border border-white/60 p-4"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Available Habits
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {hiddenHabits.length}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-gray-400 mt-2 mb-3">
              These habits are part of the core library but not currently active.
            </p>
            <div className="space-y-2">
              {hiddenHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2.5 border border-white/70"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{habit.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{habit.title}</span>
                  </div>
                  <button
                    onClick={() => onRestore(habit.id)}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const { user } = useAuth();
  const { habits, refreshHabits, handleAchievementsEarned } = useApp();

  const {
    hiddenIds,
    completions,
    loading: defaultsLoading,
    hideDefault,
    restoreDefault,
    completeDefault,
  } = useDefaultHabits(user?.uid);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [activeInsight,  setActiveInsight]  = useState(null);

  // Split default habits into active and hidden
  const activeDefaults = DEFAULT_HABITS.filter((h) => !hiddenIds.includes(h.id));
  const hiddenDefaults  = DEFAULT_HABITS.filter((h) =>  hiddenIds.includes(h.id));

  const handleHabitCreated = () => {
    refreshHabits();
    setShowHabitModal(false);
  };

  const handleDefaultComplete = async (habitId, insight) => {
    const result = await completeDefault(habitId);
    if (result?.success && insight) {
      setActiveInsight(insight);
    }
  };

  const handleCustomCompletion = () => {
    refreshHabits();
  };

  const handleCustomDelete = () => {
    refreshHabits();
  };

  const totalActiveToday =
    activeDefaults.filter((h) => {
      const today = new Date().toISOString().split('T')[0];
      return completions[h.id]?.lastCompletedDate === today;
    }).length +
    habits.filter((h) => {
      const today = new Date().toISOString().split('T')[0];
      return h.lastCompletedDate === today;
    }).length;

  const totalActive = activeDefaults.length + habits.length;

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Habits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Choose the daily inputs that shape your future self
          </p>
        </div>
        <button
          onClick={() => setShowHabitModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </motion.div>

      {/* ── Daily summary pill ── */}
      {totalActive > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            totalActiveToday === totalActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {totalActiveToday === totalActive ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            )}
            {totalActiveToday} of {totalActive} completed today
          </div>
        </motion.div>
      )}

      {/* ── Core Habits section ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white/40 rounded-2xl border border-white/60 p-4 space-y-3"
      >
        <SectionHeader
          title="Core Habits"
          count={activeDefaults.length}
        />

        {/* Insight banner */}
        <AnimatePresence mode="wait">
          {activeInsight && (
            <InsightBanner
              key={activeInsight}
              insight={activeInsight}
              onDismiss={() => setActiveInsight(null)}
            />
          )}
        </AnimatePresence>

        {defaultsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            <AnimatePresence>
              {activeDefaults.map((habit) => (
                <DefaultHabitCard
                  key={habit.id}
                  habit={habit}
                  completion={completions[habit.id]}
                  onComplete={handleDefaultComplete}
                  onHide={hideDefault}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Custom Habits section ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white/40 rounded-2xl border border-white/60 p-4"
      >
        <SectionHeader
          title="Custom Habits"
          count={habits.length}
          action={
            <button
              onClick={() => setShowHabitModal(true)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            >
              + Add
            </button>
          }
        />

        {habits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-3">
              No custom habits yet. Add one that fits your own routine.
            </p>
            <button
              onClick={() => setShowHabitModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add custom habit
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            <AnimatePresence>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  userId={user.uid}
                  onCompletion={handleCustomCompletion}
                  onAchievementsEarned={handleAchievementsEarned}
                  onDelete={handleCustomDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Available (hidden) habits ── */}
      <AnimatePresence>
        {hiddenDefaults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AvailableHabitsPanel
              hiddenHabits={hiddenDefaults}
              onRestore={restoreDefault}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Custom habit creation modal ── */}
      <HabitCreationModal
        isOpen={showHabitModal}
        onClose={() => setShowHabitModal(false)}
        userId={user?.uid}
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
}
