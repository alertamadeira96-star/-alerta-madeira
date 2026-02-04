-- Run this in Supabase Dashboard → SQL Editor → New query
-- Fixes "infinite recursion detected in policy for relation profiles"
-- Cause: a policy on profiles was reading from profiles (e.g. to check admin).

-- 1. Drop ALL existing policies on profiles (removes any that cause recursion)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
-- Drop any other profile policies you may have added
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- 2. Safe helper: returns current user's role WITHOUT triggering RLS (no recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- 3. Simple non-recursive policies (only use auth.uid(), never read from profiles in policy)
-- SELECT: user sees own row; admins see all (admin check uses function, not a subquery on profiles)
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.get_my_role() = 'admin'
  );

-- INSERT: user can only insert their own row
CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: user can only update their own row
CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. RLS stays enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
