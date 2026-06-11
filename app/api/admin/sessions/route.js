import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

import { verifyAdmin } from '../verify-admin';

export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const sessionData = await request.json();
    const { data, error } = await supabaseAdmin.from('sessions').insert([sessionData]).select();
    if (error) throw error;
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, ...updateData } = await request.json();
    const { data, error } = await supabaseAdmin.from('sessions').update(updateData).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await request.json();
    const { error } = await supabaseAdmin.from('sessions').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
