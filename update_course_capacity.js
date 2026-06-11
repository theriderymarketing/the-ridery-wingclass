const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  await supabaseAdmin.from('course_types').update({ capacity: 4 }).eq('name', 'Cours');
  await supabaseAdmin.from('course_types').update({ capacity: 1 }).eq('name', 'Navigation surveillée');
  console.log("Updated!");
}
test();
