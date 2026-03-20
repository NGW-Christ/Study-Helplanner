import { ArrowRight, BookOpen, GraduationCap, X } from 'lucide-react';
import React, { useState } from 'react';
import { Cycle, Option, UserProfile } from '../types';

interface OnboardingProps {
 onComplete: (profile: Pick<UserProfile, 'cycle' | 'option'>) => void;
 onBack?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBack }) => {
 const [step, setStep] = useState<number>(0);
 const [cycle, setCycle] = useState<Cycle | null>(null);
 const [option, setOption] = useState<Option | null>(null);
 const [loading, setLoading] = useState(false);

 const handleCycleSelect = (selectedCycle: Cycle) => {
 setCycle(selectedCycle);
 };

 const handleContinueCycle = () => {
 if (cycle) {
 setStep(2);
 }
 };

 const handleOptionSelect = (selectedOption: Option) => {
 setOption(selectedOption);
 };

 const handleCompleteOnboarding = () => {
 if (cycle && option) {
 onComplete({ cycle, option });
 }
 };

 const handleBack = () => {
 if (step > 0) {
 setStep(step - 1);
 } else if (onBack) {
 onBack();
 }
 };

 return (
 <div className="flex flex-col min-h-screen bg-light-background transition-colors">
 {/* Header with Close/Back Button matching RN reference */}
 <div className="flex justify-end pt-8 px-8">
 <button 
 onClick={handleBack}
 className="p-3 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full shadow-sm"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="flex-1 flex items-center justify-center p-6">
 <div className="max-w-xl w-full">
 {step === 0 && (
 <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-14 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
 <div className="flex justify-center mb-8">
 <div className="bg-indigo-50 p-6 rounded-[2rem] animate-bounce-subtle">
 <BookOpen className="w-16 h-16 text-indigo-600" />
 </div>
 </div>
 <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Welcome to Study Helplanner</h1>
 <p className="text-slate-600 text-lg mb-10 leading-relaxed font-semibold">
 Your personal, focused workspace for mastering your Cameroonian O and A Level subjects.
 Let's get your study plan set up.
 </p>
 <button
 onClick={() => setStep(1)}
 className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 mx-auto w-full md:w-auto shadow-xl shadow-indigo-500/25 active:scale-95 text-lg"
 >
 Get Started <ArrowRight className="w-5 h-5" />
 </button>
 </div>
 )}

 {step === 1 && (
 <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
 <div className="text-center mb-14">
 <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Select Your Level</h2>
 <p className="text-slate-500 text-lg font-semibold">Choose your academic cycle</p>
 </div>
 
 <div className="flex-1 space-y-6 flex flex-col justify-center">
 <button
 onClick={() => handleCycleSelect(Cycle.O_LEVEL)}
 className={`w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
 cycle === Cycle.O_LEVEL 
 ? 'bg-indigo-50 border-indigo-600 shadow-xl shadow-indigo-500/10' 
 : 'bg-white border-slate-100 hover:border-slate-200 '
 }`}
 >
 <div className="flex items-center gap-8">
 <div className={`p-5 rounded-2xl transition-all ${
 cycle === Cycle.O_LEVEL 
 ? 'bg-indigo-600 text-white scale-110 shadow-lg' 
 : 'bg-slate-50 text-slate-400'
 }`}>
 <GraduationCap className="w-10 h-10" />
 </div>
 <div className="text-left">
 <h3 className="text-2xl font-black text-slate-900 mb-1">O Level</h3>
 <p className="text-slate-500 text-base font-semibold">Form 5 - Ordinary Level</p>
 </div>
 </div>
 {cycle === Cycle.O_LEVEL && (
 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-lg">
 <ArrowRight className="w-6 h-6" />
 </div>
 )}
 </button>

 <button
 onClick={() => handleCycleSelect(Cycle.A_LEVEL)}
 className={`w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
 cycle === Cycle.A_LEVEL 
 ? 'bg-indigo-50 border-indigo-600 shadow-xl shadow-indigo-500/10' 
 : 'bg-white border-slate-100 hover:border-slate-200'
 }`}
 >
 <div className="flex items-center gap-8">
 <div className={`p-5 rounded-2xl transition-all ${
 cycle === Cycle.A_LEVEL 
 ? 'bg-indigo-600 text-white scale-110 shadow-lg' 
 : 'bg-slate-50 text-slate-400'
 }`}>
 <GraduationCap className="w-10 h-10" />
 </div>
 <div className="text-left">
 <h3 className="text-2xl font-black text-slate-900 mb-1">A Level</h3>
 <p className="text-slate-500 text-base font-semibold">Advanced Level</p>
 </div>
 </div>
 {cycle === Cycle.A_LEVEL && (
 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-lg">
 <ArrowRight className="w-6 h-6" />
 </div>
 )}
 </button>
 </div>

 <div className="mt-14 pb-10">
 <button
 onClick={handleContinueCycle}
 disabled={!cycle || loading}
 className={`w-full font-black py-5 rounded-[2.5rem] transition-all flex items-center justify-center gap-2 shadow-xl text-lg ${
 !cycle || loading
 ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
 : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-[0.98]'
 }`}
 >
 {loading ? (
 <span className="flex items-center gap-2">Processing...</span>
 ) : (
 <>
 Continue <ArrowRight className="w-6 h-6" />
 </>
 )}
 </button>
 </div>
 </div>
 )}

 {step === 2 && (
 <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
 <div className="text-center mb-14">
 <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Select Your Option</h2>
 <p className="text-slate-500 text-lg font-semibold">Choose your field of study</p>
 </div>
 
 <div className="flex-1 space-y-6 flex flex-col justify-center">
 <button
 onClick={() => handleOptionSelect(Option.SCIENCE)}
 className={`w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
 option === Option.SCIENCE 
 ? 'bg-emerald-50 border-emerald-600 shadow-xl shadow-emerald-500/10' 
 : 'bg-white border-slate-100 hover:border-slate-200'
 }`}
 >
 <div className="flex items-center gap-8">
 <div className={`p-5 rounded-2xl transition-all ${
 option === Option.SCIENCE 
 ? 'bg-emerald-600 text-white scale-110 shadow-lg' 
 : 'bg-slate-50 text-slate-400'
 }`}>
 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
 </div>
 <div className="text-left">
 <h3 className="text-2xl font-black text-slate-900 mb-1">Science</h3>
 <p className="text-slate-500 text-base font-semibold">Mathematics, Physics, Chemistry, Biology</p>
 </div>
 </div>
 {option === Option.SCIENCE && (
 <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-lg">
 <ArrowRight className="w-6 h-6" />
 </div>
 )}
 </button>

 <button
 onClick={() => handleOptionSelect(Option.ARTS)}
 className={`w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
 option === Option.ARTS 
 ? 'bg-rose-50 border-rose-600 shadow-xl shadow-rose-500/10' 
 : 'bg-white border-slate-100 hover:border-slate-200'
 }`}
 >
 <div className="flex items-center gap-8">
 <div className={`p-5 rounded-2xl transition-all ${
 option === Option.ARTS 
 ? 'bg-rose-600 text-white scale-110 shadow-lg' 
 : 'bg-slate-50 text-slate-400'
 }`}>
 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
 </div>
 <div className="text-left">
 <h3 className="text-2xl font-black text-slate-900 mb-1">Arts</h3>
 <p className="text-slate-500 text-base font-semibold">Literature, History, Philosophy, Languages</p>
 </div>
 </div>
 {option === Option.ARTS && (
 <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-lg">
 <ArrowRight className="w-6 h-6" />
 </div>
 )}
 </button>
 </div>

 <div className="mt-14 pb-10 space-y-4">
 <button
 onClick={handleCompleteOnboarding}
 disabled={!option || loading}
 className={`w-full font-black py-5 rounded-[2.5rem] transition-all flex items-center justify-center gap-2 shadow-xl text-lg ${
 !option || loading
 ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
 : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-[0.98]'
 }`}
 >
 {loading ? (
 <span className="flex items-center gap-2">Processing...</span>
 ) : (
 <>
 Complete Setup <ArrowRight className="w-6 h-6" />
 </>
 )}
 </button>

 <button
 onClick={handleBack}
 className="w-full font-semibold py-4 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-xs"
 >
 Back
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default Onboarding;
