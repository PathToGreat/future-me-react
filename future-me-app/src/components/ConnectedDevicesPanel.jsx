import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getDeviceSyncStatus } from '../utils/deviceIntegrationManager';
import { getAllProviders, connectProvider, PROVIDER_STATUS } from '../utils/deviceProviders';

export default function ConnectedDevicesPanel({ onClose }) {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState({});
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    try {
      setProviders(getAllProviders());
      
      if (user?.uid) {
        const status = await getDeviceSyncStatus(user.uid);
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Error loading device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId) => {
    if (!user?.uid) return;
    
    setConnecting(providerId);
    try {
      const result = await connectProvider(user.uid, providerId);
      console.log('Connection result:', result);
    } catch (error) {
      console.error('Error connecting provider:', error);
    } finally {
      setConnecting(null);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getMetricIcon = (metric) => {
    const icons = {
      sleep: '💤',
      activity: '💪',
      stress: '⚖️',
      heart_rate: '❤️',
      hrv: '📊'
    };
    return icons[metric] || '📱';
  };

  const metrics = [
    { id: 'sleep', name: 'Sleep', description: 'Sleep duration, quality, and stages' },
    { id: 'activity', name: 'Activity', description: 'Steps, active minutes, calories' },
    { id: 'stress', name: 'Stress', description: 'Stress levels and recovery scores' },
    { id: 'heart_rate', name: 'Heart Rate', description: 'Resting and average heart rate' },
    { id: 'hrv', name: 'HRV', description: 'Heart rate variability metrics' }
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Connected Devices</h2>
            <p className="text-sm text-gray-500">Sync health data from your devices</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Data Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.map((metric) => {
                const status = syncStatus[metric.id];
                const hasData = status?.hasData;
                
                return (
                  <div
                    key={metric.id}
                    className={`p-4 rounded-xl border-2 transition-colors ${
                      hasData ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMetricIcon(metric.id)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{metric.name}</span>
                          {hasData && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Synced
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{metric.description}</p>
                        {hasData && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last: {formatLastSync(status.lastSync)}
                            {status.source && (
                              <span className="ml-1">via {status.source}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Available Integrations
            </h3>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                      {provider.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{provider.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{provider.description}</p>
                      <div className="flex gap-1 mt-1">
                        {provider.metrics.map((m) => (
                          <span key={m} className="text-xs text-gray-400">
                            {getMetricIcon(m)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting === provider.id}
                      className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      {connecting === provider.id ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="text-xl">📱</span>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Device Integration Coming Soon</h4>
                <p className="text-sm text-gray-600">
                  We're working on bringing automatic data sync from your favorite health devices. 
                  When available, device data will automatically enhance your Future Me projections 
                  with more accurate metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
