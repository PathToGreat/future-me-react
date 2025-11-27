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
        betaTermsAcceptedAt: new Date().toISOString()
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
          <p className="text-gray-600">Welcome to the beta</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Beta Agreement and Privacy Notice
          </h2>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-64 overflow-y-auto border border-gray-200">
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                This is a beta version of Future Me. Features are still in development and may change. Some features may not be fully functional at this time.
              </p>
              
              <p>
                Your data is private and stored securely in Firebase. This includes your daily logs, profile information, and any images you upload. Image uploads are processed securely and never shared with third parties.
              </p>
              
              <p>
                By continuing, you agree that this is a testing environment and that Future Me may collect anonymized usage data to improve app performance.
              </p>
              
              <p className="text-gray-500 text-xs pt-2 border-t border-gray-200">
                &copy; 2025 Future Me. All rights reserved. Patent Pending.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
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
              I have read and agree.
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
