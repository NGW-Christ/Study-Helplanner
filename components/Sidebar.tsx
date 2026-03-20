import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Calendar,
    CheckSquare,
    ChevronRight,
    Circle,
    FileText,
    Globe,
    GraduationCap,
    HelpCircle,
    Layout,
    LogOut,
    Mail,
    Moon,
    Plus,
    Settings,
    Shield,
    Square,
    StickyNote,
    Trash2,
    User,
    X,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SUBJECTS_CONFIG } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { AppView, Cycle, Option, StudyPlan, UserProfile } from '../types';
import { Sun } from 'lucide-react';
interface SidebarProps {
    userId: string;
    userEmail?: string;
    userProfile: UserProfile;
    currentView: AppView;
    selectedSubject: string | null;
    onNavigate: (view: AppView, subject?: string) => void;
    onLogout: () => void;
    onUpdateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
    streak: number;
    taskCount: number;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

type SettingsTab = 'account' | 'academic' | 'ai' | 'appearance' | 'support';

const Sidebar: React.FC<SidebarProps> = ({
    userId,
    userEmail,
    userProfile,
    currentView,
    selectedSubject,
    onNavigate,
    onLogout,
    onUpdateProfile,
    isOpen,
    onClose
}) => {
    // Use userProfile.subjects for the list, fallback to empty array if something goes wrong
    const subjects = userProfile.subjects || [];

    const [tasks, setTasks] = useState<StudyPlan[]>([]);
    const [newTask, setNewTask] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');

    // Academic Edit State
    const [editCycle, setEditCycle] = useState<Cycle>(userProfile.cycle);
    const [editOption, setEditOption] = useState<Option>(userProfile.option);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(userProfile.subjects || []);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [editName, setEditName] = useState(userProfile.full_name || '');

    // Sync local state when modal opens or profile changes
    useEffect(() => {
        if (isSettingsOpen) {
            setEditCycle(userProfile.cycle);
            setEditOption(userProfile.option);
            setSelectedSubjects(userProfile.subjects || []);
            setEditName(userProfile.full_name || '');
        }
    }, [isSettingsOpen, userProfile]);

    const navItems = [
        { view: AppView.DASHBOARD, label: 'Dashboard', icon: Layout },
        { view: AppView.PLANNER, label: 'Planner', icon: Calendar },
        { view: AppView.NOTES, label: 'My Notes', icon: StickyNote },
    ];

    useEffect(() => {
        if (userId) {
            fetchTasks();
        }
    }, [userId]);

  const fetchTasks = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('planned_date', { ascending: true });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !userId) return;

    try {
      const { data, error } = await supabase.from('study_plans').insert({
        user_id: userId,
        subject: selectedSubject || 'General',
        task_description: newTask,
        planned_date: newDate,
        is_completed: false,
        created_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;
      if (data) {
        setTasks([...tasks, data]);
        setNewTask('');
        setIsAddingTask(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (task: StudyPlan) => {
    try {
      // Optimistic update
      const updatedTasks = tasks.filter(t => t.id !== task.id);
      setTasks(updatedTasks);

      const { error } = await supabase.from('study_plans').update({
        is_completed: true
      }).eq('id', task.id);

      if (error) {
        // Rollback on error
        setTasks([...tasks]);
        throw error;
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

    // ACADEMIC PROFILE LOGIC
    const handleCycleOrOptionChange = (newCycle: Cycle, newOption: Option) => {
        setEditCycle(newCycle);
        setEditOption(newOption);
        // Reset selected subjects to the default list for this combination
        const defaults = SUBJECTS_CONFIG[newCycle][newOption];
        setSelectedSubjects(defaults);
    };

    const toggleSubjectSelection = (subject: string) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
        } else {
            setSelectedSubjects([...selectedSubjects, subject]);
        }
    };

    const handleSaveAcademicProfile = async () => {
        setIsSavingProfile(true);
        await onUpdateProfile({
            full_name: editName,
            cycle: editCycle,
            option: editOption,
            subjects: selectedSubjects
        });
        setIsSavingProfile(false);
    };

    // ACCOUNT LOGIC
    const handleUpgrade = async () => {
        if (confirm("In a real app, this would open a payment gateway. Upgrade to Premium for unlimited AI?")) {
            await onUpdateProfile({ plan_tier: 'premium' });
        }
    };

    const handleChangePassword = async () => {
        if (userEmail) {
            await supabase.auth.resetPasswordForEmail(userEmail);
            alert(`Password reset link sent to ${userEmail}`);
        }
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm("Are you sure? This will delete all your study plans, notes, and progress. This action cannot be undone.");
        if (confirm) {
            try {
                // Delete profile which cascades to other tables
                const { error } = await supabase.from('profiles').delete().eq('id', userId);
                if (error) throw error;
                
                // Sign out user
                await supabase.auth.signOut();
                onLogout();
            } catch (error) {
                console.error('Error deleting account:', error);
                alert('Failed to delete account. Please try again.');
            }
        }
    };


    const setLanguage = async (lang: 'en' | 'fr') => {
        await onUpdateProfile({
            preferences: {
                ...userProfile.preferences,
                language: lang
            }
        });
    };

    const aiLimit = userProfile.plan_tier === 'premium' ? 50 : 10;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white  border-r border-slate-200  flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0 shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100  flex justify-between items-center shrink-0">
                    <div className="flex flex-col animate-in fade-in slide-in-from-left duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Study<span className="text-indigo-600 ">Helplanner</span></h1>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-tighter text-slate-400 mt-1.5 ml-11">{userProfile.option} • {userProfile.cycle}</p>
                    </div>
                    <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-100  rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">

                    {/* Main Navigation */}
                    <div className="space-y-1.5">
                        {navItems.map((item, idx) => (
                            <button
                                key={item.view}
                                onClick={() => onNavigate(item.view)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 animate-in fade-in slide-in-from-left-4 ${currentView === item.view && !selectedSubject
                                        ? 'bg-indigo-50  text-indigo-700  shadow-sm border border-indigo-100 '
                                        : 'text-slate-600  hover:bg-slate-50  hover:text-slate-900 '
                                    }`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <item.icon className={`w-4 h-4 ${currentView === item.view && !selectedSubject ? 'text-indigo-600' : 'text-slate-400'}`} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="px-2">
                        <hr className="border-slate-100 " />
                    </div>

                    {/* To-Do List */}
                    <div className="animate-in fade-in duration-700 delay-200">
                        <div className="flex items-center justify-between mb-3 px-2">
                            <h3 className="text-[10px] font-semibold text-slate-400  uppercase tracking-[0.2em]">To-Do List</h3>
                            <button
                                onClick={() => setIsAddingTask(!isAddingTask)}
                                className="text-indigo-600  hover:bg-indigo-50  p-1.5 rounded-lg transition-all active:scale-90"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {isAddingTask && (
                            <div className="mb-4 p-3 bg-white  rounded-2xl border border-slate-200  shadow-xl animate-in zoom-in-95 duration-200">
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="Task name..."
                                    className="w-full text-xs p-2.5 mb-2 rounded-xl border border-slate-200  bg-slate-50   focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full text-xs p-2.5 mb-3 rounded-xl border border-slate-200  bg-slate-50   outline-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsAddingTask(false)} className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5">Cancel</button>
                                    <button onClick={handleAddTask} className="text-[10px] font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all active:scale-95">Add Task</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            {tasks.length === 0 && !isAddingTask ? (
                                <p className="text-xs text-slate-400 px-2 italic">No pending tasks.</p>
                            ) : (
                                tasks.map((task, idx) => (
                                    <div key={task.id} className="group flex items-start gap-3 p-2.5 hover:bg-white  rounded-xl transition-all duration-200 animate-in fade-in slide-in-from-left-2 shadow-sm border border-transparent hover:border-slate-100 " style={{ animationDelay: `${idx * 30}ms` }}>
                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors active:scale-90"
                                        >
                                            <Circle className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-slate-700  leading-tight truncate group-hover:text-slate-900  transition-colors">{task.task_description}</p>
                                            <p className={`text-[9px] font-semibold mt-1 uppercase tracking-tight ${new Date(task.planned_date) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                                                {new Date(task.planned_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="px-2">
                        <hr className="border-slate-100 " />
                    </div>

                    {/* Subjects List */}
                    <div className="animate-in fade-in duration-700 delay-300">
                        <h3 className="text-[10px] font-semibold text-slate-400  uppercase tracking-[0.2em] mb-3 px-2">
                            Your Subjects
                        </h3>
                        <div className="space-y-1">
                            {subjects.map((subject, idx) => (
                                <button
                                    key={subject}
                                    onClick={() => onNavigate(AppView.SUBJECT, subject)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left animate-in fade-in slide-in-from-left-4 ${selectedSubject === subject
                                            ? 'bg-slate-900  text-white shadow-lg shadow-slate-900/20'
                                            : 'text-slate-600  hover:bg-slate-50  hover:text-slate-900 '
                                        }`}
                                    style={{ animationDelay: `${(idx + 4) * 50}ms` }}
                                >
                                    <BookOpen className={`w-3.5 h-3.5 ${selectedSubject === subject ? 'text-indigo-400' : 'text-slate-400'}`} />
                                    <span className="truncate">{subject}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer: User Profile */}
                <div className="p-4 border-t border-slate-100  mt-auto shrink-0 bg-slate-50/50 ">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-3 w-full p-2.5 rounded-[1.25rem] hover:bg-white  transition-all duration-300 group shadow-sm hover:shadow-md border border-transparent hover:border-slate-100 "
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0 shadow-inner">
                            {userProfile.full_name ? userProfile.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900  truncate">{userProfile.full_name || 'User'}</p>
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${userProfile.plan_tier === 'premium' ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400'}`}></span>
                                <p className="text-[9px] font-black text-slate-400  uppercase tracking-widest">{userProfile.plan_tier}</p>
                            </div>
                        </div>
                        <div className="bg-slate-100  p-1.5 rounded-lg group-hover:bg-indigo-50  transition-colors">
                            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 " />
                        </div>
                    </button>
                    

                </div>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white  rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col md:flex-row overflow-hidden border border-slate-100  animate-in zoom-in-95">

                        {/* Modal Sidebar */}
                        <div className="w-full md:w-64 bg-slate-50  border-b md:border-b-0 md:border-r border-slate-200  p-4 md:p-6 flex flex-col shrink-0">
                            <div className="flex justify-between items-center mb-4 md:mb-6 px-2">
                                <h2 className="text-xl font-semibold text-slate-900 ">Settings</h2>
                                <button onClick={() => setIsSettingsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <nav className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                <button onClick={() => setActiveTab('account')} className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-white  text-indigo-600  shadow-sm border border-slate-200 ' : 'text-slate-600  hover:bg-white  hover:text-slate-900 '}`}>
                                    <User className="w-4 h-4 hidden md:block" /> Account
                                </button>
                                <button onClick={() => setActiveTab('academic')} className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'academic' ? 'bg-white  text-indigo-600  shadow-sm border border-slate-200 ' : 'text-slate-600  hover:bg-white  hover:text-slate-900 '}`}>
                                    <GraduationCap className="w-4 h-4 hidden md:block" /> Academic Profile
                                </button>
                                <button onClick={() => setActiveTab('ai')} className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-white  text-indigo-600  shadow-sm border border-slate-200 ' : 'text-slate-600  hover:bg-white  hover:text-slate-900 '}`}>
                                    <Zap className="w-4 h-4 hidden md:block" /> AI Usage
                                </button>

                                <button onClick={() => setActiveTab('support')} className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'support' ? 'bg-white  text-indigo-600  shadow-sm border border-slate-200 ' : 'text-slate-600  hover:bg-white  hover:text-slate-900 '}`}>
                                    <HelpCircle className="w-4 h-4 hidden md:block" /> Support
                                </button>
                            </nav>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white  relative">
                            <button onClick={() => setIsSettingsOpen(false)} className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-slate-600  p-2 hover:bg-slate-100  rounded-full transition-colors z-10">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex-1 overflow-y-auto p-5 md:p-10 min-h-0">
                                {activeTab === 'account' && (
                                    <div className="space-y-8 max-w-lg">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-1">Your Plan</h3>
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-indigo-100 text-sm font-medium mb-1">Current Plan</p>
                                                        <h4 className="text-2xl font-semibold capitalize">{userProfile.plan_tier} Scholar</h4>
                                                    </div>
                                                    <Shield className="w-8 h-8 text-indigo-200" />
                                                </div>
                                                {userProfile.plan_tier === 'free' ? (
                                                    <button onClick={handleUpgrade} className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors w-full">
                                                        Upgrade to Premium
                                                    </button>
                                                ) : (
                                                    <div className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center w-full">
                                                        Premium Active
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-slate-900 ">Account Details</h3>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 ">Display Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-lg text-slate-900  focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                                        placeholder="Your name"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveAcademicProfile}
                                                disabled={isSavingProfile}
                                                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 active:scale-95 text-sm"
                                            >
                                                {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                            </button>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 ">Email Address</label>
                                                <div className="flex items-center gap-2 p-3 bg-slate-50  border border-slate-200  rounded-lg text-slate-600 ">
                                                    <Mail className="w-4 h-4" />
                                                    {userEmail}
                                                </div>
                                            </div>

                                            <div className="pt-4 space-y-3">
                                                <button onClick={handleChangePassword} className="w-full flex items-center justify-between p-4 border border-slate-200  rounded-xl hover:border-indigo-300  hover:bg-slate-50  transition-all text-left group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-100  p-2 rounded-lg group-hover:bg-white "><Shield className="w-5 h-5 text-slate-600 " /></div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 ">Change Password</div>
                                                            <div className="text-xs text-slate-500 ">Receive a reset link via email</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </button>

                                                <button onClick={onLogout} className="w-full flex items-center justify-between p-4 border border-slate-200  rounded-xl hover:border-indigo-300  hover:bg-slate-50  transition-all text-left group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-100  p-2 rounded-lg group-hover:bg-white "><LogOut className="w-5 h-5 text-slate-600 " /></div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 ">Log Out</div>
                                                            <div className="text-xs text-slate-500 ">Sign out of your account</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </button>

                                                <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 border border-red-100  rounded-xl hover:bg-red-50  transition-all text-left group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-red-100  p-2 rounded-lg group-hover:bg-white "><Trash2 className="w-5 h-5 text-red-600 " /></div>
                                                        <div>
                                                            <div className="font-semibold text-red-700 ">Delete Account</div>
                                                            <div className="text-xs text-red-400 ">Permanently remove all data</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'academic' && (
                                    <div className="space-y-8 max-w-lg">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-4">Edit Profile</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700  mb-2">Cycle</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[Cycle.O_LEVEL, Cycle.A_LEVEL].map((c) => (
                                                            <button
                                                                key={c}
                                                                onClick={() => handleCycleOrOptionChange(c, editOption)}
                                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${editCycle === c ? 'border-indigo-600 bg-indigo-50  text-indigo-700 ' : 'border-slate-200  hover:border-slate-300  text-slate-600 '}`}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700  mb-2">Option</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[Option.SCIENCE, Option.ARTS].map((o) => (
                                                            <button
                                                                key={o}
                                                                onClick={() => handleCycleOrOptionChange(editCycle, o)}
                                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${editOption === o ? 'border-indigo-600 bg-indigo-50  text-indigo-700 ' : 'border-slate-200  hover:border-slate-300  text-slate-600 '}`}
                                                            >
                                                                {o}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleSaveAcademicProfile}
                                                    disabled={isSavingProfile}
                                                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 " />

                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-2">Edit Selected Subjects</h3>
                                            <p className="text-sm text-slate-500  mb-4">Uncheck subjects you do not take.</p>
                                            <div className="grid grid-cols-1 gap-2 pr-2">
                                                {SUBJECTS_CONFIG[editCycle][editOption].map(subj => {
                                                    const isSelected = selectedSubjects.includes(subj);
                                                    return (
                                                        <button
                                                            key={subj}
                                                            onClick={() => toggleSubjectSelection(subj)}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected
                                                                    ? 'bg-indigo-50  border-indigo-200 '
                                                                    : 'bg-white  border-slate-200 '
                                                                }`}
                                                        >
                                                            {isSelected
                                                                ? <CheckSquare className="w-5 h-5 text-indigo-600 " />
                                                                : <Square className="w-5 h-5 text-slate-300" />}
                                                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900 ' : 'text-slate-500 '}`}>{subj}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'ai' && (
                                    <div className="space-y-8 max-w-lg">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-6">AI Usage & Limits</h3>

                                            <div className="bg-white  border border-slate-200  rounded-xl p-6 shadow-sm mb-6">
                                                <div className="flex justify-between items-end mb-4">
                                                    <div>
                                                        <p className="text-slate-500  text-sm font-medium">Daily Generations</p>
                                                        <h4 className="text-3xl font-semibold text-slate-900 ">{userProfile.daily_ai_count} <span className="text-lg text-slate-400 font-normal">/ {aiLimit}</span></h4>
                                                    </div>
                                                    <BarChart3 className="w-8 h-8 text-indigo-100 " />
                                                </div>
                                                <div className="w-full bg-slate-100  rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${userProfile.daily_ai_count >= aiLimit ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                        style={{ width: `${Math.min((userProfile.daily_ai_count / aiLimit) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 text-right">
                                                    {Math.max(0, aiLimit - userProfile.daily_ai_count)} remaining today
                                                </p>
                                            </div>

                                            {userProfile.plan_tier === 'free' && (
                                                <div className="bg-orange-50  border border-orange-100  rounded-xl p-4 flex gap-3">
                                                    <AlertTriangle className="w-5 h-5 text-orange-600  shrink-0" />
                                                    <div>
                                                        <h5 className="font-semibold text-orange-800  text-sm">Need more power?</h5>
                                                        <p className="text-xs text-orange-600  mt-1">Upgrade to Premium for unlimited AI calls and faster response times.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'appearance' && (
                                    <div className="space-y-8 max-w-lg">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-6">App Appearance</h3>

                                            <div className="space-y-4">

                                                <div className="flex items-center justify-between p-4 border border-slate-200  rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-slate-100  p-2 rounded-lg"><Globe className="w-5 h-5 text-slate-600 " /></div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 ">Language</div>
                                                            <div className="text-xs text-slate-500 ">Interface language</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex bg-slate-100  rounded-lg p-1">
                                                        <button
                                                            onClick={() => setLanguage('en')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${userProfile.preferences?.language === 'en' ? 'bg-white  text-indigo-600  shadow-sm' : 'text-slate-500  hover:text-slate-700 '}`}
                                                        >
                                                            English
                                                        </button>
                                                        <button
                                                            onClick={() => setLanguage('fr')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${userProfile.preferences?.language === 'fr' ? 'bg-white  text-indigo-600  shadow-sm' : 'text-slate-500  hover:text-slate-700 '}`}
                                                        >
                                                            Français
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'support' && (
                                    <div className="space-y-8 max-w-lg">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900  mb-6">Support & Feedback</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <a href="mailto:mouyengac@gmail.com?subject=Study%20Helplanner%20Issue%20Report" className="bg-white  border border-slate-200  hover:border-red-200 hover:bg-red-50  p-6 rounded-xl text-center group transition-all">
                                                    <div className="w-12 h-12 bg-red-100  text-red-600  rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <AlertTriangle className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-800  mb-1">Report a Problem</h4>
                                                    <p className="text-xs text-slate-500 ">Something not working?</p>
                                                </a>

                                                <a href="mailto:mouyengac@gmail.com?subject=Study%20Helplanner%20Feature%20Request" className="bg-white  border border-slate-200  hover:border-indigo-200 hover:bg-indigo-50  p-6 rounded-xl text-center group transition-all">
                                                    <div className="w-12 h-12 bg-indigo-100  text-indigo-600  rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Zap className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-800  mb-1">Suggest Feature</h4>
                                                    <p className="text-xs text-slate-500 ">Have an idea?</p>
                                                </a>
                                            </div>

                                            <div className="mt-8 bg-slate-50  p-6 rounded-xl border border-slate-100  text-center">
                                                <h4 className="font-semibold text-slate-800  mb-2">Direct Contact</h4>
                                                <p className="text-sm text-slate-500  mb-4">You can also email us directly at:</p>
                                                <div className="bg-white  px-4 py-2 rounded-lg border border-slate-200  inline-block text-indigo-600  font-mono text-sm select-all">
                                                    mouyengac@gmail.com
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
