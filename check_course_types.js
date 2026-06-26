import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Alter table is not possible via standard Supabase JS client without a specific RPC
  // But we can just use the description field to store { is_active: boolean }
  console.log("We will use description to store JSON config for course types.");
}
run();
