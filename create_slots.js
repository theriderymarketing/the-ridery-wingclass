import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: instructors } = await supabase.from('instructors').select('*').limit(1);
  const instructorId = instructors?.[0]?.id;
  
  if (!instructorId) {
    console.log("No instructor found! Can't create slots without an instructor.");
    return;
  }
  
  const merJeuId = '85e42c60-8927-4af8-b489-8a7d631c3185';
  const venDimId = 'b51d0d79-d4c1-47e3-b684-ea3b5f759df4';

  const sessionsToInsert = [];
  
  // We'll generate slots for the next 4 weeks starting from today
  const today = new Date();
  
  for (let i = 0; i < 28; i++) {
    const current = new Date(today);
    current.setDate(today.getDate() + i);
    
    const dayOfWeek = current.getDay();
    
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    if (dayOfWeek === 1 || dayOfWeek === 2) continue; // Skip Mon, Tue
    
    const courseId = (dayOfWeek === 3 || dayOfWeek === 4) ? merJeuId : venDimId;
    
    // Slots: 9, 11, 13, 15, 17
    const hours = [9, 11, 13, 15, 17];
    
    for (const h of hours) {
      const start = new Date(current);
      start.setHours(h, 0, 0, 0);
      
      const end = new Date(current);
      end.setHours(h + 2, 0, 0, 0);
      
      sessionsToInsert.push({
        instructor_id: instructorId,
        course_type_id: courseId,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    }
  }

  console.log(`Inserting ${sessionsToInsert.length} sessions...`);
  
  const { error } = await supabase.from('sessions').insert(sessionsToInsert);
  if (error) {
    console.error("Error inserting sessions:", error);
  } else {
    console.log("Successfully created sessions!");
  }
}
run();
