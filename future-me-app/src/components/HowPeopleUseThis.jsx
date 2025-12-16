import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const socialProofMessages = [
  "Some users notice changes in stress patterns within the first two weeks.",
  "Many people use this as a daily awareness check, not a habit streak.",
  "Most users find that tracking reveals patterns they hadn't noticed before.",
  "Some people share their progress with a spouse or accountability partner.",
  "Many users find morning logging helps set intentions for the day.",
  "Some users check in briefly each evening as a reflection practice.",
  "Many people discover connections between sleep and stress after a few weeks.",
  "Some users find that consistent tracking reduces the need for perfect habits.",
  "Many people notice their baseline understanding improves over time.",
  "Some users appreciate seeing their patterns without pressure to change them."
];

export default function HowPeopleUseThis() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    setCurrentIndex(dayOfYear % socialProofMessages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % socialProofMessages.length);
        setIsVisible(true);
      }, 300);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
      <div className="flex items-start gap-2">
        <span className="text-gray-400 text-sm flex-shrink-0">📊</span>
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-gray-500 leading-relaxed"
            >
              {socialProofMessages[currentIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
