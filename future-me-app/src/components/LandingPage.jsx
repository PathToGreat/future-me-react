import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Future Me
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            See the Person You Are Becoming
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Your daily choices are shaping your future body, energy, and life. Future Me turns those choices into a visual reflection so you can clearly see where your current path leads.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="card bg-white/80 backdrop-blur-sm p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Track Your Lifestyle</h3>
                <p className="text-gray-600">
                  Answer simple questions about how you live today. Sleep, nutrition, movement, stress, and habits that quietly shape your future.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔭</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">See Your Future</h3>
                <p className="text-gray-600">
                  Watch a realistic future version of yourself change based on your current lifestyle patterns, not guesses.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Take Action</h3>
                <p className="text-gray-600">
                  Use clarity as motivation. Small changes reveal a different future. Consistent choices compound into transformation.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <button
                onClick={() => navigate('/auth')}
                className="btn-primary text-lg px-12 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Start Your Journey
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Free to use • Takes less than 2 minutes
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Future Is Already Forming
            </h2>
            <p className="text-gray-600 mb-6">
              Most people drift into the future without seeing where their habits are leading. Future Me makes the direction visible so you can decide whether to stay the course or change it.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-primary-600">100%</div>
                <div className="text-sm text-gray-600">Free</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">&lt;2min</div>
                <div className="text-sm text-gray-600">Clarity Setup</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">∞</div>
                <div className="text-sm text-gray-600">Unlimited Future Scenarios</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
