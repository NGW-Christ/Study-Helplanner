import 'katex/dist/katex.min.css';
import { Calendar, FileText, HelpCircle, Hourglass, Loader2, Menu, RefreshCw, Trophy, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Auth from './components/Auth';
import FocusMode from './components/FocusMode';
import NotesView from './components/NotesView';
import Onboarding from './components/Onboarding';
import PlannerView from './components/PlannerView';
import Sidebar from './components/Sidebar';
import SubjectView from './components/SubjectView';
import { ToastProvider } from './components/ToastProvider';
import { SUBJECTS_CONFIG } from './constants';
import { supabase } from './lib/supabaseClient';
import { AppView, Cycle, Option, UserProfile } from './types';

// SUBJECTS_CONFIG is keyed by the real Cycle/Option enum values (e.g. 'O Level (Form 5)',
// 'Science'). Profile data can end up with values that don't match any valid key — a past
// bug in Auth.tsx's signup call stored placeholder strings ('O_LEVEL' / 'SCIENCE') instead —
// so these helpers guard every SUBJECTS_CONFIG lookup instead of indexing it directly.
const isValidCycleOption = (cycle: string | null | undefined, option: string | null | undefined): boolean => {
  return !!(cycle && option && SUBJECTS_CONFIG[cycle as Cycle]?.[option as Option]);
};

const getSubjectsForProfile = (cycle: string | null | undefined, option: string | null | undefined): string[] => {
  if (!isValidCycleOption(cycle, option)) return [];
  return SUBJECTS_CONFIG[cycle as Cycle][option as Option];
};

const AppContent: React.FC = () => {
  const [session, setSession] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState<number>(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [taskCount, setTaskCount] = useState(0)

  useEffect(() => {
    let mounted = true;

    // Check active session and listen for auth changes
    const initializeAuth = async () => {
      // Get initial session manually to speed up initial load
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(initialSession);
        if (initialSession) {
          try {
            await Promise.all([
              fetchProfile(initialSession.user.id),
              fetchStreak(initialSession.user.id),
              fetchTaskCount(initialSession.user.id)
            ]);
          } catch (error) {
            console.error('Initial data fetch error:', error);
          } finally {
            if (mounted) setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session) {
          try {
            await Promise.all([
              fetchProfile(session.user.id),
              fetchStreak(session.user.id),
              fetchTaskCount(session.user.id)
            ]);
          } catch (error) {
            console.error('Auth state change data fetch error:', error);
          } finally {
            if (mounted) setLoading(false);
          }
        } else {
          setUserProfile(null);
          setStreak(0);
          if (mounted) setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = initializeAuth();
    return () => {
      mounted = false;
      cleanup.then(unsub => unsub?.());
    };
  }, []);

  // Existing users already have a valid cycle/option set but may not have
  // onboarding_completed flagged yet — mark it complete so they aren't sent
  // back through Onboarding. Uses isValidCycleOption (not just truthiness) so
  // a profile with bad/legacy cycle-option data is routed to Onboarding to be
  // fixed, instead of being marked complete and crashing on the dashboard.
  useEffect(() => {
    if (userProfile && !userProfile.onboarding_completed && isValidCycleOption(userProfile.cycle, userProfile.option)) {
      setUserProfile({ ...userProfile, onboarding_completed: true });
    }
  }, [userProfile]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Create a new profile if it doesn't exist (ProfileService.upsertProfile logic)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: session?.user.email!,
            full_name: session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'Student',
            cycle: session?.user.user_metadata?.cycle || null,
            option_type: session?.user.user_metadata?.option || null,
            onboarding_completed: !!(session?.user.user_metadata?.cycle && session?.user.user_metadata?.option),
            preferences: { darkMode: false, language: 'en' },
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Profile creation can fail because the session's user no longer exists
          // server-side (profiles.id has a foreign key to auth.users.id) — e.g. a
          // stale browser session left over after the account was deleted. That
          // session is unusable, so sign out instead of leaving the user stuck on
          // a profile that can never load.
          await supabase.auth.signOut();
          setSession(null);
          setUserProfile(null);
          return;
        }

        if (newProfile) {
          setUserProfile({
            id: newProfile.id,
            email: newProfile.email,
            full_name: newProfile.full_name || 'Student',
            cycle: newProfile.cycle as Cycle,
            option: newProfile.option_type as Option,
            subjects: newProfile.subjects?.length ? newProfile.subjects : getSubjectsForProfile(newProfile.cycle, newProfile.option_type),
            plan_tier: newProfile.plan_tier || 'free',
            preferences: newProfile.preferences || { darkMode: false, language: 'en' },
            daily_ai_count: newProfile.daily_ai_count || 0,
            last_ai_usage_date: newProfile.last_ai_usage_date || new Date().toISOString().split('T')[0],
            onboarding_completed: isValidCycleOption(newProfile.cycle, newProfile.option_type) && (newProfile.onboarding_completed || false)
          });
        }
        return;
      }

      if (data) {
        // Sync with session metadata if database fields are missing but metadata has them
        let needsUpdate = false;
        const updates: any = {};
        
        if (!data.cycle && session?.user.user_metadata?.cycle) {
          updates.cycle = session.user.user_metadata.cycle;
          needsUpdate = true;
        }
        if (!data.option_type && session?.user.user_metadata?.option) {
          updates.option_type = session.user.user_metadata.option;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          const { data: updatedData } = await supabase
            .from('profiles')
            .update({
              ...updates,
              onboarding_completed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
          
          if (updatedData) {
            data.cycle = updatedData.cycle;
            data.option_type = updatedData.option_type;
            data.onboarding_completed = updatedData.onboarding_completed;
          }
        }

        // Handle daily reset of AI count if date changed
        const today = new Date().toISOString().split('T')[0]
        let dailyCount = data.daily_ai_count
        
        if (data.last_ai_usage_date !== today) {
            dailyCount = 0
            // Optimistically update local, background update DB
            supabase.from('profiles').update({ 
                daily_ai_count: 0, 
                last_ai_usage_date: today,
                updated_at: new Date().toISOString()
            }).eq('id', userId)
        }

        setUserProfile({
            id: data.id,
            email: data.email,
            full_name: data.full_name || 'Student',
            cycle: data.cycle as Cycle,
            option: data.option_type as Option,
            subjects: data.subjects?.length ? data.subjects : getSubjectsForProfile(data.cycle, data.option_type),
            plan_tier: data.plan_tier || 'free',
            preferences: data.preferences || { darkMode: false, language: 'en' },
            daily_ai_count: dailyCount || 0,
            last_ai_usage_date: data.last_ai_usage_date || today,
            // If cycle/option don't map to a valid SUBJECTS_CONFIG entry (e.g. a profile
            // corrupted by a past bug), treat onboarding as incomplete so the user is
            // routed back through Onboarding to re-select valid values instead of the
            // app crashing on every future login.
            onboarding_completed: isValidCycleOption(data.cycle, data.option_type) && (data.onboarding_completed || false)
        })
      }
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error)
    }
  }

  const fetchStreak = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single()

      if (data) {
        setStreak(data.current_streak || 0)
      }
    } catch (error) {
      console.error('Error fetching streak', error)
    }
  }

  const fetchTaskCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('is_completed', false)

      if (!error) {
        setTaskCount(data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching task count', error)
    }
  }

  const updateStreak = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak data
      const { data: currentStreak, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current streak:', fetchError);
        return;
      }

      let newStreak = 1;
      let newLongest = 1;

      if (currentStreak) {
        const lastActivity = new Date(currentStreak.last_activity_date);
        const todayDate = new Date(today);
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);

        if (lastActivity.toISOString().split('T')[0] === today) {
          // Already updated today, don't increment
          return;
        } else if (lastActivity.toISOString().split('T')[0] === yesterdayDate.toISOString().split('T')[0]) {
          // Consecutive day
          newStreak = currentStreak.current_streak + 1;
          newLongest = Math.max(newStreak, currentStreak.longest_streak);
        }
        // If gap > 1 day, reset to 1 (already set above)
      }

      // Update or insert streak
      const { error: updateError } = await supabase
        .from('streaks')
        .upsert({
          user_id: userId,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Error updating streak:', updateError);
      } else {
        setStreak(newStreak);
      }
    } catch (error) {
      console.error('Error in updateStreak:', error);
    }
  }

  const incrementAiUsage = async () => {
    try {
      if (!userProfile || !session) return;

      const today = new Date().toISOString().split('T')[0];
      const newDailyCount = userProfile.daily_ai_count + 1;

      // Update profile with new AI count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          daily_ai_count: newDailyCount,
          last_ai_usage_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating AI usage:', updateError);
        return;
      }

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        daily_ai_count: newDailyCount,
        last_ai_usage_date: today
      } : null);

      // Check if user has reached 2 generations today and update streak
      if (newDailyCount === 2) {
        await updateStreak(session.user.id);
      }

    } catch (error) {
      console.error('Error in incrementAiUsage:', error);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserProfile(null)
    setCurrentView(AppView.DASHBOARD)
    setSelectedSubject(null)
  }

  const getDailyTip = () => {
    const date = new Date()
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
    
    const standardTips = [
        "Review your notes within 24 hours of taking them to boost retention.",
        "Take a 5-minute break every 25 minutes (Pomodoro Technique) to stay fresh.",
        "Teach what you have learned to an imaginary audience to test your understanding.",
        "Drink water before starting your study session to improve concentration.",
        "Sleep is when memory consolidation happens. Aim for 8 hours tonight.",
        "Take short movement breaks between study sessions."
    ]
    return standardTips[dayOfYear % standardTips.length]
  }

  const getDaysToGCE = () => {
    const today = new Date();
    const gceDate = new Date(today.getFullYear(), 5, 1); // June 1st
    if (today > gceDate) {
      gceDate.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = Math.abs(gceDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading your study space...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-slate-600">We couldn't load your profile. Please check your connection and try again.</p>
          <button
            onClick={() => fetchProfile(session.user.id)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (userProfile && !userProfile.onboarding_completed) {
    // Skip onboarding if cycle and option are already set to a valid combination
    // (existing users) — the useEffect above will flip onboarding_completed on
    // the next render. A profile with invalid/legacy cycle-option data falls
    // through to Onboarding instead, so the user can fix it themselves.
    if (isValidCycleOption(userProfile.cycle, userProfile.option)) {
      return null;
    }

    return <Onboarding onComplete={async ({ cycle, option }) => {
      try {
        // Sync with Auth metadata as per Auth service reference
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            cycle,
            option,
          },
        });

        if (authError) {
          console.error('Failed to update auth metadata:', authError);
          return;
        }

        // ProfileService.updateProfile logic (database sync)
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            cycle, 
            option_type: option,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          return;
        }

        if (updatedProfile) {
          // Update local state
          setUserProfile({
            ...userProfile!,
            cycle: updatedProfile.cycle as Cycle,
            option: updatedProfile.option_type as Option,
            subjects: updatedProfile.subjects?.length ? updatedProfile.subjects : getSubjectsForProfile(updatedProfile.cycle, updatedProfile.option_type),
            onboarding_completed: true
          });
        }
      } catch (error) {
        console.error('Unexpected error in onboarding completion:', error);
      }
    }} />
  }

  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile(prev => prev ? {
          ...prev,
          ...updatedFields
        } : null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-light-background text-slate-900 font-sans flex pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Sidebar */}
        <Sidebar
          userId={session.user.id}
          userProfile={userProfile}
          currentView={currentView}
          onNavigate={(view: AppView, subject?: string) => {
            setCurrentView(view)
            setSelectedSubject(subject || null)
            setIsMobileMenuOpen(false)
          }}
          selectedSubject={selectedSubject}
          streak={streak}
          taskCount={taskCount}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-light-background flex flex-col">
          {currentView === AppView.DASHBOARD && (
            <div className="p-6 md:p-10 h-full overflow-y-auto bg-light-background">
              <header className="mb-8 md:mb-10">
                <div className="flex items-center gap-4 mb-2 lg:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Menu className="w-6 h-6 text-slate-600" />
                  </button>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                  Hello, {userProfile?.option === Option.SCIENCE ? 'Scientist' : 'Scholar'}
                </h1>
                <p className="text-slate-500 mt-2">
                  Ready to make progress on your {userProfile?.cycle} exams?
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-slate-800">Study Streak</h3>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900">{streak} Days</div>
                  <p className="text-sm text-slate-500 mt-1">
                    {streak > 0 ? "Keep the momentum going!" : "Start your streak today!"}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-slate-800">Pending Tasks</h3>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900">{taskCount}</div>
                  <p className="text-sm text-slate-500 mt-1">Tasks due today or overdue.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                      <Hourglass className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-slate-800">Days to GCE</h3>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900">{getDaysToGCE()}</div>
                  <p className="text-sm text-slate-500 mt-1">Written Exams (Est. June 1)</p>
                </div>
              </div>



              {/* Active Subject View Area if subject is selected */}
              {selectedSubject && (
                <div className="mt-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900 mb-1">{selectedSubject}</h3>
                      <p className="text-slate-500">Access your specialized learning tools</p>
                    </div>
                    <button 
                      onClick={() => setCurrentView(AppView.SUBJECT)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                    >
                      Open Study View
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setCurrentView(AppView.SUBJECT)}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Quick Summary</h4>
                        <p className="text-xs text-slate-500">Overview of a topic</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentView(AppView.NOTES)}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Add Notes</h4>
                        <p className="text-xs text-slate-500">Create study notes</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentView(AppView.SUBJECT)}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RefreshCw className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Revise Topic</h4>
                        <p className="text-xs text-slate-500">Practice & review</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-10">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Tip of the Day</h3>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
                  <div className="relative z-10">
                    <h4 className="text-xl font-semibold mb-2">
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

              {/* Help FAB matching reference */}
              <button className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20">
                <HelpCircle className="w-6 h-6" />
              </button>
            </div>
          )}

          {currentView === AppView.PLANNER && (
            <PlannerView
              userId={session.user.id}
              userProfile={userProfile}
              onActivityRecorded={() => {}}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          )}

          {currentView === AppView.NOTES && (
            <NotesView 
              userId={session.user.id} 
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          )}

          {currentView === AppView.SUBJECT && selectedSubject && (
            <SubjectView
              userId={session.user.id}
              subject={selectedSubject}
              userProfile={userProfile}
              onFocusModeRequest={() => setIsFocusMode(true)}
              onActivityRecorded={() => {}}
              onIncrementAiUsage={incrementAiUsage}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          )}

          {currentView === AppView.STATISTICS && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Statistics</h2>
                <p className="text-slate-600">Coming soon!</p>
              </div>
            </div>
          )}
        </main>

        {/* Focus Mode Modal */}
        {isFocusMode && (
          <FocusMode
            userId={session.user.id}
            onExit={() => setIsFocusMode(false)}
            onSessionComplete={() => updateStreak(session.user.id)}
            initialDuration={25}
          />
        )}
      </div>
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App
