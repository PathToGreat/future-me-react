import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BetaAgreement() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateUserProfile, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!agreed) return;
    setLoading(true);
    setError('');
    try {
      await updateUserProfile({
        hasAcceptedBetaTerms: true,
        betaTermsAcceptedAt: new Date().toISOString(),
      });
      if (userProfile?.onboardingCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Error saving agreement:', err);
      setError('Failed to save your agreement. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Future Me
          </h1>
          <p className="text-gray-600">Beta — Terms, Notices &amp; Privacy</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Please read before continuing
          </h2>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-96 overflow-y-auto border border-gray-200 space-y-5 text-sm text-gray-700 leading-relaxed">

            {/* Beta notice */}
            <Section title="Beta Version">
              This is a beta version of Future Me. Features are still in development and may
              change. Some features may not be fully functional at this time.
            </Section>

            {/* Trajectory & Visualization */}
            <Section title="Trajectory &amp; Visualization">
              Future Me provides observational and interpretive wellness insights based on
              user-provided information, patterns, habits, and behavioral trends. Visual
              projections, avatar states, and AI-generated imagery are intended to reflect
              general trajectory and directional patterns and should not be interpreted as
              medical predictions, diagnoses, or guaranteed future outcomes.
            </Section>

            {/* Not Medical Advice */}
            <Section title="Not Medical Advice">
              Future Me is not a medical device and does not provide medical, psychiatric,
              nutritional, or therapeutic diagnosis or treatment. The information provided
              inside the app is informational and reflective in nature and should not replace
              professional medical or mental health guidance. If you have health concerns,
              please consult a qualified healthcare provider.
            </Section>

            {/* AI Image Generation */}
            <Section title="Future Lab — Experimental AI Images">
              The Future Lab AI image generation feature is experimental. Generated images
              are interpretive visualizations based on general trajectory patterns and should
              not be treated as accurate representations of your future appearance or health.
              Likeness preservation is not guaranteed. Images may vary in realism, accuracy,
              and relevance. This feature is intended as a reflective and emotionally
              meaningful tool, not a predictive or diagnostic system.
            </Section>

            {/* Privacy & Data */}
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

            {/* Usage Responsibility */}
            <Section title="Your Responsibility">
              You remain responsible for your own real-world decisions and actions. Future Me
              is a reflective and interpretive tool, not a substitute for professional
              judgment in health, wellness, financial, relational, or lifestyle matters. The
              app is designed to support self-awareness and personal growth — decisions based
              on app insights are yours alone.
            </Section>

            {/* Usage data */}
            <Section title="Usage Data">
              By continuing, you agree that this is a testing environment and that Future Me
              may collect anonymized usage data to improve app performance and features.
            </Section>

            <p className="text-gray-400 text-xs pt-2 border-t border-gray-200">
              &copy; 2025 Future Me. All rights reserved. Patent Pending.
            </p>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  agreed
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 group-hover:border-primary-400'
                }`}
              >
                {agreed && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 select-none">
              I have read and understood the terms and notices above.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!agreed || loading}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              agreed && !loading
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="font-semibold text-gray-800 mb-1">{title}</p>
      <p>{children}</p>
    </div>
  );
}
