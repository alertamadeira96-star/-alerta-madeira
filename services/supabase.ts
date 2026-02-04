import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase credentials – replace with your project's URL and anon key from Supabase Dashboard → Settings → API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gvrniusfxhrswyhgbhpz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cm5pdXNmeGhyc3d5aGdiaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjA4MDYsImV4cCI6MjA4NTA5NjgwNn0.4FANk84-znMdNELoAeY_1onw1NL1MTT2v5aHm-qTkTI';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
