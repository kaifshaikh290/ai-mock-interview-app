'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SuspicionEvent {
  type: string;
  timestamp: Date;
}

export const useProctoring = (
  isActive: boolean,
  onSuspicionThresholdExceeded?: () => void
) => {
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [suspicionEvents, setSuspicionEvents] = useState<SuspicionEvent[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const SUSPICION_THRESHOLD = 50;

  const addSuspicionEvent = useCallback((type: string, points: number) => {
    const event: SuspicionEvent = {
      type,
      timestamp: new Date(),
    };

    setSuspicionEvents((prev) => [...prev, event]);
    setSuspicionScore((prev) => {
      const newScore = Math.min(prev + points, 100);
      if (newScore >= SUSPICION_THRESHOLD && onSuspicionThresholdExceeded) {
        onSuspicionThresholdExceeded();
      }
      return newScore;
    });
  }, [onSuspicionThresholdExceeded]);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        addSuspicionEvent('Tab switched', 10);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addSuspicionEvent('Exited fullscreen', 15);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive, addSuspicionEvent]);

  const reportCameraDisabled = () => {
    addSuspicionEvent('Camera disabled', 20);
  };

  const reportMicrophoneMuted = () => {
    addSuspicionEvent('Microphone muted', 10);
  };

  const resetProctoring = () => {
    setSuspicionScore(0);
    setSuspicionEvents([]);
    setTabSwitchCount(0);
  };

  return {
    suspicionScore,
    suspicionEvents,
    tabSwitchCount,
    reportCameraDisabled,
    reportMicrophoneMuted,
    resetProctoring,
  };
};
