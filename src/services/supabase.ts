import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const SUPABASE_URL = 'https://xrmhzpuiacziggvejtxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybWh6cHVpYWN6aWdndmVqdHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTA5NzQsImV4cCI6MjA4MzU2Njk3NH0.yK-cbfxrvoXKqZuafYGn4tV00Od5f5TrYnDW62bhhB0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});