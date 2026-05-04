import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZONE_META, TRAIT_META } from '../config/defaultHabits';

const getTodayUTC = () => new Date().toISOString().split('T')[0];

function rhythmLabel(streak) {
  if (!streak || streak < 1) return null;
  if (streak >= 14) return `${streak}-day rhythm`;
  if (streak >= 7)  return `${streak}-day rhythm`;
  if (streak >= 3)  return `${streak}-day practice`;
  return `${streak}-day start`;
}

export default function DefaultHabitCard({ habit, completion, onComplete, onHide }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const today        = getTodayUTC();
  const completedToday = completion?.lastCompletedDate === today;
  const streak       = completion?.streak || 0;

  const zone  = ZONE_META[habit.zone]  || ZONE_META.health;
  const trait = TRAIT_META[habit.trait];
  const label = rhythmLabel(streak);

  const handleComplete = async () => {
    if (completedToday || isCompleting) return;
    setIsCompleting(true);
    try {
      await onComplete(habit.id, habit.insight);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-white/60 rounded-xl border p-4 transition-colors ${
        completedToday ? 'border-indigo-200/80 bg-indigo-50/20' : 'border-white/70'
      }`}
    >
      {/* Hide button */}
      <button
        onClick={() => onHide(habit.id)}
        className="absolute top-2.5 right-2.5 text-gray-300 hover:text-gray-400 transition-colors p-0.5"
        title="Remove from active habits"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-5">
        {/* Icon bubble */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg transition-colors ${
            completedToday ? 'bg-indigo-100' : 'bg-gray-50 border border-gray-100'
          }`}
        >
          {habit.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row + check button */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm leading-snug">{habit.title}</h3>
              <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${zone.chipColor}`}>
                {zone.name}
              </span>
            </div>

            {/* Completion circle */}
            <button
              onClick={handleComplete}
              disabled={completedToday || isCompleting}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                completedToday
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : isCompleting
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
              }`}
            >
              {completedToday ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : isCompleting ? (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : null}
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{habit.description}</p>

          {/* Footer: rhythm + trait chip */}
          {(label || trait) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {label && (
                <span className="text-[10px] text-gray-400 font-medium">
                  ⭐ {label}
                </span>
              )}
              {trait && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${trait.color}`}>
                  {trait.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
