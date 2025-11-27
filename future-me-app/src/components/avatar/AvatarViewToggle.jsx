import { motion } from 'framer-motion';

export const VIEW_MODES = {
  PHOTO: 'photo',
  AVATAR: 'avatar'
};

export const TOGGLE_CONFIG = {
  transitionDuration: 0.3,
  labels: {
    [VIEW_MODES.PHOTO]: 'Show Photo',
    [VIEW_MODES.AVATAR]: 'Show Avatar'
  },
  icons: {
    [VIEW_MODES.PHOTO]: '📸',
    [VIEW_MODES.AVATAR]: '🎨'
  }
};

export default function AvatarViewToggle({ 
  currentMode = VIEW_MODES.PHOTO, 
  onModeChange,
  disabled = false,
  className = ''
}) {
  const isPhotoMode = currentMode === VIEW_MODES.PHOTO;

  const handleToggle = () => {
    if (disabled) return;
    const newMode = isPhotoMode ? VIEW_MODES.AVATAR : VIEW_MODES.PHOTO;
    onModeChange(newMode);
    console.log(`🔄 Avatar view toggled to: ${newMode}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`flex items-center justify-center ${className}`}
    >
      <div 
        className={`
          relative flex items-center p-1 rounded-full 
          ${disabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 cursor-pointer'}
          shadow-inner
        `}
        onClick={handleToggle}
        role="button"
        aria-label={`Switch to ${isPhotoMode ? 'avatar' : 'photo'} view`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <motion.div
          className="absolute h-[calc(100%-8px)] rounded-full bg-white shadow-md"
          initial={false}
          animate={{
            x: isPhotoMode ? 4 : 'calc(100% + 4px)',
            width: isPhotoMode ? '50%' : '50%'
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
          style={{
            top: '4px',
            left: 0,
            width: 'calc(50% - 4px)'
          }}
        />
        
        <button
          type="button"
          className={`
            relative z-10 flex items-center gap-2 px-4 py-2 rounded-full
            text-sm font-medium transition-colors duration-200
            ${isPhotoMode 
              ? 'text-gray-800' 
              : 'text-gray-500 hover:text-gray-700'
            }
            ${disabled ? 'pointer-events-none' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPhotoMode) handleToggle();
          }}
        >
          <span>{TOGGLE_CONFIG.icons[VIEW_MODES.PHOTO]}</span>
          <span className="hidden sm:inline">{TOGGLE_CONFIG.labels[VIEW_MODES.PHOTO]}</span>
          <span className="sm:hidden">Photo</span>
        </button>

        <button
          type="button"
          className={`
            relative z-10 flex items-center gap-2 px-4 py-2 rounded-full
            text-sm font-medium transition-colors duration-200
            ${!isPhotoMode 
              ? 'text-gray-800' 
              : 'text-gray-500 hover:text-gray-700'
            }
            ${disabled ? 'pointer-events-none' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (isPhotoMode) handleToggle();
          }}
        >
          <span>{TOGGLE_CONFIG.icons[VIEW_MODES.AVATAR]}</span>
          <span className="hidden sm:inline">{TOGGLE_CONFIG.labels[VIEW_MODES.AVATAR]}</span>
          <span className="sm:hidden">Avatar</span>
        </button>
      </div>
    </motion.div>
  );
}
