import { useState, useEffect, useCallback } from 'react';
import { saveCommitment, getActiveCommitment, updateCommitmentStatus } from '../utils/commitmentStorage';
import { isCommitmentActive, dismissCommitment, completeCommitment, getCommitmentProgress, getCommitmentDaysRemaining } from '../utils/commitmentIntentSystem';
import { getCommitmentContextForAvatar, createAcknowledgmentCard, shouldShowAcknowledgment } from '../utils/commitmentAcknowledgment';

export function useCommitmentIntent(userId) {
  const [activeCommitment, setActiveCommitment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgmentCount, setAcknowledgmentCount] = useState(0);

  useEffect(() => {
    async function fetchActiveCommitment() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const commitment = await getActiveCommitment(userId);
      setActiveCommitment(commitment);
      setIsLoading(false);
    }

    fetchActiveCommitment();
  }, [userId]);

  const createCommitment = useCallback(async (commitment) => {
    if (!commitment) {
      return false;
    }

    const saved = await saveCommitment(commitment);
    
    if (saved) {
      setActiveCommitment(saved);
      setAcknowledgmentCount(0);
      return true;
    }
    
    return false;
  }, []);

  const dismissActiveCommitment = useCallback(async (reason = 'user_dismissed') => {
    if (!activeCommitment) {
      return false;
    }

    const dismissed = dismissCommitment(activeCommitment, reason);
    const success = await updateCommitmentStatus(activeCommitment.id, dismissed);
    
    if (success) {
      setActiveCommitment(null);
      setAcknowledgmentCount(0);
    }
    
    return success;
  }, [activeCommitment]);

  const completeActiveCommitment = useCallback(async () => {
    if (!activeCommitment) {
      return false;
    }

    const completed = completeCommitment(activeCommitment);
    const success = await updateCommitmentStatus(activeCommitment.id, completed);
    
    if (success) {
      setActiveCommitment(null);
      setAcknowledgmentCount(0);
    }
    
    return success;
  }, [activeCommitment]);

  const getAvatarContext = useCallback(() => {
    return getCommitmentContextForAvatar(activeCommitment);
  }, [activeCommitment]);

  const checkForAcknowledgment = useCallback((userMetrics) => {
    if (!activeCommitment) {
      return null;
    }

    if (!shouldShowAcknowledgment(activeCommitment, userMetrics, acknowledgmentCount)) {
      return null;
    }

    const card = createAcknowledgmentCard(activeCommitment, userMetrics);
    
    if (card) {
      setAcknowledgmentCount(prev => prev + 1);
    }
    
    return card;
  }, [activeCommitment, acknowledgmentCount]);

  const getProgress = useCallback(() => {
    if (!activeCommitment) {
      return null;
    }
    
    return getCommitmentProgress(activeCommitment);
  }, [activeCommitment]);

  const getDaysRemaining = useCallback(() => {
    if (!activeCommitment) {
      return 0;
    }
    
    return getCommitmentDaysRemaining(activeCommitment);
  }, [activeCommitment]);

  const hasActiveCommitment = activeCommitment && isCommitmentActive(activeCommitment);

  return {
    activeCommitment,
    hasActiveCommitment,
    isLoading,
    createCommitment,
    dismissActiveCommitment,
    completeActiveCommitment,
    getAvatarContext,
    checkForAcknowledgment,
    getProgress,
    getDaysRemaining
  };
}

export default useCommitmentIntent;
