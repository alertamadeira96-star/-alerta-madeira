-- Run this in Supabase Dashboard → SQL Editor → New query
-- Creates notifications and push_tokens tables for push notifications.
-- Requires get_my_role() to exist (run supabase-fix-profile-recursion.sql first if needed).

-- NOTIFICATIONS (history of sent pushes)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  sent_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_admin" ON public.notifications;
CREATE POLICY "notifications_select_admin"
  ON public.notifications FOR SELECT
  USING (public.get_my_role() = 'admin');

-- PUSH_TOKENS (device tokens for push delivery)
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_insert_own" ON public.push_tokens;
CREATE POLICY "push_tokens_insert_own"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_update_own" ON public.push_tokens;
CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_select_own" ON public.push_tokens;
CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);
