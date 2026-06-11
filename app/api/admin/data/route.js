import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

import { verifyAdmin } from '../verify-admin';

export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const [instRes, courseRes, sessRes, credRes, partRes, custRes] = await Promise.all([
      supabaseAdmin.from('instructors').select('*'),
      supabaseAdmin.from('course_types').select('*'),
      supabaseAdmin.from('sessions').select('*'),
      supabaseAdmin.from('student_credits').select('*'),
      supabaseAdmin.from('session_participants').select('*'),
      supabaseAdmin.from('customers').select('*')
    ]);

    if (instRes.error) throw instRes.error;
    if (courseRes.error) throw courseRes.error;
    if (sessRes.error) throw sessRes.error;
    if (credRes.error) throw credRes.error;
    if (partRes.error) throw partRes.error;
    if (custRes.error) throw custRes.error;

    return NextResponse.json({
      instructors: instRes.data || [],
      courseTypes: courseRes.data || [],
      sessions: sessRes.data || [],
      studentCredits: credRes.data || [],
      sessionParticipants: partRes.data || [],
      customers: custRes.data || []
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
