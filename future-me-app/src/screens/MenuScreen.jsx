import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConnectedDevicesPanel from '../components/ConnectedDevicesPanel';

const MENU_ITEMS = [
  { id: 'devices', label: 'Connected Devices', icon: '📱', description: 'Manage health device integrations' },
  { id: 'retake', label: 'Retake Assessment', icon: '📋', description: 'Update your baseline metrics' },
  { id: 'settings', label: 'Account Settings', icon: '⚙️', description: 'Manage your profile and preferences' },
  { id: 'support', label: 'Support', icon: '❓', description: 'Get help and FAQs' },
  { id: 'logout', label: 'Log Out', icon: '🚪', description: 'Sign out of your account', danger: true },
];

export default function MenuScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDevicesPanel, setShowDevicesPanel] = useState(false);

  const handleMenuClick = async (itemId) => {
    switch (itemId) {
      case 'devices':
        setShowDevicesPanel(true);
        break;
      case 'retake':
        navigate('/onboarding');
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
            className={`w-full flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left ${
              item.danger ? 'hover:border-red-200' : 'hover:border-blue-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              item.danger ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <span className="text-2xl">{item.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                item.danger ? 'text-red-600' : 'text-gray-800'
              }`}>
                {item.label}
              </h3>
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
        <p className="text-center text-sm text-gray-400">
          Future Me v1.0
        </p>
      </div>

      <AnimatePresence>
        {showDevicesPanel && (
          <ConnectedDevicesPanel onClose={() => setShowDevicesPanel(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
