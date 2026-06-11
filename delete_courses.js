const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  console.log("Deleting old sessions...");
  await supabaseAdmin.from('sessions').delete().in('course_type_id', [
    '27fe742f-f3ae-49c3-8433-898f93166b48',
    '2452722b-b5bd-4506-9801-071afab94ea8',
    'f3765f58-89ec-4f12-84e0-57a160667112'
  ]);
  
  console.log("Deleting old student_credits...");
  await supabaseAdmin.from('student_credits').delete().in('course_type_id', [
    '27fe742f-f3ae-49c3-8433-898f93166b48',
    '2452722b-b5bd-4506-9801-071afab94ea8',
    'f3765f58-89ec-4f12-84e0-57a160667112'
  ]);

  console.log("Deleting old course types...");
  const { error } = await supabaseAdmin.from('course_types').delete().in('name', ['Wingboost Débutant', 'Perfectionnement', 'Foil Avancé']);
  console.log("Error deleting courses:", error);
}
test();
