import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const tables = ['course_types', 'instructors', 'sessions', 'session_participants', 'student_credits', 'customers'];
  for (const table of tables) {
    const { error } = await supabase.rpc('exec_sql', { sql_string: `
      CREATE POLICY "Allow public read" ON ${table} FOR SELECT USING (true);
    ` });
    if (error) {
      console.error(`Error on ${table}:`, error);
    } else {
      console.log(`Policy added for ${table}`);
    }
  }
}
run();
