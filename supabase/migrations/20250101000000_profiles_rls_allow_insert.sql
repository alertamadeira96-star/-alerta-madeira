-- Fix: "new row violates row level security policy for table profile(s)"
-- Run this in Supabase Dashboard → SQL Editor (or via supabase db push if you use CLI).
--
-- If your table is named "profile" (singular), replace "profiles" with "profile" below.

-- Allow authenticated users to insert their own profile row (required for signup).
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- If the insert still fails, your table might be "profile". Run this instead:
-- CREATE POLICY "Users can insert own profile"
--   ON public.profile
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = id);
