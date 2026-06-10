import { createClient } from '@supabase/supabase-js';

// The URL is our own Next.js app's proxy endpoint
const proxyUrl = typeof window !== 'undefined' 
  ? window.location.origin + '/api/proxy/supabase' 
  : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/api/proxy/supabase';

// We pass a dummy key, the proxy will inject the real Service Role Key on the server securely
export const supabaseProxy = createClient(proxyUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
