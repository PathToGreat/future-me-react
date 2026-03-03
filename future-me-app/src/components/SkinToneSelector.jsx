import { useState, useEffect } from 'react';
import { SKIN_TONE_PALETTE } from '../avatar/avatarParams';

const STORAGE_KEY = 'futureme_skin_tone';
const HAIR_STORAGE_KEY = 'futureme_hair_style';

const HAIR_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' }
];

export function loadSkinTone() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function loadHairStyle() {
  try {
    return localStorage.getItem(HAIR_STORAGE_KEY) || 'none';
  } catch {
    return 'none';
  }
}

export default function SkinToneSelector({ onSkinToneChange, onHairStyleChange }) {
  const [selected, setSelected] = useState(() => loadSkinTone());
  const [hairStyle, setHairStyle] = useState(() => loadHairStyle());

  useEffect(() => {
    if (onSkinToneChange) onSkinToneChange(selected);
  }, [selected]);

  useEffect(() => {
    if (onHairStyleChange) onHairStyleChange(hairStyle);
  }, [hairStyle]);

  const handleSelect = (id) => {
    const newVal = selected === id ? null : id;
    setSelected(newVal);
    try {
      if (newVal) {
        localStorage.setItem(STORAGE_KEY, newVal);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    if (onSkinToneChange) onSkinToneChange(newVal);
  };

  const handleHairChange = (id) => {
    setHairStyle(id);
    try {
      localStorage.setItem(HAIR_STORAGE_KEY, id);
    } catch {}
    if (onHairStyleChange) onHairStyleChange(id);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Skin Tone</p>
        <div className="flex items-center gap-2">
          {SKIN_TONE_PALETTE.map((tone) => (
            <button
              key={tone.id}
              onClick={() => handleSelect(tone.id)}
              title={tone.label}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                selected === tone.id
                  ? 'border-blue-500 scale-110 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: tone.base }}
            />
          ))}
          {selected && (
            <button
              onClick={() => handleSelect(selected)}
              className="text-xs text-slate-400 hover:text-slate-600 ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Hair</p>
        <div className="flex items-center gap-2">
          {HAIR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleHairChange(opt.id)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                hairStyle === opt.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
