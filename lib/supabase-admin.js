import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use this client ONLY in backend API routes. It bypasses all Row Level Security.
// We fallback to dummy strings if env vars are missing during Vercel build to prevent static analysis crashes
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://dummy.supabase.co', 
  supabaseServiceKey || 'dummy-key'
);
