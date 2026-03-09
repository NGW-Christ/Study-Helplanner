import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { StudyPlan, UserProfile } from '../types';
import { SUBJECTS_CONFIG } from '../constants';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

interface PlannerViewProps {
  userId: string;
  userProfile: UserProfile;
}

const PlannerView: React.FC<PlannerViewProps> = ({ userId, userProfile }) => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Add Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
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
    if (!newTaskDesc.trim() || !newSubject) return;

    const finalSubject = isExam ? 'Exam' : newSubject;
    const finalDesc = isExam ? `EXAM: ${newTaskDesc} (${newSubject})` : newTaskDesc;

    const { data, error } = await supabase.from('study_plans').insert({
      user_id: userId,
      subject: finalSubject,
      task_description: finalDesc,
      planned_date: newDate,
      is_completed: false
    }).select().single();

    if (data) {
      setPlans([...plans, data]);
      setIsAdding(false);
      setNewTaskDesc('');
      setNewSubject('');
      setIsExam(false);
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

  const exams = plans.filter(p => p.subject === 'Exam' || p.task_description.startsWith('EXAM:')).sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime());

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Study Planner</h1>
          <p className="text-slate-500 text-sm">Organize your week and track exams</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Add Schedule</span>
          <span className="md:hidden">Add</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        
        {/* Weekly Calendar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Weekly Schedule
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-medium text-slate-600">
                {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => changeWeek(1)} className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {weekDays.map((day) => {
              const dayPlans = getPlansForDate(day);
              const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              
              return (
                <div key={day.toISOString()} className={`min-h-[120px] md:min-h-[200px] flex flex-col ${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <div className={`p-2 text-center border-b border-slate-100 flex md:block justify-between items-center px-4 md:px-2 ${isToday ? 'bg-indigo-100/50' : 'bg-slate-50'}`}>
                    <div className="text-xs font-semibold text-slate-500 uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {dayPlans.map(plan => (
                      <div key={plan.id} className="bg-white p-2 rounded border border-slate-200 shadow-sm text-xs group relative hover:border-indigo-300 transition-colors">
                        <div className="font-semibold text-indigo-700 truncate mb-0.5">{plan.subject}</div>
                        <div className="text-slate-600 line-clamp-2">{plan.task_description}</div>
                        <button 
                          onClick={() => handleDelete(plan.id)}
                          className="absolute top-1 right-1 text-slate-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayPlans.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-300 text-[10px] italic py-2 md:py-0">
                            No tasks
                        </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exam Timetable */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h2 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock className="w-5 h-5 text-red-600" />
               Exam Timetable
             </h2>
           </div>
           
           {exams.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-sm">No upcoming exams scheduled.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr>
                     <th className="p-4">Date</th>
                     <th className="p-4">Subject</th>
                     <th className="p-4">Details</th>
                     <th className="p-4 w-10"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {exams.map(exam => (
                     <tr key={exam.id} className="hover:bg-slate-50">
                       <td className="p-4 font-medium text-slate-900 whitespace-nowrap">
                         {new Date(exam.planned_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                       </td>
                       <td className="p-4 text-indigo-600 font-semibold">{exam.task_description.split('(')[1]?.replace(')', '') || 'General'}</td>
                       <td className="p-4 text-slate-600">{exam.task_description.replace('EXAM: ', '').split('(')[0]}</td>
                       <td className="p-4 text-right">
                         <button onClick={() => handleDelete(exam.id)} className="text-slate-400 hover:text-red-600">
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add to Schedule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={!isExam} 
                      onChange={() => setIsExam(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Study Session
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={isExam} 
                      onChange={() => setIsExam(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Exam
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select 
                  value={newSubject} 
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="General">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text" 
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder={isExam ? "e.g. Paper 1 MCQ" : "e.g. Revise Chapter 4"}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPlan}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Save
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