import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { loadReminderPreferences, saveReminderPreferences } from '../utils/reminderEngine';

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-slate-600' : 'bg-slate-200'}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

export default function ReminderSettings({ isOpen, onClose }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadReminderPreferences(user.uid).then(setPrefs);
    }
  }, [isOpen, user?.uid]);

  const handleChange = async (key, value) => {
    if (!user?.uid || !prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    await saveReminderPreferences(user.uid, updated);
    setSaving(false);
  };

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
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Reflection Reminders</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Get notified when something meaningful changes
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

            {prefs && (
              <div className="divide-y divide-gray-50">
                <Toggle
                  label="Enable Reminders"
                  description="Only triggers when something meaningful changes"
                  checked={prefs.enabled}
                  onChange={(v) => handleChange('enabled', v)}
                />

                {prefs.enabled && (
                  <>
                    <Toggle
                      label="Direction Changes"
                      description="When your overall direction shifts"
                      checked={prefs.directionChanges}
                      onChange={(v) => handleChange('directionChanges', v)}
                    />
                    <Toggle
                      label="New Patterns"
                      description="When a new pattern is detected in your data"
                      checked={prefs.newPatterns}
                      onChange={(v) => handleChange('newPatterns', v)}
                    />
                    <Toggle
                      label="Monthly Snapshot Ready"
                      description="When your monthly snapshot becomes available"
                      checked={prefs.monthlySnapshot}
                      onChange={(v) => handleChange('monthlySnapshot', v)}
                    />
                  </>
                )}
              </div>
            )}

            {!prefs && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-transparent"></div>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Reminders appear as a subtle banner on your dashboard. They are not daily nudges — they only appear when your data shows a meaningful shift.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
