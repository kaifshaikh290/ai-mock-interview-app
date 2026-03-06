'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useFullscreen } from '@/hooks/useFullscreen';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function SystemCheck() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const camera = useCamera();
  const microphone = useMicrophone();
  const fullscreen = useFullscreen();

  const [checks, setChecks] = useState({
    camera: false,
    microphone: false,
    cameraStream: false,
    fullscreen: false,
  });

  const [testing, setTesting] = useState(false);
  const [allChecksPassed, setAllChecksPassed] = useState(false);

  useEffect(() => {
    if (camera.videoRef.current && camera.streamRef.current) {
      camera.videoRef.current.srcObject = camera.streamRef.current;
    }
  }, [camera.streamRef.current]);

  const runSystemChecks = async () => {
    setTesting(true);
    setChecks({ camera: false, microphone: false, cameraStream: false, fullscreen: false });

    try {
      await camera.requestPermission();
      setChecks((prev) => ({ ...prev, camera: true }));

      await microphone.requestPermission();
      setChecks((prev) => ({ ...prev, microphone: true }));

      await new Promise((resolve) => setTimeout(resolve, 500));
      const streamActive = camera.checkStreamActive();
      setChecks((prev) => ({ ...prev, cameraStream: streamActive }));

      await fullscreen.enterFullscreen();
      setChecks((prev) => ({ ...prev, fullscreen: true }));

      setAllChecksPassed(true);
    } catch (error) {
      console.error('System check failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const startInterview = async () => {
    if (!allChecksPassed) return;

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' }),
      });

      if (response.ok) {
        router.push(`/interview/${interviewId}`);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const CheckStatus = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="font-medium text-gray-700">{label}</span>
      {testing ? (
        <Loader className="animate-spin text-blue-600" size={24} strokeWidth={2.5} />
      ) : passed ? (
        <CheckCircle className="text-green-600" size={24} strokeWidth={2.5} />
      ) : (
        <XCircle className="text-gray-400" size={24} strokeWidth={2.5} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              System Check
            </h1>
            <p className="text-gray-600 text-base">
              We need to verify your system before starting the interview
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* System Requirements */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Requirements</h3>
              <div className="space-y-3">
                <CheckStatus passed={checks.camera} label="Camera Permission" />
                <CheckStatus passed={checks.microphone} label="Microphone Permission" />
                <CheckStatus passed={checks.cameraStream} label="Camera Feed Active" />
                <CheckStatus passed={checks.fullscreen} label="Fullscreen Mode" />
              </div>
            </div>

            {/* Camera Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera Preview</h3>
              <div className="relative bg-black rounded-xl border-2 border-gray-300 shadow-md overflow-hidden aspect-video">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!camera.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-white font-medium">Camera not active</p>
                      <p className="text-gray-400 text-sm mt-1">Click "Run System Check" to enable</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Instructions Box */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-6">
            <h4 className="font-semibold text-yellow-800 text-lg mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Important Instructions
            </h4>
            <ul className="space-y-2 text-yellow-700 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Keep your camera on throughout the interview</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Stay in fullscreen mode - exiting will increase suspicion score</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Do not switch tabs or minimize the window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>Ensure good lighting and stable internet connection</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
            {!allChecksPassed ? (
              <button
                onClick={runSystemChecks}
                disabled={testing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin" size={20} />
                    Testing...
                  </span>
                ) : (
                  'Run System Check'
                )}
              </button>
            ) : (
              <button
                onClick={startInterview}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200"
              >
                Start Interview →
              </button>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-600 mt-6">
          All checks must pass before you can start the interview
        </p>
      </div>
    </div>
  );
}
