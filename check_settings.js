import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to create a new settings table for storing generic config
  const res = await supabase.from('settings').select('*').limit(1);
  console.log("Settings table exists?", !res.error);

  if (res.error) {
    console.log("Error:", res.error);
  }
}
run();
