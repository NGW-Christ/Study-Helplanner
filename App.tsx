import { Calendar, FileText, Hourglass, Loader2, Menu, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Auth from './components/Auth';
import FocusMode from './components/FocusMode';
import NotesView from './components/NotesView';
import Onboarding from './components/Onboarding';
import PlannerView from './components/PlannerView';
import Sidebar from './components/Sidebar';
import SubjectView from './components/SubjectView';
import { SUBJECTS_CONFIG } from './constants';
import { supabase } from './lib/supabaseClient';
import { AppView, Cycle, Option, UserProfile } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchStreak(session.user.id);
        fetchTaskCount(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchStreak(session.user.id);
        fetchTaskCount(session.user.id);
      } else {
        setUserProfile(null);
        setStreak(0);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply Dark Mode Effect
  useEffect(() => {
    if (userProfile?.preferences?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile?.preferences?.darkMode]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        // Handle daily reset of AI count if date changed
        const today = new Date().toISOString().split('T')[0];
        let dailyCount = data.daily_ai_count;
        
        if (data.last_ai_usage_date !== today) {
            dailyCount = 0;
            // Optimistically update local, background update DB
            supabase.from('profiles').update({ 
                daily_ai_count: 0, 
                last_ai_usage_date: today 
            }).eq('id', userId);
        }

        setUserProfile({
            full_name: data.full_name || session.user.email?.split('@')[0] || 'Student',
            cycle: data.cycle as Cycle,
            option: data.option_type as Option,
            subjects: data.subjects || SUBJECTS_CONFIG[data.cycle as Cycle][data.option_type as Option],
            plan_tier: data.plan_tier || 'free',
            preferences: data.preferences || { darkMode: false, language: 'en' },
            daily_ai_count: dailyCount || 0,
            last_ai_usage_date: data.last_ai_usage_date || today
        });
      }
    } catch (error) {
      console.error('Unexpected error fetching profile', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreak = async (userId: string) => {
      const { data } = await supabase.from('streaks').select('current_streak').eq('user_id', userId).single();
      if (data) {
          setStreak(data.current_streak || 0);
      }
  };

  const fetchTaskCount = async (userId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('study_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lte('planned_date', today);
      
      setTaskCount(count || 0);
  };

  const handleRecordActivity = async () => {
      if (!session?.user) return;
      
      const userId = session.user.id;
      // Fetch current streak info
      const { data: streakData } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
      
      if (!streakData) return;

      const lastDate = new Date(streakData.last_activity_date);
      const today = new Date();
      
      // Reset time to compare only dates
      lastDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);

      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = streakData.current_streak;

      if (diffDays === 0) {
          // Already studied today
          return;
      } else if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
      } else {
          // Streak broken
          newStreak = 1;
      }

      // Update DB
      await supabase.from('streaks').update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streakData.longest_streak),
          last_activity_date: new Date().toISOString()
      }).eq('user_id', userId);

      setStreak(newStreak);
  };

    const handleOnboardingComplete = async (profile: Pick<UserProfile, 'cycle' | 'option' | 'full_name'>) => {
    if (!session?.user) return;
    setLoading(true);

    const initialSubjects = SUBJECTS_CONFIG[profile.cycle][profile.option];
    const initialPrefs = { darkMode: false, language: 'en' };

    const { error } = await supabase.from('profiles').insert({
        id: session.user.id,
        full_name: profile.full_name,
        cycle: profile.cycle,
        option_type: profile.option, 
        subjects: initialSubjects,
        preferences: initialPrefs,
        plan_tier: 'free',
        daily_ai_count: 0,
        last_ai_usage_date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
        setUserProfile({
            ...profile,
            subjects: initialSubjects,
            preferences: initialPrefs as any,
            plan_tier: 'free',
            daily_ai_count: 0,
            last_ai_usage_date: new Date().toISOString().split('T')[0]
        });
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (updatedFields: Partial<UserProfile>) => {
      if (!session?.user || !userProfile) return;
      
      const newProfile = { ...userProfile, ...updatedFields };

      // Prepare DB update object
      const dbUpdate: any = {};
      if (updatedFields.full_name) dbUpdate.full_name = updatedFields.full_name;
      if (updatedFields.cycle) dbUpdate.cycle = updatedFields.cycle;
      if (updatedFields.option) dbUpdate.option_type = updatedFields.option;
      if (updatedFields.subjects) dbUpdate.subjects = updatedFields.subjects;
      if (updatedFields.preferences) dbUpdate.preferences = updatedFields.preferences;
      if (updatedFields.plan_tier) dbUpdate.plan_tier = updatedFields.plan_tier;
      if (updatedFields.daily_ai_count !== undefined) {
         dbUpdate.daily_ai_count = updatedFields.daily_ai_count;
         dbUpdate.last_ai_usage_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase.from('profiles').update(dbUpdate).eq('id', session.user.id);

      if (!error) {
          setUserProfile(newProfile);
          // If the currently selected subject is not in the new profile, reset it
          if (selectedSubject && updatedFields.subjects && !updatedFields.subjects.includes(selectedSubject)) {
              setSelectedSubject(null);
              setCurrentView(AppView.DASHBOARD);
          }
      }
  };

  const incrementAiUsage = async () => {
     if (userProfile) {
         await handleProfileUpdate({ daily_ai_count: userProfile.daily_ai_count + 1 });
     }
  };

  const handleNavigate = (view: AppView, subject?: string) => {
    setCurrentView(view);
    setSelectedSubject(subject || null);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setCurrentView(AppView.DASHBOARD);
    setSelectedSubject(null);
  };

  const getDailyTip = () => {
    const date = new Date();
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    
    const standardTips = [
        "Review your notes within 24 hours of taking them to boost retention.",
        "Take a 5-minute break every 25 minutes (Pomodoro Technique) to stay fresh.",
        "Teach what you've learned to an imaginary audience to test your understanding.",
        "Drink water before starting your study session to improve concentration.",
        "Sleep is when memory consolidation happens. Aim for 8 hours tonight.",
        "Practice active recall: Close your book and try to remember key points.",
        "Switch subjects every 1-2 hours to prevent mental fatigue."
    ];

    const heavyLoadTips = [
        "You have a lot due soon! Prioritize the hardest task and do it first (Eat the Frog).",
        "Break your big tasks into tiny, 10-minute chunks to overcome procrastination.",
        "Focus on one thing at a time. Multitasking will slow you down today.",
        "Don't panic. Just start with 5 minutes of focused work."
    ];
    
    if (taskCount > 3) {
        return heavyLoadTips[dayOfYear % heavyLoadTips.length];
    }
    return standardTips[dayOfYear % standardTips.length];
  };

  const getDaysToGCE = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let gceDate = new Date(currentYear, 5, 1); 

    if (today > gceDate) {
        gceDate = new Date(currentYear + 1, 5, 1);
    }

    const diffTime = gceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  if (loading) {
      return (
          <div className="h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
      );
  }

  if (!session) {
      return <Auth />;
  }

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (isFocusMode) {
    return <FocusMode 
        userId={session.user.id}
        onExit={() => setIsFocusMode(false)} 
        onSessionComplete={handleRecordActivity}
    />;
  }

  const PlaceholderView = ({ title, icon: Icon, desc }: { title: string, icon: any, desc: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white h-full">
      <div className="bg-slate-50 p-6 rounded-full mb-6">
        <Icon className="w-12 h-12 text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md">{desc}</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden dark:bg-slate-900 transition-colors">
      <Sidebar
        userId={session.user.id}
        userEmail={session.user.email}
        userProfile={userProfile}
        currentView={currentView}
        selectedSubject={selectedSubject}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onUpdateProfile={handleProfileUpdate}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden p-4 pt-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 z-20 shadow-sm sticky top-0">
           <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">Study<span className="text-brand-600 dark:text-brand-400">Helplanner</span></span>
           <button 
             onClick={() => setIsMobileMenuOpen(true)} 
             className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
            {currentView === AppView.DASHBOARD && (
              <div className="p-6 md:p-10 h-full overflow-y-auto dark:bg-slate-900">
                <header className="mb-8 md:mb-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Hello, {userProfile.option === Option.SCIENCE ? 'Scientist' : 'Scholar'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Ready to make progress on your {userProfile.cycle} exams?</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Trophy className="w-5 h-5"/></div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">Study Streak</h3>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{streak} Days</div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{streak > 0 ? "Keep the momentum going!" : "Start your streak today!"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Calendar className="w-5 h-5"/></div>
                             <h3 className="font-semibold text-slate-800 dark:text-white">Pending Tasks</h3>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{taskCount}</div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tasks due today or overdue.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400"><Hourglass className="w-5 h-5"/></div>
                             <h3 className="font-semibold text-slate-800 dark:text-white">Days to GCE</h3>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{getDaysToGCE()}</div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Written Exams (Est. June 1)</p>
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Tip of the Day</h3>
                    <div className="bg-indigo-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none">
                        <div className="relative z-10">
                            <h4 className="text-xl font-bold mb-2">
                                {taskCount > 3 ? "High Workload Detected" : "Study Smart"}
                            </h4>
                            <p className="text-indigo-100 max-w-lg text-lg leading-relaxed">
                                {getDailyTip()}
                            </p>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-indigo-500/20 transform skew-x-12"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
                    </div>
                </div>
              </div>
            )}

            {currentView === AppView.SUBJECT && selectedSubject && (
              <SubjectView 
                userId={session.user.id}
                subject={selectedSubject} 
                userProfile={userProfile}
                onFocusModeRequest={() => setIsFocusMode(true)}
                onActivityRecorded={handleRecordActivity}
                onIncrementAiUsage={incrementAiUsage}
              />
            )}

            {currentView === AppView.PLANNER && (
                <PlannerView userId={session.user.id} userProfile={userProfile} />
            )}
            {currentView === AppView.PAPERS && (
                 <PlaceholderView title="Past Papers" icon={FileText} desc="Access a library of past GCE questions to practice effectively." />
            )}
            {currentView === AppView.NOTES && (
                 <NotesView userId={session.user.id} />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;