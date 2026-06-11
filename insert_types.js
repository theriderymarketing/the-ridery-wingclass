import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('course_types').insert([
    { name: 'Cours', capacity: 4, color: '#3B82F6', duration_minutes: 120 },
    { name: 'Navigation surveillée', capacity: 10, color: '#10B981', duration_minutes: 120 }
  ]).select();
  if (error) console.error(error);
  console.log(data);
}
run();
