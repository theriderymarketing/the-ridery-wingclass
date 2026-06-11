import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('sessions').insert([
    { 
      course_type_id: '85e42c60-8927-4af8-b489-8a7d631c3185',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      spot_location: 'Test'
    }
  ]).select();
  console.log('Error:', error);
}
run();
