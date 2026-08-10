// supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sagvtnbbbdrfuoqxnplf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ3Z0bmJiYmRyZnVvcXhucGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDY3ODIsImV4cCI6MjA4NzUyMjc4Mn0.C0Cy95aMDjtpnRKiQ6g5c0WQdZiPDZoj0QuwsIAOchA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});