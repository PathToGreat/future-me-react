import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

function StatusRow() {
  const { liveProfile, historyData } = useApp();

  const profileStatus = liveProfile?.onboardingCompleted ? 'Active' : 'Setup';
  const assessmentStatus = liveProfile?.onboardingCompleted ? 'Complete' : 'Pending';
  const trackingDays = historyData?.length || 0;

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span className="text-xs text-slate-500">Profile: {profileStatus}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span className="text-xs text-slate-500">Assessment: {assessmentStatus}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span className="text-xs text-slate-500">Tracking: {trackingDays} day{trackingDays !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

export default function ProgressDetails({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-t-2 border-t-indigo-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm">📈</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Progress & Details
          </span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-4">
              <StatusRow />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
