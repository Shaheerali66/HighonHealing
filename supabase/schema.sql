-- =========================================================
-- High on Healing - Centralized Database Schema & RLS Policies
-- PostgreSQL / Supabase Migration
-- =========================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'counselor', 'admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Psychologists / Counselors Table
CREATE TABLE IF NOT EXISTS public.psychologists (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  credentials TEXT DEFAULT '',
  affiliation TEXT DEFAULT '',
  city TEXT DEFAULT '',
  image TEXT DEFAULT '',
  about TEXT DEFAULT '',
  specializations TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  session_mode TEXT DEFAULT 'Online & In-person',
  rating NUMERIC DEFAULT 5.0,
  sessions_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Pricing Plans Table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  period TEXT NOT NULL DEFAULT '/month',
  description TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  cta TEXT NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  color TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  counselor_id TEXT NOT NULL REFERENCES public.psychologists(id) ON DELETE CASCADE,
  counselor_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Video Call', 'Phone Call', 'Chat')),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Support Queries Table
CREATE TABLE IF NOT EXISTS public.support_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_role TEXT DEFAULT 'Student',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Counselor Applications (Approvals)
CREATE TABLE IF NOT EXISTS public.counselor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  university TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Student Progress Table
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL UNIQUE,
  mood_score NUMERIC,
  ai_interactions_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================
-- Enable Row Level Security (RLS) on All Tables
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Psychologists Policies
CREATE POLICY "Public can view active psychologists" ON public.psychologists
  FOR SELECT USING (status = 'Active' OR public.is_admin());

CREATE POLICY "Admins manage psychologists" ON public.psychologists
  FOR ALL USING (public.is_admin());

-- Pricing Plans Policies
CREATE POLICY "Public can view pricing" ON public.pricing_plans
  FOR SELECT USING (true);

CREATE POLICY "Admins update pricing" ON public.pricing_plans
  FOR UPDATE USING (public.is_admin());

-- Sessions Policies
CREATE POLICY "Students can view own sessions" ON public.sessions
  FOR SELECT USING (student_id = auth.uid()::text OR public.is_admin());

CREATE POLICY "Students can insert own session" ON public.sessions
  FOR INSERT WITH CHECK (student_id = auth.uid()::text OR auth.uid() IS NOT NULL);

CREATE POLICY "Counselors and admins can update sessions" ON public.sessions
  FOR UPDATE USING (public.is_admin() OR counselor_id = auth.uid()::text);

-- Support Queries Policies
CREATE POLICY "Anyone can submit support query" ON public.support_queries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage queries" ON public.support_queries
  FOR ALL USING (public.is_admin());

-- Counselor Applications Policies
CREATE POLICY "Anyone can submit counselor application" ON public.counselor_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage applications" ON public.counselor_applications
  FOR ALL USING (public.is_admin());

-- Enable Realtime Subscriptions on Tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.psychologists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_queries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.counselor_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- =========================================================
-- Initial Seed Data
-- =========================================================
INSERT INTO public.pricing_plans (id, name, price, period, description, features, cta, popular, color)
VALUES
  ('starter', 'Starter', 500, '/month', 'Perfect for students who want to explore mental wellness resources at a minimal cost.', ARRAY['AI Chatbot Access (24/7)', '1 Monthly Session (30 min)', 'Basic Chat Support', 'Mood Tracking Journal', 'Self-Help Resources Library'], 'Get Started', false, 'var(--pink-400)'),
  ('growth', 'Growth', 1500, '/month', 'Our most popular plan for students who need regular, consistent support.', ARRAY['Everything in Starter', '4 Monthly Sessions (45 min)', 'Priority Chat Support', 'Progress Reports', 'Personalized Wellness Plan', 'Group Support Sessions'], 'Choose Growth', true, 'var(--pink-600)'),
  ('premium', 'Premium Care', 3000, '/month', 'Comprehensive care with senior graduates for students who need dedicated, intensive support.', ARRAY['Everything in Growth', '4 Video Sessions (60 min)', 'Unlimited Messaging', 'Senior Graduate Counselor', 'Custom Progress Tracking', 'Emergency Chat Support', 'Family Session (1/month)'], 'Go Premium', false, 'var(--pink-800)')
ON CONFLICT (id) DO NOTHING;
