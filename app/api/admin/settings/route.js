import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { verifyAdmin } from '../verify-admin';

export async function GET(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  const { data, error } = await supabaseAdmin
    .from('course_types')
    .select('description')
    .eq('name', '__SETTINGS__')
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let settings = { businessHours: {}, closedDates: [] };
  if (data?.description) {
    try {
      settings = JSON.parse(data.description);
    } catch(e) {}
  }

  return NextResponse.json({ data: settings });
}

export async function POST(req) {
  const adminCheck = await verifyAdmin(req);
  if (adminCheck?.error) return NextResponse.json(adminCheck, { status: adminCheck.status });

  try {
    const newSettings = await req.json();
    
    // Check if it exists
    const { data: existing } = await supabaseAdmin
      .from('course_types')
      .select('id')
      .eq('name', '__SETTINGS__')
      .single();

    let res;
    if (existing) {
      res = await supabaseAdmin
        .from('course_types')
        .update({ description: JSON.stringify(newSettings) })
        .eq('id', existing.id);
    } else {
      res = await supabaseAdmin
        .from('course_types')
        .insert([{ 
          id: '00000000-0000-0000-0000-000000000000',
          name: '__SETTINGS__',
          description: JSON.stringify(newSettings),
          capacity: 0,
          duration_minutes: 0
        }]);
    }

    if (res.error) throw res.error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
