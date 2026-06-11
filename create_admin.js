const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'marketing@theridery.com';
  const password = 'Theriderywingboost2K26!!';

  // Try to create user
  const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  let userId;

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists, getting ID...');
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const user = existingUsers.users.find(u => u.email === email);
      if (user) {
        userId = user.id;
        // Update password just in case
        await supabase.auth.admin.updateUserById(userId, { password: password });
        console.log('Updated password for existing user.');
      } else {
        console.error('Could not find existing user');
        return;
      }
    } else {
      console.error('Error creating user:', authError);
      return;
    }
  } else {
    userId = userAuth.user.id;
    console.log('User created successfully.');
  }

  // Upsert profile as admin
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email, role: 'admin' });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Admin profile created/updated successfully!');
  }
}

createAdmin();
