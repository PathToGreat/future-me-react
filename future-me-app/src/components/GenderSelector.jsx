import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function GenderSelector({ onGenderChange }) {
  const { userProfile, updateUserProfile } = useAuth();
  const [selectedGender, setSelectedGender] = useState(userProfile?.gender || null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pendingGender, setPendingGender] = useState(null);

  const isLocked = !!userProfile?.gender && !editing;

  useEffect(() => {
    if (userProfile?.gender) {
      setSelectedGender(userProfile.gender);
    } else if (userProfile && !userProfile.gender) {
      setSelectedGender('male');
    }
  }, [userProfile]);

  const handleGenderSelect = async (gender) => {
    if (gender === selectedGender && !editing) return;

    if (isLocked) return;

    if (editing && gender !== selectedGender) {
      setPendingGender(gender);
      return;
    }

    setSelectedGender(gender);

    if (onGenderChange) {
      onGenderChange(gender);
    }

    setSaving(true);

    try {
      await updateUserProfile({ gender });
    } catch (error) {
      setSelectedGender(userProfile?.gender || 'male');
      if (onGenderChange) {
        onGenderChange(userProfile?.gender || 'male');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmChange = async () => {
    if (!pendingGender) return;

    setSelectedGender(pendingGender);
    if (onGenderChange) {
      onGenderChange(pendingGender);
    }

    setSaving(true);
    try {
      await updateUserProfile({ gender: pendingGender });
    } catch (error) {
      setSelectedGender(userProfile?.gender || 'male');
      if (onGenderChange) {
        onGenderChange(userProfile?.gender || 'male');
      }
    } finally {
      setSaving(false);
      setEditing(false);
      setPendingGender(null);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setPendingGender(null);
  };

  const genderOptions = [
    { id: 'male', label: 'Male', icon: '👤' },
    { id: 'female', label: 'Female', icon: '👤' }
  ];

  if (isLocked) {
    const currentLabel = genderOptions.find(o => o.id === selectedGender)?.label || selectedGender;
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Body type: {currentLabel}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  if (pendingGender) {
    const pendingLabel = genderOptions.find(o => o.id === pendingGender)?.label || pendingGender;
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500">
          Change body type to {pendingLabel}?
        </p>
        <div className="flex gap-2">
          <button
            onClick={confirmChange}
            disabled={saving}
            className="flex-1 py-1.5 px-3 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="flex-1 py-1.5 px-3 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-600">
          Avatar Body Type
        </label>
        {editing && (
          <button
            onClick={cancelEdit}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
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
