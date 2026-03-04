import { useState, useEffect } from 'react';
import { SKIN_TONE_PALETTE } from '../avatar/avatarParams';

let _currentUserId = null;

export function setStorageUserId(uid) {
  _currentUserId = uid || null;
}

function storageKey(base) {
  return _currentUserId ? `${base}_${_currentUserId}` : base;
}

const STORAGE_KEY = 'futureme_skin_tone';
const HAIR_STORAGE_KEY = 'futureme_hair_style';
const HAIR_COLOR_STORAGE_KEY = 'futureme_hair_color';

const HAIR_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' }
];

const HAIR_COLOR_PALETTE = [
  { id: 'black', label: 'Black', base: '#1a1a1a', highlight: '#3a3a3a' },
  { id: 'darkBrown', label: 'Dark Brown', base: '#3a2a1a', highlight: '#5a4a3a' },
  { id: 'brown', label: 'Brown', base: '#5c3a1e', highlight: '#7a5a3a' },
  { id: 'lightBrown', label: 'Light Brown', base: '#8b6a3e', highlight: '#a88a5e' },
  { id: 'darkBlonde', label: 'Dark Blonde', base: '#a08040', highlight: '#c0a060' },
  { id: 'blonde', label: 'Blonde', base: '#c8a84e', highlight: '#dcc070' },
  { id: 'auburn', label: 'Auburn', base: '#6b2a1a', highlight: '#8b4a3a' },
  { id: 'gray', label: 'Gray', base: '#8a8a8a', highlight: '#aaaaaa' }
];

export { HAIR_COLOR_PALETTE };

export function loadSkinTone() {
  try {
    return localStorage.getItem(storageKey(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function loadHairStyle() {
  try {
    return localStorage.getItem(storageKey(HAIR_STORAGE_KEY)) || 'none';
  } catch {
    return 'none';
  }
}

export function loadHairColor() {
  try {
    return localStorage.getItem(storageKey(HAIR_COLOR_STORAGE_KEY)) || 'darkBrown';
  } catch {
    return 'darkBrown';
  }
}

export function getHairColors(colorId) {
  const entry = HAIR_COLOR_PALETTE.find(c => c.id === colorId);
  if (entry) return { base: entry.base, highlight: entry.highlight };
  return { base: '#3a2a1a', highlight: '#5a4a3a' };
}

export default function SkinToneSelector({ onSkinToneChange, onHairStyleChange, onHairColorChange }) {
  const [selected, setSelected] = useState(() => loadSkinTone());
  const [hairStyle, setHairStyle] = useState(() => loadHairStyle());
  const [hairColor, setHairColor] = useState(() => loadHairColor());

  useEffect(() => {
    if (onSkinToneChange) onSkinToneChange(selected);
  }, [selected]);

  useEffect(() => {
    if (onHairStyleChange) onHairStyleChange(hairStyle);
  }, [hairStyle]);

  useEffect(() => {
    if (onHairColorChange) onHairColorChange(hairColor);
  }, [hairColor]);

  const handleSelect = (id) => {
    const newVal = selected === id ? null : id;
    setSelected(newVal);
    try {
      if (newVal) {
        localStorage.setItem(storageKey(STORAGE_KEY), newVal);
      } else {
        localStorage.removeItem(storageKey(STORAGE_KEY));
      }
    } catch {}
    if (onSkinToneChange) onSkinToneChange(newVal);
  };

  const handleHairChange = (id) => {
    setHairStyle(id);
    try {
      localStorage.setItem(storageKey(HAIR_STORAGE_KEY), id);
    } catch {}
    if (onHairStyleChange) onHairStyleChange(id);
  };

  const handleHairColorChange = (id) => {
    setHairColor(id);
    try {
      localStorage.setItem(storageKey(HAIR_COLOR_STORAGE_KEY), id);
    } catch {}
    if (onHairColorChange) onHairColorChange(id);
  };

  const showColorPicker = hairStyle && hairStyle !== 'none';

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
        <p className="text-xs font-medium text-slate-500 mb-2">Hair Style</p>
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

      {showColorPicker && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Hair Color</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {HAIR_COLOR_PALETTE.map((c) => (
              <button
                key={c.id}
                onClick={() => handleHairColorChange(c.id)}
                title={c.label}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  hairColor === c.id
                    ? 'border-blue-500 scale-110 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: c.base }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
