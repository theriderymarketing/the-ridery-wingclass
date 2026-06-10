import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export async function POST(request) {
  try {
    const sessionData = await request.json();
    const { data, error } = await supabaseAdmin.from('sessions').insert([sessionData]).select();
    if (error) throw error;
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
