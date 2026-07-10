import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import DailyTracking from '../components/DailyTracking';
import ZoneCard from '../components/ZoneCard';
import LifeZoneDetailsModal from '../components/LifeZoneDetailsModal';
import { ZONE_CONFIG } from '../utils/zoneConfig';

export default function MetricsScreen() {
  const {
    liveProfile,
    handleAchievementsEarned,
  } = useApp();

  const [showDailyTracking, setShowDailyTracking] = useState(false);
  const [showZoneDetailsModal, setShowZoneDetailsModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const lifeZones = liveProfile.lifeZones || {};
  
  const zones = Object.keys(ZONE_CONFIG).map(zoneId => ({
    title: ZONE_CONFIG[zoneId].title,
    zoneId: zoneId,
    score: lifeZones[zoneId]?.score || 50,
    icon: ZONE_CONFIG[zoneId].icon,
    details: lifeZones[zoneId]?.details,
    isPlaceholder: !lifeZones[zoneId]
  }));

  const handleViewZoneDetails = (zone) => {
    setSelectedZone(zone);
    setShowZoneDetailsModal(true);
  };

  const handleCloseZoneModal = () => {
    setShowZoneDetailsModal(false);
    setSelectedZone(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Daily Metrics</h1>
        <p className="text-gray-600">Log your daily health and wellness data</p>
      </div>

      <AnimatePresence mode="wait">
        {showDailyTracking ? (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DailyTracking
              onClose={() => setShowDailyTracking(false)}
              onSave={() => {
                console.log("Daily metrics saved");
              }}
              onAchievementsEarned={handleAchievementsEarned}
            />
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <button
              onClick={() => setShowDailyTracking(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📊</span>
              <span>Daily Quick Log</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Life Zones</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone, index) => (
            <ZoneCard
              key={zone.title}
              title={zone.title}
              zoneId={zone.zoneId}
              score={zone.score}
              icon={zone.icon}
              index={index}
              details={zone.details}
              isPlaceholder={zone.isPlaceholder}
              onViewDetails={handleViewZoneDetails}
            />
          ))}
        </div>
      </div>

      <LifeZoneDetailsModal
        isOpen={showZoneDetailsModal}
        onClose={handleCloseZoneModal}
        zone={selectedZone}
        zoneId={selectedZone?.zoneId}
      />
    </div>
  );
}
