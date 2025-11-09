
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NoteDisplay } from './components/NoteDisplay';
import { Visualizer } from './components/Visualizer';
import { NoteData, autoCorrelate, frequencyToNoteInfo } from './utils/audio';
import { MicIcon, StopCircleIcon, GithubIcon } from './components/Icons';

const App: React.FC = () => {
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(updatePitch);
      return;
    }

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const frequency = autoCorrelate(bufferRef.current, audioContextRef.current!.sampleRate);
    
    if (frequency !== -1) {
      const noteInfo = frequencyToNoteInfo(frequency);
      setNoteData(noteInfo);
    } else {
      setNoteData(null);
    }

    animationFrameIdRef.current = requestAnimationFrame(updatePitch);
  }, []);
  
  const startListening = async () => {
    try {
      setError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;
        
        bufferRef.current = new Float32Array(analyser.fftSize);
        
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceNodeRef.current = source;
        
        setIsListening(true);
        animationFrameIdRef.current = requestAnimationFrame(updatePitch);
      } else {
        setError("Your browser does not support the Web Audio API.");
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
          setError('Could not access the microphone.');
      }
    }
  };

  const stopListening = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    bufferRef.current = null;
    setIsListening(false);
    setNoteData(null);
  }, []);
  
  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/40 via-gray-900 to-gray-900 z-0"></div>
        <div className="w-full max-w-md mx-auto text-center z-10">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Vocal Pitch Detector
            </h1>
            <p className="text-gray-400 mt-2">Sing a note and see it in real-time.</p>
          </header>

          <main className="bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-md p-6 md:p-8 border border-gray-700/50">
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <div className="h-64 flex items-center justify-center">
              {isListening ? (
                <NoteDisplay data={noteData} />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <MicIcon className="w-16 h-16 mb-4"/>
                  <span className="text-lg">Press Start to begin</span>
                </div>
              )}
            </div>
            
            <div className="h-24 mt-4 mb-8">
              <Visualizer analyser={analyserRef.current} isListening={isListening}/>
            </div>

            <button
              onClick={handleToggleListen}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ease-in-out shadow-lg transform active:scale-95 focus:outline-none focus:ring-4
                ${isListening 
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400/50' 
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-400/50'
                }`}
            >
              {isListening ? (
                <StopCircleIcon className="w-12 h-12" />
              ) : (
                <MicIcon className="w-10 h-10" />
              )}
              <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
            </button>
          </main>
        </div>
    </div>
  );
};

export default App;
