import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function GenderSelector({ onGenderChange }) {
  const { userProfile, updateUserProfile } = useAuth();
  const [selectedGender, setSelectedGender] = useState(userProfile?.gender || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.gender) {
      setSelectedGender(userProfile.gender);
    } else if (userProfile && !userProfile.gender) {
      setSelectedGender('male');
    }
  }, [userProfile]);

  const handleGenderSelect = async (gender) => {
    if (gender === selectedGender) return;
    
    setSelectedGender(gender);
    
    if (onGenderChange) {
      onGenderChange(gender);
    }
    
    setSaving(true);
    
    try {
      await updateUserProfile({ gender });
      console.log('Gender saved:', gender);
    } catch (error) {
      console.error('Error saving gender:', error);
      setSelectedGender(userProfile?.gender || 'male');
      if (onGenderChange) {
        onGenderChange(userProfile?.gender || 'male');
      }
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    { id: 'male', label: 'Male', icon: '👤' },
    { id: 'female', label: 'Female', icon: '👤' }
  ];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-600">
        Avatar Body Type
      </label>
      <div className="flex gap-2">
        {genderOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleGenderSelect(option.id)}
            disabled={saving}
            className={`
              flex-1 py-2 px-4 rounded-lg font-medium text-sm
              transition-all duration-200 border-2
              ${selectedGender === option.id
                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }
              ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </motion.button>
        ))}
      </div>
      {saving && (
        <p className="text-xs text-gray-400 animate-pulse">Saving...</p>
      )}
    </div>
  );
}
