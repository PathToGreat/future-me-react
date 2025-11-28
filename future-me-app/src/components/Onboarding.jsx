import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateAllLifeZones } from '../utils/lifeZoneEngine';

const SliderInput = ({ label, value, onChange, leftLabel, rightLabel, min = 1, max = 5 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
    />
    <div className="flex justify-between text-sm text-gray-600 mt-1">
      <span>{leftLabel}</span>
      <span className="font-semibold text-primary-600">{value}/{max}</span>
      <span>{rightLabel}</span>
    </div>
  </div>
);

const OptionButtons = ({ label, options, value, onChange, columns = 3 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`p-3 rounded-lg border-2 transition-all text-sm ${
            value === option.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-700 hover:border-primary-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const MultiSelectButtons = ({ label, options, values, onToggle, columns = 2 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
    <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`p-3 rounded-lg border-2 transition-all ${
            values.includes(option)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-700 hover:border-primary-300'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export default function Onboarding() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    goals: [],
    
    activity: 3,
    nutrition: 3,
    sleep: 3,
    stress: 3,
    
    energyLevel: 3,
    morningFatigue: 'sometimes',
    bodyTension: 3,
    
    movementRhythm: 'moderate',
    eatingRhythm: 'regular',
    sleepRhythm: 'consistent',
    
    primaryStressor: 'none',
    emotionalClimate: 'neutral',
    socialSupport: 'average',
    
    purposeAlignment: 'searching',
    faithRhythm: 'inconsistent',
    motivationLevel: 3,
  });

  const TOTAL_STEPS = 6;

  const handleSubmit = async () => {
    console.log('Starting onboarding submission...');
    setLoading(true);
    
    try {
      console.log('Calculating lifestyle score...');
      const lifestyleScore = (formData.activity + formData.nutrition + formData.sleep + (5 - formData.stress)) / 16 * 100;
      console.log('Lifestyle score calculated:', lifestyleScore);
      
      const avatarState = lifestyleScore >= 75 ? 'vibrant' : lifestyleScore >= 50 ? 'stable' : 'weary';
      console.log('Avatar state:', avatarState);
      
      const today = new Date().toISOString().split('T')[0];
      
      const healthLogData = {
        date: today,
        timestamp: new Date().toISOString(),
        activity: formData.activity,
        nutrition: formData.nutrition,
        sleep: formData.sleep,
        stress: formData.stress
      };
      
      const healthLogRef = doc(db, 'users', user.uid, 'zoneLogs', 'health', 'daily', today);
      await setDoc(healthLogRef, healthLogData, { merge: true });
      console.log('Initial Health zone log saved');
      
      const dailyDataRef = doc(db, 'users', user.uid, 'dailyData', today);
      await setDoc(dailyDataRef, {
        ...healthLogData,
        lifestyleScore: Math.round(lifestyleScore)
      }, { merge: true });
      
      const zoneHistories = {
        health: [healthLogData],
        socialEmotional: [],
        family: [],
        community: [],
        wealth: [],
        faith: []
      };
      
      const initialZones = calculateAllLifeZones(zoneHistories, null);
      console.log('Initial Life Zones calculated:', initialZones);
      
      const baselineState = {
        energyLevel: formData.energyLevel,
        morningFatigue: formData.morningFatigue,
        bodyTension: formData.bodyTension,
      };
      
      const lifestyleRhythm = {
        movementRhythm: formData.movementRhythm,
        eatingRhythm: formData.eatingRhythm,
        sleepRhythm: formData.sleepRhythm,
      };
      
      const emotionalProfile = {
        primaryStressor: formData.primaryStressor,
        emotionalClimate: formData.emotionalClimate,
        socialSupport: formData.socialSupport,
      };
      
      const faithPurpose = {
        purposeAlignment: formData.purposeAlignment,
        faithRhythm: formData.faithRhythm,
        motivationLevel: formData.motivationLevel,
      };
      
      const onboardingBaseline = {
        activity: formData.activity,
        nutrition: formData.nutrition,
        sleep: formData.sleep,
        stress: formData.stress,
        lifestyleScore: Math.round(lifestyleScore),
        capturedAt: new Date().toISOString(),
      };
      
      const dataToSave = {
        age: formData.age,
        goals: formData.goals,
        activity: formData.activity,
        nutrition: formData.nutrition,
        sleep: formData.sleep,
        stress: formData.stress,
        onboardingBaseline,
        baselineState,
        lifestyleRhythm,
        emotionalProfile,
        faithPurpose,
        lifestyleScore: Math.round(lifestyleScore),
        avatarState,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
        lifeZones: initialZones,
      };
      
      console.log('Saving user profile...', dataToSave);
      await updateUserProfile(dataToSave);
      console.log('User profile saved successfully!');
      
      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      console.error('Error details:', error.message, error.code);
      alert(`Error: ${error.message || 'There was an error saving your data. Please try again.'}`);
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

  const canProceed = () => {
    switch (step) {
      case 1: return formData.age !== '';
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  const getSectionTitle = () => {
    switch (step) {
      case 1: return 'Your Goals';
      case 2: return 'Core Habits';
      case 3: return 'Physical State';
      case 4: return 'Lifestyle Rhythm';
      case 5: return 'Emotional Profile';
      case 6: return 'Faith & Purpose';
      default: return '';
    }
  };

  const getSectionSubtitle = () => {
    switch (step) {
      case 1: return 'Tell us about yourself and what you want to achieve';
      case 2: return 'Your current daily lifestyle patterns';
      case 3: return 'How your body feels day-to-day';
      case 4: return 'The rhythm of your daily life';
      case 5: return 'Your emotional landscape and stress';
      case 6: return 'What drives your transformation';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-800">{getSectionTitle()}</h2>
            <span className="text-sm text-gray-500">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{getSectionSubtitle()}</p>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
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

              <MultiSelectButtons
                label="What are your health goals?"
                options={['Fitness', 'Weight Loss', 'Muscle Gain', 'Better Sleep', 'Stress Relief', 'Longevity']}
                values={formData.goals}
                onToggle={toggleGoal}
                columns={2}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <SliderInput
                label="Physical Activity Level"
                value={formData.activity}
                onChange={(v) => updateField('activity', v)}
                leftLabel="Sedentary"
                rightLabel="Very Active"
              />
              <SliderInput
                label="Nutrition Quality"
                value={formData.nutrition}
                onChange={(v) => updateField('nutrition', v)}
                leftLabel="Poor"
                rightLabel="Excellent"
              />
              <SliderInput
                label="Sleep Quality"
                value={formData.sleep}
                onChange={(v) => updateField('sleep', v)}
                leftLabel="Poor"
                rightLabel="Excellent"
              />
              <SliderInput
                label="Stress Level"
                value={formData.stress}
                onChange={(v) => updateField('stress', v)}
                leftLabel="Low"
                rightLabel="High"
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <SliderInput
                label="Energy level most days"
                value={formData.energyLevel}
                onChange={(v) => updateField('energyLevel', v)}
                leftLabel="Very Low"
                rightLabel="High Energy"
              />
              
              <OptionButtons
                label="Do you wake up tired even after a full night's sleep?"
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'sometimes', label: 'Sometimes' },
                  { value: 'yes', label: 'Yes' },
                ]}
                value={formData.morningFatigue}
                onChange={(v) => updateField('morningFatigue', v)}
                columns={3}
              />

              <SliderInput
                label="General body tension (neck, shoulders, gut)"
                value={formData.bodyTension}
                onChange={(v) => updateField('bodyTension', v)}
                leftLabel="Relaxed"
                rightLabel="Very Tense"
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <OptionButtons
                label="Daily movement type"
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'intense', label: 'Intense' },
                ]}
                value={formData.movementRhythm}
                onChange={(v) => updateField('movementRhythm', v)}
                columns={3}
              />

              <OptionButtons
                label="Eating rhythm"
                options={[
                  { value: 'regular', label: 'Regular Meals' },
                  { value: 'irregular', label: 'Irregular' },
                  { value: 'snacking', label: 'Frequent Snacking' },
                ]}
                value={formData.eatingRhythm}
                onChange={(v) => updateField('eatingRhythm', v)}
                columns={3}
              />

              <OptionButtons
                label="Sleep rhythm"
                options={[
                  { value: 'consistent', label: 'Consistent Bedtime' },
                  { value: 'inconsistent', label: 'Inconsistent' },
                  { value: 'irregular', label: 'Very Irregular' },
                ]}
                value={formData.sleepRhythm}
                onChange={(v) => updateField('sleepRhythm', v)}
                columns={3}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <OptionButtons
                label="Primary stress source"
                options={[
                  { value: 'work', label: 'Work' },
                  { value: 'family', label: 'Family' },
                  { value: 'money', label: 'Money' },
                  { value: 'uncertainty', label: 'Uncertainty' },
                  { value: 'health', label: 'Health' },
                  { value: 'other', label: 'Other' },
                  { value: 'none', label: 'None' },
                ]}
                value={formData.primaryStressor}
                onChange={(v) => updateField('primaryStressor', v)}
                columns={3}
              />

              <OptionButtons
                label="Overall emotional climate"
                options={[
                  { value: 'overwhelmed', label: 'Overwhelmed' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'hopeful', label: 'Hopeful' },
                ]}
                value={formData.emotionalClimate}
                onChange={(v) => updateField('emotionalClimate', v)}
                columns={3}
              />

              <OptionButtons
                label="Social support level"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'average', label: 'Average' },
                  { value: 'strong', label: 'Strong' },
                ]}
                value={formData.socialSupport}
                onChange={(v) => updateField('socialSupport', v)}
                columns={3}
              />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <OptionButtons
                label="Do you feel aligned with your purpose right now?"
                options={[
                  { value: 'aligned', label: 'Aligned' },
                  { value: 'searching', label: 'Searching' },
                  { value: 'disconnected', label: 'Disconnected' },
                ]}
                value={formData.purposeAlignment}
                onChange={(v) => updateField('purposeAlignment', v)}
                columns={3}
              />

              <OptionButtons
                label="Faith practice rhythm"
                options={[
                  { value: 'consistent', label: 'Consistent' },
                  { value: 'inconsistent', label: 'Inconsistent' },
                  { value: 'not_practicing', label: 'Not Currently' },
                ]}
                value={formData.faithRhythm}
                onChange={(v) => updateField('faithRhythm', v)}
                columns={3}
              />

              <SliderInput
                label="How motivated are you to change?"
                value={formData.motivationLevel}
                onChange={(v) => updateField('motivationLevel', v)}
                leftLabel="Not Very"
                rightLabel="Highly Motivated"
              />
            </motion.div>
          )}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1" disabled={loading}>
                Back
              </button>
            )}
            <button
              onClick={() => step < TOTAL_STEPS ? setStep(step + 1) : handleSubmit()}
              className="btn-primary flex-1"
              disabled={!canProceed() || loading}
            >
              {loading ? 'Generating Your Future...' : step === TOTAL_STEPS ? 'See My Future' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
