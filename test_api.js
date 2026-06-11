const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabaseAdmin.from('instructors').insert([{first_name: "Test", last_name: "Test", email: "test@test.com", phone: "123", color: "#000000"}]).select();
  console.log("Data:", data);
  console.log("Error:", error);
}
test();
