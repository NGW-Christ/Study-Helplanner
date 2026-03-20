import { BellOff, CheckCircle, Maximize, Play, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { FOCUS_DURATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface FocusModeProps {
 userId: string;
 onExit: () => void;
 onSessionComplete: () => void;
 initialDuration?: number;
}

enum FocusStep {
 AWARENESS = 0,
 GUIDANCE = 1,
 ACTIVE = 2,
}

const FocusMode: React.FC<FocusModeProps> = ({ userId, onExit, onSessionComplete, initialDuration = 25 }) => {
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
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in transition-all">
 <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 text-center border border-slate-200">
 <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
 <BellOff className="w-10 h-10 text-indigo-600" />
 </div>
 <h2 className="text-3xl font-semibold text-slate-900 mb-4">Focus Zone</h2>
 <p className="text-slate-600 mb-10 leading-relaxed text-lg font-medium">
 Distractions are the enemy of deep learning. Let's silence the world for a while.
 </p>
 <div className="flex flex-col gap-4">
 <button
 onClick={() => setStep(FocusStep.GUIDANCE)}
 className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all w-full shadow-lg shadow-indigo-500/25 active:scale-95"
 >
 Continue to Setup
 </button>
 <button
 onClick={onExit}
 className="text-slate-400 hover:text-slate-600 font-semibold py-4 transition-colors text-sm uppercase tracking-widest"
 >
 Maybe Later
 </button>
 </div>
 </div>
 </div>
 );
 }

 // 2. Guidance Screen
 if (step === FocusStep.GUIDANCE) {
 return (
 <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-500 transition-colors">
 <div className="max-w-xl w-full">
 <div className="flex justify-between items-center mb-12">
 <div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Prepare your Space</h2>
 <p className="text-slate-500 font-medium">A quick checklist for deep work</p>
 </div>
 <button 
 onClick={onExit}
 className="p-3 hover:bg-slate-100 rounded-full transition-colors group"
 >
 <X className="w-7 h-7 text-slate-400 group-hover:text-slate-600 "/>
 </button>
 </div>
 
 <div className="space-y-8 mb-12">
 <div className="flex items-start gap-6 group">
 <div className="bg-slate-100 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Smartphone className="w-8 h-8 text-slate-600"/></div>
 <div>
 <h3 className="text-xl font-semibold text-slate-800">Turn on Do Not Disturb</h3>
 <p className="text-slate-500 text-base mt-2 leading-relaxed">Silence notifications to prevent digital interruptions and keep your flow state.</p>
 </div>
 </div>
 <div className="flex items-start gap-6 group">
 <div className="bg-slate-100 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Maximize className="w-8 h-8 text-slate-600"/></div>
 <div>
 <h3 className="text-xl font-semibold text-slate-800">Enter Immersion</h3>
 <p className="text-slate-500 text-base mt-2 leading-relaxed">The app will go full screen to remove all visual clutter and browser distractions.</p>
 </div>
 </div>
 </div>

 <div className="mb-12">
 <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Session Duration</label>
 <div className="grid grid-cols-4 gap-4">
 {FOCUS_DURATIONS.map((m) => (
 <button
 key={m}
 onClick={() => setDuration(m)}
 className={`py-4 rounded-2xl text-lg font-semibold border-2 transition-all ${
 duration === m 
 ? 'border-indigo-600 bg-indigo-50 text-indigo-700 scale-105 shadow-md' 
 : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
 }`}
 >
 {m}m
 </button>
 ))}
 </div>
 </div>

 <button
 onClick={startSession}
 className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] transition-all w-full flex items-center justify-center gap-3 text-xl shadow-xl shadow-indigo-500/30 active:scale-[0.98]"
 >
 <Play className="w-6 h-6 fill-current" /> Start Deep Work
 </button>
 </div>
 </div>
 );
 }

 // 3. Active Mode
 return (
 <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center animate-in fade-in duration-1000">
 {/* Background decoration */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
 <div className="absolute -top-60 -right-60 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px]"></div>
 <div className="absolute -bottom-60 -left-60 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[120px]"></div>
 </div>

 {/* Real Time Clock */}
 <div className="absolute top-12 right-12 text-slate-600 font-mono text-xl tracking-[0.3em] hover:text-slate-400 transition-colors cursor-default select-none group">
 <span className="group-hover:scale-110 inline-block transition-transform">
 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>

 <div className="z-10 text-center px-4">
 {!completed ? (
 <>
 <div className="mb-10 text-indigo-400 font-black tracking-[0.4em] uppercase text-xs animate-pulse">Immersion Active</div>
 <div className="text-9xl sm:text-[12rem] font-black font-mono tracking-tighter mb-16 tabular-nums drop-shadow-2xl">
 {formatTime(timeLeft)}
 </div>
 <div className="flex gap-10 justify-center">
 <button 
 onClick={() => setIsActive(!isActive)}
 className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all backdrop-blur-xl border border-white/10 group active:scale-90"
 >
 {isActive ? (
 <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
 ) : (
 <Play className="w-8 h-8 text-white fill-current group-hover:scale-110 transition-transform" />
 )}
 </button>
 <button 
 onClick={onExit}
 className="w-20 h-20 rounded-full bg-red-500/5 hover:bg-red-500/20 text-red-500 hover:text-red-400 flex items-center justify-center transition-all backdrop-blur-xl border border-red-500/10 group active:scale-90"
 >
 <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
 </button>
 </div>
 </>
 ) : (
 <div className="animate-in zoom-in duration-700 max-w-sm mx-auto">
 <div className="bg-emerald-500/20 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-emerald-500/30">
 <CheckCircle className="w-16 h-16 text-emerald-400" />
 </div>
 <h2 className="text-5xl font-black mb-6 tracking-tight">Mission Accomplished</h2>
 <p className="text-slate-400 text-xl mb-12 font-medium leading-relaxed">Your focus session was successful. You're getting closer to your goals.</p>
 <button
 onClick={onExit}
 className="bg-white text-slate-900 px-12 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all shadow-xl shadow-white/10 active:scale-95"
 >
 End Session
 </button>
 </div>
 )}
 </div>
 
 {!completed && (
 <div className="absolute bottom-12 text-slate-600 text-sm font-semibold uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full backdrop-blur-sm">
 Maintain your streak
 </div>
 )}
 </div>
 );
};

export default FocusMode;
