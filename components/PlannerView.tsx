import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Menu, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SUBJECTS_CONFIG } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { StudyPlan, UserProfile } from '../types';
import { useToast } from './ToastProvider';

interface PlannerViewProps {
  userId: string;
  userProfile: UserProfile;
  onActivityRecorded: () => void;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ userId, userProfile, onActivityRecorded, setIsMobileMenuOpen }) => {
 const { showToast } = useToast();
 const [plans, setPlans] = useState<StudyPlan[]>([]);
 const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
 const [loading, setLoading] = useState(true);
 
 // Add Modal State
 const [isAdding, setIsAdding] = useState(false);
 const [newTaskDesc, setNewTaskDesc] = useState('');
 const [newSubject, setNewSubject] = useState('');
 const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
 const [newStartTime, setNewStartTime] = useState('09:00');
 const [newEndTime, setNewEndTime] = useState('10:00');
 const [isExam, setIsExam] = useState(false);

 const subjects = SUBJECTS_CONFIG[userProfile.cycle][userProfile.option];

 useEffect(() => {
 // Align currentWeekStart to Monday
 const date = new Date(currentWeekStart);
 const day = date.getDay();
 const diff = date.getDate() - day + (day === 0 ? -6 : 1);
 const monday = new Date(date.setDate(diff));
 monday.setHours(0, 0, 0, 0);
 // Only update if different day to prevent loop (though setWeekStart handles this mostly)
 }, []);

 useEffect(() => {
 fetchPlans();
 }, [userId]);

 const fetchPlans = async () => {
 const { data } = await supabase
 .from('study_plans')
 .select('*')
 .eq('user_id', userId);
 
 if (data) setPlans(data);
 setLoading(false);
 };

 const handleAddPlan = async () => {
  if (!newSubject) {
    return;
  }

  const finalSubject = isExam ? 'Exam' : newSubject;
  const finalDesc = isExam ? `EXAM: ${newTaskDesc || 'Exam'} (${newSubject})` : (newTaskDesc || `${newSubject} Study Session`);

  try {
    const { data, error } = await supabase.from('study_plans').insert({
      user_id: userId,
      subject: finalSubject,
      task_description: finalDesc,
      planned_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      is_completed: false
    }).select().single();

    if (error) {
      console.error('Supabase error:', error);
      showToast(`Error saving schedule: ${error.message}`, 'error');
      return;
    }

    if (data) {
      setPlans([...plans, data]);
      setIsAdding(false);
      setNewTaskDesc('');
      setNewSubject('');
      setNewStartTime('09:00');
      setNewEndTime('10:00');
      setIsExam(false);
    } else {
      console.error('No data returned from insert');
      showToast('Error: No data returned when saving schedule', 'error');
    }
  } catch (err) {
    console.error('Unexpected error in handleAddPlan:', err);
    showToast('Unexpected error occurred while saving schedule', 'error');
  }
 };

 const handleDelete = async (id: string) => {
 await supabase.from('study_plans').delete().eq('id', id);
 setPlans(plans.filter(p => p.id !== id));
 };

 const getWeekDays = () => {
 const days = [];
 const date = new Date(currentWeekStart);
 // Ensure we start on Monday
 const day = date.getDay();
 const diff = date.getDate() - day + (day === 0 ? -6 : 1);
 const monday = new Date(date.setDate(diff));

 for (let i = 0; i < 7; i++) {
 const d = new Date(monday);
 d.setDate(monday.getDate() + i);
 days.push(d);
 }
 return days;
 };

 const weekDays = getWeekDays();

 const changeWeek = (offset: number) => {
 const newDate = new Date(currentWeekStart);
 newDate.setDate(newDate.getDate() + (offset * 7));
 setCurrentWeekStart(newDate);
 };

 const getPlansForDate = (date: Date) => {
 const dateStr = date.toISOString().split('T')[0];
 return plans.filter(p => p.planned_date === dateStr && p.subject !== 'Exam');
};

const getTimeSlots = () => {
 const slots = [];
 for (let hour = 6; hour <= 22; hour++) {
  slots.push(`${hour.toString().padStart(2, '0')}:00`);
 }
 return slots;
};

const getPlansForTimeSlot = (date: Date, timeSlot: string) => {
 const dateStr = date.toISOString().split('T')[0];
 return plans.filter(p => 
  p.planned_date === dateStr && 
  p.subject !== 'Exam' &&
  p.start_time <= timeSlot && 
  p.end_time > timeSlot
 );
};

 const exams = plans.filter(p => p.subject === 'Exam' || p.task_description.startsWith('EXAM:')).sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime());

 return (
 <div className="h-full flex flex-col bg-light-background transition-colors pt-[env(safe-area-inset-top)]">
 {/* Header */}
 <div className="p-6 border-b border-slate-200 bg-white backdrop-blur-sm flex justify-between items-center shrink-0">
 <div className="flex items-center gap-4">
 <button
 onClick={() => setIsMobileMenuOpen(true)}
 className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
 >
 <Menu className="w-6 h-6 text-slate-600" />
 </button>
 <div>
 <h1 className="text-2xl font-semibold text-slate-900 ">Study Planner</h1>
 <p className="text-slate-500 text-sm">Organize your week and track exams</p>
 </div>
 </div>
 <button 
 onClick={() => setIsAdding(true)}
 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span className="hidden md:inline">Add Schedule</span>
 <span className="md:hidden">Add</span>
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
 
 {/* Weekly Calendar */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 ">
 <h2 className="font-semibold text-slate-800 flex items-center gap-2">
 <CalendarIcon className="w-5 h-5 text-indigo-600 " />
 Weekly Schedule
 </h2>
 <div className="flex items-center gap-2 text-sm text-slate-600 ">
 <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
 <span className="font-medium whitespace-nowrap">
 {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
 </span>
 <button onClick={() => changeWeek(1)} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <div className="min-w-[800px]">
  {/* Header row with days */}
  <div className="grid grid-cols-8 border-b border-slate-200">
   <div className="p-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</div>
   {weekDays.map((day) => {
    const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    return (
     <div key={day.toISOString()} className={`p-2 text-center border-l border-slate-100 ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
      <div className={`text-sm font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
       {day.getDate()}
      </div>
     </div>
    );
   })}
  </div>
  
  {/* Time slots */}
  {getTimeSlots().map((timeSlot) => (
   <div key={timeSlot} className="grid grid-cols-8 border-b border-slate-100">
    <div className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-100">
     {timeSlot}
    </div>
    {weekDays.map((day) => {
     const slotPlans = getPlansForTimeSlot(day, timeSlot);
     const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
     
     return (
      <div key={`${day.toISOString()}-${timeSlot}`} className={`p-1 min-h-[60px] border-l border-slate-100 ${isToday ? 'bg-indigo-50/30' : ''}`}>
       {slotPlans.map(plan => (
        <div 
         key={plan.id} 
         className="bg-indigo-100 border border-indigo-200 rounded p-1 text-xs group relative hover:bg-indigo-200 transition-all mb-1"
        >
         <div className="font-semibold text-indigo-700 truncate text-[10px] uppercase">{plan.subject}</div>
         <div className="text-slate-600 truncate">
          {plan.start_time} - {plan.end_time}
         </div>
         <div className="text-slate-500 truncate leading-tight">{plan.task_description}</div>
         <button 
          onClick={() => handleDelete(plan.id)}
          className="absolute top-0 right-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
         >
          <Trash2 className="w-3 h-3" />
         </button>
        </div>
       ))}
      </div>
     );
    })}
   </div>
  ))}
 </div>
 </div>
 </div>

 {/* Exam Timetable */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
 <h2 className="font-semibold text-slate-800 flex items-center gap-2">
 <Clock className="w-5 h-5 text-red-600 " />
 Exam Timetable
 </h2>
 </div>
 
 {exams.length === 0 ? (
 <div className="p-8 text-center text-slate-400 text-sm">No upcoming exams scheduled.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-widest text-[10px]">
 <tr>
 <th className="p-4">Date</th>
 <th className="p-4">Subject</th>
 <th className="p-4">Details</th>
 <th className="p-4 w-10"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {exams.map(exam => (
 <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
 <td className="p-4 font-semibold text-slate-900 whitespace-nowrap">
 {new Date(exam.planned_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
 </td>
 <td className="p-4 text-indigo-600 font-black uppercase text-xs">
 {exam.task_description.split('(')[1]?.replace(')', '') || 'General'}
 </td>
 <td className="p-4 text-slate-600 font-medium">
 {exam.task_description.replace('EXAM: ', '').split('(')[0]}
 </td>
 <td className="p-4 text-right">
 <button onClick={() => handleDelete(exam.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* Add Modal */}
 {isAdding && (
 <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 border border-slate-200">
 <h3 className="text-2xl font-semibold text-slate-900 mb-6">Add to Schedule</h3>
 
 <div className="space-y-5">
 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Focus Mode</label>
 <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
 <button 
 onClick={() => setIsExam(false)}
 className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isExam ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
 >
 Study Session
 </button>
 <button 
 onClick={() => setIsExam(true)}
 className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isExam ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
 >
 Exam
 </button>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Subject</label>
 <select 
 value={newSubject} 
 onChange={(e) => setNewSubject(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
 >
 <option value="">Select Subject</option>
 {subjects.map(s => <option key={s} value={s}>{s}</option>)}
 <option value="General">General / Other</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">What's the plan? <span className="text-slate-300">(optional)</span></label>
 <input 
 type="text" 
 value={newTaskDesc}
 onChange={(e) => setNewTaskDesc(e.target.value)}
 placeholder={isExam ? "e.g. Paper 1 MCQ" : "e.g. Revise Chapter 4"}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
 />
 </div>

 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Scheduled Date</label>
 <input 
 type="date" 
 value={newDate}
 onChange={(e) => setNewDate(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Start Time</label>
 <input 
 type="time" 
 value={newStartTime}
 onChange={(e) => setNewStartTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
 />
 </div>
 <div>
 <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">End Time</label>
 <input 
 type="time" 
 value={newEndTime}
 onChange={(e) => setNewEndTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium transition-all"
 />
 </div>
 </div>

 <div className="flex gap-3 pt-4">
 <button 
 onClick={() => {
  setIsAdding(false);
  setNewTaskDesc('');
  setNewSubject('');
  setNewStartTime('09:00');
  setNewEndTime('10:00');
  setIsExam(false);
 }}
 className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
 >
 Cancel
 </button>
 <button 
 onClick={handleAddPlan}
 className="flex-3 py-3 px-8 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
 >
 Save Entry
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default PlannerView;
