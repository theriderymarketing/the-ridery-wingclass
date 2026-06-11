import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('sessions').select('id, start_time, end_time');
  console.log(`Found ${data.length} sessions`);
  
  // Group by start_time
  const byTime = {};
  for (const s of data) {
    if (!byTime[s.start_time]) byTime[s.start_time] = [];
    byTime[s.start_time].push(s);
  }
  
  // Find overlapping
  let idsToDelete = [];
  for (const t in byTime) {
    if (byTime[t].length > 1) {
      // Keep the first one, delete the rest
      const toDelete = byTime[t].slice(1).map(s => s.id);
      idsToDelete.push(...toDelete);
    }
  }
  
  console.log(`Will delete ${idsToDelete.length} duplicate sessions`);
  
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('sessions').delete().in('id', idsToDelete);
    if (error) console.error("Error deleting:", error);
    else console.log("Deleted duplicates.");
  }
}
run();
