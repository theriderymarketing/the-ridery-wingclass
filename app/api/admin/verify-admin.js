import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // We ignore profileError because the 'profiles' table might not even exist yet (PGRST205)
  // or it might return no rows (PGRST116).
  // Same logic as layout.js: allow if admin or if no profile exists
  if (profile && profile.role !== 'admin') {
    return { error: 'Forbidden: Requires admin role', status: 403 };
  }

  return { user };
}
