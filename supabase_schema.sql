-- RESET DATABASE (CAUTION: This deletes existing data to ensure schema compatibility)
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user_streak();

DROP TABLE IF EXISTS public.study_plans CASCADE;
DROP TABLE IF EXISTS public.streaks CASCADE;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;
DROP TABLE IF EXISTS public.past_papers CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable Row Level Security (RLS) on all tables is best practice
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  cycle TEXT, -- Can be NULL until onboarding
  option_type TEXT, -- Can be NULL until onboarding
  subjects TEXT[], -- Array of selected subjects
  plan_tier TEXT DEFAULT 'free', -- 'free' or 'premium'
  preferences JSONB DEFAULT '{"darkMode": false, "language": "en"}',
  daily_ai_count INTEGER DEFAULT 0,
  last_ai_usage_date DATE DEFAULT CURRENT_DATE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- Markdown content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create past_papers table (Updated Schema)
CREATE TABLE public.past_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  cycle TEXT NOT NULL, -- 'O Level' or 'A Level'
  option_type TEXT NOT NULL, -- 'Science' or 'Arts'
  year INTEGER NOT NULL,
  paper_type TEXT NOT NULL, -- e.g. "Paper 1"
  external_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  subject TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create streaks table (One row per user)
CREATE TABLE public.streaks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create study_plans table
CREATE TABLE public.study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  task_description TEXT NOT NULL,
  planned_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '10:00:00',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (Users can only see/edit their own data)

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Notes
CREATE POLICY "Users can all on notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Past Papers (Read Only for Authenticated Users)
CREATE POLICY "Authenticated users can read past papers" ON public.past_papers FOR SELECT TO authenticated USING (true);

-- Focus Sessions
CREATE POLICY "Users can all on focus_sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id);

-- Streaks
CREATE POLICY "Users can all on streaks" ON public.streaks FOR ALL USING (auth.uid() = user_id);

-- Study Plans
CREATE POLICY "Users can all on study_plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user streaks automatically
CREATE OR REPLACE FUNCTION public.handle_new_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (new.id, 0, 0, CURRENT_DATE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create streak record when a profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_streak();