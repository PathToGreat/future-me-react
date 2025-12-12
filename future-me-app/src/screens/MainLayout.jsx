import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from '../context/AppContext';
import BottomNavigation from '../components/navigation/BottomNavigation';
import AchievementNotification from '../components/AchievementNotification';
import HomeScreen from './HomeScreen';
import AvatarScreen from './AvatarScreen';
import HabitsScreen from './HabitsScreen';
import MetricsScreen from './MetricsScreen';
import MenuScreen from './MenuScreen';

function MainLayoutContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { newAchievementNotification, handleCloseNotification } = useApp();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'avatar':
        return <AvatarScreen />;
      case 'habits':
        return <HabitsScreen />;
      case 'metrics':
        return <MetricsScreen />;
      case 'menu':
        return <MenuScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AchievementNotification 
        achievement={newAchievementNotification}
        onClose={handleCloseNotification}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
}

export default function MainLayout() {
  return (
    <AppProvider>
      <MainLayoutContent />
    </AppProvider>
  );
}
