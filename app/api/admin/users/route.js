import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '../verify-admin';

// Initialise Supabase avec les droits Admin complets pour gérer les comptes Auth
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Clé secrète obligatoire pour auth.admin
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};

export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, mot de passe et rôle requis' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      { id: authData.user.id, role }
    ]);
    if (profileError) throw profileError;

    if (role === 'instructor') {
      const namePart = email.split('@')[0];
      const { error: instError } = await supabaseAdmin.from('instructors').insert([
        { user_id: authData.user.id, email, first_name: namePart, last_name: '' }
      ]);
      if (instError) throw instError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Users:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const userId = url.searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const auth = await verifyAdmin(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
