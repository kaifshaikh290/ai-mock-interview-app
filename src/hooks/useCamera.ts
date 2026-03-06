'use client';

import { useState, useEffect, useRef } from 'react';

export const useCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setIsActive(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err: any) {
      setHasPermission(false);
      setError(err.message || 'Camera permission denied');
      throw err;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  const checkStreamActive = () => {
    if (!streamRef.current) return false;
    const videoTracks = streamRef.current.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].readyState === 'live';
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    hasPermission,
    isActive,
    error,
    videoRef,
    streamRef,
    requestPermission,
    stopCamera,
    checkStreamActive,
  };
};
