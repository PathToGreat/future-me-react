import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WALKTHROUGH_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Future Me',
    description: 'Future Me helps you visualize how your daily habits shape your future self. Track your lifestyle metrics, build positive habits, and watch your avatar evolve based on your consistency.',
    icon: '👋',
    highlight: null,
    position: 'center'
  },
  {
    id: 'metrics',
    title: 'Log Your Daily Metrics',
    description: 'This is where you log your daily sleep, nutrition, stress, hydration, activity, and more. Daily logs drive your avatar and insights.',
    icon: '📊',
    highlight: 'metrics',
    position: 'bottom'
  },
  {
    id: 'avatar',
    title: 'Your Dynamic Avatar',
    description: 'Your avatar updates based on your consistency. You need at least two days of logging before your first projection appears.',
    icon: '👤',
    highlight: 'avatar',
    position: 'bottom'
  },
  {
    id: 'insights',
    title: 'Personalized Insights',
    description: 'Here you will see personalized insights based on the patterns the app observes from your logs.',
    icon: '💡',
    highlight: 'home',
    position: 'bottom'
  },
  {
    id: 'habits',
    title: 'Track Your Habits',
    description: 'Track your key habits here. Each time you check one off you will see supportive feedback acknowledging your effort and consistency.',
    icon: '✓',
    highlight: 'habits',
    position: 'bottom'
  },
  {
    id: 'finish',
    title: 'You Are Ready',
    description: 'You are ready to start. Begin by logging today\'s metrics.',
    icon: '🎯',
    highlight: null,
    position: 'center'
  }
];

export default function OnboardingWalkthrough({ isVisible, onComplete, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  if (!isVisible) return null;

  const step = WALKTHROUGH_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WALKTHROUGH_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />
        
        {step.highlight && (
          <HighlightOverlay highlight={step.highlight} />
        )}

        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`absolute left-4 right-4 max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 ${
            step.position === 'center' 
              ? 'top-1/2 -translate-y-1/2' 
              : 'top-24'
          }`}
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{step.icon}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h2>
            <p className="text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {WALKTHROUGH_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-blue-500'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>

          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              Skip Walkthrough
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function HighlightOverlay({ highlight }) {
  const getHighlightPosition = () => {
    switch (highlight) {
      case 'home':
        return { left: '10%', width: '20%' };
      case 'avatar':
        return { left: '30%', width: '20%' };
      case 'habits':
        return { left: '50%', width: '20%' };
      case 'metrics':
        return { left: '70%', width: '20%' };
      default:
        return { left: '50%', width: '20%' };
    }
  };

  const position = getHighlightPosition();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-40"
    >
      <div
        className="absolute bottom-0 h-full"
        style={{
          left: position.left,
          width: position.width,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="absolute inset-0 border-4 border-blue-400 rounded-xl animate-pulse" />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="text-blue-400 text-2xl">↓</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
