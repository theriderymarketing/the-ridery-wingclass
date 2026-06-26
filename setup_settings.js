import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('course_types').upsert({
    id: '00000000-0000-0000-0000-000000000000',
    name: '__SETTINGS__',
    description: JSON.stringify({
      businessHours: {
        1: { open: '09:00', close: '18:00', isOpen: true },
        2: { open: '09:00', close: '18:00', isOpen: true },
        3: { open: '09:00', close: '18:00', isOpen: true },
        4: { open: '09:00', close: '18:00', isOpen: true },
        5: { open: '09:00', close: '18:00', isOpen: true },
        6: { open: '09:00', close: '18:00', isOpen: true },
        0: { open: '09:00', close: '18:00', isOpen: false },
      },
      closedDates: []
    })
  }).select();

  console.log("Upsert settings:", data, error);
}
run();
