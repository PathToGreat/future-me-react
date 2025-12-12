import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'avatar', label: 'Avatar', icon: '👤' },
  { id: 'habits', label: 'Habits', icon: '✓' },
  { id: 'metrics', label: 'Metrics', icon: '📊' },
  { id: 'menu', label: 'Menu', icon: '☰' },
];

export default function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span
              className={`text-xl mb-1 transition-transform ${
                activeTab === item.id ? 'scale-110' : 'scale-100'
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`text-xs font-medium transition-colors ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
