import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Onboarding() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity: 3,
    nutrition: 3,
    sleep: 3,
    stress: 3,
    age: '',
    goals: [],
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const lifestyleScore = (formData.activity + formData.nutrition + formData.sleep + (5 - formData.stress)) / 16 * 100;
      
      const avatarState = lifestyleScore >= 75 ? 'vibrant' : lifestyleScore >= 50 ? 'stable' : 'weary';
      
      const projectionData = {
        ...formData,
        lifestyleScore,
        avatarState,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await updateUserProfile({
        ...formData,
        lifestyleScore,
        avatarState,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
      });

      const projectionRef = doc(collection(db, 'users', user.uid, 'projections'));
      await setDoc(projectionRef, projectionData);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving projection:', error);
      alert('There was an error saving your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Tell us about yourself</h2>
            <span className="text-sm text-gray-500">Step {step} of 3</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your age?
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="input-field"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are your health goals?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Fitness', 'Weight Loss', 'Muscle Gain', 'Better Sleep', 'Stress Relief', 'Longevity'].map(goal => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.goals.includes(goal)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Activity Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.activity}
                  onChange={(e) => updateField('activity', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Sedentary</span>
                  <span className="font-semibold text-primary-600">{formData.activity}/5</span>
                  <span>Very Active</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nutrition Quality
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.nutrition}
                  onChange={(e) => updateField('nutrition', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Poor</span>
                  <span className="font-semibold text-primary-600">{formData.nutrition}/5</span>
                  <span>Excellent</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Quality
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.sleep}
                  onChange={(e) => updateField('sleep', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Poor</span>
                  <span className="font-semibold text-primary-600">{formData.sleep}/5</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stress Level
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.stress}
                  onChange={(e) => updateField('stress', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Low</span>
                  <span className="font-semibold text-primary-600">{formData.stress}/5</span>
                  <span>High</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1" disabled={loading}>
                Back
              </button>
            )}
            <button
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              className="btn-primary flex-1"
              disabled={(step === 1 && !formData.age) || loading}
            >
              {loading ? 'Generating...' : step === 3 ? 'See My Future' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
