import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { error } = await supabase.rpc('exec_sql', { sql_string: `
    CREATE POLICY "Allow authenticated users to insert sessions" ON sessions FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Allow authenticated users to insert course_types" ON course_types FOR INSERT TO authenticated WITH CHECK (true);
  ` });
  console.log('Error creating policy:', error);
}
run();
