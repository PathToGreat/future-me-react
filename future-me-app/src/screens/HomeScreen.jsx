import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import FutureSelfPreview from '../components/FutureSelfPreview';
import DailyInsight from '../components/DailyInsight';
import JourneyMeter from '../components/JourneyMeter';
import MicroSuggestionCard from '../components/MicroSuggestionCard';
import ReassessmentBanner from '../components/ReassessmentBanner';
import InsightsPanel from '../components/InsightsPanel';
import ProgressTimeline from '../components/ProgressTimeline';
import FocusZoneIndicator from '../components/FocusZoneIndicator';
import ConsistencyStreaks from '../components/ConsistencyStreaks';
import WeeklyReflectionPrompt from '../components/WeeklyReflectionPrompt';
import NoticingCard from '../components/NoticingCard';
import ProgressSnapshot from '../components/ProgressSnapshot';

export default function HomeScreen() {
  const {
    liveProfile,
    habits,
    achievements,
    showReassessmentBanner,
    reassessmentAnalysis,
    dismissReassessmentBanner,
    historyData,
  } = useApp();
  
  const [showSnapshot, setShowSnapshot] = useState(false);

  if (!liveProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600">Your daily overview</p>
      </div>

      <FocusZoneIndicator />

      <NoticingCard />

      <WeeklyReflectionPrompt />

      <FutureSelfPreview 
        lifestyleScore={liveProfile.lifestyleScore || 50} 
        lifeZones={liveProfile.lifeZones}
        habits={habits}
        achievements={achievements}
      />

      <ReassessmentBanner
        isVisible={showReassessmentBanner}
        improvements={reassessmentAnalysis?.improvements || []}
        declines={reassessmentAnalysis?.declines || []}
        summary={reassessmentAnalysis?.summary}
        onDismiss={dismissReassessmentBanner}
      />

      <MicroSuggestionCard 
        onViewInsights={() => {
          const insightsSection = document.querySelector('[data-section="insights"]');
          if (insightsSection) {
            insightsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <ProgressTimeline />
        <ConsistencyStreaks />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DailyInsight
          activity={liveProfile.activity}
          nutrition={liveProfile.nutrition}
          sleep={liveProfile.sleep}
          stress={liveProfile.stress}
        />
        <JourneyMeter onboardingCompleted={liveProfile.onboardingCompleted} />
      </div>

      <div data-section="insights">
        <InsightsPanel 
          profile={liveProfile}
          historyData={historyData}
        />
      </div>

      {historyData && historyData.length >= 3 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowSnapshot(true)}
            className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-2"
          >
            📊 View Progress Snapshot
          </button>
        </div>
      )}

      <ProgressSnapshot 
        isOpen={showSnapshot} 
        onClose={() => setShowSnapshot(false)} 
      />
    </div>
  );
}
