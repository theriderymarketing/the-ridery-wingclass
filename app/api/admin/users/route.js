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
    const { email, password, role, firstName, lastName } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, mot de passe et rôle requis' }, { status: 400 });
    }

    // 1. Créer le compte utilisateur dans le système d'authentification
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Pour éviter l'envoi d'email de confirmation
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (authError) throw authError;

    // 2. Créer le profil avec le rôle choisi
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      { id: authData.user.id, role, first_name: firstName, last_name: lastName }
    ]);

    if (profileError) throw profileError;

    // 3. Si c'est un prof, l'ajouter automatiquement à la table instructors
    if (role === 'instructor') {
      const { error: instError } = await supabaseAdmin.from('instructors').insert([
        { user_id: authData.user.id, email, first_name: firstName, last_name: lastName }
      ]);
      if (instError) throw instError;
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    console.error("Erreur API Users:", error);
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
