'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useProctoring } from '@/hooks/useProctoring';
import { Mic, MicOff, AlertTriangle, AlertCircle, Loader, Volume2, VolumeX } from 'lucide-react';

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const camera = useCamera();
  const microphone = useMicrophone();

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const proctoring = useProctoring(true, () => {
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  });

  useEffect(() => {
    initializeInterview();
    setupSpeechRecognition();

    return () => {
      camera.stopCamera();
      microphone.cleanup();
      // Cancel any ongoing speech when component unmounts
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (camera.videoRef.current && camera.streamRef.current) {
      camera.videoRef.current.srcObject = camera.streamRef.current;
    }
  }, [camera.streamRef.current]);

  const initializeInterview = async () => {
    try {
      await camera.requestPermission();
      await microphone.requestPermission();
      await fetchNextQuestion();
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setTranscript((prev) => {
          const newTranscript = [...prev];
          newTranscript[newTranscript.length - 1] = transcript;
          return newTranscript;
        });
      };
    }
  };

  /**
   * Text-to-Speech Function
   * Converts question text to spoken audio using Web Speech API
   * 
   * @param text - The question text to be spoken
   * 
   * Features:
   * - Cancels any previous speech before starting new one
   * - Uses English (US) voice
   * - Configurable rate, pitch, and volume
   * - Updates speaking state for UI feedback
   */
  const speakQuestion = (text: string) => {
    // Check if browser supports Speech Synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-Speech not supported in this browser');
      return;
    }

    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();

    // Create new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current = utterance;

    // Configure voice settings
    utterance.lang = 'en-US'; // English (US) voice
    utterance.rate = 0.9; // Slightly slower for clarity (0.1 to 10, default 1)
    utterance.pitch = 1.0; // Normal pitch (0 to 2, default 1)
    utterance.volume = 1.0; // Full volume (0 to 1, default 1)

    // Event handlers for speech lifecycle
    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Stop current speech
   * Cancels any ongoing text-to-speech
   */
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  /**
   * Enable voice for the first time
   * Must be triggered by user interaction (button click)
   * This is required by browser autoplay policies
   */
  const enableVoice = () => {
    setVoiceEnabled(true);
    // Speak the current question if available
    if (currentQuestion) {
      speakQuestion(currentQuestion);
    }
  };

  const fetchNextQuestion = async (previousAnswer?: string) => {
    if (!interviewId) {
      setError('Interview ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/interviews/${interviewId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousAnswer }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Question API Response:', data);

      if (data.completed) {
        console.log('Interview completed');
        await completeInterview();
        return;
      }

      if (!data.question) {
        throw new Error('No question received from API');
      }

      // Set question state
      setCurrentQuestion(data.question || null);
      setQuestionNumber(data.questionNumber || null);
      setTotalQuestions(data.totalQuestions || 10);
      setError(null);

      // Automatically speak the question if voice is enabled
      // This happens after user has clicked "Enable Voice" button
      if (voiceEnabled && data.question) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          speakQuestion(data.question);
        }, 300);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch question';
      console.error('Error fetching question:', errorMessage);
      setError(errorMessage);
      setCurrentQuestion(null);
      setQuestionNumber(null);
    } finally {
      setLoading(false);
    }
  };

  const startAnswering = () => {
    setIsAnswering(true);
    setTranscript((prev) => [...prev, '']);
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopAnswering = async () => {
    setIsAnswering(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const answer = transcript[transcript.length - 1] || '';

    if (questionNumber !== null) {
      await fetch(`/api/interviews/${interviewId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          questionIndex: questionNumber - 1,
        }),
      });
    }

    await fetchNextQuestion(answer);
  };

  const completeInterview = async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspicionScore: proctoring.suspicionScore,
          suspicionEvents: proctoring.suspicionEvents,
        }),
      });

      if (response.ok) {
        router.push(`/interview/${interviewId}/report`);
      }
    } catch (error) {
      console.error('Failed to complete interview:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>Warning: Suspicious activity detected!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Question Container */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {questionNumber !== null && totalQuestions !== null
                  ? `Question ${questionNumber} of ${totalQuestions}`
                  : 'Loading...'}
              </h2>
              <div className="flex items-center gap-3">
                {/* Voice Control Button */}
                {!voiceEnabled ? (
                  <button
                    onClick={enableVoice}
                    disabled={!currentQuestion || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    title="Enable AI voice to hear questions"
                  >
                    <Volume2 size={18} />
                    <span className="text-sm">Enable Voice</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {isSpeaking ? (
                      <button
                        onClick={stopSpeaking}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
                        title="Stop speaking"
                      >
                        <VolumeX size={18} />
                        <span className="text-sm">Stop Voice</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => currentQuestion && speakQuestion(currentQuestion)}
                        disabled={!currentQuestion}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                        title="Replay question"
                      >
                        <Volume2 size={18} />
                        <span className="text-sm">Replay</span>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Suspicion Score */}
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-300">Suspicion:</span>
                  <span
                    className={`font-bold text-lg ${
                      proctoring.suspicionScore > 50
                        ? 'text-red-500'
                        : proctoring.suspicionScore > 25
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {proctoring.suspicionScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="bg-gray-700 rounded-lg p-6 mb-8 min-h-[120px] flex flex-col justify-center relative">
              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-green-600 rounded-full">
                  <div className="flex gap-1">
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-white text-xs font-medium">AI Speaking...</span>
                </div>
              )}

              {loading && currentQuestion === null ? (
                <div className="flex items-center gap-3">
                  <Loader className="animate-spin text-blue-400" size={24} />
                  <p className="text-gray-300 text-lg">Loading question...</p>
                </div>
              ) : error ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="text-red-400 font-medium">Error Loading Question</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              ) : currentQuestion ? (
                <p className="text-white text-lg font-medium leading-relaxed">
                  {currentQuestion}
                </p>
              ) : (
                <p className="text-gray-400 text-lg italic">No question available</p>
              )}
            </div>

            {/* Answer Button */}
            <div className="flex justify-center">
              {!isAnswering ? (
                <button
                  onClick={startAnswering}
                  disabled={loading || error !== null || currentQuestion === null}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold text-white transition-colors shadow-lg"
                >
                  <Mic size={24} />
                  <span>Start Answering</span>
                </button>
              ) : (
                <button
                  onClick={stopAnswering}
                  className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full font-semibold text-white transition-colors shadow-lg animate-pulse"
                >
                  <MicOff size={24} />
                  <span>Stop & Submit</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcription Container */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Live Transcription</h3>
            <div className="bg-gray-700 rounded-lg p-5 min-h-[200px] max-h-[300px] overflow-y-auto border border-gray-600">
              {transcript.length === 0 ? (
                <p className="text-gray-400 italic">Your answer will appear here...</p>
              ) : (
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {transcript[transcript.length - 1] || ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Camera Feed */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Camera Feed</h3>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2 border-gray-600">
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Proctoring Events */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Proctoring Events</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {proctoring.suspicionEvents.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No events detected</p>
              ) : (
                proctoring.suspicionEvents.slice(-5).reverse().map((event, idx) => (
                  <div key={idx} className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                    <p className="text-yellow-400 font-medium text-sm">{event.type}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
