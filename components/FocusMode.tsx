import React, { useState, useEffect } from 'react';
import { FOCUS_DURATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Maximize, X, Play, Smartphone, BellOff, CheckCircle } from 'lucide-react';

interface FocusModeProps {
  userId: string;
  onExit: () => void;
  onSessionComplete: () => void;
}

enum FocusStep {
  AWARENESS = 0,
  GUIDANCE = 1,
  ACTIVE = 2,
}

const FocusMode: React.FC<FocusModeProps> = ({ userId, onExit, onSessionComplete }) => {
  const [step, setStep] = useState<FocusStep>(FocusStep.AWARENESS);
  const [duration, setDuration] = useState<number>(25); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Effect
  useEffect(() => {
    const clockInterval = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (step === FocusStep.ACTIVE && isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !completed) {
      setIsActive(false);
      handleCompletion();
    }
    return () => clearInterval(interval);
  }, [step, isActive, timeLeft, completed]);

  const handleCompletion = async () => {
      setCompleted(true);
      
      // Save session to DB
      try {
          await supabase.from('focus_sessions').insert({
              user_id: userId,
              duration_minutes: duration,
              subject: 'General Study', // Could be dynamic
              completed_at: new Date().toISOString()
          });

          // Trigger streak update in parent
          onSessionComplete();
      } catch (error) {
          console.error("Error saving session:", error);
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSession = () => {
    setTimeLeft(duration * 60);
    setStep(FocusStep.ACTIVE);
    setIsActive(true);
  };

  // 1. Awareness Modal
  if (step === FocusStep.AWARENESS) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <BellOff className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Enter Focus Zone</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Distractions are the enemy of deep learning. We'll help you set up your environment before starting the timer.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep(FocusStep.GUIDANCE)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors w-full"
            >
              Continue
            </button>
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-slate-600 font-medium py-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Guidance Screen
  if (step === FocusStep.GUIDANCE) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-lg w-full">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold text-slate-800">Prepare your Device</h2>
                <button onClick={onExit}><X className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-lg"><Smartphone className="w-6 h-6 text-slate-600"/></div>
                    <div>
                        <h3 className="font-semibold text-slate-800">Turn on Do Not Disturb</h3>
                        <p className="text-slate-500 text-sm mt-1">Silence notifications to prevent interruptions.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-lg"><Maximize className="w-6 h-6 text-slate-600"/></div>
                    <div>
                        <h3 className="font-semibold text-slate-800">We will go Full Screen</h3>
                        <p className="text-slate-500 text-sm mt-1">The app will hide navigation to keep you focused.</p>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <label className="block text-sm font-medium text-slate-700 mb-4">Select Session Duration</label>
                <div className="grid grid-cols-4 gap-3">
                    {FOCUS_DURATIONS.map((m) => (
                        <button
                            key={m}
                            onClick={() => setDuration(m)}
                            className={`py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                                duration === m 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {m}m
                        </button>
                    ))}
                </div>
            </div>

            <button
              onClick={startSession}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-colors w-full flex items-center justify-center gap-2 text-lg shadow-lg shadow-indigo-200"
            >
              <Play className="w-5 h-5 fill-current" /> Start Focus Session
            </button>
        </div>
      </div>
    );
  }

  // 3. Active Mode
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center animate-in fade-in duration-700">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Real Time Clock */}
      <div className="absolute top-8 right-8 text-slate-400/50 font-mono text-xl tracking-widest hover:text-slate-200 transition-colors cursor-default select-none">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="z-10 text-center">
        {!completed ? (
            <>
                <div className="mb-8 text-indigo-300 font-medium tracking-widest uppercase text-sm">Focus Mode Active</div>
                <div className="text-9xl font-bold font-mono tracking-tighter mb-12 tabular-nums">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex gap-6 justify-center">
                    <button 
                        onClick={() => setIsActive(!isActive)}
                        className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-md"
                    >
                        {isActive ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                             <Play className="w-6 h-6 text-white fill-current" />
                        )}
                    </button>
                    <button 
                        onClick={onExit}
                        className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors backdrop-blur-md"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </>
        ) : (
            <div className="animate-in zoom-in duration-500">
                <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold mb-4">Session Complete!</h2>
                <p className="text-slate-400 text-lg mb-8">Great job staying focused.</p>
                <button
                  onClick={onExit}
                  className="bg-white text-slate-900 px-8 py-3 rounded-full font-medium hover:bg-slate-200 transition-colors"
                >
                  Return to Dashboard
                </button>
            </div>
        )}
      </div>
      
      {!completed && (
         <div className="absolute bottom-8 text-slate-500 text-sm">
            Stay on this screen to maintain your streak.
         </div>
      )}
    </div>
  );
};

export default FocusMode;