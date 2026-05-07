import { motion, AnimatePresence } from 'framer-motion';

function Section({ title, children }) {
  return (
    <div>
      <p className="font-semibold text-gray-700 mb-1 text-sm">{title}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

export default function LegalNoticesModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">Legal &amp; Notices</h2>
                <p className="text-xs text-gray-400 mt-0.5">Terms, privacy, and AI disclosures</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-5 py-5 space-y-5 flex-1">

              <Section title="Trajectory &amp; Visualization">
                Future Me provides observational and interpretive wellness insights based on
                user-provided information, patterns, habits, and behavioral trends. Visual
                projections, avatar states, and AI-generated imagery are intended to reflect
                general trajectory and directional patterns and should not be interpreted as
                medical predictions, diagnoses, or guaranteed future outcomes.
              </Section>

              <Section title="Not Medical Advice">
                Future Me is not a medical device and does not provide medical, psychiatric,
                nutritional, or therapeutic diagnosis or treatment. The information provided
                inside the app is informational and reflective in nature and should not replace
                professional medical or mental health guidance. If you have health concerns,
                please consult a qualified healthcare provider.
              </Section>

              <Section title="Future Lab — Experimental AI Images">
                The Future Lab AI image generation feature is experimental. Generated images
                are interpretive visualizations based on general trajectory patterns and should
                not be treated as accurate representations of your future appearance or health.
                Likeness preservation is not guaranteed. Images may vary in realism, accuracy,
                and relevance. This feature is intended as a reflective and emotionally
                meaningful tool, not a predictive or diagnostic system.
              </Section>

              <Section title="Privacy &amp; Data">
                Your data is private and stored securely in Firebase. This includes daily logs,
                profile information, and any reference images you provide. When you use the
                Future Lab AI generation feature, generation requests — including trajectory
                data and any reference information you provide — are transmitted securely to a
                third-party AI infrastructure provider (Replicate) for image generation
                purposes only. Future Me does not sell your images or likeness data. Reference
                images and generation inputs are used solely to produce and support your
                in-app experience.
              </Section>

              <Section title="Your Responsibility">
                You remain responsible for your own real-world decisions and actions. Future Me
                is a reflective and interpretive tool, not a substitute for professional
                judgment in health, wellness, financial, relational, or lifestyle matters. The
                app is designed to support self-awareness and personal growth — decisions based
                on app insights are yours alone.
              </Section>

              <Section title="Beta Version">
                This is a beta version of Future Me. Features are still in development and may
                change. Anonymized usage data may be collected to improve app performance.
              </Section>

              <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100">
                &copy; 2025 Future Me. All rights reserved. Patent Pending.
              </p>
            </div>

            {/* Footer close */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
