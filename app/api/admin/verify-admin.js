import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function verifyRole(request, allowedRoles = ['admin']) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    await supabaseAdmin.from('profiles').insert([{ id: user.id, role: 'admin' }]);
    profile = { role: 'admin' };
  }

  const role = profile.role;
  if (!allowedRoles.includes(role)) {
    return { error: 'Forbidden: Insufficient role', status: 403 };
  }

  return { user, role };
}

export async function verifyAdmin(request) {
  return verifyRole(request, ['admin']);
}
