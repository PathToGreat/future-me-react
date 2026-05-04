import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import ConnectedDevicesPanel from '../components/ConnectedDevicesPanel';
import InvestorMetricsDashboard from '../components/InvestorMetricsDashboard';
import ReminderSettings from '../components/ReminderSettings';

const MENU_ITEMS = [
  { id: 'futureLab', label: 'Future Lab', icon: '🎯', description: 'Preview and compare experimental visual directions', highlight: true },
  { id: 'devices', label: 'Connected Devices', icon: '📱', description: 'Manage health device integrations' },
  { id: 'reminders', label: 'Reflection Reminders', icon: '📊', description: 'Choose when to be notified of meaningful changes' },
  { id: 'retake', label: 'Retake Assessment', icon: '📋', description: 'Update your baseline metrics' },
  { id: 'walkthrough', label: 'Replay Walkthrough', icon: '🎓', description: 'View the app introduction again' },
  { id: 'settings', label: 'Account Settings', icon: '⚙️', description: 'Manage your profile and preferences' },
  { id: 'support', label: 'Support', icon: '❓', description: 'Get help and FAQs' },
  { id: 'logout', label: 'Log Out', icon: '🚪', description: 'Sign out of your account', danger: true },
];

export default function MenuScreen({ onNavigate }) {
  const { logout } = useAuth();
  const { replayWalkthrough } = useApp();
  const navigate = useNavigate();
  const [showDevicesPanel, setShowDevicesPanel] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showFounderMetrics, setShowFounderMetrics] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0);
  
  useEffect(() => {
    if (versionTapCount >= 5) {
      setShowFounderMetrics(true);
      setVersionTapCount(0);
    }
    
    const timer = setTimeout(() => {
      if (versionTapCount > 0 && versionTapCount < 5) {
        setVersionTapCount(0);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [versionTapCount]);

  const handleMenuClick = async (itemId) => {
    switch (itemId) {
      case 'futureLab':
        if (onNavigate) onNavigate('futureLab');
        break;
      case 'devices':
        setShowDevicesPanel(true);
        break;
      case 'reminders':
        setShowReminderSettings(true);
        break;
      case 'retake':
        navigate('/onboarding');
        break;
      case 'walkthrough':
        replayWalkthrough();
        break;
      case 'settings':
        alert('Account Settings coming soon!');
        break;
      case 'support':
        alert('Support page coming soon!');
        break;
      case 'logout':
        await logout();
        navigate('/');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
        <p className="text-gray-600">Settings and account options</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {MENU_ITEMS.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border transition-all text-left ${
              item.danger     ? 'border-gray-100 hover:border-red-200'
              : item.highlight ? 'border-indigo-200 hover:border-indigo-400'
              : 'border-gray-100 hover:border-blue-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              item.danger ? 'bg-red-50' : item.highlight ? 'bg-indigo-50' : 'bg-gray-50'
            }`}>
              <span className="text-2xl">{item.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${
                  item.danger ? 'text-red-600' : item.highlight ? 'text-indigo-700' : 'text-gray-800'
                }`}>
                  {item.label}
                </h3>
                {item.highlight && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-semibold uppercase tracking-wide">
                    Preview
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <svg 
              className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-gray-400'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))}
      </motion.div>

      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={() => setVersionTapCount(prev => prev + 1)}
          className="w-full text-center text-sm text-gray-400 cursor-default select-none"
        >
          Future Me v1.0
        </button>
      </div>

      <AnimatePresence>
        {showDevicesPanel && (
          <ConnectedDevicesPanel onClose={() => setShowDevicesPanel(false)} />
        )}
      </AnimatePresence>

      <ReminderSettings
        isOpen={showReminderSettings}
        onClose={() => setShowReminderSettings(false)}
      />

      <AnimatePresence>
        {showFounderMetrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFounderMetrics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <div className="relative">
                <button
                  onClick={() => setShowFounderMetrics(false)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center z-10"
                >
                  ✕
                </button>
                <InvestorMetricsDashboard />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
