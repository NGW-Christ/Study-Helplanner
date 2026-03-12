import { Calendar, FileText, Hourglass, Loader2, Trophy } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Auth from './components/Auth'
import FocusMode from './components/FocusMode'
import NotesView from './components/NotesView'
import Onboarding from './components/Onboarding'
import PlannerView from './components/PlannerView'
import Sidebar from './components/Sidebar'
import SubjectView from './components/SubjectView'
import { SUBJECTS_CONFIG } from './constants'
import { supabase } from './lib/supabaseClient'
import { AppView, Cycle, Option, UserProfile } from './types'

const App: React.FC = () => {
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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchStreak(session.user.id),
          fetchTaskCount(session.user.id)
        ]).finally(() => {
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchStreak(session.user.id),
          fetchTaskCount(session.user.id)
        ]).finally(() => {
          setLoading(false)
        })
      } else {
        setUserProfile(null)
        setStreak(0)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Apply Dark Mode Effect
  useEffect(() => {
    if (userProfile?.preferences?.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [userProfile?.preferences?.darkMode])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) {
        // Handle daily reset of AI count if date changed
        const today = new Date().toISOString().split('T')[0]
        let dailyCount = data.daily_ai_count
        
        if (data.last_ai_usage_date !== today) {
            dailyCount = 0
            // Optimistically update local, background update DB
            supabase.from('profiles').update({ 
                daily_ai_count: 0, 
                last_ai_usage_date: today 
            }).eq('id', userId)
        }

        setUserProfile({
            full_name: data.full_name || session?.user.email?.split('@')[0] || 'Student',
            cycle: data.cycle as Cycle,
            option: data.option_type as Option,
            subjects: data.subjects || SUBJECTS_CONFIG[data.cycle as Cycle][data.option_type as Option],
            plan_tier: data.plan_tier || 'free',
            preferences: data.preferences || { darkMode: false, language: 'en' },
            daily_ai_count: dailyCount || 0,
            last_ai_usage_date: data.last_ai_usage_date || today,
            onboarding_completed: data.onboarding_completed || false
        })
      }
    } catch (error) {
      console.error('Unexpected error fetching profile', error)
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

      if (data) {
        setTaskCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching task count', error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-slate-600 dark:text-slate-400">Loading your study space...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  if (userProfile && !userProfile.onboarding_completed) {
    return <Onboarding onComplete={async ({ cycle, option }) => {
      console.log('onComplete called with:', { cycle, option });
      console.log('Current session:', session);
      
      try {
        // First try to update the profile (if it exists)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            cycle, 
            option_type: option,
            onboarding_completed: true 
          })
          .eq('id', session.user.id);

        console.log('Database update result:', { updateError });

        if (updateError) {
          // If update fails, try to insert the profile (if it doesn't exist)
          console.log('Update failed, trying to insert profile...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              cycle,
              option_type: option,
              onboarding_completed: true,
              full_name: session.user.email?.split('@')[0] || 'Student'
            });

          console.log('Database insert result:', { insertError });

          if (insertError) {
            console.error('Both update and insert failed:', { updateError, insertError });
            return;
          }
        }

        // Update local state
        setUserProfile({
          ...userProfile,
          cycle,
          option,
          onboarding_completed: true
        });
        console.log('Profile updated successfully');
      } catch (error) {
        console.error('Unexpected error in onboarding completion:', error);
      }
    }} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
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
          onUpdateProfile={async () => {}}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {currentView === AppView.DASHBOARD && (
            <div className="h-full flex">
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8 flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back, {userProfile?.full_name?.split(' ')[0]}!
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400">
                        {userProfile?.cycle && userProfile?.option
                          ? `You're studying ${userProfile.cycle} with ${userProfile.option} focus`
                          : 'Ready to start learning?'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Subject Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {userProfile?.subjects?.map((subject: string, idx: number) => (
                      <div
                        key={subject}
                        onClick={() => {
                          setSelectedSubject(subject)
                          setCurrentView(AppView.SUBJECT)
                        }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{subject}</h3>
                          <Trophy className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Continue your {subject} studies
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => setCurrentView(AppView.PLANNER)}
                      className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                    >
                      <Calendar className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-white">Study Planner</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Schedule your sessions</p>
                    </button>

                    <button
                      onClick={() => setCurrentView(AppView.NOTES)}
                      className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                    >
                      <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-white">My Notes</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{taskCount} saved notes</p>
                    </button>

                    <button
                      onClick={() => setIsFocusMode(true)}
                      className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                    >
                      <Hourglass className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-white">Focus Mode</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Deep work session</p>
                    </button>

                    <button
                      onClick={() => setCurrentView(AppView.STATISTICS)}
                      className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                    >
                      <Trophy className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-slate-900 dark:text-white">Statistics</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{streak} day streak!</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === AppView.PLANNER && (
            <PlannerView
              userId={session.user.id}
              userProfile={userProfile}
              onActivityRecorded={() => {}}
            />
          )}

          {currentView === AppView.NOTES && (
            <NotesView userId={session.user.id} />
          )}

          {currentView === AppView.SUBJECT && selectedSubject && (
            <SubjectView
              userId={session.user.id}
              subject={selectedSubject}
              userProfile={userProfile}
              onFocusModeRequest={() => setIsFocusMode(true)}
              onActivityRecorded={() => {}}
              onIncrementAiUsage={async () => {}}
            />
          )}

          {currentView === AppView.STATISTICS && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Statistics</h2>
                <p className="text-slate-600 dark:text-slate-400">Coming soon!</p>
              </div>
            </div>
          )}
        </main>

        {/* Focus Mode Modal */}
        {isFocusMode && (
          <FocusMode
            userId={session.user.id}
            onExit={() => setIsFocusMode(false)}
            onSessionComplete={() => {}}
            initialDuration={25}
          />
        )}
      </div>
    </Router>
  )
}

export default App
