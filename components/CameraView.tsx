import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, Timer, Play } from 'lucide-react';
import { PhotoData } from '../types';

interface CameraViewProps {
  onCaptureComplete: (photos: PhotoData[]) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCaptureComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for logic
  const [phase, setPhase] = useState<'PREPARING' | 'COUNTING' | 'CAPTURING'>('PREPARING');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoData[]>([]);
  const [flash, setFlash] = useState(false);

  // Initialize Camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 }, // Optimize for 4:3 (matches 520x390 slot better)
            height: { ideal: 960 },
            aspectRatio: { ideal: 1.33333 }, // Force 4:3 aspect ratio
            facingMode: 'user'
          },
          audio: false,
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        setError('Could not access camera. Please allow permissions.');
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture Function
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Mirror the context
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      const newPhoto: PhotoData = { id: Date.now().toString(), dataUrl };
      setCapturedPhotos(prev => {
        const updated = [...prev, newPhoto];
        return updated;
      });
    }
  }, []);

  // Start the sequence manually
  const startSequence = (duration: number) => {
    setSelectedDuration(duration);
    setPhase('COUNTING');
    setCountdown(duration);
  };

  // Main Sequencing Logic
  useEffect(() => {
    // If we are still preparing, do nothing
    if (phase === 'PREPARING') return;

    // We need 3 photos.
    const TOTAL_PHOTOS = 3;

    if (capturedPhotos.length >= TOTAL_PHOTOS) {
      const t = setTimeout(() => {
        onCaptureComplete(capturedPhotos);
      }, 500);
      return () => clearTimeout(t);
    }

    // Logic for Countdown -> Capture cycle
    // If countdown is active, decrement it
    // If countdown hits 0, capture and reset/restart logic
    
    // We only want to set up the interval if we are in COUNTING phase and have a countdown value
    if (phase === 'COUNTING' && countdown !== null) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev > 1) return prev - 1;
          
          // Time to capture (when hitting 1 -> 0 logic)
          clearInterval(timer);
          setPhase('CAPTURING');
          capturePhoto();
          return null; // Stop countdown display
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    // If we just captured a photo (phase became CAPTURING), we need to go back to COUNTING for the next photo
    if (phase === 'CAPTURING') {
        // Short delay after capture before starting next countdown
        const timeout = setTimeout(() => {
            if (capturedPhotos.length < TOTAL_PHOTOS) {
                setPhase('COUNTING');
                setCountdown(selectedDuration);
            }
        }, 1000); 
        return () => clearTimeout(timeout);
    }

  }, [phase, countdown, capturedPhotos.length, capturePhoto, selectedDuration, onCaptureComplete]);


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 text-center">
        <AlertCircle size={64} className="mb-4" />
        <h2 className="text-2xl font-bold">Camera Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
      />

      {/* PREPARATION OVERLAY: Timer Selection */}
      {phase === 'PREPARING' && (
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-md text-center max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-2 brand-font">Ready?</h2>
            <p className="text-slate-200 mb-8">Select a timer to start the sequence</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => startSequence(5)}
                className="flex flex-col items-center justify-center p-6 bg-pink-600 hover:bg-pink-500 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
              >
                <Timer size={40} className="mb-2 text-white group-hover:rotate-12 transition-transform" />
                <span className="text-4xl font-bold">5s</span>
                <span className="text-sm opacity-80 uppercase tracking-wider">Fast</span>
              </button>

              <button 
                onClick={() => startSequence(10)}
                className="flex flex-col items-center justify-center p-6 bg-purple-600 hover:bg-purple-500 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
              >
                <Timer size={40} className="mb-2 text-white group-hover:-rotate-12 transition-transform" />
                <span className="text-4xl font-bold">10s</span>
                <span className="text-sm opacity-80 uppercase tracking-wider">Relaxed</span>
              </button>
            </div>
          </div>
          <p className="mt-8 text-white/60 text-sm">Strike a pose for 3 photos!</p>
        </div>
      )}

      {/* Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 z-30 ${flash ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Countdown Overlay */}
      {phase === 'COUNTING' && countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 z-20">
          <span className="text-[12rem] md:text-[20rem] font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] brand-font animate-pulse">
            {countdown}
          </span>
        </div>
      )}

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
        {[0, 1, 2].map((idx) => (
          <div 
            key={idx}
            className={`w-5 h-5 rounded-full border-2 border-white transition-all duration-300 ${
              idx < capturedPhotos.length 
                ? 'bg-white scale-100' 
                : idx === capturedPhotos.length && phase !== 'PREPARING'
                  ? 'bg-yellow-400 animate-bounce scale-110 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                  : 'bg-transparent opacity-40 scale-90'
            }`}
          />
        ))}
      </div>
      
      {/* Top Status Text */}
      <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-20">
        {phase !== 'PREPARING' && (
             <h2 className="text-white text-2xl font-bold drop-shadow-md brand-font tracking-wide">
             {capturedPhotos.length === 0 ? "Get Ready!" : `Photo ${capturedPhotos.length + 1} of 3`}
          </h2>
        )}
      </div>
    </div>
  );
};

export default CameraView;