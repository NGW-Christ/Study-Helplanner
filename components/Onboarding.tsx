import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import React, { useState } from 'react';
import { Cycle, Option, UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: Pick<UserProfile, 'cycle' | 'option'>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [option, setOption] = useState<Option | null>(null);

  const handleCycleSelect = (selectedCycle: Cycle) => {
    console.log('Cycle selected:', selectedCycle);
    setCycle(selectedCycle);
    setStep(2);
  };

  const handleOptionSelect = (selectedOption: Option) => {
    console.log('handleOptionSelect called with:', selectedOption);
    console.log('Current cycle:', cycle);
    setOption(selectedOption);
    // Move to final confirmation or completion
    if (cycle) {
        console.log('Calling onComplete with:', { cycle, option: selectedOption });
        onComplete({ cycle, option: selectedOption });
    } else {
        console.log('No cycle selected, cannot complete');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-xl w-full">
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-50 p-4 rounded-full">
                <BookOpen className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Welcome to Study Helplanner</h1>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              Your personal, focused workspace for mastering your Cameroonian O and A Level subjects.
              Let's get your study plan set up.
            </p>
            <button
              onClick={() => setStep(1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 mx-auto w-full md:w-auto"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Select your Cycle</h2>
                <p className="text-slate-500">Which exam are you preparing for?</p>
             </div>
             
             <button
               onClick={() => {
                 console.log('O Level button clicked');
                 handleCycleSelect(Cycle.O_LEVEL);
               }}
               className="w-full bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 p-6 rounded-xl flex items-center justify-between group transition-all"
             >
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-800">{Cycle.O_LEVEL}</h3>
                        <p className="text-slate-400 text-sm">Form 5 Syllabus</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
             </button>

             <button
               onClick={() => {
                 console.log('A Level button clicked');
                 handleCycleSelect(Cycle.A_LEVEL);
               }}
               className="w-full bg-white hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 p-6 rounded-xl flex items-center justify-between group transition-all"
             >
                <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-800">{Cycle.A_LEVEL}</h3>
                        <p className="text-slate-400 text-sm">Upper Sixth Syllabus</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
             </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Choose your Option</h2>
                <p className="text-slate-500">This helps us tailor your subject list.</p>
             </div>
             
             <button
               onClick={() => {
                 console.log('Science button clicked');
                 handleOptionSelect(Option.SCIENCE);
               }}
               className="w-full bg-white hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 p-6 rounded-xl flex items-center justify-between group transition-all"
             >
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-800">{Option.SCIENCE}</h3>
                        <p className="text-slate-400 text-sm">Math, Physics, Bio, Chem...</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
             </button>

             <button
               onClick={() => {
                 console.log('Arts button clicked');
                 handleOptionSelect(Option.ARTS);
               }}
               className="w-full bg-white hover:bg-rose-50 border-2 border-slate-100 hover:border-rose-200 p-6 rounded-xl flex items-center justify-between group transition-all"
             >
                <div className="flex items-center gap-4">
                    <div className="bg-rose-100 p-3 rounded-lg text-rose-600 group-hover:bg-rose-200 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-800">{Option.ARTS}</h3>
                        <p className="text-slate-400 text-sm">History, Lit, French...</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;