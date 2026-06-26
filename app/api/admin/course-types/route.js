import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { verifyAdmin } from '../verify-admin';

export async function POST(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  try {
    const data = await req.json();
    const { data: result, error } = await supabaseAdmin
      .from('course_types')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    
    const { data: result, error } = await supabaseAdmin
      .from('course_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  try {
    const { id } = await req.json();
    const { error } = await supabaseAdmin
      .from('course_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
