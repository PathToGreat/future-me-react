import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { loadActiveReminders, dismissReminder } from '../utils/reminderEngine';

export default function ReminderBanner() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    loadActiveReminders(user.uid).then(active => {
      setReminders(active);
      setLoaded(true);
    });
  }, [user?.uid]);

  const handleDismiss = async (reminderId) => {
    if (!user?.uid) return;
    await dismissReminder(user.uid, reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  if (!loaded || reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {reminders.map(reminder => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <p className="text-sm text-slate-600 leading-snug">{reminder.message}</p>
            </div>
            <button
              onClick={() => handleDismiss(reminder.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
